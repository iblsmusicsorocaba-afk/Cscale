'use client';
import React,{useMemo,useState} from 'react';
import {AlertTriangle,ArrowRight,ChartColumnIncreasing,ChartPie,UsersRound,CalendarRange,Download,SlidersHorizontal,Activity} from 'lucide-react';
import {Panel,Badge,Btn,Empty,dateFmt,formatPercent,monthKey} from './ui';

const valid=a=>['pending','confirmed','completed'].includes(a.state);
const accepted=a=>['confirmed','completed'].includes(a.state);
function roleTarget(ministry,functions){
 const specifics=functions.filter(f=>f.ministry_id===ministry.id);
 return specifics.length?specifics.reduce((total,f)=>total+Math.max(0,f.min_people||0),0):Math.max(0,ministry.min_people||0);
}
function nice(n){return Number.isFinite(n)?String(n):'0'}
export function DashboardInsights({role,ministries,functions,services,assignments,members,month,selectedMinistry,onNavigate}){
 const [order,setOrder]=useState('risk'),[statusFilter,setStatusFilter]=useState('all'),[focus,setFocus]=useState(null);
 const scope=useMemo(()=>ministries.filter(m=>!selectedMinistry||m.id===selectedMinistry),[ministries,selectedMinistry]);
 const scopeIds=useMemo(()=>new Set(scope.map(m=>m.id)),[scope]);
 const meetings=useMemo(()=>services.filter(s=>monthKey(s.starts_at)===month&&s.status!=='cancelled').sort((a,b)=>a.starts_at.localeCompare(b.starts_at)),[services,month]);
 const monthAssignments=useMemo(()=>assignments.filter(a=>scopeIds.has(a.ministry_id)&&meetings.some(s=>s.id===a.service_id)),[assignments,scopeIds,meetings]);
 const totals=useMemo(()=>meetings.map(s=>{
   const rows=monthAssignments.filter(a=>a.service_id===s.id);
   const required=scope.reduce((sum,m)=>sum+roleTarget(m,functions),0);
   const filled=rows.filter(valid).length;
   const yes=rows.filter(accepted).length;
   const awaiting=rows.filter(a=>a.state==='pending').length;
   return {id:s.id,title:s.title,date:s.starts_at,status:s.status,required,filled,yes,awaiting,declined:rows.filter(a=>a.state==='unavailable').length,missing:Math.max(0,required-filled),percent:formatPercent(filled,required)};
 }),[meetings,monthAssignments,scope,functions]);
 const displayed=useMemo(()=>{
   let rows=totals;
   if(statusFilter==='risks')rows=rows.filter(r=>r.missing>0);
   if(statusFilter==='pending')rows=rows.filter(r=>r.awaiting>0);
   if(statusFilter==='confirmed')rows=rows.filter(r=>r.required>0&&r.yes>=r.required);
   return [...rows].sort((a,b)=>order==='date'?a.date.localeCompare(b.date):order==='coverage'?b.percent-a.percent:b.missing-a.missing||a.date.localeCompare(b.date));
 },[totals,order,statusFilter]);
 const required=totals.reduce((n,r)=>n+r.required,0),slots=totals.reduce((n,r)=>n+r.filled,0);
 const risk=totals.filter(r=>r.missing>0).length;
 const leadersMembers=members.filter(p=>(p.profile_roles||[]).some(r=>scopeIds.has(r.ministry_id)));
 const workloads=useMemo(()=>{
   const active=monthAssignments.filter(valid);
   return leadersMembers.map(p=>({
     id:p.id,name:p.full_name,limit:p.monthly_limit||0,
     shifts:active.filter(a=>a.profile_id===p.id).length,
     confirmed:active.filter(a=>a.profile_id===p.id&&accepted(a)).length
   })).sort((a,b)=>b.shifts-a.shifts||a.name.localeCompare(b.name));
 },[leadersMembers,monthAssignments]);
 const bins=[0,1,2,3,4].map(i=>({label:i===4?'4+':String(i),people:workloads.filter(v=>i===4?v.shifts>=4:v.shifts===i).length}));
 const worst=Math.max(1,...bins.map(b=>b.people));
 const alert=totals.filter(r=>r.missing>0||r.awaiting>0).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
 const exportCSV=()=>{
   const header=['Culto','Início','Status','Vagas necessárias','Convocados','Confirmados','Pendentes','Recusas','Vagas livres'];
   const csv=[header,...totals.map(r=>[r.title,dateFmt(r.date),r.status,r.required,r.filled,r.yes,r.awaiting,r.declined,r.missing])].map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\r\n');
   const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
   const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='cscale-analise-'+month+'.csv';a.click();URL.revokeObjectURL(url);
 };
 return <section className="bi-section" aria-label="Painel analítico de ministérios">
   <div className="bi-intro">
    <div><div className="eyebrow"><Activity size={13}/> INTELIGÊNCIA OPERACIONAL</div><h2>Dados para servir melhor</h2><p>Indicadores calculados a partir dos cultos e convocações reais {role==='pastor'?'da igreja':'dos seus ministérios'}.</p></div>
    <Btn icon={Download} variant="secondary" onClick={exportCSV} disabled={!totals.length}>Exportar CSV</Btn>
   </div>
   <div className="bi-kpis">
    <div className="bi-kpi"><span><CalendarRange size={17}/> CULTOS COM VAGAS</span><strong>{risk}<small> / {totals.length}</small></strong><p>{totals.length?formatPercent(risk,totals.length)+'% exigem atenção':'Nenhum culto no período'}</p></div>
    <div className="bi-kpi"><span><ChartPie size={17}/> COBERTURA ATUAL</span><strong>{formatPercent(slots,required)}<small>%</small></strong><p>{slots} de {required} posições ocupadas</p></div>
    <div className="bi-kpi"><span><UsersRound size={17}/> EQUIPE ELEGÍVEL</span><strong>{leadersMembers.length}</strong><p>Voluntários associados ao escopo</p></div>
    <div className="bi-kpi"><span><AlertTriangle size={17}/> CONVITES SEM RESPOSTA</span><strong>{monthAssignments.filter(a=>a.state==='pending').length}</strong><p>Confirmar ou buscar substituição</p></div>
   </div>
   <div className="bi-split">
    <Panel title="Cobertura por culto" subtitle="Vagas preenchidas versus necessidade por celebração" action={<div className="bi-controls"><SlidersHorizontal size={15}/><select aria-label="Ordenar cobertura" value={order} onChange={e=>setOrder(e.target.value)}><option value="risk">Mais vagas livres</option><option value="date">Por data</option><option value="coverage">Maior cobertura</option></select></div>}>
     {!totals.length?<Empty icon={CalendarRange} title="Ainda sem dados neste mês" subtitle="Cadastre os cultos para acompanhar a cobertura em tempo real."/>:
     <div className="bi-bars">{displayed.slice(0,10).map(item=><button key={item.id} className={'bi-bar-row '+(focus===item.id?'is-selected':'')} onClick={()=>setFocus(focus===item.id?null:item.id)} aria-expanded={focus===item.id}>
      <div className="bi-bar-copy"><span>{item.title}<small>{dateFmt(item.date,{day:'2-digit',month:'short'})}</small></span><strong>{item.filled}/{item.required}</strong></div>
      <div className="bi-bar-track"><div className={item.percent>=100?'full':item.percent>=65?'partial':'low'} style={{width:Math.min(item.percent,100)+'%'}}/></div>
      {focus===item.id&&<div className="bi-detail">{item.yes} confirmados · {item.awaiting} pendentes · {item.declined} recusas · {item.missing} vagas abertas</div>}
     </button>)}</div>}
    </Panel>
    <Panel title="Equilíbrio das escalas" subtitle="Quantidade de voluntários por número de convocações">
     {workloads.length===0?<Empty icon={UsersRound} title="Sem voluntários associados" subtitle="A distribuição aparecerá após o cadastro e vínculo das equipes."/>:
      <div><div className="bi-histogram">{bins.map(b=><div className="bi-histo-item" key={b.label}><strong>{b.people}</strong><div className="bi-histo-track"><div style={{height:Math.max(4,b.people/worst*100)+'%'}}/></div><small>{b.label} {b.label==='1'?'culto':'cultos'}</small></div>)}</div><p className="bi-footnote">Equipes menores podem ter mais convocações. Verifique os limites individuais antes de publicar.</p></div>}
    </Panel>
   </div>
   <div className="bi-split">
    <Panel title="Cultos que precisam de atenção" subtitle="Prioridades dentro do mês selecionado" action={<div className="bi-controls"><select aria-label="Filtrar riscos" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">Todos</option><option value="risks">Com vagas</option><option value="pending">Com pendências</option><option value="confirmed">Equipe confirmada</option></select></div>}>
     {displayed.length===0?<Empty icon={ChartColumnIncreasing} title="Nada neste filtro" subtitle="Os próximos cultos aparecerão aqui assim que forem cadastrados."/>:<div className="bi-list">{displayed.slice(0,7).map(r=><div className="bi-list-row" key={r.id}><div><b>{r.title}</b><small>{dateFmt(r.date)}</small></div><div className="bi-right"><Badge tone={r.missing?'amber':'green'}>{r.missing?r.missing+' vagas':'Coberto'}</Badge><small>{r.awaiting} aguardando</small></div></div>)}</div>}
     <Btn variant="soft" icon={ArrowRight} className="w-full mt-2" onClick={()=>onNavigate('escalas')}>Resolver na gestão de escalas</Btn>
    </Panel>
    <Panel title="Carga por voluntário" subtitle="Quem está sendo mais escalado neste mês">
     {workloads.length===0?<Empty icon={UsersRound} title="Sem convocações" subtitle="Acompanhe o equilíbrio da escala conforme os voluntários forem convocados."/>:<div className="bi-list">{workloads.slice(0,7).map((p,i)=><div key={p.id} className="bi-list-row"><div className="bi-person"><span>{i+1}</span><div><b>{p.name}</b><small>{p.confirmed} confirmações</small></div></div><div className="bi-right"><Badge tone={p.limit>0&&p.shifts>=p.limit?'amber':'purple'}>{p.shifts}/{p.limit} cultos</Badge></div></div>)}</div>}
     <p className="bi-footnote">Somente pessoas visíveis para a sua liderança são exibidas.</p>
    </Panel>
   </div>
 </section>;
}
