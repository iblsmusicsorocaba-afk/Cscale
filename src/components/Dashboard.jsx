'use client';
import React,{useMemo,useState} from 'react';
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
 const [reports,setReports]=useState(false);
 const currentMonths=monthsAround(month);
 const monthServices=services.filter(s=>monthKey(s.starts_at)===month&&s.status!=='cancelled');
 const scope=ministries.filter(m=>!selectedMinistry||m.id===selectedMinistry);
 const allowed=new Set(scope.map(m=>m.id));
 const included=new Set(monthServices.map(s=>s.id));
 const all=assignments.filter(a=>included.has(a.service_id)&&allowed.has(a.ministry_id));
 const active=all.filter(a=>['pending','confirmed','completed'].includes(a.state));
 const pending=active.filter(a=>a.state==='pending').length;
 const confirmed=active.filter(a=>['confirmed','completed'].includes(a.state)).length;
 const required=monthServices.length*sumMin(scope,functions);
 const missing=Math.max(0,required-active.length);
 const future=monthServices.filter(s=>new Date(s.starts_at).getTime()>=Date.now()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at)).slice(0,3);
 const needsSetup=monthServices.length===0;
 const ctaTitle=needsSetup?'Comece cadastrando os cultos':missing>0?'Há vagas para preencher':pending>0?'Acompanhe as confirmações':'Suas escalas estão organizadas';
 const ctaDetail=needsSetup?'Organize as datas e horários para começar a montar a escala.':missing>0?'Existem '+missing+' posições ainda livres neste mês.':pending>0?'Ainda há '+pending+' respostas de voluntários pendentes.':'Você pode acompanhar os próximos cultos ou consultar os relatórios.';
 return <>
 <PageHead eyebrow={role==='pastor'?'GESTÃO DA IGREJA':'GESTÃO DO MINISTÉRIO'} title={role==='pastor'?'Olá, vamos organizar a igreja?':'Vamos cuidar da sua equipe?'}
 description="Veja o essencial e saiba o que fazer a seguir."
 action={<div className="filter-strip"><select aria-label="Escolher mês" value={month} onChange={e=>setMonth(e.target.value)}>{currentMonths.map(k=><option key={k} value={k}>{monthLabel(k)}</option>)}</select>{ministries.length>1&&<select aria-label="Escolher ministério" value={selectedMinistry} onChange={e=>setSelectedMinistry(e.target.value)}><option value="">Todos os ministérios</option>{ministries.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>}</div>}/>
 <div className="simple-metrics">
  <div className="simple-metric"><div className="simple-metric-icon violet"><CalendarDays size={21}/></div><div><span>Cultos do mês</span><strong>{monthServices.length}</strong><small>Programados</small></div></div>
  <div className="simple-metric"><div className="simple-metric-icon amber"><AlertTriangle size={21}/></div><div><span>Vagas abertas</span><strong>{missing}</strong><small>De {required} necessárias</small></div></div>
  <div className="simple-metric"><div className="simple-metric-icon blue"><Clock3 size={21}/></div><div><span>Respostas pendentes</span><strong>{pending}</strong><small>{confirmed} confirmações recebidas</small></div></div>
 </div>
 <section className="simple-next" aria-label="Próximo passo">
  <div className="simple-next-icon"><ClipboardCheck size={23}/></div>
  <div><div className="eyebrow">PRÓXIMO PASSO</div><h2>{ctaTitle}</h2><p>{ctaDetail}</p></div>
  <Btn icon={ArrowRight} onClick={()=>onNavigate('escalas')}>{needsSetup?'Cadastrar cultos':missing?'Organizar escala':pending?'Ver respostas':'Ver escalas'}</Btn>
 </section>
 <Panel title="Próximos cultos" subtitle="Uma visão rápida das próximas celebrações" action={<Btn variant="secondary" small onClick={()=>onNavigate('escalas')}>Ver todos <ArrowRight size={14}/></Btn>}>
  {future.length===0?<Empty icon={CalendarDays} title="Nenhum culto próximo neste mês" subtitle="Escolha outro mês ou cadastre novos cultos em Escalas."/>:
  <div className="simple-services">{future.map(s=>{
   const entries=active.filter(a=>a.service_id===s.id);
   const total=sumMin(scope,functions),filled=entries.length,yes=entries.filter(a=>['confirmed','completed'].includes(a.state)).length;
   const coverage=total?Math.round(filled/total*100):0;
   return <div className="simple-service" key={s.id}>
    <div className="simple-service-date"><strong>{dateFmt(s.starts_at,{day:'2-digit'})}</strong><small>{dateFmt(s.starts_at,{month:'short'}).replace('.','')}</small></div>
    <div className="simple-service-body"><b>{s.title}</b><span>{dateFmt(s.starts_at,{weekday:'long',hour:'2-digit',minute:'2-digit'})}</span><div className="bar-track"><div className={'bar-fill '+(coverage>=100?'good':coverage<50?'warn':'')} style={{width:Math.min(100,coverage)+'%'}}/></div></div>
    <div className="simple-service-status"><b>{filled}/{total}</b><small>{yes} confirmados</small></div>
   </div>;
  })}</div>}
 </Panel>
 <div className="simple-report">
  <button type="button" className="simple-report-toggle" onClick={()=>setReports(v=>!v)} aria-expanded={reports}>
   <span><BarChart3 size={19}/><strong>Relatórios e análises</strong><small>Gráficos, distribuição de equipes e indicadores detalhados</small></span><span className="simple-report-action">{reports?'Ocultar':'Ver relatórios'} <ChevronDown size={17} style={{transform:reports?'rotate(180deg)':'none'}}/></span>
  </button>
  {reports&&<DashboardInsights role={role} ministries={ministries} functions={functions} services={services} assignments={assignments} members={members} month={month} selectedMinistry={selectedMinistry} onNavigate={onNavigate}/>}
 </div>
 </>;
}

function sumMin(mins,functions){
 return mins.reduce((total,m)=>{const subs=functions.filter(f=>f.ministry_id===m.id);return total+(subs.length?subs.reduce((acc,f)=>acc+f.min_people,0):m.min_people||0)},0);
}
