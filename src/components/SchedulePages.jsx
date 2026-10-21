'use client';
import React,{useMemo,useState} from 'react';
import {CalendarDays,Plus,Clock3,CheckCheck,UsersRound,Sparkles,LayoutGrid,List,ChevronLeft,ChevronRight,Send,Info,AlertTriangle,CalendarCheck2,ShieldCheck} from 'lucide-react';
import {Btn,Panel,Badge,PageHead,Metric,Progress,Empty,Modal,dateFmt,monthLabel,monthKey,dayNumber,shortMonth,Avatar} from './ui';
import {draft} from '../lib/scheduler';
import {ScheduleCard,minimumForMinistry} from './ScheduleCard';
const minDay=date=>Number(dateFmt(date,{day:'numeric'}));
export function SchedulePages({client,role,profile,ministries,functions,services,assignments,members,month,setMonth,onRun,busy}){
 const [mode,setMode]=useState('lista'),[filter,setFilter]=useState('all'),[creating,setCreating]=useState(false),[preview,setPreview]=useState(null),[openService,setOpenService]=useState(null);
 const [form,setForm]=useState({title:'Culto',start:'',end:'',repeat:1});
 const dateParts=month.split('-').map(Number);
 const isPastor=role==='pastor';
 const scoped=new Set(ministries.map(m=>m.id));
 const monthServices=services.filter(s=>monthKey(s.starts_at)===month).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 const monthIds=new Set(monthServices.map(s=>s.id));
 const monthAssignments=assignments.filter(a=>monthIds.has(a.service_id)&&scoped.has(a.ministry_id));
 const totalActive=monthAssignments.filter(a=>['pending','confirmed','completed'].includes(a.state)).length;
 const totalConfirmed=monthAssignments.filter(a=>['confirmed','completed'].includes(a.state)).length;
 const totalNeeded=monthServices.filter(x=>x.status!=='cancelled').length*ministries.reduce((sum,m)=>sum+(functions.some(f=>f.ministry_id===m.id)?functions.filter(f=>f.ministry_id===m.id).reduce((s,f)=>s+f.min_people,0):m.min_people),0);
 const confReady=ministries.filter(m=>m.arrival_minutes!==null&&m.departure_minutes!==null&&m.min_people>0);
 const prev=()=>{const d=new Date(dateParts[0],dateParts[1]-2,1);setMonth(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'))};
 const next=()=>{const d=new Date(dateParts[0],dateParts[1],1);setMonth(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'))};
 const create=async e=>{e.preventDefault();await onRun(async()=>{
  if(!form.start||!form.end||new Date(form.end)<=new Date(form.start))throw Error('A data de término deve ser depois do início.');
  const values=Array.from({length:Number(form.repeat)},(_,i)=>({church_id:profile.church_id,title:form.title||'Culto',starts_at:new Date(new Date(form.start).getTime()+i*7*86400000).toISOString(),ends_at:new Date(new Date(form.end).getTime()+i*7*86400000).toISOString(),status:'draft'}));
  const {error}=await client.from('services').insert(values);if(error)throw error;setCreating(false);
 },'Cultos cadastrados com sucesso!')};
 const changeStatus=async(service,status)=>await onRun(async()=>{const {error}=await client.from('services').update({status}).eq('id',service.id);if(error)throw error;setOpenService(null)},status==='published'?'Culto publicado. Os convites estão disponíveis.':'Culto atualizado.');
 const generate=()=>{
  if(!confReady.length){setPreview({assignments:[],missing:['Configure chegada, saída e quantidade de cada ministério antes de gerar a escala.']});return}
  const activeServices=monthServices.filter(s=>s.status!=='cancelled'&&s.status!=='completed');
  const result=draft(activeServices,members,confReady,functions,assignments);
  const missing=ministries.filter(m=>!confReady.some(x=>x.id===m.id)).map(m=>m.name+' • configure chegada, saída e equipe mínima');
  setPreview({...result,missing:[...result.missing,...missing]});
 };
 const savePreview=async()=>{if(!preview?.assignments?.length)return;await onRun(async()=>{
  const {error}=await client.from('assignments').insert(preview.assignments);if(error)throw error;setPreview(null);
 },'Convocações salvas. Confira e publique os cultos quando estiverem prontos.')};
 const days=useMemo(()=>{
  const first=new Date(dateParts[0],dateParts[1]-1,1).getDay();
  const last=new Date(dateParts[0],dateParts[1],0).getDate();
  return [...Array(first).fill(null),...Array.from({length:last},(_,i)=>i+1)];
 },[month]);
 return <>

 <div className="sc-hero">
  <div className="sc-hero-copy"><div className="eyebrow">PLANEJAMENTO DOS MINISTÉRIOS</div>
   <h1>Escalas dos cultos</h1>
   <p>Veja quem vai servir, o que falta confirmar e quais equipes precisam de ajuda.</p>
   <div className="sc-hero-stats"><span><CalendarDays size={15}/>{monthServices.filter(s=>s.status!=='cancelled').length} cultos</span><span><CheckCheck size={15}/>{totalConfirmed} confirmações</span><span><UsersRound size={15}/>{Math.max(0,totalNeeded-totalActive)} vagas abertas</span></div>
  </div>
  <div className="sc-hero-buttons">{isPastor&&<Btn icon={Plus} onClick={()=>setCreating(true)}>Novo culto</Btn>}<Btn icon={Sparkles} variant="secondary" onClick={generate}>Gerar escala</Btn></div>
 </div>
 <div className="sc-toolbar">
  <div className="sc-month-nav"><button type="button" aria-label="Mês anterior" onClick={prev}><ChevronLeft size={19}/></button><strong>{monthLabel(month)}</strong><button type="button" aria-label="Próximo mês" onClick={next}><ChevronRight size={19}/></button></div>
  <div className="sc-filters" role="group" aria-label="Filtrar cultos">
   {[
    ['all','Todos os cultos'],
    ['vacancies','Com vagas'],
    ['pending','Aguardando respostas']
   ].map(([id,label])=><button key={id} type="button" className={filter===id?'current':''} onClick={()=>setFilter(id)} aria-pressed={filter===id}>{label}</button>)}
  </div>
 </div>
 {monthServices.length===0?<div className="sc-empty"><Empty icon={CalendarDays} title="Seu mês está livre por enquanto" subtitle={isPastor?'Crie o primeiro culto para começar a organizar os ministérios.':'Os cultos aparecerão quando o pastor cadastrar a programação.'} action={isPastor?<Btn icon={Plus} onClick={()=>setCreating(true)}>Adicionar culto</Btn>:null}/></div>:
 (()=>{const filtered=monthServices.filter(s=>{
    const related=monthAssignments.filter(a=>a.service_id===s.id);
    const filled=related.filter(a=>['pending','confirmed','completed'].includes(a.state)).length;
    const needed=ministries.reduce((n,m)=>n+minimumForMinistry(m,functions),0);
    return filter==='all'||(filter==='vacancies'&&s.status!=='cancelled'&&filled<needed)||(filter==='pending'&&related.some(a=>a.state==='pending'));
   });
   return filtered.length===0?<div className="sc-empty"><Empty icon={CheckCheck} title="Nenhum culto neste filtro" subtitle="Você pode voltar a ver todos os cultos." action={<Btn variant="secondary" onClick={()=>setFilter('all')}>Mostrar todos</Btn>}/></div>:
    <div className="sc-cards">{filtered.map(s=><ScheduleCard key={s.id} service={s} assignments={monthAssignments.filter(a=>a.service_id===s.id)} ministries={ministries} functions={functions} members={members} onOpen={setOpenService}/>)}</div>;
 })()}
 {preview&&<Modal title="Prévia da escala automática" onClose={()=>setPreview(null)} footer={<><Btn variant="secondary" onClick={()=>setPreview(null)}>Voltar</Btn><Btn disabled={!preview.assignments.length||busy} icon={CheckCheck} onClick={savePreview}>Salvar convocações</Btn></>}>
   <div className="hero" style={{padding:17,marginBottom:16}}><div><div className="eyebrow" style={{color:'#c1bfff'}}>RESULTADO DA ANÁLISE</div><h2>{preview.assignments.length} novas convocações</h2><p>{preview.missing.length} posições sem candidato ou pendentes de configuração.</p></div><Sparkles size={39} color="#c2bbff"/></div>
   <p className="note">As sugestões respeitam a disponibilidade e as qualificações aprovadas, mas precisam da revisão da liderança. O banco valida novamente as atribuições.</p>
   {preview.missing.length>0&&<div className="alert error mt-2"><AlertTriangle size={18}/><div><strong>Itens que precisam de atenção:</strong><div className="stack mt-1">{preview.missing.slice(0,14).map((m,i)=><small key={i}>{m}</small>)}{preview.missing.length>14&&<small>…e mais {preview.missing.length-14} itens</small>}</div></div></div>}
   {preview.assignments.length===0&&<Empty icon={UsersRound} title="Nenhum voluntário elegível encontrado" subtitle="Confira cadastros aprovados, limites mensais e disponibilidade."/>}
   {preview.assignments.length>0&&<div className="table-scroll" style={{maxHeight:260}}><table className="data-table"><thead><tr><th>Data</th><th>Voluntário</th><th>Função</th></tr></thead><tbody>{preview.assignments.slice(0,40).map((a,i)=><tr key={i}><td>{dateFmt(services.find(s=>s.id===a.service_id)?.starts_at,{day:'2-digit',month:'short'})}</td><td>{members.find(p=>p.id===a.profile_id)?.full_name||'Voluntário'}</td><td>{functions.find(f=>f.id===a.function_id)?.name||ministries.find(m=>m.id===a.ministry_id)?.name}</td></tr>)}</tbody></table></div>}
 </Modal>}
 {creating&&isPastor&&<Modal title="Cadastrar novo culto" onClose={()=>setCreating(false)} footer={<><Btn variant="secondary" onClick={()=>setCreating(false)}>Cancelar</Btn><Btn type="submit" disabled={busy} icon={CalendarCheck2} onClick={()=>document.getElementById('create-service-form')?.requestSubmit()}>Criar culto</Btn></>}>
 <form id="create-service-form" onSubmit={create}><div className="stack"><div><label>Nome do culto</label><input required value={form.title} onChange={e=>setForm(v=>({...v,title:e.target.value}))}/></div><div className="fields"><div><label>Data e hora de início</label><input required type="datetime-local" value={form.start} onChange={e=>setForm(v=>({...v,start:e.target.value}))}/></div><div><label>Data e hora de término</label><input required type="datetime-local" value={form.end} onChange={e=>setForm(v=>({...v,end:e.target.value}))}/></div></div><div><label>Recorrência</label><select value={form.repeat} onChange={e=>setForm(v=>({...v,repeat:Number(e.target.value)}))}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n===1?'Somente este culto':n+' semanas consecutivas'}</option>)}</select></div></div></form>
 </Modal>}
 {openService&&<Modal title={openService.title} onClose={()=>setOpenService(null)} footer={<><Btn variant="secondary" onClick={()=>setOpenService(null)}>Fechar</Btn>{isPastor&&openService.status==='draft'&&<Btn icon={Send} disabled={busy} onClick={()=>changeStatus(openService,'published')}>Publicar culto</Btn>}{isPastor&&['draft','published'].includes(openService.status)&&<Btn variant="danger" disabled={busy} onClick={()=>changeStatus(openService,'cancelled')}>Cancelar</Btn>}</>}>
  <div className="sc-modal-subtitle"><CalendarDays size={16}/><span>{dateFmt(openService.starts_at)} – {dateFmt(openService.ends_at,{hour:'2-digit',minute:'2-digit'})}</span></div>
  <div className="sc-modal-summary">{(()=>{
   const entries=assignments.filter(a=>a.service_id===openService.id&&ministries.some(m=>m.id===a.ministry_id));
   const accepted=entries.filter(a=>['confirmed','completed'].includes(a.state)).length;
   const pending=entries.filter(a=>a.state==='pending').length;
   const needed=ministries.reduce((n,m)=>n+minimumForMinistry(m,functions),0);
   return <><div><CheckCheck size={17}/><b>{accepted}</b><small>Confirmados</small></div><div><Clock3 size={17}/><b>{pending}</b><small>Aguardando</small></div><div><UsersRound size={17}/><b>{Math.max(0,needed-accepted-pending)}</b><small>Vagas livres</small></div></>;
  })()}</div>
  <p className="sc-group-help">Toque no ministério para ver as pessoas escaladas.</p>
  {ministries.map(m=>{
   const entries=assignments.filter(a=>a.service_id===openService.id&&a.ministry_id===m.id);
   const active=entries.filter(a=>['pending','confirmed','completed'].includes(a.state));
   const needed=minimumForMinistry(m,functions);
   return <details className="sc-team-group" key={m.id} open={ministries.length===1?true:undefined}>
    <summary><strong>{m.name}</strong><span>{active.length}/{needed} pessoas escaladas</span></summary>
    {entries.length===0?<p>Esse ministério ainda não tem pessoas escaladas neste culto.</p>:entries.map(a=>{
     const person=members.find(p=>p.id===a.profile_id);
     const status=['confirmed','completed'].includes(a.state)?'Confirmado':a.state==='pending'?'Aguardando':a.state==='unavailable'?'Não disponível':'Cancelado';
     return <div className="sc-team-person" key={a.id}><Avatar name={person?.full_name||'Voluntário'}/><div><b>{person?.full_name||'Voluntário'}</b><small>{functions.find(f=>f.id===a.function_id)?.name||'Equipe geral'}</small></div><Badge tone={['confirmed','completed'].includes(a.state)?'green':a.state==='pending'?'amber':'rose'}>{status}</Badge></div>
    })}
   </details>;
  })}
 </Modal>}
 </>;
}
