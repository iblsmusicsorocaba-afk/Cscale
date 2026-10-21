'use client';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Church,ChartNoAxesCombined,HeartHandshake,CalendarRange,UsersRound,ShieldCheck,CheckCircle2,Mail,LockKeyhole,ArrowRight,UserRoundPlus,Eye,EyeOff,AlertCircle,RefreshCw} from 'lucide-react';
import {db,CHURCH} from '../lib/supabase';
import {monthKey,Avatar,Btn} from './ui';
import {AppShell} from './AppShell';
import {Dashboard} from './Dashboard';
import {SchedulePages} from './SchedulePages';
import {TeamPage,MinistriesPage,LeadersPage} from './TeamPages';
import {VolunteerSchedule,AvailabilityPage,ProfilePage} from './VolunteerPages';

const emptyData={ministries:[],functions:[],profile:null,manager:null,scopes:[],profiles:[],members:[],allLeaders:[],leaderScopes:[],myRoles:[],availability:[],exceptions:[],services:[],assignments:[],myAssignments:[],team:{}};
const msg=e=>{const message=e?.message||String(e);if(message.includes('Invalid login credentials'))return 'E-mail ou senha incorretos.';if(message.includes('Email not confirmed'))return 'Confirme o e-mail da sua conta antes de entrar.';if(message.includes('duplicate key'))return 'Este registro já existe.';return message};
const profileSlug=(name,id)=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+id.slice(0,8);
function Login({client,working,onSignIn,error,notice}){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[signup,setSignup]=useState(false),[show,setShow]=useState(false);
 const submit=e=>{e.preventDefault();onSignIn({email:email.trim().toLowerCase(),password,signup});};
 return <div className="sign-landing"><div className="sign-left"><div className="sign-brand"><span className="logo-mark"><Church size={26}/></span> C Scale<span style={{color:'#a9a4ff'}}>.</span></div><div style={{position:'relative',zIndex:1}}><div className="eyebrow" style={{color:'#b4adff'}}>BEM-VINDO À SUA COMUNIDADE</div><h1 className="sign-title">Organizando escalas.<br/>Valorizando pessoas.</h1><p className="sign-lead">Uma plataforma para a Lagoinha servir com excelência. Cultos, ministérios e voluntários conectados em um só lugar.</p><div className="sign-features"><div><ChartNoAxesCombined size={24} color="#bdb8ff"/><b>Visão completa</b><small>Dashboards claros para a liderança.</small></div><div><CalendarRange size={24} color="#bdb8ff"/><b>Escalas inteligentes</b><small>Mais organização, menos conflitos.</small></div><div><HeartHandshake size={24} color="#bdb8ff"/><b>Pessoas primeiro</b><small>Confirmações simples e intuitivas.</small></div></div></div><div style={{fontSize:11,color:'#9baecb'}}>© C Scale · Lagoinha Sorocaba</div></div><div className="sign-right"><div className="sign-form"><div className="eyebrow">C SCALE • CHURCH MANAGEMENT</div><h2>{signup?'Crie seu acesso':'Bom ter você aqui!'}</h2><p>{signup?'Comece seu cadastro para participar de um ministério.':'Entre com o e-mail e a senha cadastrados para continuar.'}</p>{error&&<div className="alert error"><AlertCircle size={18}/>{error}</div>}{notice&&<div className="alert"><CheckCircle2 size={18}/>{notice}</div>}<form onSubmit={submit}><label>Seu e-mail</label><div className="row"><Mail size={18} color="#a1abc0" style={{position:'absolute',marginLeft:13,pointerEvents:'none'}}/><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" style={{paddingLeft:40}}/></div><label>Senha</label><div className="row"><LockKeyhole size={18} color="#a1abc0" style={{position:'absolute',marginLeft:13,pointerEvents:'none'}}/><input type={show?'text':'password'} required minLength={8} autoComplete={signup?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" style={{paddingLeft:40,paddingRight:42}}/><button type="button" aria-label="Mostrar senha" onClick={()=>setShow(v=>!v)} style={{marginLeft:-45,position:'relative',border:0,background:'transparent',color:'#94a0b4',width:32,height:32}}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div><Btn type="submit" disabled={working} className="w-full mt-3" icon={ArrowRight}>{working?'Processando...':signup?'Criar acesso':'Entrar no C Scale'}</Btn></form><div className="divider"/><Btn className="w-full" variant="secondary" icon={signup?ArrowRight:UserRoundPlus} onClick={()=>setSignup(v=>!v)}>{signup?'Já tenho acesso — entrar':'Meu primeiro acesso'}</Btn><div className="sign-footer">Seu acesso é individual e protegido por autenticação.</div></div></div></div>;
}
function Registration({user,working,error,notice,onRegister}){
 const [form,setForm]=useState({name:'',phone:'',limit:4,vocal:'nao_informada'});
 return <div className="sign-landing"><div className="sign-left"><div className="sign-brand"><span className="logo-mark"><Church size={26}/></span>C Scale.</div><div><div className="eyebrow" style={{color:'#b4adff'}}>PRIMEIRO ACESSO</div><h1 className="sign-title">Bem-vindo ao<br/>seu ministério.</h1><p className="sign-lead">Preencha seus dados para que a liderança possa preparar uma escala que respeite seu tempo e sua disponibilidade.</p></div><small>Lagoinha Sorocaba · Juntos, fazemos mais.</small></div><div className="sign-right"><form className="sign-form" onSubmit={e=>{e.preventDefault();onRegister(form)}}><div className="eyebrow">CADASTRO DE VOLUNTÁRIO</div><h2>Conte-nos sobre você</h2><p>Seu acesso por e-mail já está ativo: {user.email}</p>{error&&<div className="alert error">{error}</div>}{notice&&<div className="alert">{notice}</div>}<label>Nome completo</label><input value={form.name} required minLength={5} onChange={e=>setForm(v=>({...v,name:e.target.value}))} placeholder="Nome e sobrenome"/><label>WhatsApp com DDD</label><input value={form.phone} required onChange={e=>setForm(v=>({...v,phone:e.target.value}))} placeholder="(15) 99999-9999"/><label>Máximo de cultos por mês</label><input type="number" min={1} max={30} value={form.limit} onChange={e=>setForm(v=>({...v,limit:e.target.value}))}/><label>Grupo vocal (opcional)</label><select value={form.vocal} onChange={e=>setForm(v=>({...v,vocal:e.target.value}))}><option value="nao_informada">Não se aplica</option><option value="masculina">Voz masculina</option><option value="feminina">Voz feminina</option></select><Btn className="w-full mt-3" type="submit" disabled={working} icon={ArrowRight}>Concluir cadastro</Btn></form></div></div>;
}
export default function CScaleApp(){
 const client=useMemo(()=>{try{return db()}catch{return null}},[]);
 const [user,setUser]=useState(null),[authReady,setAuthReady]=useState(false);
 const [data,setData]=useState(emptyData),[loading,setLoading]=useState(false),[working,setWorking]=useState(false);
 const [notice,setNotice]=useState(''),[error,setError]=useState('');
 const [section,setSection]=useState('minhas');
 const [month,setMonth]=useState(()=>monthKey(new Date())),[selectedMinistry,setSelectedMinistry]=useState('');
 const routed=useRef(false);
 const loadingSerial=useRef(0);
 useEffect(()=>{
  if(!client){setAuthReady(true);setError('Não foi possível conectar ao Supabase.');return}
  client.auth.getUser().then(({data})=>{setUser(data.user||null);setAuthReady(true)}).catch(e=>{setError(msg(e));setAuthReady(true)});
  const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{setUser(session?.user||null);setAuthReady(true)});
  return()=>subscription.unsubscribe();
 },[client]);
 const load=useCallback(async()=>{
  if(!client||!user)return;
  const serial=++loadingSerial.current;
  setLoading(true);
  const get=async query=>{const {data,error}=await query;if(error)throw error;return data};
  try{
   const [profile,allMinistries,functions]=await Promise.all([
    get(client.from('profiles').select('*').eq('user_id',user.id).maybeSingle()),
    get(client.from('ministries').select('*').order('name')),
    get(client.from('functions').select('*').order('name'))
   ]);
   const base={...emptyData,profile,ministries:allMinistries||[],functions:functions||[]};
   if(!profile){if(serial===loadingSerial.current)setData(base);return}
   const [manager,scopes,myRoles,availability,exceptions,services,myAssignments]=await Promise.all([
    get(client.from('managers').select('*').eq('profile_id',profile.id).maybeSingle()),
    get(client.from('leader_ministries').select('*')),
    get(client.from('profile_roles').select('*').eq('profile_id',profile.id)),
    get(client.from('availability').select('*').eq('profile_id',profile.id)),
    get(client.from('availability_exceptions').select('*').eq('profile_id',profile.id)),
    get(client.from('services').select('*').order('starts_at',{ascending:true}).limit(600)),
    get(client.from('assignments').select('*').eq('profile_id',profile.id))
   ]);
   Object.assign(base,{manager,scopes:scopes||[],myRoles:myRoles||[],availability:availability||[],exceptions:exceptions||[],services:services||[],myAssignments:myAssignments||[]});
   if(manager){
    const [profiles,roles,available,excepts,assignments,allLeaders,leaderScopes]=await Promise.all([
     get(client.from('profiles').select('*').eq('church_id',CHURCH)),
     get(client.from('profile_roles').select('*')),
     get(client.from('availability').select('*')),
     get(client.from('availability_exceptions').select('*')),
     get(client.from('assignments').select('*')),
     get(client.from('managers').select('*')),
     get(client.from('leader_ministries').select('*'))
    ]);
    const allowed=new Set((scopes||[]).filter(s=>s.profile_id===profile.id).map(s=>s.ministry_id));
    const pastor=manager.role==='pastor';
    const memberships=roles||[];
    const memberProfiles=(profiles||[]).filter(p=>pastor||memberships.some(r=>r.profile_id===p.id&&allowed.has(r.ministry_id)));
    base.members=memberProfiles.map(p=>({...p,
      profile_roles:memberships.filter(r=>r.profile_id===p.id&&(pastor||allowed.has(r.ministry_id))),
      availability:(available||[]).filter(v=>v.profile_id===p.id),
      availability_exceptions:(excepts||[]).filter(x=>x.profile_id===p.id)
    }));
    base.profiles=profiles||[];
    base.assignments=(assignments||[]).filter(a=>pastor||allowed.has(a.ministry_id));
    base.allLeaders=allLeaders||[];
    base.leaderScopes=leaderScopes||[];
   }
   const ids=[...new Set((myAssignments||[]).map(x=>x.service_id))];
   const teamRows=await Promise.all(ids.map(async id=>{
    const result=await client.rpc('confirmed_service_team',{p_service:id});
    return [id,result.error?[]:(result.data||[])];
   }));
   base.team=Object.fromEntries(teamRows);
   if(serial===loadingSerial.current){
    setData(base);
    if(!routed.current){setSection(manager?'dashboard':'minhas');routed.current=true}
    setError('');
   }
  }catch(e){if(serial===loadingSerial.current)setError(msg(e))}finally{if(serial===loadingSerial.current)setLoading(false)}
 },[client,user]);
 useEffect(()=>{if(!user){routed.current=false;setData(emptyData);setLoading(false);return}void load()},[user,load]);
 const onRun=async(fn,success)=>{
  setWorking(true);setError('');setNotice('');
  try{await fn();setNotice(success||'Alterações salvas.');await load();return true}
  catch(e){setError(msg(e));return false}
  finally{setWorking(false)}
 };
 const authenticate=({email,password,signup})=>onRun(async()=>{
  if(!client)throw Error('Supabase não configurado.');
  const request=signup?client.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin}}):client.auth.signInWithPassword({email,password});
  const {data:result,error:err}=await request;if(err)throw err;
  if(signup&&!result.session){setNotice('Confirme o e-mail enviado para '+email+' e entre com sua senha.');return}
 },'Acesso autenticado.');
 const register=(form)=>onRun(async()=>{
  if(!user)throw Error('É necessário entrar primeiro.');
  if(form.name.trim().length<5)throw Error('Informe seu nome completo.');
  const {error:err}=await client.from('profiles').insert({user_id:user.id,church_id:CHURCH,full_name:form.name.trim(),slug:profileSlug(form.name,user.id),phone:form.phone.trim(),monthly_limit:Number(form.limit),vocal_group:form.vocal});
  if(err)throw err;
 },'Cadastro registrado. Agora escolha sua disponibilidade e seu ministério.');
 const logout=async()=>{await client.auth.signOut();setData(emptyData);setSection('minhas');setNotice('');setError('')};
 if(!authReady)return <div style={{minHeight:'100vh',display:'grid',placeItems:'center'}}><div className="logo-mark"><Church size={31}/></div></div>;
 if(!user)return <Login client={client} working={working} onSignIn={authenticate} notice={notice} error={error}/>;
 if(loading&&!data.profile)return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',gap:15}}><div className="stack" style={{alignItems:'center'}}><div className="logo-mark"><Church size={26}/></div><p className="muted">Preparando seu painel...</p></div></div>;
 if(!data.profile)return <Registration user={user} working={working} error={error} notice={notice} onRegister={register}/>;
 const role=data.manager?.role||'volunteer';
 const isAdmin=role==='pastor'||role==='leader';
 const permitted=role==='pastor'?data.ministries:data.ministries.filter(m=>data.scopes.some(s=>s.profile_id===data.profile.id&&s.ministry_id===m.id));
 const viewedAssignments=isAdmin?data.assignments:[];
 const pending=data.myAssignments.filter(a=>a.state==='pending'&&data.services.some(s=>s.id===a.service_id&&s.status==='published')).length;
 const shared={client,role,profile:data.profile,ministries:permitted,functions:data.functions,services:data.services,assignments:viewedAssignments,members:data.members,month,setMonth,onRun,busy:working};
 const render=()=>{
  if(section==='dashboard'&&isAdmin)return <Dashboard {...shared} selectedMinistry={selectedMinistry} setSelectedMinistry={setSelectedMinistry} onNavigate={setSection}/>;
  if(section==='escalas'&&isAdmin)return <SchedulePages {...shared}/>;
  if(section==='equipe'&&isAdmin)return <TeamPage {...shared}/>;
  if(section==='ministerios'&&isAdmin)return <MinistriesPage {...shared}/>;
  if(section==='lideres'&&role==='pastor')return <LeadersPage {...shared} allLeaders={data.allLeaders} leaderScopes={data.leaderScopes}/>;
  if(section==='disponibilidade')return <AvailabilityPage {...shared} availability={data.availability} exceptions={data.exceptions}/>;
  if(section==='perfil')return <ProfilePage {...shared} roles={data.myRoles}/>;
  return <VolunteerSchedule {...shared} assignments={data.myAssignments} team={data.team}/>;
 };
 return <AppShell profile={data.profile} role={role} section={section} setSection={setSection} pending={pending} signOut={logout}>
 {notice&&<div className="alert"><CheckCircle2 size={18}/>{notice}<button type="button" onClick={()=>setNotice('')} style={{marginLeft:'auto',background:'transparent',border:0,color:'inherit',cursor:'pointer'}}>×</button></div>}
 {error&&<div className="alert error"><AlertCircle size={18}/>{error}<button type="button" onClick={()=>{setError('');void load()}} style={{marginLeft:'auto',background:'transparent',border:0,color:'inherit',cursor:'pointer'}}><RefreshCw size={16}/></button></div>}
 {render()}
 </AppShell>;
}
