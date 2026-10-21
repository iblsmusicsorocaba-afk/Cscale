'use client';
import React,{useState} from 'react';
import {UsersRound,Search,UserRoundCheck,UserPlus,ShieldCheck,Layers3,Clock3,Link as LinkIcon,ClipboardCopy,Settings2,Plus,CheckCheck,Info,UserRound,SlidersHorizontal,HeartHandshake} from 'lucide-react';
import {Avatar,Badge,Btn,PageHead,Panel,Metric,Empty,Progress,Modal,dateFmt} from './ui';

export function TeamPage({role,client,members,ministries,functions,busy,onRun}){
 const [search,setSearch]=useState(''),[filter,setFilter]=useState(''),[selected,setSelected]=useState(null);
 const isPastor=role==='pastor';
 const visible=members.filter(m=>(m.full_name||'').toLowerCase().includes(search.toLowerCase())&&(!filter||m.profile_roles?.some(x=>x.ministry_id===filter)));
 const waiting=members.flatMap(m=>(m.profile_roles||[]).filter(r=>!r.approved&&(!filter||r.ministry_id===filter)).map(r=>({...r,person:m})));
 const approve=async(id,table)=>await onRun(async()=>{const {error}=await client.from(table).update({approved:true}).eq('id',id);if(error)throw error},'Aprovação registrada com sucesso.');
 const link=m=>typeof window==='undefined'?'':window.location.origin+'/voluntario/'+m.slug;
 const copy=async m=>{try{await navigator.clipboard.writeText(link(m));alert('Link copiado!')}catch{alert('Link: '+link(m))}};
 return <>
  <PageHead eyebrow="PESSOAS E MINISTÉRIOS" title="Voluntários" description={isPastor?'Acompanhe os cadastros e as qualificações de todas as equipes.':'Acompanhe e valide os voluntários dos seus ministérios.'} action={<Badge tone="purple">{members.length} cadastrados</Badge>}/>
  <div className="simple-inline-status"><UsersRound size={17}/><strong>{members.length} pessoas</strong><span>{members.filter(p=>p.approved).length} aprovadas{waiting.length>0?' · '+waiting.length+' funções aguardando aprovação':''}</span></div>
  {waiting.length>0&&<Panel className="mb-3" title="Aprovações pendentes" subtitle="Verifique a função do voluntário antes de aprová-la.">
   <div className="stack">{waiting.map(r=><div className="mini-summary row spread" key={r.id}><div className="row"><Avatar name={r.person.full_name}/><div><strong className="person-name">{r.person.full_name}</strong><div className="inline-muted">{ministries.find(m=>m.id===r.ministry_id)?.name} • {functions.find(f=>f.id===r.function_id)?.name||'Equipe geral'}</div></div></div><Btn icon={CheckCheck} small disabled={busy} onClick={()=>approve(r.id,'profile_roles')}>Aprovar função</Btn></div>)}</div>
  </Panel>}
  <Panel title="Diretório de voluntários" subtitle="Consulte funções, status e disponibilidade">
   <div className="filter-strip mb-2"><div className="row" style={{border:'1px solid #e4e8f0',borderRadius:11,padding:'0 11px',background:'white',flex:'1 1 230px'}}><Search size={15} color="#a0a9bd"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome" style={{border:0,boxShadow:'none',background:'transparent',minHeight:40}}/></div><select aria-label="Filtrar por ministério" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Todos os ministérios</option>{ministries.map(m=><option value={m.id} key={m.id}>{m.name}</option>)}</select></div>
   {visible.length===0?<Empty icon={UsersRound} title="Nenhum voluntário encontrado" subtitle="Compartilhe o link do C Scale para que cada profissional faça seu próprio cadastro."/>:<div className="table-scroll"><table className="data-table"><thead><tr><th>Voluntário</th><th>Ministério / função</th><th>Disponibilidade</th><th>Situação</th><th></th></tr></thead><tbody>{visible.map(m=><tr key={m.id}><td><div className="row"><Avatar name={m.full_name}/><div><strong className="person-name">{m.full_name}</strong><div className="tiny-label">{m.monthly_limit} cultos/mês</div></div></div></td><td><div style={{maxWidth:230,display:'flex',flexWrap:'wrap',gap:5}}>{(m.profile_roles||[]).filter(r=>!filter||r.ministry_id===filter).length?(m.profile_roles||[]).filter(r=>!filter||r.ministry_id===filter).map(r=><Badge key={r.id} tone={r.approved?'purple':'amber'}>{functions.find(f=>f.id===r.function_id)?.name||ministries.find(x=>x.id===r.ministry_id)?.name||'Equipe'}</Badge>):<span className="inline-muted">Sem função</span>}</div></td><td>{(m.availability||[]).length} faixas</td><td><Badge tone={m.approved?'green':'amber'}>{m.approved?'Aprovado':'Pendente'}</Badge></td><td><Btn variant="secondary" small onClick={()=>setSelected(m)}>Ver perfil</Btn></td></tr>)}</tbody></table></div>}
  </Panel>
  {selected&&<Modal title="Perfil do voluntário" onClose={()=>setSelected(null)} footer={<><Btn variant="secondary" onClick={()=>setSelected(null)}>Fechar</Btn><Btn icon={ClipboardCopy} onClick={()=>copy(selected)}>Copiar link pessoal</Btn></>}>
   <div className="row mb-3"><Avatar name={selected.full_name} size="large"/><div><h3>{selected.full_name}</h3><div className="inline-muted">{selected.phone||'WhatsApp não cadastrado'}</div><Badge tone={selected.approved?'green':'amber'}>{selected.approved?'Cadastro aprovado':'Aguardando validação'}</Badge></div></div>
   <div className="dashboard-grid mb-3"><div className="col-6"><div className="mini-summary"><Clock3 size={18} color="#7069e8"/><div><strong>{selected.monthly_limit} cultos</strong><div className="tiny-label">Limite mensal</div></div></div></div><div className="col-6"><div className="mini-summary"><ShieldCheck size={18} color="#7069e8"/><div><strong>{selected.profile_roles?.length||0} funções</strong><div className="tiny-label">Cadastradas</div></div></div></div></div>
   <h3 className="mb-2">Funções</h3>{(selected.profile_roles||[]).length===0?<p className="inline-muted">Nenhuma função registrada.</p>:(selected.profile_roles||[]).map(r=><div className="mini-summary row spread mb-2" key={r.id}><div><strong>{ministries.find(m=>m.id===r.ministry_id)?.name}</strong><div className="tiny-label">{functions.find(f=>f.id===r.function_id)?.name||'Equipe geral'}</div></div><Badge tone={r.approved?'green':'amber'}>{r.approved?'Aprovada':'Pendente'}</Badge></div>)}
   {isPastor&&!selected.approved&&<Btn className="w-full" icon={UserRoundCheck} disabled={busy} onClick={()=>approve(selected.id,'profiles')}>Aprovar cadastro</Btn>}
   <div className="divider"/>
   <div className="inline-muted">Disponibilidade: {(selected.availability||[]).length} faixas semanais. Consulte diretamente a área de horários do voluntário.</div>
  </Modal>}
 </>;
}
export function MinistriesPage({role,client,ministries,functions,busy,onRun}){
 const isPastor=role==='pastor';
 const settings=[
  ['min_people','Equipe mínima','pessoas'],
  ['arrival_minutes','Chegada antecipada','minutos antes'],
  ['departure_minutes','Saída após o culto','minutos depois']
 ];
 const update=async(table,id,field,input,old)=>{
  const next=input===''?null:Number(input);
  if(next===old)return;
  await onRun(async()=>{const {error}=await client.from(table).update({[field]:next}).eq('id',id);if(error)throw error},'Configuração atualizada.');
 };
 return <>
 <PageHead eyebrow="CONFIGURAÇÕES DE EQUIPES" title="Ministérios" description={isPastor?'Regras e quantitativos de cada ministério. As mudanças passam a valer nas próximas escalas.':'Regras das equipes sob sua responsabilidade. Ajustes oficiais são feitos pelo pastor.'}/>
 <div className="hero mb-3"><div><div className="eyebrow">ORGANIZAÇÃO DO CULTO</div><h2>Todos servem. Cada função importa.</h2><p>Os quantitativos são metas mínimas por culto. Defina corretamente as janelas de chegada e saída para evitar conflitos de disponibilidade.</p></div><Layers3 size={70} color="#bfc0ff"/></div>
 <div className="dashboard-grid">
 {ministries.map(m=>{const fs=functions.filter(f=>f.ministry_id===m.id);const desired=fs.length?fs.reduce((n,f)=>n+f.min_people,0):m.min_people;return <div className="col-6" key={m.id}><Panel title={m.name} action={<Badge tone={m.arrival_minutes===null||m.departure_minutes===null?'amber':'purple'}>{desired||'A definir'} {desired===1?'posição':'posições'}</Badge>}>
 <div className="row spread mb-2"><span className="inline-muted">Organização do ministério</span><Badge tone={m.arrival_minutes!==null&&m.departure_minutes!==null?'green':'amber'}>{m.arrival_minutes!==null&&m.departure_minutes!==null?'Horários completos':'Configuração pendente'}</Badge></div>
 {fs.length>0&&<div className="stack" style={{gap:8}}>{fs.map(f=><div key={f.id} className="row spread mini-summary"><div><strong>{f.name}</strong><div className="tiny-label">Quantidade mínima por culto</div></div>{isPastor?<input aria-label={'Quantidade mínima para '+f.name} type="number" min="0" style={{width:79,minHeight:36}} defaultValue={f.min_people} key={f.id+':'+f.min_people} onBlur={e=>void update('functions',f.id,'min_people',e.target.value,f.min_people)}/>:<strong>{f.min_people}</strong>}</div>)}</div>}
 <div className="fields mt-2">{settings.filter(([key])=>fs.length===0||key!=='min_people').map(([key,label,unit])=><div key={key}><label>{label}</label>{isPastor?<div className="row"><input type="number" min="0" key={m.id+key+String(m[key])} defaultValue={m[key]??''} placeholder="A definir" onBlur={e=>void update('ministries',m.id,key,e.target.value,m[key])}/><span className="tiny-label" style={{minWidth:75}}>{unit}</span></div>:<div style={{fontWeight:800}}>{m[key]===null?'Não configurado':m[key]+' '+unit}</div>}</div>)}</div>
 </Panel></div>})}
 </div>
 </>;
}
export function LeadersPage({client,members,ministries,allLeaders,leaderScopes,busy,onRun}){
 const [person,setPerson]=useState(''),[ministry,setMinistry]=useState(''),[kind,setKind]=useState('leader');
 const leaders=allLeaders.filter(l=>l.role==='leader').map(l=>({...l,profile:members.find(p=>p.id===l.profile_id),scopes:leaderScopes.filter(s=>s.profile_id===l.profile_id)}));
 const pastors=allLeaders.filter(l=>l.role==='pastor').map(l=>({...l,profile:members.find(p=>p.id===l.profile_id)}));
 const appoint=async e=>{
  e.preventDefault();if(!person||(kind==='leader'&&!ministry))return;
  if(kind==='pastor'&&!window.confirm('Conceder acesso de pastor? Esta pessoa poderá administrar todos os ministérios e permissões da igreja.'))return;
  await onRun(async()=>{
    const profile=members.find(p=>p.id===person);
    if(!profile?.approved)throw Error('O cadastro precisa ser aprovado antes de assumir uma função administrativa.');
    const current=allLeaders.find(l=>l.profile_id===person);
    if(current?.role==='pastor')throw Error('Este perfil já possui acesso pastoral completo.');
    const a=await client.from('managers').upsert({profile_id:person,role:kind},{onConflict:'profile_id'});
    if(a.error)throw a.error;
    if(kind==='leader'){
      const b=await client.from('leader_ministries').upsert({profile_id:person,ministry_id:ministry},{onConflict:'profile_id,ministry_id'});
      if(b.error)throw b.error;
    }
    setPerson('');
   },kind==='pastor'?'Novo pastor autorizado com visão de toda a igreja.':'Liderança atribuída ao ministério.');
 };
 const remove=async scope=>await onRun(async()=>{
   const r=await client.from('leader_ministries').delete().eq('profile_id',scope.profile_id).eq('ministry_id',scope.ministry_id);
   if(r.error)throw r.error;
 },'Permissão do ministério removida.');
 return <>
  <PageHead eyebrow="PASTOR • PERMISSÕES" title="Gestão de líderes" description="Pastores visualizam tudo. Líderes possuem acesso exclusivo aos ministérios autorizados." action={<Badge tone="purple"><ShieldCheck size={13}/> Gestão de acessos</Badge>}/>
  <div className="dashboard-grid mb-3">
   <div className="col-4"><Metric icon={ShieldCheck} label="Pastores autorizados" value={pastors.length} caption="Visão integral da igreja" tone="purple"/></div>
   <div className="col-4"><Metric icon={UserRoundCheck} label="Líderes cadastrados" value={leaders.length} caption="Gestores por ministério" tone="blue"/></div>
   <div className="col-4"><Metric icon={Layers3} label="Ministérios com líder" value={new Set(leaderScopes.filter(s=>leaders.some(l=>l.profile_id===s.profile_id)).map(s=>s.ministry_id)).size} caption={'de '+ministries.length+' ministérios'} tone="green"/></div>
  </div>
  <div className="dashboard-grid">
   <div className="col-5"><Panel title="Conceder acesso" subtitle="Defina o nível de permissão de cada pessoa.">
    <form onSubmit={appoint} className="stack">
     <div><label>Tipo de acesso</label><select value={kind} onChange={e=>setKind(e.target.value)}><option value="leader">Líder de ministério</option><option value="pastor">Pastor — acesso a toda a igreja</option></select></div>
     <div><label>Voluntário aprovado</label><select required value={person} onChange={e=>setPerson(e.target.value)}><option value="">Escolher pessoa</option>{members.filter(p=>p.approved&&!pastors.some(l=>l.profile_id===p.id)).sort((a,b)=>a.full_name.localeCompare(b.full_name)).map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
     {kind==='leader'&&<div><label>Ministério sob responsabilidade</label><select required value={ministry} onChange={e=>setMinistry(e.target.value)}><option value="">Selecione um ministério</option>{ministries.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>}
     <div className="alert info"><Info size={17}/><span>{kind==='pastor'?'O pastor terá controle e dashboard consolidado de todos os ministérios e voluntários.':'O líder poderá acompanhar e organizar apenas os ministérios que você autorizar.'}</span></div>
     <Btn type="submit" icon={Plus} disabled={busy||!person||(kind==='leader'&&!ministry)}>Conceder acesso</Btn>
    </form>
   </Panel></div>
   <div className="col-7"><Panel title="Pessoas com acesso de liderança" subtitle="Responsabilidades e permissões atualmente ativas">
    {pastors.length===0&&leaders.length===0?<Empty icon={ShieldCheck} title="Sem liderança cadastrada" subtitle="Cadastre o primeiro gestor no formulário ao lado."/>:<div className="stack">
     {pastors.map(p=><div key={p.profile_id} className="mini-summary row spread"><div className="row"><Avatar name={p.profile?.full_name||'Pastor'}/><div><strong>{p.profile?.full_name||'Pastor'}</strong><div className="tiny-label">Acesso completo</div></div></div><Badge tone="green">Pastor · Global</Badge></div>)}
     {leaders.map(l=><div key={l.profile_id} className="volunteer-card"><div className="row spread mb-2"><div className="row"><Avatar name={l.profile?.full_name||'Líder'}/><div><strong>{l.profile?.full_name||'Líder'}</strong><div className="tiny-label">{l.scopes.length} ministérios autorizados</div></div></div><Badge tone="purple">Líder</Badge></div><div className="stack" style={{gap:7}}>{l.scopes.length===0?<small className="muted">Sem ministério atribuído.</small>:l.scopes.map(s=><div key={s.ministry_id} className="mini-summary row spread"><span className="inline-muted">{ministries.find(m=>m.id===s.ministry_id)?.name||'Ministério'}</span><Btn small variant="danger" disabled={busy} onClick={()=>remove(s)}>Remover</Btn></div>)}</div></div>)}
    </div>}
   </Panel></div>
  </div>
 </>;
}
