'use client';
import React,{useState} from 'react';
import {CalendarDays,Clock3,CheckCircle2,CheckCheck,HeartHandshake,HandHeart,Plus,MicVocal,UsersRound,CalendarX2,ClipboardCheck,Link as LinkIcon,Copy,UserRound,ShieldCheck,Sun,SunMoon,CalendarOff,Trash2,Mail} from 'lucide-react';
import {PageHead,Panel,Badge,Btn,Empty,Metric,Modal,Avatar,dateFmt,dayNumber,shortMonth} from './ui';
const weekdays=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const hm=n=>String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const minutes=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const symbols={'Bateria':'🥁','Guitarra':'🎸','Baixo':'🎸','Violão':'🎸','Teclado':'🎹','Cantor':'🎤'};
function Studio({team,functions,assignment}){
 const role=functions.find(f=>f.id===assignment.function_id);
 const ministry=role?.ministry_id;
 const isMusic=role&&['Bateria','Guitarra','Baixo','Violão','Teclado','Cantor'].includes(role.name);
 if(!isMusic)return null;
 const names=['Bateria','Guitarra','Baixo','Violão','Teclado','Cantor'];
 return <div className="studio"><div className="studio-title">SUA EQUIPE DE LOUVOR · INTEGRANTES CONFIRMADOS</div><div className="studio-grid">{names.map(name=>{const people=team?.filter(x=>x.function_name===name).map(x=>x.person_name)||[];return <div key={name} className="studio-cell"><div className="studio-symbol">{symbols[name]}</div><div className="studio-role">{name}</div><div className="studio-name">{people.length?people.join(' · '):'Aguardando'}</div></div>})}</div></div>;
}
function ShiftCard({assignment,service,functions,ministries,team,children,confirmed=false}){
 const min=ministries.find(m=>m.id===assignment.ministry_id);
 const f=functions.find(f=>f.id===assignment.function_id);
 return <div className="service-card"><div className="service-top"><div className="row"><div className="service-date"><strong>{dayNumber(service?.starts_at)}</strong><small>{shortMonth(service?.starts_at)}</small></div><div><h3>{service?.title||'Culto'}</h3><div className="service-meta"><span><Clock3 size={12}/>{dateFmt(service?.starts_at,{weekday:'short',hour:'2-digit',minute:'2-digit'})}</span></div><div className="inline-muted">{min?.name}{f?' · '+f.name:''}</div></div></div><Badge tone={confirmed?'green':'amber'}>{confirmed?'Confirmada':'Aguardando'}</Badge></div><Studio team={team} functions={functions} assignment={assignment}/>{children}</div>;
}
export function VolunteerSchedule({client,assignments,services,ministries,functions,team,onRun,busy}){
 const [answers,setAnswers]=useState({}),[review,setReview]=useState(false);
 const map=new Map(services.map(s=>[s.id,s]));
 const pending=assignments.filter(a=>a.state==='pending'&&map.get(a.service_id)?.status==='published').sort((a,b)=>(map.get(a.service_id)?.starts_at||'').localeCompare(map.get(b.service_id)?.starts_at||''));
 const confirmed=assignments.filter(a=>['confirmed','completed'].includes(a.state)).sort((a,b)=>(map.get(a.service_id)?.starts_at||'').localeCompare(map.get(b.service_id)?.starts_at||''));
 const declined=assignments.filter(a=>a.state==='unavailable');
 const finalize=async()=>await onRun(async()=>{
   if(pending.some(a=>!answers[a.id]))throw Error('Escolha uma resposta para cada data.');
   const result=await client.rpc('finalize_my_responses',{p_answers:pending.map(a=>({id:a.id,state:answers[a.id]}))});
   if(result.error)throw result.error;
   setReview(false);setAnswers({});
 },'Respostas finalizadas! Que Deus abençoe sua vida e seu ministério! 🙏');
 return <>
 <PageHead eyebrow="MINHA PARTICIPAÇÃO" title="Minhas escalas" description="Escolha as datas em que poderá servir. Confira tudo antes de enviar suas respostas."/>
 <div className="dashboard-grid mb-3"><div className="col-4"><Metric icon={Clock3} label="Precisam de resposta" value={pending.length} caption="Convocações deste período" tone="orange"/></div><div className="col-4"><Metric icon={CheckCircle2} label="Confirmadas" value={confirmed.length} caption="Próximos compromissos aceitos" tone="green"/></div><div className="col-4"><Metric icon={CalendarX2} label="Não disponíveis" value={declined.length} caption="Datas liberadas para substitutos" tone="pink"/></div></div>
 <Panel title="Novas convocações" subtitle="Responda cada data individualmente e finalize uma única vez." className="mb-3" action={<Badge tone="amber">{pending.length} pendentes</Badge>}>
 {pending.length===0?<Empty icon={CalendarDays} title="Tudo certo por aqui!" subtitle="Você não tem novas convocações aguardando resposta. Quando uma escala for publicada, ela aparecerá aqui."/>:<><div className="dashboard-grid">{pending.map(a=><div className="col-6" key={a.id}><ShiftCard assignment={a} service={map.get(a.service_id)} functions={functions} ministries={ministries} team={team[a.service_id]||[]}><div className="actions mt-2"><Btn small icon={CheckCheck} variant={answers[a.id]==='confirmed'?'success':'secondary'} onClick={()=>setAnswers(v=>({...v,[a.id]:'confirmed'}))}>Confirmar</Btn><Btn small variant={answers[a.id]==='unavailable'?'danger':'secondary'} onClick={()=>setAnswers(v=>({...v,[a.id]:'unavailable'}))}>Não disponível</Btn></div></ShiftCard></div>)}</div><div className="row spread mt-3" style={{flexWrap:'wrap'}}><p className="inline-muted" style={{margin:0}}>{pending.filter(a=>answers[a.id]).length} de {pending.length} respostas selecionadas</p><Btn icon={ClipboardCheck} disabled={busy||pending.some(a=>!answers[a.id])} onClick={()=>setReview(true)}>Conferir e finalizar respostas</Btn></div></>}
 </Panel>
 <Panel title="Minhas confirmadas" subtitle="Datas em que você já confirmou sua participação" className="mb-3" action={<Badge tone="green">{confirmed.length} confirmadas</Badge>}>
 {confirmed.length===0?<Empty icon={HeartHandshake} title="Nenhuma data confirmada" subtitle="Suas datas aceitas aparecerão aqui, junto com os nomes da equipe confirmada."/>:<div className="dashboard-grid">{confirmed.map(a=><div className="col-6" key={a.id}><ShiftCard assignment={a} service={map.get(a.service_id)} functions={functions} ministries={ministries} team={team[a.service_id]||[]} confirmed/></div>)}</div>}
 </Panel>
 {declined.length>0&&<Panel title="Datas em que não posso servir" subtitle="Convocações que você liberou para substituição"><div className="stack">{declined.map(a=><div key={a.id} className="mini-summary row spread"><span>{map.get(a.service_id)?.title||'Culto'} · {dateFmt(map.get(a.service_id)?.starts_at)}</span><Badge tone="rose">Indisponível</Badge></div>)}</div></Panel>}
 {review&&<Modal title="Conferir suas respostas" onClose={()=>setReview(false)} footer={<><Btn variant="secondary" onClick={()=>setReview(false)}>Voltar e editar</Btn><Btn icon={CheckCheck} variant="success" disabled={busy} onClick={finalize}>Finalizar respostas</Btn></>}>
   <p className="inline-muted mb-2">Confira com carinho todas as datas. Depois de finalizar, a alteração deverá ser solicitada à liderança.</p>
   <div className="stack">{pending.map(a=><div className="mini-summary row spread" key={a.id}><div><strong>{map.get(a.service_id)?.title}</strong><div className="tiny-label">{dateFmt(map.get(a.service_id)?.starts_at)}</div></div><Badge tone={answers[a.id]==='confirmed'?'green':'rose'}>{answers[a.id]==='confirmed'?'Vou servir':'Não disponível'}</Badge></div>)}</div>
 </Modal>}
 </>;
}
export function AvailabilityPage({client,profile,availability,exceptions,onRun,busy}){
 const [form,setForm]=useState({weekday:3,start:'18:00',end:'23:00',overnight:false});
 const [exception,setException]=useState({date:'',note:''});
 const grouped=weekdays.map((day,i)=>({name:day,index:i,times:availability.filter(x=>x.weekday===i).sort((a,b)=>a.start_minute-b.start_minute)}));
 const add=async(e)=>{e.preventDefault();await onRun(async()=>{
  const start=minutes(form.start),end=minutes(form.end)+(form.overnight?1440:0);
  if(end<=start||end-start>1440)throw Error('O fim deve ser posterior ao início. Use a opção Dia seguinte para atravessar a madrugada.');
  const {error}=await client.from('availability').insert({profile_id:profile.id,weekday:Number(form.weekday),start_minute:start,end_minute:end});
  if(error)throw error;
 },'Disponibilidade adicionada.')};
 const quick=(day,start,end)=>onRun(async()=>{
  const {error}=await client.from('availability').insert({profile_id:profile.id,weekday:day,start_minute:start,end_minute:end});
  if(error)throw error;
 },'Bloco de disponibilidade adicionado.');
 const remove=(id,table)=>onRun(async()=>{const {error}=await client.from(table).delete().eq('id',id);if(error)throw error},'Registro removido.');
 const addExc=async e=>{e.preventDefault();await onRun(async()=>{
  if(!exception.date)throw Error('Escolha a data.');
  const {error}=await client.from('availability_exceptions').upsert({profile_id:profile.id,service_date:exception.date,available:false,note:exception.note},{onConflict:'profile_id,service_date'});
  if(error)throw error;
 },'Data bloqueada com sucesso.');};
 return <>
 <PageHead eyebrow="AGENDA PESSOAL" title="Minha disponibilidade" description="Seu tempo é valioso. Informe precisamente quando pode servir, inclusive em horários que atravessam a madrugada."/>
 <div className="hero mb-3"><div><div className="eyebrow">HORÁRIOS MAIS INTELIGENTES</div><h2>Você escolhe quando pode servir.</h2><p>Use blocos rápidos de 2 horas ou personalize início e fim em intervalos de 30 minutos. Pode cadastrar vários períodos no mesmo dia.</p></div><Clock3 size={70} color="#c7bfff"/></div>
 <div className="dashboard-grid">
 <div className="col-7"><Panel title="Minha semana" subtitle="Clique em um bloco para removê-lo." action={<Badge tone="purple">{availability.length} faixas</Badge>}><div className="week-list">{grouped.map(d=><div className="availability-tile" key={d.index}><div className="row spread"><strong>{d.name}</strong><span className="tiny-label">{d.times.length} períodos</span></div>{d.times.length===0?<small>Sem horário disponível</small>:<div className="week-time">{d.times.map(t=><button title="Remover período" disabled={busy} key={t.id} className="chip selected" style={{padding:'5px 8px'}} onClick={()=>remove(t.id,'availability')}>{hm(t.start_minute)} – {hm(t.end_minute)}{t.end_minute>1440?' +1':''} ×</button>)}</div>}</div>)}</div></Panel></div>
 <div className="col-5"><Panel title="Adicionar disponibilidade" subtitle="Horário personalizado"><form onSubmit={add} className="stack"><div><label>Dia da semana</label><select value={form.weekday} onChange={e=>setForm(v=>({...v,weekday:Number(e.target.value)}))}>{weekdays.map((day,i)=><option key={day} value={i}>{day}</option>)}</select></div><div className="fields"><div><label>Posso a partir de</label><input type="time" step="1800" value={form.start} onChange={e=>setForm(v=>({...v,start:e.target.value}))}/></div><div><label>Posso até</label><input type="time" step="1800" value={form.end} onChange={e=>setForm(v=>({...v,end:e.target.value}))}/></div></div><label className="option-row"><input type="checkbox" checked={form.overnight} onChange={e=>setForm(v=>({...v,overnight:e.target.checked}))}/> Termina no dia seguinte</label><Btn type="submit" icon={Plus} disabled={busy}>Adicionar horário</Btn></form><div className="divider"/><h3 className="mb-2">Blocos rápidos de 2 horas</h3><div className="week-time">{[6,8,10,12,14,16,18,20,22].map(h=><button className="chip" type="button" disabled={busy} key={h} onClick={()=>quick(Number(form.weekday),h*60,(h+2)*60)}>{String(h).padStart(2,'0')}:00 – {String((h+2)%24).padStart(2,'0')}:00</button>)}</div><p className="note mt-2">Para o bloco 22h–00h, o período termina à meia-noite do dia seguinte.</p></Panel></div>
 <div className="col-12"><Panel title="Bloquear datas específicas" subtitle="Viagens, compromissos ou imprevistos: a escala automática respeitará estes dias."><div className="dashboard-grid"><div className="col-5"><form onSubmit={addExc} className="stack"><div><label>Data indisponível</label><input required type="date" value={exception.date} onChange={e=>setException(v=>({...v,date:e.target.value}))}/></div><div><label>Observação (opcional)</label><input value={exception.note} onChange={e=>setException(v=>({...v,note:e.target.value}))} placeholder="Ex.: Viagem com a família"/></div><Btn icon={CalendarOff} type="submit" disabled={busy}>Bloquear data</Btn></form></div><div className="col-7">{exceptions.length===0?<Empty icon={CalendarDays} title="Nenhum dia bloqueado" subtitle="Inclua datas em que não poderá participar da escala."/>:<div className="stack">{exceptions.map(x=><div className="mini-summary row spread" key={x.id}><div><strong>{x.service_date}</strong><div className="tiny-label">{x.note||'Indisponível o dia inteiro'}</div></div><Btn small variant="danger" icon={Trash2} disabled={busy} onClick={()=>remove(x.id,'availability_exceptions')}>Remover</Btn></div>)}</div>}</div></div></Panel></div>
 </div>
 </>;
}
export function ProfilePage({client,profile,roles,ministries,functions,onRun,busy}){
 const [edit,setEdit]=useState({name:profile.full_name,phone:profile.phone||'',limit:profile.monthly_limit,group:profile.vocal_group||'nao_informada'});
 const [roleForm,setRoleForm]=useState({ministry:'',functionId:''});
 const save=async e=>{e.preventDefault();await onRun(async()=>{
  if(edit.name.trim().length<5)throw Error('Informe o nome completo.');
  const {error}=await client.from('profiles').update({full_name:edit.name.trim(),phone:edit.phone.trim(),monthly_limit:Number(edit.limit),vocal_group:edit.group}).eq('id',profile.id);
  if(error)throw error;
 },'Dados do perfil salvos.')};
 const request=async e=>{e.preventDefault();await onRun(async()=>{
  const {error}=await client.from('profile_roles').insert({profile_id:profile.id,ministry_id:roleForm.ministry,function_id:roleForm.functionId||null});
  if(error)throw error;setRoleForm({ministry:'',functionId:''});
 },'Nova função enviada para aprovação da liderança.')};
 const myLink=typeof window==='undefined'?'':'https://cscale-web-production.up.railway.app/voluntario/'+profile.slug;
 const copy=()=>navigator.clipboard.writeText(myLink).catch(()=>{});
 return <>
  <PageHead eyebrow="MINHA CONTA" title="Meu perfil" description="Seus dados, qualificações e link pessoal de escalas."/>
  <div className="dashboard-grid">
   <div className="col-5"><Panel title="Dados pessoais" subtitle="Informações atualizadas pelo próprio voluntário."><div className="row mb-3"><Avatar name={profile.full_name} size="large"/><div><strong style={{fontSize:16}}>{profile.full_name}</strong><div className="inline-muted">{profile.phone||'Adicione seu WhatsApp'}</div><Badge tone={profile.approved?'green':'amber'}>{profile.approved?'Cadastro aprovado':'Aguardando aprovação'}</Badge></div></div><form onSubmit={save} className="stack"><div><label>Nome completo</label><input required value={edit.name} onChange={e=>setEdit(v=>({...v,name:e.target.value}))}/></div><div><label>WhatsApp com DDD</label><input value={edit.phone} onChange={e=>setEdit(v=>({...v,phone:e.target.value}))} placeholder="(15) 99999-9999"/></div><div><label>Máximo de cultos por mês</label><input type="number" min="1" max="30" value={edit.limit} onChange={e=>setEdit(v=>({...v,limit:e.target.value}))}/></div><div><label>Grupo vocal (apenas para louvor)</label><select value={edit.group} onChange={e=>setEdit(v=>({...v,group:e.target.value}))}><option value="nao_informada">Não se aplica</option><option value="masculina">Voz masculina</option><option value="feminina">Voz feminina</option></select></div><Btn type="submit" disabled={busy}>Salvar alterações</Btn></form></Panel></div>
   <div className="col-7"><Panel title="Minha participação" subtitle="Funções e acesso individual"><div className="alert info"><ShieldCheck size={17}/><div>Seu link é pessoal, mas não dispensa autenticação. Outros voluntários só veem os nomes da equipe confirmada.</div></div><label>Seu link permanente</label><div className="mini-summary row spread mb-3"><span className="inline-muted" style={{overflowWrap:'anywhere'}}>{myLink}</span><Btn small icon={Copy} variant="secondary" onClick={copy}>Copiar</Btn></div>
    <h3 className="mb-2">Minhas funções</h3>{roles.length===0?<Empty icon={UsersRound} title="Nenhuma função escolhida" subtitle="Informe seu ministério abaixo para que a liderança aprove seu cadastro."/>:<div className="stack">{roles.map(r=><div className="mini-summary row spread" key={r.id}><div><strong>{ministries.find(m=>m.id===r.ministry_id)?.name}</strong><div className="tiny-label">{functions.find(f=>f.id===r.function_id)?.name||'Equipe geral'}</div></div><Badge tone={r.approved?'green':'amber'}>{r.approved?'Aprovada':'Aguardando'}</Badge></div>)}</div>}
    <div className="divider"/><h3 className="mb-2">Participar de outro ministério</h3><form className="stack" onSubmit={request}><div className="fields"><div><label>Ministério</label><select required value={roleForm.ministry} onChange={e=>setRoleForm({ministry:e.target.value,functionId:''})}><option value="">Selecione</option>{ministries.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div><div><label>Função</label><select value={roleForm.functionId} onChange={e=>setRoleForm(v=>({...v,functionId:e.target.value}))}><option value="">Equipe geral</option>{functions.filter(f=>f.ministry_id===roleForm.ministry).map(f=><option value={f.id} key={f.id}>{f.name}</option>)}</select></div></div><Btn type="submit" icon={Plus} disabled={busy||!roleForm.ministry}>Solicitar função</Btn></form>
   </Panel></div>
  </div>
 </>;
}
