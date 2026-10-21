'use client';
import React,{useCallback,useEffect,useState} from 'react';
import {QrCode,MessageCircle,Smartphone,ShieldCheck,RefreshCw,CheckCheck,Link2Off,Send,Info,LockKeyhole} from 'lucide-react';
import {PageHead,Btn,Badge} from './ui';
const labels={unconfigured:'Configuração pendente',disconnected:'Não conectado',connecting:'Preparando conexão',qr:'Aguardando leitura',connected:'Número conectado',offline:'Serviço indisponível'};
export function WhatsAppSettings({client,demo=false}){
 const [state,setState]=useState({status:demo?'demo':'loading',qrCode:null,senderPhone:null});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const refresh=useCallback(async()=>{
  if(demo||!client)return;
  try{
   const {data:{session},error:e}=await client.auth.getSession();
   if(e||!session?.access_token)throw Error('Sua sessão expirou. Entre novamente.');
   const res=await fetch('/api/whatsapp',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
   const data=await res.json();
   if(!res.ok)throw Error(data.error||'Não foi possível consultar o WhatsApp.');
   setState(data);setError('');
  }catch(e){setError(e.message||'Não foi possível consultar o serviço.');setState(s=>({...s,status:'offline',qrCode:null}))}
 },[client,demo]);
 useEffect(()=>{if(demo)return;void refresh();const timer=setInterval(()=>void refresh(),4500);return ()=>clearInterval(timer)},[demo,refresh]);
 async function command(action){
  if(busy||!client)return;
  setBusy(true);setSuccess('');setError('');
  try{
   const {data:{session}}=await client.auth.getSession();
   if(!session?.access_token)throw Error('Entre na sua conta novamente.');
   const res=await fetch('/api/whatsapp',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({action})});
   const result=await res.json();
   if(!res.ok)throw Error(result.error||'A operação não foi concluída.');
   setSuccess(action==='test'?'Mensagem de teste enviada ao próprio número vinculado.':action==='disconnect'?'WhatsApp desvinculado.':'Preparando o QR Code. Ele aparecerá automaticamente.');
   await refresh();
  }catch(e){setError(e.message||'Não foi possível concluir a operação.')}finally{setBusy(false)}
 }
 const status=state.status,connected=status==='connected',waiting=status==='qr',preparing=status==='connecting';
 return <>
  <PageHead eyebrow="CONFIGURAÇÕES DA IGREJA" title="WhatsApp da igreja" description="Conecte o número que será usado para avisar os voluntários sobre as escalas."/>
  <div className="wa-intro"><div className="wa-intro-icon"><MessageCircle size={27}/></div><div><div className="wa-intro-kicker">CANAL DE COMUNICAÇÃO</div><h2>Um número para todas as escalas</h2><p>O pastor controla a conexão. Os voluntários não veem o QR Code nem as credenciais.</p></div><Badge tone={connected?'green':waiting?'amber':'purple'}>{demo?'Prévia':labels[status]||'Verificando'}</Badge></div>
  {demo&&<div className="wa-info-line"><Info size={18}/><span>Esta é uma prévia. Entre com a conta real do pastor para vincular um número de verdade.</span></div>}
  {success&&<div className="alert" role="status"><CheckCheck size={18}/>{success}</div>}
  {error&&<div className="alert error" role="alert"><Info size={18}/>{error}</div>}
  <div className="wa-content">
   <section className="wa-main-card">
    {connected&&!demo?<div className="wa-connected-state"><div className="wa-connected-icon"><CheckCheck size={35}/></div><h2>WhatsApp conectado!</h2><p>Este número ficará pronto para o envio quando as notificações forem habilitadas.</p><div className="wa-number">{state.senderPhone?'+'+state.senderPhone:'Número conectado'}</div><div className="wa-info-line"><ShieldCheck size={17}/><span>A sessão é preservada no servidor, sem salvar o QR no banco.</span></div><div className="actions wa-actions"><Btn icon={Send} disabled={busy} onClick={()=>command('test')}>Enviar mensagem de teste</Btn><Btn icon={Link2Off} variant="secondary" disabled={busy} onClick={()=>{if(window.confirm('Desconectar este WhatsApp do C Scale?'))void command('disconnect')}}>Desconectar</Btn></div></div>:
    waiting&&state.qrCode&&!demo?<div className="wa-qr-state"><div className="wa-pulse"><span/>AGUARDANDO SEU CELULAR</div><h2>Escaneie o QR Code</h2><p>Use o WhatsApp do número que ficará responsável pelas mensagens da igreja.</p><div className="wa-qr-frame"><img src={state.qrCode} alt="QR Code temporário para vincular o WhatsApp da igreja" width="300" height="300"/></div><div className="wa-qr-foot"><RefreshCw size={14}/> O código atualiza automaticamente enquanto você conecta.</div></div>:
    preparing?<div className="wa-wait-state"><RefreshCw size={38} className="wa-spin"/><h2>Preparando seu QR Code...</h2><p>A conexão com o WhatsApp está sendo iniciada.</p></div>:
    <div className="wa-empty-state"><div className="wa-qr-placeholder"><QrCode size={94} strokeWidth={1.1}/></div><h2>{demo?'Pronto para conectar':'Conecte o WhatsApp da igreja'}</h2><p>{demo?'No painel real, um QR Code temporário aparecerá aqui para ser escaneado.':status==='offline'?'O serviço está temporariamente indisponível. Tente atualizar.':'Clique para gerar um QR Code e escaneie com o WhatsApp do número da igreja.'}</p>{demo?<Btn icon={LockKeyhole} disabled>Somente na conta real do pastor</Btn>:<div className="actions wa-actions"><Btn icon={QrCode} disabled={busy||status==='unconfigured'} onClick={()=>command('connect')}>Gerar QR Code</Btn><Btn icon={RefreshCw} variant="secondary" disabled={busy} onClick={refresh}>Atualizar</Btn></div>}</div>}
   </section>
   <aside className="wa-instructions"><div className="wa-steps-heading"><Smartphone size={19}/><h3>Como conectar</h3></div>
    {[['01','Abra o WhatsApp','No celular que contém o número da igreja.'],['02','Vá em Aparelhos conectados','Abra o menu e escolha “Conectar aparelho”.'],['03','Leia o QR Code','Aponte o celular para o código ao lado.']].map(([n,title,detail])=><div className="wa-step" key={n}><span>{n}</span><div><b>{title}</b><p>{detail}</p></div></div>)}
    <div className="wa-privacy"><LockKeyhole size={16}/><span>Só o pastor pode acessar esta página e desconectar o número.</span></div>
   </aside>
  </div>
  <div className="wa-bottom-note"><Info size={18}/><div><strong>Sobre as mensagens</strong><p>Esta conexão usa WhatsApp Web (não oficial), sujeito a desconexões e restrições da plataforma. O envio automático para voluntários permanece desativado até validarmos a conexão e as regras de envio. Para uso contínuo, a API oficial do WhatsApp Business é mais adequada.</p></div></div>
 </>;
}
