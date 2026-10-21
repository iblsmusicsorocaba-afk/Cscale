'use client';
import React,{useMemo} from 'react';
import {CalendarDays,UsersRound,ClipboardCheck,Clock3,TrendingUp,ChartNoAxesCombined,ArrowRight,CheckCheck,AlertTriangle,BarChart3,Church2,MousePointer2,Sparkles,ChevronDown} from 'lucide-react';
import {Panel,Badge,Metric,Progress,Empty,PageHead,dateFmt,formatPercent,monthKey,monthLabel,Btn} from './ui';
import {DashboardInsights} from './DashboardInsights';

function monthsAround(today){
 const [year,mm]=today.split('-').map(Number);return Array.from({length:12},(_,i)=>{
  const d=new Date(year,mm-1-5+i,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
 });
}
function TrendChart({series}){
 const max=Math.max(1,...series.map(p=>Math.max(p.scheduled,p.confirmed)));
 const W=760,H=250,pad={left:40,right:18,top:20,bottom:37};
 const x=i=>pad.left+(i*(W-pad.left-pad.right)/Math.max(1,series.length-1));
 const y=n=>pad.top+(H-pad.top-pad.bottom)*(1-n/max);
 const make=key=>series.map((d,i)=>(i===0?'M':'L')+x(i).toFixed(2)+' '+y(d[key]).toFixed(2)).join(' ');
 return <div style={{overflowX:'auto'}}><svg className="timeline-chart" viewBox={'0 0 '+W+' '+H} role="img" aria-label="Evolução mensal de escalas e confirmações">
 {Array.from({length:5},(_,i)=>{const v=max*i/4;return <g key={i}><line x1={pad.left} x2={W-pad.right} y1={y(v)} y2={y(v)} stroke="#edf0f5" strokeDasharray="4 6"/><text x="8" y={y(v)+4} fontSize="11" fill="#a0abc0">{Math.round(v)}</text></g>})}
 <path d={make('scheduled')} stroke="#7569ee" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
 <path d={make('confirmed')} stroke="#43bf9a" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
 {series.map((d,i)=><g key={d.key}><circle cx={x(i)} cy={y(d.scheduled)} r="4.5" stroke="white" strokeWidth="2" fill="#7569ee"><title>{d.label}: {d.scheduled} convocações</title></circle><circle cx={x(i)} cy={y(d.confirmed)} r="4.5" stroke="white" strokeWidth="2" fill="#43bf9a"><title>{d.label}: {d.confirmed} confirmações</title></circle><text x={x(i)} textAnchor="middle" y={H-10} fontSize="11" fill="#8995a7">{d.label}</text></g>)}
 </svg></div>;
}
function Donut({confirmed,pending,declined}){
 const sum=confirmed+pending+declined,p1=formatPercent(confirmed,sum),p2=formatPercent(pending,sum);
 return <div className="row" style={{gap:25,justifyContent:'center',flexWrap:'wrap'}}>
 <div style={{width:158,height:158,flex:'0 0 auto',borderRadius:'50%',background:sum?'conic-gradient(#3ab992 0% '+p1+'%, #f4ad67 '+p1+'% '+(p1+p2)+'%, #df7986 '+(p1+p2)+'% 100%)':'conic-gradient(#e9edf6 0% 100%)',display:'grid',placeItems:'center'}}>
 <div style={{width:112,height:112,borderRadius:'50%',background:'white',display:'grid',placeItems:'center',textAlign:'center',alignContent:'center'}}><div className="metric-value" style={{fontSize:28}}>{sum}</div><small className="tiny-label">respostas / convites</small></div></div>
 <div className="stack" style={{minWidth:150,gap:14}}>
 {[['Confirmadas',confirmed,'#3ab992'],['Aguardando',pending,'#f4ad67'],['Recusadas',declined,'#df7986']].map(([label,value,color])=><div className="row spread" key={label}><div className="row" style={{gap:8}}><i style={{width:10,height:10,background:color,borderRadius:'50%'}}/><small style={{fontWeight:700,color:'#748096'}}>{label}</small></div><b>{value}</b></div>)}
 </div></div>;
}
export function Dashboard({role,profile,ministries,services,assignments,members,functions,month,setMonth,onNavigate,selectedMinistry,setSelectedMinistry}){
 const monthServices=services.filter(s=>monthKey(s.starts_at)===month&&s.status!=='cancelled');
 const monthIds=new Set(monthServices.map(s=>s.id));
 const minIds=new Set(ministries.map(m=>m.id));
 const filtered=assignments.filter(a=>monthIds.has(a.service_id)&&minIds.has(a.ministry_id)&&(!selectedMinistry||a.ministry_id===selectedMinistry));
 const active=filtered.filter(a=>['pending','confirmed','completed'].includes(a.state));
 const confirmed=filtered.filter(a=>['confirmed','completed'].includes(a.state));
 const pending=filtered.filter(a=>a.state==='pending');
 const declined=filtered.filter(a=>a.state==='unavailable');
 const selectedMins=ministries.filter(m=>!selectedMinistry||m.id===selectedMinistry);
 const needed=sumMin(selectedMins,functions)*monthServices.length;
 const overallNeeded=sumMin(ministries,functions)*monthServices.length;
 const coverage=formatPercent(active.length,needed);
 const rate=formatPercent(confirmed.length,active.length+declined.length);
 const distinct=new Set(active.map(x=>x.profile_id)).size;
 const upcoming=services.filter(s=>s.status!=='cancelled'&&new Date(s.starts_at)>new Date()).slice(0,5);
 const mHist=useMemo(()=>{
  const [y,m]=month.split('-').map(Number);
  return Array.from({length:6},(_,i)=>{
   const d=new Date(y,m-6+i,1),key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
   const allowed=new Set(services.filter(s=>monthKey(s.starts_at)===key&&!['cancelled'].includes(s.status)).map(s=>s.id));
   const a=assignments.filter(x=>allowed.has(x.service_id)&&minIds.has(x.ministry_id)&&(!selectedMinistry||x.ministry_id===selectedMinistry));
   return {key,label:new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(d).replace('.',''),scheduled:a.filter(x=>['pending','confirmed','completed'].includes(x.state)).length,confirmed:a.filter(x=>['confirmed','completed'].includes(x.state)).length};
  });
 },[month,services,assignments,ministries,selectedMinistry]);
 const ministryRows=selectedMins.map(m=>{
  const slots=sumMin([m],functions)*monthServices.length;
  const allocated=active.filter(a=>a.ministry_id===m.id).length;
  const accepted=confirmed.filter(a=>a.ministry_id===m.id).length;
  return {...m,slots,allocated,accepted,coverage:formatPercent(allocated,slots)};
 }).sort((a,b)=>a.coverage-b.coverage||a.name.localeCompare(b.name));
 const currentMonths=monthsAround(month);
 return <>
  <PageHead eyebrow={role==='pastor'?'PAINEL GERAL DA IGREJA':'INTELIGÊNCIA DO MINISTÉRIO'} title={role==='pastor'?'Visão geral da igreja':'Painel da liderança'} description={role==='pastor'?'Todos os ministérios, cultos e voluntários em uma visão.':'Indicadores e escalas exclusivamente dos seus ministérios.'} action={<div className="filter-strip"><select aria-label="Filtrar mês" value={month} onChange={e=>setMonth(e.target.value)}>{currentMonths.map(k=><option key={k} value={k}>{monthLabel(k)}</option>)}</select>{ministries.length>1&&<select aria-label="Filtrar ministério" value={selectedMinistry} onChange={e=>setSelectedMinistry(e.target.value)}><option value="">Todos os meus ministérios</option>{ministries.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>}</div>}/>
  <div className="hero mb-3"><div style={{position:'relative',zIndex:1}}><div className="eyebrow"><Sparkles size={13}/> SEU CENTRO DE DECISÕES</div><h2>{role==='pastor'?'Tudo o que acontece na igreja, em um lugar.':'Cuide da sua equipe com clareza.'}</h2><p>{role==='pastor'?'Acompanhe o preenchimento das escalas, a confirmação dos voluntários e os ministérios que precisam de atenção.':'Acompanhe vagas, respostas e participação de cada voluntário. Você gerencia somente sua equipe.'}</p></div><div className="hero-visual"><ChartNoAxesCombined size={51}/></div></div>
  <div className="dashboard-grid mb-3">
   <div className="col-3"><Metric icon={CalendarDays} label="Cultos no período" value={monthServices.length} caption="Calendário do mês selecionado" tone="purple"/></div>
   <div className="col-3"><Metric icon={UsersRound} label="Voluntários escalados" value={distinct} caption="Pessoas únicas convocadas" tone="blue"/></div>
   <div className="col-3"><Metric icon={ClipboardCheck} label="Ocupação da escala" value={coverage+'%'} caption={active.length+' de '+needed+' posições previstas'} tone="green"/></div>
   <div className="col-3"><Metric icon={Clock3} label="Confirmações" value={rate+'%'} caption={pending.length+' convites ainda pendentes'} tone="orange"/></div>
   <div className="col-8"><Panel title="Evolução das escalas" subtitle="Convocações e confirmações nos últimos seis meses" action={<div className="legend"><span><i style={{background:'#7569ee'}}/>Convocações</span><span><i style={{background:'#43bf9a'}}/>Confirmações</span></div>}><TrendChart series={mHist}/></Panel></div>
   <div className="col-4"><Panel title="Status das respostas" subtitle="Situação das convocações no período"><Donut confirmed={confirmed.length} pending={pending.length} declined={declined.length}/></Panel></div>
   <div className="col-7"><Panel title="Cobertura por ministério" subtitle={role==='pastor'?'Comparação de todas as equipes':'Ministérios sob sua responsabilidade'} action={<Badge tone="purple">{ministries.length} ministérios</Badge>}>
   {ministryRows.length===0?<Empty icon={UsersRound} title="Nenhum ministério atribuído" subtitle="O pastor precisa vincular sua conta a um ministério para mostrar o dashboard."/>:
   ministryRows.map(m=><div key={m.id} className="mini-row"><span className="mini-row-label" title={m.name}>{m.name}</span><div className="bar-track"><div className={'bar-fill '+(m.coverage>=100?'good':m.coverage<50?'warn':'')} style={{width:Math.min(100,m.coverage)+'%'}}/></div><span className="mini-row-value">{m.allocated}/{m.slots}</span></div>)}
   </Panel></div>
   <div className="col-5"><Panel title="Atenção necessária" subtitle="Pontos que merecem acompanhamento">
    <div className="stack">
     <div className="mini-summary"><div className="metric-icon orange" style={{margin:0,width:35,height:35}}><Clock3 size={17}/></div><div><strong>{pending.length} convites pendentes</strong><div className="tiny-label">Aguardando resposta dos voluntários</div></div></div>
     <div className="mini-summary"><div className="metric-icon pink" style={{margin:0,width:35,height:35}}><AlertTriangle size={17}/></div><div><strong>{Math.max(0,needed-active.length)} vagas em aberto</strong><div className="tiny-label">Posições previstas ainda não preenchidas</div></div></div>
     <div className="mini-summary"><div className="metric-icon green" style={{margin:0,width:35,height:35}}><CheckCheck size={17}/></div><div><strong>{confirmed.length} confirmações</strong><div className="tiny-label">Pessoas que aceitaram servir</div></div></div>
    </div>
    <Btn variant="soft" className="w-full mt-2" icon={ArrowRight} onClick={()=>onNavigate('escalas')}>Abrir gestão das escalas</Btn>
   </Panel></div>
   <div className="col-12"><Panel title="Próximos cultos" subtitle="Agenda operacional da igreja" action={<Btn small variant="secondary" onClick={()=>onNavigate('escalas')}>Ver calendário <ArrowRight size={14}/></Btn>}>
   {upcoming.length===0?<Empty icon={CalendarDays} title="Nenhum culto futuro cadastrado" subtitle="Crie os cultos no menu Escalas e cultos para visualizar o planejamento." action={role==='pastor'?<Btn icon={CalendarDays} onClick={()=>onNavigate('escalas')}>Cadastrar primeiro culto</Btn>:null}/>:<div className="table-scroll"><table className="data-table"><thead><tr><th>Culto</th><th>Data e horário</th><th>Convocações</th><th>Confirmadas</th><th>Estado</th></tr></thead><tbody>{upcoming.map(s=>{
    const rows=assignments.filter(a=>a.service_id===s.id&&minIds.has(a.ministry_id)&&(!selectedMinistry||a.ministry_id===selectedMinistry));return <tr key={s.id}><td><strong>{s.title}</strong></td><td>{dateFmt(s.starts_at)}</td><td>{rows.filter(a=>['pending','confirmed','completed'].includes(a.state)).length}</td><td>{rows.filter(a=>['confirmed','completed'].includes(a.state)).length}</td><td><Badge tone={s.status==='published'?'green':'amber'}>{s.status==='published'?'Publicado':'Rascunho'}</Badge></td></tr>;
    })}</tbody></table></div>}
   </Panel></div>
  </div>
  <DashboardInsights role={role} ministries={ministries} functions={functions} services={services} assignments={assignments} members={members} month={month} selectedMinistry={selectedMinistry} onNavigate={onNavigate}/>
 </>;
}
function sumMin(mins,functions){
 return mins.reduce((total,m)=>{const subs=functions.filter(f=>f.ministry_id===m.id);return total+(subs.length?subs.reduce((acc,f)=>acc+f.min_people,0):m.min_people||0)},0);
}
