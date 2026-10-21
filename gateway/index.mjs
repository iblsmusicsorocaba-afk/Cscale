
import http from 'node:http';
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import makeWASocket, { Browsers, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';

const port=Number(process.env.PORT||3000);
const authFolder=process.env.WHATSAPP_AUTH_DIR||'/data/whatsapp';
const apiKey=process.env.WHATSAPP_GATEWAY_KEY;
if(!apiKey||apiKey.length<32){console.error('WHATSAPP_GATEWAY_KEY missing or too short');process.exit(1)}

const logger=pino({level:'silent'});
let socket=null;
let currentState='disconnected';
let phone=null;
let qrData=null;
let lastError=null;
let connectPromise=null;
let manualDisconnect=false;
let attempt=0;
let restartTimer=null;

function compareSecret(presented){
 const a=Buffer.from(presented||'');
 const b=Buffer.from(apiKey);
 return a.length===b.length&&timingSafeEqual(a,b);
}
function snapshot(){
 return {
  status:currentState,
  senderPhone:currentState==='connected'?phone:null,
  qrCode:currentState==='qr'?qrData:null,
  error:lastError,
  provider:'whatsapp-web-linked-device'
 };
}
function laterRetry(){
 if(manualDisconnect||restartTimer)return;
 attempt=Math.min(attempt+1,5);
 restartTimer=setTimeout(()=>{restartTimer=null;void connectSocket().catch(e=>{lastError='Falha de conexão. Tente novamente.';laterRetry()})},Math.min(30000,2000*2**attempt));
}
async function connectSocket(){
 if(connectPromise)return connectPromise;
 if(socket&&['connected','qr','connecting'].includes(currentState))return snapshot();
 manualDisconnect=false;
 connectPromise=(async()=>{
   currentState='connecting';qrData=null;lastError=null;
   await fs.mkdir(authFolder,{recursive:true,mode:0o700});
   const {state,saveCreds}=await useMultiFileAuthState(authFolder);
   let version;
   try{const versionRes=await fetchLatestBaileysVersion();if(versionRes.isLatest)version=versionRes.version;}catch{}
   const opts={auth:state,logger,browser:Browsers.ubuntu('C Scale'),markOnlineOnConnect:false,syncFullHistory:false};
   if(version)opts.version=version;
   const nextSocket=makeWASocket(opts);
   socket=nextSocket;
   nextSocket.ev.on('creds.update',saveCreds);
   nextSocket.ev.on('connection.update',async update=>{
     if(nextSocket!==socket)return;
     if(update.qr){
       try{qrData=await QRCode.toDataURL(update.qr,{margin:3,width:360,color:{dark:'#142338',light:'#ffffff'}});currentState='qr';lastError=null;}
       catch{qrData=null;lastError='Não foi possível gerar o QR Code';}
     }
     if(update.connection==='open'){
       currentState='connected';qrData=null;phone=String(nextSocket.user?.id||'').split(':')[0].split('@')[0]||null;
       attempt=0;lastError=null;
     }
     if(update.connection==='close'){
       socket=null;qrData=null;phone=null;currentState='disconnected';
       const reason=update.lastDisconnect?.error?.output?.statusCode;
       if(reason===DisconnectReason.loggedOut){
         manualDisconnect=true;
         lastError='Aparelho desconectado. Gere um novo QR Code.';
         await fs.rm(authFolder,{recursive:true,force:true}).catch(()=>{});
       }else if(!manualDisconnect)laterRetry();
     }
   });
   return snapshot();
 })().catch(e=>{
   currentState='disconnected';socket=null;
   lastError='Falha ao iniciar o WhatsApp. Consulte os logs privados.';
   console.error('Failed to create WhatsApp socket:',e?.message||String(e));
   throw e;
 }).finally(()=>{connectPromise=null});
 return connectPromise;
}
async function disconnect(){
 manualDisconnect=true;
 if(restartTimer){clearTimeout(restartTimer);restartTimer=null}
 const old=socket;socket=null;qrData=null;phone=null;currentState='disconnected';
 if(old){try{await old.logout()}catch{}try{old.ws?.close?.()}catch{}}
 await fs.rm(authFolder,{recursive:true,force:true});
 return snapshot();
}
async function sendSelfTest(){
 if(currentState!=='connected'||!socket||!phone)throw Object.assign(new Error('WhatsApp não conectado'),{status:409});
 const jid=phone+'@s.whatsapp.net';
 await socket.sendMessage(jid,{text:'✅ C Scale conectado! Esta é uma mensagem de teste enviada pelo número da igreja. Que Deus abençoe seu ministério! 🙏'});
 return {sent:true,to:'same-linked-number'};
}
async function json(req){
 let buffer='';for await(const chunk of req){buffer+=chunk;if(buffer.length>2500)throw Object.assign(new Error('Payload muito grande'),{status:413})}
 try{return buffer?JSON.parse(buffer):{}}catch{throw Object.assign(new Error('JSON inválido'),{status:400})}
}
function respond(res,code,payload){
 res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end(JSON.stringify(payload));
}
http.createServer(async(req,res)=>{
 if(req.url==='/health'){return respond(res,200,{ok:true,service:'cscale-whatsapp-gateway'})}
 const presented=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 if(!compareSecret(presented))return respond(res,401,{error:'Unauthorized'});
 try{
  if(req.method==='GET'&&req.url==='/status')return respond(res,200,snapshot());
  if(req.method==='POST'&&req.url==='/connect'){
   await connectSocket();
   return respond(res,202,snapshot());
  }
  if(req.method==='POST'&&req.url==='/disconnect')return respond(res,200,await disconnect());
  if(req.method==='POST'&&req.url==='/test'){
   return respond(res,200,await sendSelfTest());
  }
  if(req.method==='POST'&&req.url==='/send'){
   // Sending to volunteer phones is intentionally disabled until consent,
   // templates, rate limits and the outbox dispatcher are configured.
   return respond(res,409,{error:'O envio automático para voluntários ainda não foi habilitado.'});
  }
  return respond(res,404,{error:'Não encontrado'});
 }catch(e){
  const status=e?.status||503;
  console.error('Gateway operation failed:',e?.message||String(e));
  return respond(res,status,{error:status===503?'Não foi possível concluir a operação. Tente novamente.':e.message});
 }
}).listen(port,'0.0.0.0',()=>console.log('C Scale WhatsApp gateway listening on '+port));

fs.stat(join(authFolder,'creds.json')).then(()=>connectSocket()).catch(()=>{});
