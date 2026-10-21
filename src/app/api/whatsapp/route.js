
import {createClient} from '@supabase/supabase-js';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const CHURCH_ID='11111111-1111-4111-8111-111111111111';
const actions={connect:'/connect',disconnect:'/disconnect',test:'/test'};
let lastTestAt=0;

const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

async function authorize(request){
 const raw=request.headers.get('authorization')||'';
 const token=raw.startsWith('Bearer ')?raw.slice(7).trim():'';
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!token||!url||!key)return null;
 const db=createClient(url,key,{
  global:{headers:{Authorization:'Bearer '+token}},
  auth:{persistSession:false,autoRefreshToken:false}
 });
 const {data,error}=await db.auth.getUser(token);
 if(error||!data?.user)return null;
 const permission=await db.rpc('is_pastor',{p_church:CHURCH_ID});
 if(permission.error||permission.data!==true)return null;
 return {db,user:data.user};
}
async function gateway(path,method='GET'){
 const origin=process.env.WHATSAPP_GATEWAY_URL;
 const key=process.env.WHATSAPP_GATEWAY_KEY;
 if(!origin||!key)return {configured:false,status:'unconfigured',qrCode:null,senderPhone:null};
 try{
  const response=await fetch(origin+path,{
   method,
   headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
   cache:'no-store',
   signal:AbortSignal.timeout(12000)
  });
  const payload=await response.json();
  if(!response.ok)throw Error(typeof payload.error==='string'?payload.error:'Serviço indisponível');
  return {...payload,configured:true};
 }catch(e){
  return {configured:true,status:'offline',qrCode:null,senderPhone:null,error:'O serviço do WhatsApp está temporariamente indisponível.'};
 }
}
export async function GET(request){
 const ctx=await authorize(request);
 if(!ctx)return json({error:'Apenas o pastor autenticado pode acessar esta configuração.'},403);
 const status=await gateway('/status');
 return json(status);
}
export async function POST(request){
 const ctx=await authorize(request);
 if(!ctx)return json({error:'Apenas o pastor autenticado pode conectar o WhatsApp.'},403);
 let data;
 try{data=await request.json()}catch{return json({error:'Requisição inválida.'},400)}
 const action=String(data?.action||'');
 if(!Object.hasOwn(actions,action))return json({error:'Ação não permitida.'},400);
 const current=await gateway('/status');
 if(!current.configured)return json({error:'O serviço WhatsApp não foi configurado.'},503);
 if(action==='test'){
  if(current.status!=='connected')return json({error:'Conecte o número antes de enviar um teste.'},409);
  if(Date.now()-lastTestAt<60000)return json({error:'Aguarde um minuto antes de enviar outro teste.'},429);
  lastTestAt=Date.now();
 }
 const result=await gateway(actions[action],'POST');
 if(result.status==='offline')return json(result,503);
 return json(result,action==='connect'?202:200);
}
