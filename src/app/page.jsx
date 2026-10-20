
'use client';
import {useEffect,useMemo,useState} from 'react';
import {Church,CalendarDays,Users,Music2,Clock,LogOut,Check,Plus,RefreshCw,ClipboardList,CheckCircle2,Settings2,ShieldCheck,Camera,HandHeart} from 'lucide-react';
import {db,CHURCH} from '../lib/supabase';
import {draft} from '../lib/scheduler';
const week=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const fmt=t=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'medium',timeStyle:'short'}).format(new Date(t));
const hm=n=>String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const toMin=t=>{const a=t.split(':').map(Number);return a[0]*60+a[1]};
const slug=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const fail=e=>e instanceof Error?e.message:String(e);
const initial={name:'',phone:'',limit:4,group:'nao_informada'};
export default function Page(){
 const client=useMemo(()=>{try{return db()}catch{return null}},[]);
 const [user,setUser]=useState(null),[ready,setReady]=useState(false);
 const [email,setEmail]=useState(''),[otp,setOtp]=useState(''),[mailSent,setMailSent]=useState(false);
 const [profile,setProfile]=useState(null),[manager,setManager]=useState(null),[tab,setTab]=useState('minhas');
 const [ministries,setMinistries]=useState([]),[skills,setSkills]=useState([]),[mySkills,setMySkills]=useState([]);
 const [availability,setAvailability]=useState([]),[exceptions,setExceptions]=useState([]),[newAvailability,setNewAvailability]=useState({weekday:3,start:'18:00',end:'23:00',overnight:false}),[exception,setException]=useState({date:'',note:''});
 const [services,setServices]=useState([]),[myAssignments,setMyAssignments]=useState([]),[team,setTeam]=useState({});
 const [members,setMembers]=useState([]),[allAssignments,setAllAssignments]=useState([]),[answers,setAnswers]=useState({}),[review,setReview]=useState(false);
 const [reg,setReg]=useState(initial),[roleForm,setRoleForm]=useState({ministry:'',functionId:''});
 const [cult,setCult]=useState({title:'Culto',start:'',end:'',repeat:1}),[showNew,setShowNew]=useState(false),[proposal,setProposal]=useState(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 useEffect(()=>{if(!client){setError('A conexão com Supabase ainda não foi configurada.');setReady(true);return}
  client.auth.getUser().then(({data})=>{setUser(data.user||null);setReady(true)});
  const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>setUser(session?.user||null));
  return()=>subscription.unsubscribe();
 },[client]);
 useEffect(()=>{if(client&&user)void reload();else if(!user){setProfile(null);setManager(null)}},[client,user]);
 async function reload(){
  if(!client||!user)return;
  try{
   const [mr,fr,pr]=await Promise.all([
    client.from('ministries').select('*').order('name'),
    client.from('functions').select('*').order('name'),
    client.from('profiles').select('*').eq('user_id',user.id).maybeSingle()
   ]);
   for(const x of [mr,fr,pr])if(x.error)throw x.error;
   setMinistries(mr.data||[]);setSkills(fr.data||[]);setProfile(pr.data);
   if(!pr.data)return;
   const p=pr.data;
   const [ma,ar,av,ex,sv,as]=await Promise.all([
    client.from('managers').select('*').eq('profile_id',p.id).maybeSingle(),
    client.from('profile_roles').select('*').eq('profile_id',p.id),
    client.from('availability').select('*').eq('profile_id',p.id),
    client.from('availability_exceptions').select('*').eq('profile_id',p.id),
    client.from('services').select('*').order('starts_at',{ascending:true}).limit(250),
    client.from('assignments').select('*').eq('profile_id',p.id)
   ]);
   for(const x of [ma,ar,av,ex,sv,as])if(x.error)throw x.error;
   setManager(ma.data||null);setMySkills(ar.data||[]);setAvailability(av.data||[]);
   setExceptions(ex.data||[]);setServices(sv.data||[]);setMyAssignments(as.data||[]);
   const ids=[...new Set((as.data||[]).map(x=>x.service_id))];
   const data=await Promise.all(ids.map(async id=>{const r=await client.rpc('confirmed_service_team',{p_service:id});return [id,r.data||[]]}));
   setTeam(Object.fromEntries(data));
   if(ma.data){
    const [pp,aa,vs,es,rs]=await Promise.all([
     client.from('profiles').select('*').eq('church_id',CHURCH),
     client.from('assignments').select('*'),
     client.from('availability').select('*'),
     client.from('availability_exceptions').select('*'),
     client.from('profile_roles').select('*')
    ]);
    for(const x of [pp,aa,vs,es,rs])if(x.error)throw x.error;
    setAllAssignments(aa.data||[]);
    setMembers((pp.data||[]).map(m=>({...m,profile_roles:(rs.data||[]).filter(r=>r.profile_id===m.id),availability:(vs.data||[]).filter(r=>r.profile_id===m.id),availability_exceptions:(es.data||[]).filter(r=>r.profile_id===m.id)})));
   }
   setError('');
  }catch(e){setError(fail(e))}
 }
 async function action(fn){
  setBusy(true);setError('');setMessage('');
  try{await fn();await reload()}catch(e){setError(fail(e))}finally{setBusy(false)}
 }
 async function sendLogin(e){
  e.preventDefault();if(!client)return;
  await action(async()=>{const r=await client.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:window.location.origin}});if(r.error)throw r.error;setMailSent(true);setMessage('Confira sua caixa de entrada para acessar o C Scale.')});
 }
 async function verify(e){
  e.preventDefault();await action(async()=>{const r=await client.auth.verifyOtp({email:email.trim(),token:otp.trim(),type:'email'});if(r.error)throw r.error;setMessage('Acesso confirmado.')});
 }
 async function register(e){
  e.preventDefault();await action(async()=>{
   if(reg.name.trim().length<5)throw new Error('Informe seu nome completo.');
   const r=await client.from('profiles').insert({church_id:CHURCH,user_id:user.id,full_name:reg.name.trim(),phone:reg.phone.trim(),vocal_group:reg.group,monthly_limit:Number(reg.limit),slug:slug(reg.name)+'-'+user.id.slice(0,8)});
   if(r.error)throw r.error;setMessage('Cadastro criado. Escolha seu ministério e sua disponibilidade.');
  });
 }
 async function addRole(e){
  e.preventDefault();if(!roleForm.ministry)return;
  await action(async()=>{const r=await client.from('profile_roles').insert({profile_id:profile.id,ministry_id:roleForm.ministry,function_id:roleForm.functionId||null});if(r.error)throw r.error;setMessage('Função enviada para aprovação da liderança.')});
 }
 async function addAvailable(e){
  e.preventDefault();let start=toMin(newAvailability.start),end=toMin(newAvailability.end)+(newAvailability.overnight?1440:0);
  await action(async()=>{if(end<=start||end-start>1440)throw new Error('Horário inválido.');
   const r=await client.from('availability').insert({profile_id:profile.id,weekday:Number(newAvailability.weekday),start_minute:start,end_minute:end});if(r.error)throw r.error;setMessage('Horário salvo.')});
 }
 async function addException(e){
  e.preventDefault();await action(async()=>{if(!exception.date)throw new Error('Selecione uma data.');
   const r=await client.from('availability_exceptions').upsert({profile_id:profile.id,service_date:exception.date,available:false,note:exception.note},{onConflict:'profile_id,service_date'});if(r.error)throw r.error;setMessage('Data bloqueada.')});
 }
 async function createCult(e){
  e.preventDefault();await action(async()=>{
   if(!cult.start||!cult.end||new Date(cult.end)<=new Date(cult.start))throw new Error('Verifique os horários.');
   const list=Array.from({length:Number(cult.repeat)},(_,i)=>({church_id:CHURCH,title:cult.title||'Culto',starts_at:new Date(new Date(cult.start).getTime()+i*604800000).toISOString(),ends_at:new Date(new Date(cult.end).getTime()+i*604800000).toISOString(),status:'draft'}));
   const r=await client.from('services').insert(list);if(r.error)throw r.error;setShowNew(false);setMessage('Cultos cadastrados.');
  });
 }
 async function publish(id){await action(async()=>{const r=await client.from('services').update({status:'published'}).eq('id',id);if(r.error)throw r.error;setMessage('Culto publicado para convocações.')})}
 async function updateMinistry(id,key,value){await action(async()=>{const r=await client.from('ministries').update({[key]:value===''?null:Number(value)}).eq('id',id);if(r.error)throw r.error;setMessage('Configuração atualizada.')})}
 async function approve(id,table){await action(async()=>{const r=await client.from(table).update({approved:true}).eq('id',id);if(r.error)throw r.error;setMessage('Aprovação registrada.')})}
 function makeProposal(){
  setError('');const result=draft(services,members,ministries,skills,allAssignments);setProposal(result);
  if(!result.assignments.length)setMessage('Ainda não há voluntários elegíveis suficientes. Cadastre e aprove as funções primeiro.');
 }
 async function saveProposal(){await action(async()=>{if(!proposal?.assignments?.length)return;const r=await client.from('assignments').insert(proposal.assignments);if(r.error)throw r.error;setProposal(null);setMessage('Convocações registradas. Publique os cultos quando a escala estiver revisada.')})}
 async function finalize(){
  const p=pending;await action(async()=>{
   if(p.some(x=>!answers[x.id]))throw new Error('Responda todas as convocações antes de finalizar.');
   const r=await client.rpc('finalize_my_responses',{p_answers:p.map(x=>({id:x.id,state:answers[x.id]}))});if(r.error)throw r.error;setReview(false);setAnswers({});setMessage('Respostas finalizadas! Suas datas foram registradas.');
  });
 }
 const myServices=new Map(services.map(s=>[s.id,s]));
 const pending=myAssignments.filter(a=>a.state==='pending'&&myServices.get(a.service_id)?.status==='published');
 const confirmed=myAssignments.filter(a=>a.state==='confirmed'||a.state==='completed');
 const unavailable=myAssignments.filter(a=>a.state==='unavailable');
 const nextService=a=>myServices.get(a.service_id);
 function Band({assignment}){
  const people=team[assignment.service_id]||[];
  const roleNames=['Bateria','Guitarra','Baixo','Violão','Teclado','Cantor'];
  const filtered=roleNames.map(role=>({role,names:people.filter(p=>p.function_name===role).map(p=>p.person_name)}));
  const hasMusic=skills.some(f=>f.id===assignment.function_id&&roleNames.includes(f.name));
  if(!hasMusic)return null;
  const symbols={'Bateria':'🥁','Guitarra':'🎸','Baixo':'🎸','Violão':'🎸','Teclado':'🎹','Cantor':'🎤'};
  return <div className="band"><div className="bandlist">{filtered.map(({role,names})=><div key={role} className="instrument"><div className="illustration">{symbols[role]}</div><small>{role}</small><b>{names.length?names.join(', '):'Aguardando'}</b></div>)}</div><p style={{fontSize:11,textAlign:'center',color:'#c5d2df',marginBottom:0}}>Formação do louvor — somente integrantes confirmados</p></div>;
 }
 if(!ready)return <main className="login card"><h2>C Scale</h2><p>Carregando seu acesso...</p></main>;
 return <main className="shell">
  <header className="top"><div className="brand"><div className="brand-mark"><Church size={26}/></div><div>C Scale<div className="tagline">Church Scale · Lagoinha</div></div></div>{user&&<button className="secondary" onClick={()=>client.auth.signOut()}><LogOut size={15}/> Sair</button>}</header>
  {!user?<div className="wrap"><div className="card login"><h2>Bem-vindo ao C Scale</h2><p className="muted">Seu ministério organizado em um só lugar. Entre com o e-mail associado ao seu cadastro.</p>
   <form onSubmit={sendLogin}><label>Seu e-mail</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="seuemail@exemplo.com"/><div className="actions"><button disabled={busy||!client}>Enviar link de acesso</button></div></form>
   {mailSent&&<form onSubmit={verify} style={{marginTop:20}}><p className="muted">Caso seu e-mail tenha recebido um código de seis dígitos, informe abaixo.</p><label>Código recebido</label><input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Código de 6 dígitos"/><div className="actions"><button disabled={busy||otp.length<6} className="secondary">Confirmar código</button></div></form>}
   {message&&<p className="notice">{message}</p>}{error&&<p className="error">{error}</p>}</div></div>:
  <div className="wrap">
   {error&&<div className="error">{error}</div>}{message&&<div className="notice">{message}</div>}
   {!profile?<div className="card login"><h2>Meu cadastro</h2><p className="muted">Preencha seus dados para participar das escalas. A liderança aprovará sua função.</p><form onSubmit={register} className="stack"><div><label>Nome completo</label><input required value={reg.name} onChange={e=>setReg(v=>({...v,name:e.target.value}))}/></div><div><label>WhatsApp com DDD</label><input required value={reg.phone} onChange={e=>setReg(v=>({...v,phone:e.target.value}))} placeholder="(15) 99999-9999"/></div><div><label>Quantidade máxima de cultos por mês</label><input type="number" min="1" max="30" value={reg.limit} onChange={e=>setReg(v=>({...v,limit:e.target.value}))}/></div><div><label>Grupo de voz (se participa do louvor)</label><select value={reg.group} onChange={e=>setReg(v=>({...v,group:e.target.value}))}><option value="nao_informada">Não se aplica</option><option value="masculina">Voz masculina</option><option value="feminina">Voz feminina</option></select></div><button disabled={busy}>Criar meu cadastro</button></form></div>:
   <>
    <div className="row"><div className="profile"><div className="avatar">{profile.full_name.split(' ').filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div><div><strong>{profile.full_name}</strong><div className="sm">{manager?'Liderança • ':''}{profile.approved?'Cadastro aprovado':'Aguardando aprovação'}</div></div></div><button className="secondary" onClick={()=>void reload()} title="Atualizar"><RefreshCw size={17}/></button></div>
    <nav className="menu">
     {[['minhas','Minhas escalas',CalendarDays],['disponibilidade','Disponibilidade',Clock],['perfil','Meu perfil',Users],...(manager?[['gestao','Gestão',ClipboardList],['voluntarios','Voluntários',ShieldCheck],['ministerios','Ministérios',Settings2]]:[])].map(([id,label,Icon])=><button key={id} className={tab===id?'active':'secondary'} onClick={()=>setTab(id)}><Icon size={15} style={{verticalAlign:'middle'}}/> {label}</button>)}
    </nav>
    {tab==='minhas'&&<>
     <div className="grid three" style={{marginBottom:16}}><div className="stat"><strong>{pending.length}</strong><div className="sm">Aguardando resposta</div></div><div className="stat"><strong>{confirmed.length}</strong><div className="sm">Confirmadas</div></div><div className="stat"><strong>{unavailable.length}</strong><div className="sm">Não disponíveis</div></div></div>
     <section className="card"><div className="titleline"><h2>Novas escalas</h2><span className="pill wait">{pending.length} pendente(s)</span></div><p className="muted">Escolha Confirmar ou Não disponível. Você só enviará as respostas depois de conferir tudo.</p>
      {pending.length===0?<div className="minicard">Nenhuma confirmação pendente no momento.</div>:<div className="list">{pending.map(a=>{const s=nextService(a),f=skills.find(x=>x.id===a.function_id);return <div key={a.id} className="minicard"><div className="row"><div><strong>{s?.title||'Culto'}</strong><div className="sm">{s?fmt(s.starts_at):''} · {f?.name||ministries.find(x=>x.id===a.ministry_id)?.name}</div></div><span className="pill wait">Pendente</span></div><Band assignment={a}/><div className="actions"><button className={answers[a.id]==='confirmed'?'active':'secondary'} onClick={()=>setAnswers(v=>({...v,[a.id]:'confirmed'}))}>✓ Confirmar</button><button className={answers[a.id]==='unavailable'?'danger':'secondary'} onClick={()=>setAnswers(v=>({...v,[a.id]:'unavailable'}))}>Não disponível</button></div></div>})}<button disabled={busy||pending.some(a=>!answers[a.id])} onClick={()=>setReview(true)}>Conferir e finalizar respostas</button></div>}
     </section>
     <section className="card"><div className="titleline"><h2>Minhas confirmadas</h2><span className="pill ok">{confirmed.length}</span></div><div className="list">{confirmed.length===0?<p className="muted">Suas datas confirmadas aparecerão aqui.</p>:confirmed.map(a=><div className="minicard" key={a.id}><div className="row"><div><strong>{nextService(a)?.title||'Culto'}</strong><div className="sm">{nextService(a)?fmt(nextService(a).starts_at):''} · {skills.find(x=>x.id===a.function_id)?.name||'Voluntário'}</div></div><span className="pill ok">Confirmado</span></div><Band assignment={a}/></div>)}</div></section>
     {unavailable.length>0&&<details className="card"><summary>Não disponíveis ({unavailable.length})</summary><div className="list" style={{marginTop:12}}>{unavailable.map(a=><div className="minicard row" key={a.id}><div>{nextService(a)?.title||'Culto'}<div className="sm">{nextService(a)?fmt(nextService(a).starts_at):''}</div></div><span className="pill no">Não disponível</span></div>)}</div></details>}
    </>}
    {tab==='perfil'&&<section className="card"><h2>Meu perfil</h2><p className="muted">Seu link é permanente. Para proteger as informações, o acesso exige autenticação.</p><div className="linkbox">{typeof window!=='undefined'?window.location.origin:''}/voluntario/{profile.slug}</div><p><strong>WhatsApp: </strong>{profile.phone||'Não informado'}<br/><strong>Limite mensal: </strong>{profile.monthly_limit} cultos</p><h3>Minhas funções</h3><div className="stack">{mySkills.length?mySkills.map(r=><div className="minicard row" key={r.id}><span>{ministries.find(x=>x.id===r.ministry_id)?.name} • {skills.find(x=>x.id===r.function_id)?.name||'Equipe geral'}</span><span className={'pill '+(r.approved?'ok':'wait')}>{r.approved?'Aprovada':'Aguardando'}</span></div>):<p className="muted">Adicione sua função abaixo.</p>}</div><div className="divider"/>
     <h3>Adicionar uma função</h3><form onSubmit={addRole}><div className="fields"><div><label>Ministério</label><select value={roleForm.ministry} onChange={e=>setRoleForm({ministry:e.target.value,functionId:''})}><option value="">Selecione</option>{ministries.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></div><div><label>Função</label><select value={roleForm.functionId} onChange={e=>setRoleForm(v=>({...v,functionId:e.target.value}))}><option value="">Equipe geral</option>{skills.filter(x=>x.ministry_id===roleForm.ministry).map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></div></div><button disabled={busy||!roleForm.ministry}>Solicitar função</button></form>
    </section>}
    {tab==='disponibilidade'&&<><section className="card"><h2>Disponibilidade semanal</h2><p className="muted">Informe os horários completos em que você pode servir. Também aceitamos horários noturnos que terminam no dia seguinte.</p><div className="list">{availability.map(v=><div className="minicard row" key={v.id}><div><strong>{week[v.weekday]}</strong><div className="sm">{hm(v.start_minute)} às {hm(v.end_minute)} {v.end_minute>1440?'• dia seguinte':''}</div></div><button className="danger" disabled={busy} onClick={()=>void action(async()=>{const r=await client.from('availability').delete().eq('id',v.id);if(r.error)throw r.error})}>Excluir</button></div>)}</div><form onSubmit={addAvailable}><div className="fields"><div><label>Dia</label><select value={newAvailability.weekday} onChange={e=>setNewAvailability(v=>({...v,weekday:+e.target.value}))}>{week.map((n,i)=><option key={n} value={i}>{n}</option>)}</select></div><div><label>A partir de</label><input type="time" step="1800" value={newAvailability.start} onChange={e=>setNewAvailability(v=>({...v,start:e.target.value}))}/></div><div><label>Até</label><input type="time" step="1800" value={newAvailability.end} onChange={e=>setNewAvailability(v=>({...v,end:e.target.value}))}/></div><div className="checklist" style={{alignSelf:'end'}}><input type="checkbox" checked={newAvailability.overnight} onChange={e=>setNewAvailability(v=>({...v,overnight:e.target.checked}))}/> Termina no dia seguinte</div></div><button disabled={busy}><Plus size={14}/> Adicionar horário</button></form></section>
     <section className="card"><h3>Datas em que não posso servir</h3><p className="muted">Marque férias, viagens ou imprevistos. A escala automática evitará essas datas.</p><div className="list">{exceptions.map(v=><div className="minicard row" key={v.id}><div>{v.service_date} <span className="sm">{v.note}</span></div><button className="danger" disabled={busy} onClick={()=>void action(async()=>{const r=await client.from('availability_exceptions').delete().eq('id',v.id);if(r.error)throw r.error})}>Excluir</button></div>)}</div><form onSubmit={addException}><div className="fields"><div><label>Data</label><input type="date" value={exception.date} onChange={e=>setException(v=>({...v,date:e.target.value}))}/></div><div><label>Observação (opcional)</label><input value={exception.note} onChange={e=>setException(v=>({...v,note:e.target.value}))}/></div></div><button disabled={busy}>Bloquear data</button></form></section>
    </>}
    {manager&&tab==='voluntarios'&&<section className="card"><h2>Voluntários</h2><p className="muted">A liderança valida cadastro e funções antes de incluí-los nas escalas.</p><div className="list">{members.map(p=><div className="minicard" key={p.id}><div className="row"><div><strong>{p.full_name}</strong><div className="sm">Limite: {p.monthly_limit} cultos/mês • {p.availability.length} horários • {p.profile_roles.length} funções</div></div>{p.approved?<span className="pill ok">Aprovado</span>:<button disabled={busy} onClick={()=>approve(p.id,'profiles')}>Aprovar perfil</button>}</div>{p.profile_roles.filter(r=>!r.approved).map(r=><div className="row" key={r.id} style={{marginTop:10}}><div className="sm">{ministries.find(m=>m.id===r.ministry_id)?.name} / {skills.find(f=>f.id===r.function_id)?.name||'Equipe'}</div><button className="secondary" disabled={busy} onClick={()=>approve(r.id,'profile_roles')}>Aprovar função</button></div>)}</div>)}</div></section>}
    {manager&&tab==='ministerios'&&<section className="card"><h2>Ministérios da Lagoinha</h2><p className="muted">São 55 posições mínimas por culto, além do Staff. Apenas pastores podem alterar as regras oficiais.</p><div className="list">{ministries.map(m=><div key={m.id} className="minicard"><div className="row"><strong>{m.name}</strong><span className="pill">{m.min_people||'A definir'} posições</span></div>{skills.filter(x=>x.ministry_id===m.id).map(f=><div className="sm" key={f.id}>• {f.name} — {f.min_people}</div>)}<div className="sm" style={{marginTop:8}}>Chegada: {m.arrival_minutes??'A definir'} minutos antes • Saída: {m.departure_minutes??'A definir'} minutos depois</div>{manager.role==='pastor'&&<div className="fields">{[['min_people','Equipe mínima'],['arrival_minutes','Chegada (minutos antes)'],['departure_minutes','Saída (minutos depois)']].map(([key,label])=><div key={key}><label>{label}</label><input type="number" min="0" defaultValue={m[key]??''} onBlur={e=>{const v=e.target.value;if(v!==String(m[key]??''))void updateMinistry(m.id,key,v)}}/></div>)}</div>}</div>)}</div></section>}
    {manager&&tab==='gestao'&&<>
     <div className="row" style={{marginBottom:14}}><h2>Gestão dos cultos</h2>{manager.role==='pastor'&&<button onClick={()=>setShowNew(!showNew)}><Plus size={14}/> Novo culto</button>}</div>
     {showNew&&manager.role==='pastor'&&<section className="card"><h3>Criar culto</h3><form onSubmit={createCult}><div className="fields"><div><label>Nome</label><input value={cult.title} onChange={e=>setCult(v=>({...v,title:e.target.value}))}/></div><div><label>Início</label><input type="datetime-local" required value={cult.start} onChange={e=>setCult(v=>({...v,start:e.target.value}))}/></div><div><label>Término</label><input type="datetime-local" required value={cult.end} onChange={e=>setCult(v=>({...v,end:e.target.value}))}/></div><div><label>Repetir semanalmente</label><select value={cult.repeat} onChange={e=>setCult(v=>({...v,repeat:+e.target.value}))}>{[1,2,3,4,5].map(x=><option value={x} key={x}>{x} {x===1?'culto':'cultos'}</option>)}</select></div></div><button disabled={busy}>Salvar cultos</button></form></section>}
     <section className="card"><div className="row"><div><h3>Escala automática</h3><p className="muted">Analisa funções aprovadas, horários, carga mensal e conflitos. Faça uma prévia antes de publicar.</p></div><button className="secondary" onClick={makeProposal}>Gerar prévia</button></div>{proposal&&<div className="minicard"><strong>{proposal.assignments.length} convocações possíveis</strong><p className="sm">{proposal.missing.length} posições ainda descobertas</p>{proposal.missing.length>0&&<details><summary>Ver posições sem voluntário</summary><div className="stack" style={{marginTop:8}}>{proposal.missing.slice(0,80).map((m,i)=><span className="sm" key={i}>{m}</span>)}</div></details>}<div className="actions"><button disabled={busy||proposal.assignments.length===0} onClick={saveProposal}>Salvar convocações</button><button className="secondary" onClick={()=>setProposal(null)}>Cancelar</button></div></div>}</section>
     <section className="card"><h3>Cultos</h3><div className="list">{services.length===0?<p className="muted">Nenhum culto cadastrado ainda.</p>:services.map(s=><div className="minicard row" key={s.id}><div><strong>{s.title}</strong><div className="sm">{fmt(s.starts_at)} — {fmt(s.ends_at)}</div><div className="sm">{allAssignments.filter(a=>a.service_id===s.id).length} convocados • {allAssignments.filter(a=>a.service_id===s.id&&a.state==='confirmed').length} confirmados</div></div><div className="stack"><span className={'pill '+(s.status==='published'?'ok':'wait')}>{s.status}</span>{s.status==='draft'&&manager.role==='pastor'&&<button disabled={busy} onClick={()=>publish(s.id)}>Publicar</button>}</div></div>)}</div></section>
    </>}
   </>
   }
  </div>}
  {review&&<div className="modal-bg" role="dialog" aria-modal="true"><div className="modal-card"><div className="row"><h2>Conferir respostas</h2><button className="secondary" onClick={()=>setReview(false)}>✕</button></div><p className="muted">Confira suas respostas antes de finalizar. Depois de enviar, as alterações ficam com a liderança.</p><div className="stack">{pending.map(a=><div className="minicard row" key={a.id}><div><strong>{nextService(a)?.title||'Culto'}</strong><div className="sm">{nextService(a)?fmt(nextService(a).starts_at):''}</div></div><span className={'pill '+(answers[a.id]==='confirmed'?'ok':'no')}>{answers[a.id]==='confirmed'?'Confirmar':'Não disponível'}</span></div>)}</div><div className="actions"><button className="secondary" onClick={()=>setReview(false)}>Voltar e editar</button><button className="good" disabled={busy} onClick={finalize}><Check size={15}/> Finalizar respostas</button></div></div></div>}
 </main>;
}
