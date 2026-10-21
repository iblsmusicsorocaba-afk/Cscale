'use client';
import React,{useMemo,useState} from 'react';
import {Church,UsersRound,CalendarDays,Clock3,ShieldCheck,Music2,RotateCcw,CheckCheck,UserRound,Search,Plus,Send,Download,ArrowRight,HeartHandshake,SlidersHorizontal,AlertTriangle} from 'lucide-react';
import {AppShell} from './AppShell';
import {Dashboard} from './Dashboard';
import {Panel,PageHead,Metric,Badge,Btn,Empty,Avatar,Modal,dateFmt,monthKey,monthLabel} from './ui';
import roster from '../../fixtures/demo-roster.json';

const DEMO_CHURCH='22222222-2222-4222-8222-222222222222';
const demoRequirements=[
 ['staff','Staff',2,60,0],['midia','Mídia',4,60,0],['sonoplastia','Sonoplastia',3,120,0],
 ['projecao','Projeção e transmissão',5,120,60],['cozinha','Cozinha',4,120,0],
 ['louvor','Louvor e banda',9,120,0],['diaconato','Diaconato',15,120,60],
 ['enfermaria','Enfermaria',1,120,0],['intercessao','Intercessão',7,60,60],
 ['consolidacao','Consolidação',7,60,60]
];
const ministries=demoRequirements.map(([slug,name,min_people,arrival_minutes,departure_minutes])=>({id:'demo-'+slug,slug,name,min_people,arrival_minutes,departure_minutes,church_id:DEMO_CHURCH}));
const roleDefs=[
 ['louvor','Cantor',4],['louvor','Bateria',1],['louvor','Guitarra',1],['louvor','Baixo',1],
 ['louvor','Violão',1],['louvor','Teclado',1],['midia','Filmmaker',2],['midia','Fotógrafo',2]
];
const functions=roleDefs.map(([slug,name,min_people])=>({id:'demo-fn-'+slug+'-'+name,ministry_id:'demo-'+slug,name,min_people}));
const personaList=roster.map((u,index)=>({...u,id:u.email,full_name:u.name,church_id:DEMO_CHURCH,monthly_limit:u.limit,slug:u.email.split('@')[0],sort:index,
  profile_roles:u.ministry?[{id:'role-'+u.email,profile_id:u.email,ministry_id:'demo-'+u.ministry,
   function_id:u.role?'demo-fn-'+u.ministry+'-'+u.role:null,approved:u.role_approved}]:[],
  availability:[0,3].map(weekday=>({weekday,start_minute:weekday===0?360:960,end_minute:weekday===0?1410:1410})),
  availability_exceptions:[]
}));
const isActive=a=>['pending','confirmed','completed'].includes(a.state);
const allowedRoles=m=>{const opts=functions.filter(f=>f.ministry_id===m.id);return opts.length?opts.map(f=>({id:f.id,name:f.name,count:f.min_people})): [{id:null,name:m.name,count:m.min_people}]};
function demoDates(){
 const now=new Date();
 const brazil=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).formatToParts(now);
 const parts=Object.fromEntries(brazil.map(p=>[p.type,p.value]));
 const year=Number(parts.year),month=Number(parts.month);
 const list=[];
 for(let delta=-1;delta<=1;delta++){
  const p=new Date(Date.UTC(year,month-1+delta,1,12)),y=p.getUTCFullYear(),m=p.getUTCMonth()+1;
  const last=new Date(Date.UTC(y,m,0)).getUTCDate(),days=[];
  for(let d=1;d<=last;d++){
   const w=new Date(Date.UTC(y,m-1,d)).getUTCDay();
   if(w===0||w===3)days.push({day:d,weekday:w});
  }
  const weds=days.filter(x=>x.weekday===3).slice(-2),sundays=days.filter(x=>x.weekday===0).slice(-2);
  for(const o of [...weds,...sundays].sort((a,b)=>a.day-b.day)){
   const h=o.weekday===3?20:18,day=String(o.day).padStart(2,'0'),mo=String(m).padStart(2,'0');
   const begins=new Date(y+'-'+mo+'-'+day+'T'+String(h).padStart(2,'0')+':00:00-03:00');
   const ends=new Date(begins.getTime()+2*3600_000);
   list.push({id:'demo-culto-'+y+mo+day,church_id:DEMO_CHURCH,title:o.weekday===3?'Culto de Quarta':'Culto de Domingo',
     starts_at:begins.toISOString(),ends_at:ends.toISOString(),status:delta===1?'draft':delta===-1?'completed':'published'});
  }
 }
 return list;
}
function makeAssignments(services,people){
 const all=[];
 for(const [sidx,service] of services.entries()){
  const used=new Set();
  for(const ministry of ministries){
   for(const slot of allowedRoles(ministry)){
    const candidates=people.filter(p=>p.ministry===ministry.slug&&p.role_approved!==false
      &&(slot.id===null||p.role===slot.name)).sort((a,b)=>a.sort-b.sort);
    const prefer=candidates.slice(0,slot.count);
    for(const [idx,p] of prefer.entries()){
     if(used.has(p.id))continue;
     used.add(p.id);
     const mode=(sidx+idx+ministry.name.length+slot.name.length)%7;
     const state=service.status==='completed'?'completed':mode<3?'confirmed':mode<6?'pending':'unavailable';
     all.push({id:'demo-as-'+service.id+'-'+p.slug,service_id:service.id,profile_id:p.id,ministry_id:ministry.id,function_id:slot.id,state,
       responded_at:state==='confirmed'||state==='completed'?service.starts_at:null});
    }
   }
  }
 }
 return all;
}
const initialServices=demoDates();
const initialAssignments=makeAssignments(initialServices,personaList);
function csvDownload(people){
 const cells=[['Nome','Email demonstrativo','Perfil','Ministério','Função','Observação'],...people.map(u=>[u.full_name,u.email,u.kind==='pastor'?'Pastor':u.kind==='leader'?'Líder':'Voluntário',u.ministry||'Todos',u.role||'Equipe geral','Acesso apenas pelo seletor de demonstração'])];
 const csv=cells.map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(';')).join('\r\n');
 const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='cscale-73-usuarios-ficticios.csv';a.click();URL.revokeObjectURL(url);
}
function DemoCalendar({services,assignments,ministries:scope,month,onAdd,onGenerate,role}){
 const [newDate,setNewDate]=useState(''),[newHour,setNewHour]=useState('20:00');
 const permitted=new Set(scope.map(m=>m.id));
 const monthly=services.filter(s=>monthKey(s.starts_at)===month).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 const active=assignments.filter(a=>monthly.some(s=>s.id===a.service_id)&&permitted.has(a.ministry_id)&&isActive(a));
 const total=monthly.reduce((sum,s)=>sum+scope.reduce((a,m)=>a+(functions.some(f=>f.ministry_id===m.id)?functions.filter(f=>f.ministry_id===m.id).reduce((n,f)=>n+f.min_people,0):m.min_people),0),0);
 return <>
  <PageHead eyebrow="PLANEJAMENTO" title="Cultos e escalas" description="Calendário e convocações fictícias. As ações modificam apenas a sua sessão de demonstração."
   action={<Btn icon={Send} onClick={onGenerate}>Preencher vagas de teste</Btn>}/>
  <div className="simple-inline-status"><CalendarDays size={17}/><strong>{monthly.length} cultos neste mês</strong><span>{active.length} de {total} posições preenchidas</span></div>
  <Panel title="Agenda de cultos" subtitle={monthLabel(month)}>
   <div className="table-scroll"><table className="data-table"><thead><tr><th>Culto</th><th>Data</th><th>Convocados</th><th>Confirmados</th><th>Status</th></tr></thead><tbody>{monthly.map(s=>{
    const rows=assignments.filter(a=>a.service_id===s.id&&permitted.has(a.ministry_id));
    return <tr key={s.id}><td><strong>{s.title}</strong></td><td>{dateFmt(s.starts_at)}</td><td>{rows.filter(isActive).length}</td><td>{rows.filter(a=>a.state==='confirmed'||a.state==='completed').length}</td><td><Badge tone={s.status==='published'?'green':s.status==='completed'?'purple':'amber'}>{s.status==='published'?'Publicado':s.status==='completed'?'Concluído':'Rascunho'}</Badge></td></tr>;
   })}</tbody></table></div>
  </Panel>
  {role==='pastor'&&<Panel title="Criar culto de teste" subtitle="Apenas na sessão simulada"><div className="dashboard-grid" style={{alignItems:'end'}}>
    <div className="col-4"><label>Dia</label><input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)}/></div>
    <div className="col-4"><label>Início</label><input type="time" value={newHour} onChange={e=>setNewHour(e.target.value)}/></div>
    <div className="col-4"><Btn className="w-full" disabled={!newDate} icon={Plus} onClick={()=>{onAdd(newDate,newHour);setNewDate('')}}>Adicionar culto</Btn></div>
   </div></Panel>}
 </>;
}
function DemoPeople({people,ministries:scope,onApprove}){
 const [search,setSearch]=useState(''),[filter,setFilter]=useState('');
 const visible=people.filter(p=>p.full_name.toLowerCase().includes(search.toLowerCase())&&(!filter||p.ministry===filter));
 return <><PageHead eyebrow="GESTÃO DE PESSOAS" title="Equipe e voluntários" description="Perfis fictícios de demonstração para avaliar o cadastro e as aprovações."
 action={<Btn icon={Download} variant="secondary" onClick={()=>csvDownload(people)}>Lista CSV</Btn>}/>
 <div className="simple-inline-status"><UsersRound size={17}/><strong>{people.length} pessoas</strong><span>{people.filter(p=>!p.role_approved).length} funções aguardando revisão</span></div>
 <Panel title="Diretório de pessoas" subtitle="Todos os dados são inventados">
 <div className="filter-strip mb-2"><input placeholder="Buscar voluntário" value={search} onChange={e=>setSearch(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filtrar ministério"><option value="">Todas as áreas</option>{scope.map(m=><option key={m.id} value={m.slug}>{m.name}</option>)}</select></div>
 <div className="table-scroll"><table className="data-table"><thead><tr><th>Voluntário</th><th>Função</th><th>Acesso</th><th>Aprovação</th></tr></thead><tbody>{visible.map(p=><tr key={p.id}><td><div className="row"><Avatar name={p.full_name}/><div><strong>{p.full_name}</strong><div className="tiny-label">{p.email}</div></div></div></td><td>{p.role||scope.find(m=>m.slug===p.ministry)?.name||'Geral'}</td><td><Badge tone={p.kind==='pastor'?'purple':p.kind==='leader'?'blue':'green'}>{p.kind==='pastor'?'Pastor':p.kind==='leader'?'Líder':'Voluntário'}</Badge></td>
 <td>{p.role_approved?<Badge tone="green">Aprovado</Badge>:<Btn small onClick={()=>onApprove(p.id)}>Aprovar</Btn>}</td></tr>)}</tbody></table></div></Panel></>;
}
function DemoVolunteer({person,services,assignments,functions,people,onConfirm,month}){
 const all=assignments.filter(a=>a.profile_id===person.id).filter(a=>services.some(s=>s.id===a.service_id));
 const current=all.filter(a=>a.state==='pending'&&services.some(s=>s.id===a.service_id&&s.status==='published'));
 const confirmed=all.filter(a=>a.state==='confirmed'||a.state==='completed');
 const [decisions,setDecisions]=useState({}),[review,setReview]=useState(false);
 const lookup=id=>services.find(s=>s.id===id);
 function band(a){
  if(a.ministry_id!=='demo-louvor')return null;
  const names=['Bateria','Guitarra','Baixo','Violão','Teclado','Cantor'].map(role=>{
   const ids=new Set(functions.filter(f=>f.name===role&&f.ministry_id==='demo-louvor').map(f=>f.id));
   return {role,assigned:assignments.filter(r=>r.service_id===a.service_id&&r.state==='confirmed'&&ids.has(r.function_id)).map(r=>people.find(x=>x.id===r.profile_id)?.full_name||'').filter(Boolean)};
  });
  return <div className="demo-band"><strong><Music2 size={16}/> Formação confirmada do louvor</strong><div className="demo-band-grid">{names.map(({role,assigned})=><div key={role}><b>{role}</b><small>{assigned.length?assigned.join(', '):'Pendente'}</small></div>)}</div></div>;
 }
 return <><PageHead eyebrow="MEU SERVIÇO" title="Minhas escalas" description={'Bem-vindo, '+person.full_name+'. Veja seus cultos e responda às convocações fictícias.'}/>
 <div className="simple-inline-status"><Clock3 size={17}/><strong>{current.length} para responder</strong><span>{confirmed.length} datas confirmadas</span></div>
 <Panel className="mb-3" title="Convocações aguardando resposta" subtitle="Selecione cada resposta e finalize tudo numa única revisão">
  {current.length===0?<Empty icon={CheckCheck} title="Tudo respondido" subtitle="Troque de usuário ou de mês para continuar testando."/>:<div className="stack">{current.map(a=><div className="demo-invite" key={a.id}><div className="row spread"><div><strong>{lookup(a.service_id)?.title}</strong><div className="tiny-label">{dateFmt(lookup(a.service_id)?.starts_at)}</div></div><Badge tone="amber">{functions.find(f=>f.id===a.function_id)?.name||'Equipe geral'}</Badge></div>{band(a)}
   <div className="actions"><Btn small variant={decisions[a.id]==='confirmed'?'':'secondary'} icon={CheckCheck} onClick={()=>setDecisions(v=>({...v,[a.id]:'confirmed'}))}>Confirmar</Btn><Btn small variant={decisions[a.id]==='unavailable'?'':'secondary'} onClick={()=>setDecisions(v=>({...v,[a.id]:'unavailable'}))}>Não disponível</Btn></div></div>)}
   <Btn disabled={current.some(a=>!decisions[a.id])} onClick={()=>setReview(true)}>Conferir e finalizar respostas <ArrowRight size={14}/></Btn>
  </div>}
 </Panel>
 <Panel title="Minhas confirmadas" subtitle="Datas nas quais você já confirmou presença">{confirmed.length===0?<Empty icon={CalendarDays} title="Nenhuma confirmada" subtitle="Suas confirmações aparecerão aqui."/>:<div className="demo-list">{confirmed.map(a=><div className="demo-listrow" key={a.id}><div><b>{lookup(a.service_id)?.title||'Culto'}</b><small>{dateFmt(lookup(a.service_id)?.starts_at)} • {functions.find(f=>f.id===a.function_id)?.name||'Equipe'}</small></div><Badge tone="green">Confirmado</Badge></div>)}</div>}</Panel>
 {review&&<Modal title="Revisar e finalizar" onClose={()=>setReview(false)} footer={<><Btn variant="secondary" onClick={()=>setReview(false)}>Voltar</Btn><Btn icon={CheckCheck} onClick={()=>{onConfirm(current.map(a=>({id:a.id,state:decisions[a.id]})));setDecisions({});setReview(false)}}>Finalizar respostas</Btn></>}>
  <p>Confira suas respostas simuladas antes de finalizar.</p><div className="demo-list">{current.map(a=><div className="demo-listrow" key={a.id}><div><b>{lookup(a.service_id)?.title}</b><small>{dateFmt(lookup(a.service_id)?.starts_at)}</small></div><Badge tone={decisions[a.id]==='confirmed'?'green':'amber'}>{decisions[a.id]==='confirmed'?'Confirmar':'Não disponível'}</Badge></div>)}</div>
 </Modal>}
 </>;
}
export default function DemoPortal(){
 const [users,setUsers]=useState(personaList);
 const [userId,setUserId]=useState('pastor@cscale-demo.test');
 const [services,setServices]=useState(initialServices);
 const [assignments,setAssignments]=useState(initialAssignments);
 const [section,setSection]=useState('dashboard');
 const [month,setMonth]=useState(monthKey(new Date()));
 const [selectedMinistry,setSelectedMinistry]=useState('');
 const [message,setMessage]=useState('');
 const user=users.find(x=>x.id===userId)||users[0];
 const role=user.kind==='pastor'?'pastor':user.kind==='leader'?'leader':'volunteer';
 const scope=role==='pastor'?ministries:role==='leader'?ministries.filter(m=>m.slug===user.ministry):[];
 const scopeIds=new Set(scope.map(m=>m.id));
 const visibleAssignments=role==='pastor'?assignments:role==='leader'?assignments.filter(a=>scopeIds.has(a.ministry_id)):[];
 const visibleMembers=role==='pastor'?users:role==='leader'?users.filter(p=>p.ministry===user.ministry):[];
 const pending=assignments.filter(a=>a.profile_id===user.id&&a.state==='pending'&&services.find(s=>s.id===a.service_id)?.status==='published').length;
 const reset=()=>{setUsers(personaList);setServices(initialServices);setAssignments(initialAssignments);setMessage('Demonstração reiniciada.')};
 const changeUser=email=>{setUserId(email);const found=users.find(x=>x.email===email);setSection(found?.kind==='volunteer'?'minhas':'dashboard');setSelectedMinistry('');setMessage('')};
 const approve=id=>{setUsers(v=>v.map(u=>u.id===id?{...u,approved:true,role_approved:true,profile_roles:u.profile_roles.map(r=>({...r,approved:true}))}:u));setMessage('Função fictícia aprovada.')};
 const finalize=answers=>{setAssignments(old=>{
  let next=old.map(a=>{const v=answers.find(x=>x.id===a.id);return v?{...a,state:v.state,responded_at:new Date().toISOString()}:a});
  for(const v of answers.filter(x=>x.state==='unavailable')){
   const oldShift=old.find(a=>a.id===v.id);if(!oldShift)continue;
   const candidates=users.filter(x=>x.approved&&x.role_approved&&x.ministry===oldShift.ministry_id.replace('demo-','')&&
    (!oldShift.function_id||x.role===functions.find(f=>f.id===oldShift.function_id)?.name)&&
    !next.some(a=>a.service_id===oldShift.service_id&&a.profile_id===x.id));
   const pick=candidates[0];if(pick)next=[...next,{...oldShift,id:'demo-sub-'+oldShift.id+'-'+pick.slug,profile_id:pick.id,state:'pending',responded_at:null}];
  }
  return next;
 });setMessage('Respostas salvas. Um substituto foi convidado quando havia candidato compatível.')};
 const addCult=(day,time)=>{const starts_at=new Date(day+'T'+time+':00-03:00').toISOString(),ends_at=new Date(new Date(starts_at).getTime()+7200000).toISOString();
  setServices(v=>[...v,{id:'new-demo-'+Date.now(),church_id:DEMO_CHURCH,title:'Culto de Teste',starts_at,ends_at,status:'published'}]);setMessage('Culto fictício criado.')};
 const generate=()=>{const known=new Set(assignments.map(a=>a.id));
  const fresh=makeAssignments(services,users).filter(a=>!known.has(a.id)&&!assignments.some(x=>x.service_id===a.service_id&&x.profile_id===a.profile_id));
  setAssignments(v=>[...v,...fresh]);setMessage(fresh.length+' novas convocações fictícias geradas.')};
 const navigate=s=>{setSection(s);setMessage('')};
 const rendered=()=>{
  if(section==='dashboard'&&role!=='volunteer')return <Dashboard role={role} profile={user} ministries={scope} functions={functions} services={services} assignments={visibleAssignments} members={visibleMembers} month={month} setMonth={setMonth} onNavigate={navigate} selectedMinistry={selectedMinistry} setSelectedMinistry={setSelectedMinistry}/>;
  if(section==='escalas'&&role!=='volunteer')return <DemoCalendar role={role} ministries={scope} services={services} assignments={visibleAssignments} month={month} onAdd={addCult} onGenerate={generate}/>;
  if(section==='equipe'&&role!=='volunteer')return <DemoPeople people={visibleMembers} ministries={scope} onApprove={approve}/>;
  if(section==='lideres'&&role==='pastor')return <><PageHead eyebrow="GESTÃO DE LIDERANÇA" title="Líderes de teste" description="Permissões demonstrativas separadas por ministério."/><Panel title="Liderança dos ministérios"><div className="demo-list">{users.filter(x=>x.kind==='leader').map(p=><div className="demo-listrow" key={p.id}><div><b>{p.full_name}</b><small>{p.email}</small></div><Badge tone="purple">{ministries.find(m=>m.slug===p.ministry)?.name}</Badge></div>)}</div></Panel></>;
  if(section==='ministerios'&&role!=='volunteer')return <><PageHead eyebrow="ÁREAS DE SERVIÇO" title="Ministérios" description="Configuração demonstrativa dos requisitos de cada culto."/><div className="demo-ministry-grid">{scope.map(m=><Panel key={m.id} title={m.name} subtitle={m.min_people+' posições por culto'}><p className="tiny-label">Chegada: {m.arrival_minutes} minutos antes • Saída: {m.departure_minutes} minutos depois</p><div className="demo-list">{functions.filter(f=>f.ministry_id===m.id).map(f=><div className="demo-listrow" key={f.id}><b>{f.name}</b><Badge tone="blue">{f.min_people} vaga(s)</Badge></div>)}</div></Panel>)}</div></>;
  if(section==='perfil')return <><PageHead eyebrow="MINHA IDENTIDADE" title="Meu perfil fictício" description="Troque a pessoa no seletor superior para testar outra função."/><Panel title={user.full_name}><div className="demo-list"><div className="demo-listrow"><b>E-mail demonstrativo</b><small>{user.email}</small></div><div className="demo-listrow"><b>Ministério</b><small>{ministries.find(m=>m.slug===user.ministry)?.name||'Pastorado'}</small></div><div className="demo-listrow"><b>Instrumento ou função</b><small>{user.role||'Equipe geral'}</small></div><div className="demo-listrow"><b>Limite mensal</b><small>{user.monthly_limit} cultos</small></div></div></Panel></>;
  if(section==='disponibilidade')return <><PageHead eyebrow="MEU TEMPO" title="Disponibilidade semanal" description="Exemplo de intervalos de trabalho do voluntário."/><Panel title="Horários fictícios"><div className="demo-list"><div className="demo-listrow"><b>Domingo</b><small>06:00 às 23:30</small></div><div className="demo-listrow"><b>Quarta-feira</b><small>16:00 às 23:30</small></div></div></Panel></>;
  return <DemoVolunteer key={userId} person={user} services={services} assignments={assignments} functions={functions} people={users} onConfirm={finalize} month={month}/>;
 };
 return <AppShell role={role} profile={user} section={section} setSection={navigate} pending={pending} signOut={()=>window.location.assign('/')}>
  <div className="demo-simple-bar">
    <div><span className="demo-indicator">MODO DEMONSTRAÇÃO</span><h2>Testar como:</h2><p>Escolha um perfil para visualizar o sistema. Tudo aqui é fictício.</p></div>
    <div className="demo-role-pills" role="group" aria-label="Escolher um perfil de teste">
      {[
        ['pastor@cscale-demo.test','Pastor'],
        ['lider.louvor@cscale-demo.test','Líder do louvor'],
        ['louvor01@cscale-demo.test','Baterista'],
        ['louvor06@cscale-demo.test','Cantor']
      ].map(([id,label])=><button type="button" key={id} className={'demo-role-pill '+(userId===id?'chosen':'')} aria-pressed={userId===id} onClick={()=>changeUser(id)}>{label}</button>)}
    </div>
  </div>
  <details className="demo-more-personas"><summary>Outros perfis de teste e ferramentas <span>({users.length} pessoas)</span></summary>
   <div className="demo-more-content"><label htmlFor="demo-persona-picker">Selecionar qualquer voluntário</label>
    <select id="demo-persona-picker" value={userId} onChange={e=>changeUser(e.target.value)}>
      <optgroup label="Pastores e líderes">{users.filter(x=>x.kind!=='volunteer').map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</optgroup>
      <optgroup label="Voluntários">{users.filter(x=>x.kind==='volunteer').map(p=><option key={p.id} value={p.id}>{p.full_name} — {p.role||p.ministry}</option>)}</optgroup>
    </select>
    <div className="actions"><Btn icon={RotateCcw} variant="secondary" small onClick={reset}>Reiniciar testes</Btn><Btn icon={Download} variant="secondary" small onClick={()=>csvDownload(users)}>Exportar lista</Btn></div>
   </div>
  </details>
  {message&&<div role="status" className="alert"><CheckCheck size={16}/>{message}<button className="circle-btn" onClick={()=>setMessage('')} aria-label="Fechar aviso">×</button></div>}
  {rendered()}
 </AppShell>;
}
