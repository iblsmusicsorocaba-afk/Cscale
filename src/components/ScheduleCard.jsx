'use client';
import React from 'react';
import {CalendarDays,Clock3,CheckCheck,ArrowRight,UsersRound,AlertCircle} from 'lucide-react';
import {Badge,Btn,dateFmt,dayNumber,shortMonth,Avatar} from './ui';

export function minimumForMinistry(ministry,functions){
 const dedicated=functions.filter(f=>f.ministry_id===ministry.id);
 return dedicated.length?dedicated.reduce((n,f)=>n+Math.max(0,f.min_people||0),0):Math.max(0,ministry.min_people||0);
}
export function ScheduleCard({service,assignments=[],ministries=[],functions=[],members=[],onOpen,compact=false}){
 const active=assignments.filter(a=>['pending','confirmed','completed'].includes(a.state));
 const confirmed=active.filter(a=>['confirmed','completed'].includes(a.state));
 const awaiting=active.filter(a=>a.state==='pending');
 const needed=ministries.reduce((n,m)=>n+minimumForMinistry(m,functions),0);
 const available=Math.max(0,needed-active.length);
 const percent=needed?Math.min(100,Math.round(active.length/needed*100)):0;
 const percentConfirmed=needed?Math.min(100,confirmed.length/needed*100):0;
 const percentPending=needed?Math.min(100,awaiting.length/needed*100):0;
 const users=confirmed.map(a=>members.find(p=>p.id===a.profile_id)).filter(Boolean);
 const cancelled=service.status==='cancelled';
 const status=service.status==='published'?'Publicado':service.status==='completed'?'Concluído':cancelled?'Cancelado':'Rascunho';
 return <article className={'sc-card '+(compact?'sc-card-compact':'')+(cancelled?' sc-card-cancelled':'')}>
  <div className="sc-card-head">
   <div className="sc-date"><strong>{dayNumber(service.starts_at)}</strong><span>{shortMonth(service.starts_at)}</span></div>
   <div className="sc-info"><div className="sc-day">{dateFmt(service.starts_at,{weekday:'long'})}</div><h3>{service.title}</h3><div className="sc-hours"><Clock3 size={13}/>{dateFmt(service.starts_at,{hour:'2-digit',minute:'2-digit'})} – {dateFmt(service.ends_at,{hour:'2-digit',minute:'2-digit'})}</div></div>
   <Badge tone={service.status==='published'?'green':cancelled?'rose':service.status==='completed'?'purple':'amber'}>{status}</Badge>
  </div>
  <div className="sc-card-middle">
   <div className="sc-stat"><span className="sc-stat-value">{active.length}<small>/{needed}</small></span><span className="sc-stat-label">Pessoas escaladas</span></div>
   <div className="sc-progress-circle" style={{background:'conic-gradient(#2fac87 0% '+percentConfirmed+'%, #e8ae62 '+percentConfirmed+'% '+Math.min(100,percentConfirmed+percentPending)+'%, #ecedf5 '+Math.min(100,percentConfirmed+percentPending)+'% 100%)'}}>
    <div><strong>{percent}%</strong><span>preenchido</span></div>
   </div>
  </div>
  <div className="sc-progress-key">
   <span><i className="sc-dot green"/>{confirmed.length} confirmados</span>
   <span><i className="sc-dot orange"/>{awaiting.length} aguardando</span>
   <span><i className="sc-dot grey"/>{available} vagas</span>
  </div>
  <div className="sc-card-bottom">
   <div className="sc-team">
    {users.length>0?<div className="sc-facepile">{users.slice(0,4).map(p=><div key={p.id} title={p.full_name}><Avatar name={p.full_name}/></div>)}{users.length>4&&<span className="sc-more-faces">+{users.length-4}</span>}</div>:<div className="sc-no-team"><UsersRound size={17}/> Aguardando equipe</div>}
   </div>
   <Btn variant="soft" icon={ArrowRight} small onClick={()=>onOpen?.(service)}>Ver equipe</Btn>
  </div>
 </article>;
}
