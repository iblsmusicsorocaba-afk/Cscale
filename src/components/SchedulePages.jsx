'use client';
import React,{useMemo,useState} from 'react';
import {CalendarDays,Plus,Clock3,CheckCheck,UsersRound,Sparkles,LayoutGrid,List,ChevronLeft,ChevronRight,Send,Info,AlertTriangle,CalendarCheck2,ShieldCheck} from 'lucide-react';
import {Btn,Panel,Badge,PageHead,Metric,Progress,Empty,Modal,dateFmt,monthLabel,monthKey,dayNumber,shortMonth,Avatar} from './ui';
import {draft} from '../lib/scheduler';
const minDay=date=>Number(dateFmt(date,{day:'numeric'}));
export function SchedulePages({client,role,profile,ministries,functions,services,assignments,members,month,setMonth,onRun,busy}){
 const [mode,setMode]=useState('lista'),[creating,setCreating]=useState(false),[preview,setPreview]=useState(null),[openService,setOpenService]=useState(null);
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
 <PageHead eyebrow={isPastor?'PLANEJAMENTO GERAL':'ESCALA DO MEU MINISTÉRIO'} title="Escalas e cultos" description={isPastor?'Planeje, revise e publique os cultos e escalas da igreja.':'Planeje as convocações e acompanhe sua equipe em cada culto.'} action={<div className="actions">{isPastor&&<Btn icon={Plus} onClick={()=>setCreating(true)}>Novo culto</Btn>}<Btn icon={Sparkles} variant="soft" onClick={generate}>Gerar escala</Btn></div>}/>
 <div className="simple-inline-status"><CalendarDays size={17}/><strong>{monthServices.filter(s=>s.status!=='cancelled').length} cultos neste mês</strong><span>{totalActive} de {totalNeeded} posições preenchidas · {totalConfirmed} confirmadas</span></div>
 <Panel className="mb-3" title="Calendário de cultos" subtitle="Visualize e acompanhe o mês" action={<div className="actions"><Btn small variant="secondary" icon={ChevronLeft} onClick={prev}/><strong style={{minWidth:115,textAlign:'center',textTransform:'capitalize',fontSize:12}}>{monthLabel(month)}</strong><Btn small variant="secondary" icon={ChevronRight} onClick={next}/><span style={{width:8}}/><Btn small variant={mode==='lista'?'soft':'secondary'} icon={List} onClick={()=>setMode('lista')}>Lista</Btn><Btn small variant={mode==='calendario'?'soft':'secondary'} icon={LayoutGrid} onClick={()=>setMode('calendario')}>Grade</Btn></div>}>
 {mode==='calendario'?<><div className="calendar-grid mb-2">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=><div className="tiny-label" style={{textAlign:'center',fontWeight:800}} key={x}>{x}</div>)}</div><div className="calendar-grid">{days.map((day,i)=><div key={i} className={'day-pill '+(day===new Date().getDate()&&month===monthKey(new Date())?'today':'')} style={{opacity:day===null?.35:1}}>{day!==null&&<><strong>{day}</strong>{monthServices.filter(s=>minDay(s.starts_at)===day).map(s=><div key={s.id} className="event" onClick={()=>setOpenService(s)} style={{cursor:'pointer'}}>{s.title}<br/>{dateFmt(s.starts_at,{hour:'2-digit',minute:'2-digit'})}</div>)}</>}</div>)}</div></>:
 monthServices.length===0?<Empty icon={CalendarDays} title="Ainda não há cultos neste mês" subtitle={isPastor?'Crie um culto para iniciar o planejamento da escala.':'Os cultos aparecerão após o pastor cadastrá-los.'} action={isPastor?<Btn onClick={()=>setCreating(true)} icon={Plus}>Criar culto</Btn>:null}/>:
 <div className="dashboard-grid">{monthServices.map(s=>{
  const team=monthAssignments.filter(a=>a.service_id===s.id),active=team.filter(a=>['pending','confirmed','completed'].includes(a.state)),confirmed=team.filter(a=>['confirmed','completed'].includes(a.state));
  return <div className="col-6" key={s.id}><div className="service-card"><div className="row spread"><div className="row"><div className="service-date"><strong>{dayNumber(s.starts_at)}</strong><small>{shortMonth(s.starts_at)}</small></div><div><h3>{s.title}</h3><div className="service-meta" style={{margin:'6px 0 0'}}><span><Clock3 size={13}/>{dateFmt(s.starts_at,{hour:'2-digit',minute:'2-digit'})} – {dateFmt(s.ends_at,{hour:'2-digit',minute:'2-digit'})}</span></div></div></div><Badge tone={s.status==='published'?'green':s.status==='cancelled'?'rose':'amber'}>{s.status==='published'?'Publicado':s.status==='cancelled'?'Cancelado':s.status==='completed'?'Concluído':'Rascunho'}</Badge></div><div className="divider" style={{margin:'15px 0 10px'}}/><div className="row spread"><small className="inline-muted">{active.length} convocações • {confirmed.length} confirmadas</small><Btn small variant="secondary" onClick={()=>setOpenService(s)}>Ver detalhes</Btn></div></div></div>
 })}</div>}
 </Panel>
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
 {openService&&<Modal title={openService.title} onClose={()=>setOpenService(null)} footer={<><Btn variant="secondary" onClick={()=>setOpenService(null)}>Fechar</Btn>{isPastor&&openService.status==='draft'&&<Btn icon={Send} disabled={busy} onClick={()=>changeStatus(openService,'published')}>Publicar culto</Btn>}{isPastor&&['draft','published'].includes(openService.status)&&<Btn variant="danger" disabled={busy} onClick={()=>changeStatus(openService,'cancelled')}>Cancelar culto</Btn>}</>}>
 <div className="row spread mb-2"><div className="stack" style={{gap:2}}><strong>{dateFmt(openService.starts_at)}</strong><span className="inline-muted">Encerramento: {dateFmt(openService.ends_at)}</span></div><Badge tone={openService.status==='published'?'green':'amber'}>{openService.status}</Badge></div>
 <div className="divider"/>
 <h3 style={{marginBottom:12}}>Equipe convocada</h3>
 {ministries.map(m=>{const team=assignments.filter(a=>a.service_id===openService.id&&a.ministry_id===m.id);return <div className="mb-2" key={m.id}><div className="row spread mb-2"><strong>{m.name}</strong><Badge>{team.filter(a=>['pending','confirmed','completed'].includes(a.state)).length} convites</Badge></div>{team.length===0?<small className="muted">Nenhuma convocação para esta equipe.</small>:team.map(a=><div className="mini-summary mb-2" key={a.id}><Avatar name={members.find(p=>p.id===a.profile_id)?.full_name||'Voluntário'}/><div style={{flex:1}}><strong className="person-name">{members.find(p=>p.id===a.profile_id)?.full_name||'Voluntário'}</strong><div className="tiny-label">{functions.find(f=>f.id===a.function_id)?.name||'Equipe geral'}</div></div><Badge tone={a.state==='confirmed'?'green':a.state==='pending'?'amber':'rose'}>{a.state==='confirmed'?'Confirmado':a.state==='pending'?'Pendente':'Indisponível'}</Badge></div>)}</div>})}
 </Modal>}
 </>;
}
