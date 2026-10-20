
const fmt=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const parts=date=>Object.fromEntries(fmt.formatToParts(date).map(p=>[p.type,p.value]));
const stamp=p=>p.year+'-'+p.month+'-'+p.day;
const mins=p=>+p.hour*60 + +p.minute;
const weekdayIndex={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
export function available(member,service,ministry){
 const start=new Date(new Date(service.starts_at).getTime()-(ministry.arrival_minutes||0)*60000);
 const end=new Date(new Date(service.ends_at).getTime()+(ministry.departure_minutes||0)*60000);
 const a=parts(start), b=parts(end), duration=(end-start)/60000;
 if(duration<=0||duration>1440)return false;
 if((member.availability_exceptions||[]).some(x=>!x.available&&(x.service_date===stamp(a)||x.service_date===stamp(b))))return false;
 const day=weekdayIndex[a.weekday], prev=(day+6)%7,begin=mins(a);
 const windows=[...(member.availability||[]).filter(x=>x.weekday===day).map(x=>[x.start_minute,x.end_minute]),...(member.availability||[]).filter(x=>x.weekday===prev&&x.end_minute>1440).map(x=>[x.start_minute-1440,x.end_minute-1440])].sort((x,y)=>x[0]-y[0]);
 const merged=[];for(const [lo,hi] of windows){if(merged.length&&merged[merged.length-1][1]>=lo)merged[merged.length-1][1]=Math.max(hi,merged[merged.length-1][1]);else merged.push([lo,hi]);}
 return merged.some(([lo,hi])=>begin>=lo&&begin+duration<=hi);
}
export function draft(services,members,ministries,functions,existing){
 const result=[],missing=[],calendar=new Map(services.map(s=>[s.id,s])),loads=new Map();
 const month=s=>stamp(parts(new Date(s))).slice(0,7);
 const loadkey=(id,s)=>id+'_'+month(s);
 const active=existing.filter(a=>['pending','confirmed','completed'].includes(a.state));
 for(const a of active){const s=calendar.get(a.service_id);if(s){const k=loadkey(a.profile_id,s.starts_at);loads.set(k,(loads.get(k)||0)+1)}}
 const overlaps=(id,service,ministry)=>[...active,...result].some(a=>{
  if(a.profile_id!==id||a.service_id===service.id)return false;
  const other=calendar.get(a.service_id),m=ministries.find(x=>x.id===a.ministry_id);if(!other||!m)return false;
  const start=new Date(service.starts_at).getTime()-(ministry.arrival_minutes||0)*60000,end=new Date(service.ends_at).getTime()+(ministry.departure_minutes||0)*60000;
  const ostart=new Date(other.starts_at).getTime()-(m.arrival_minutes||0)*60000,oend=new Date(other.ends_at).getTime()+(m.departure_minutes||0)*60000;
  return start<oend && ostart<end;
 });
 for(const service of [...services].sort((a,b)=>a.starts_at.localeCompare(b.starts_at))){
  if(['cancelled','completed'].includes(service.status)||new Date(service.starts_at).getTime()<Date.now())continue;
  const busy=new Set(existing.filter(a=>a.service_id===service.id&&a.state!=='cancelled').map(a=>a.profile_id));
  for(const ministry of ministries){
   const subs=functions.filter(f=>f.ministry_id===ministry.id);
   const needs=subs.length?subs.map(f=>({id:f.id,label:f.name,count:f.min_people})):[{id:null,label:ministry.name,count:ministry.min_people}];
   for(const need of needs){
    const pre=active.filter(a=>a.service_id===service.id&&a.ministry_id===ministry.id&&a.function_id===need.id);
    for(let n=pre.length;n<need.count;n++){
     const selected=[...pre,...result.filter(a=>a.service_id===service.id&&a.function_id===need.id)];
     const singerGroups=selected.map(x=>members.find(m=>m.id===x.profile_id)?.vocal_group);
     const required=need.label==='Cantor'?(!singerGroups.includes('masculina')?'masculina':!singerGroups.includes('feminina')?'feminina':null):null;
     const eligible=members.filter(m=>m.approved&&(!required||m.vocal_group===required)&&!busy.has(m.id)&&!overlaps(m.id,service,ministry)&& (loads.get(loadkey(m.id,service.starts_at))||0)<m.monthly_limit&&(m.profile_roles||[]).some(r=>r.approved&&r.ministry_id===ministry.id&&(!need.id||r.function_id===need.id))&&available(m,service,ministry));
     eligible.sort((a,b)=>(loads.get(loadkey(a.id,service.starts_at))||0)-(loads.get(loadkey(b.id,service.starts_at))||0)||a.full_name.localeCompare(b.full_name));
     const pick=eligible[0];if(!pick){missing.push(service.title+' • '+need.label);continue}
     const k=loadkey(pick.id,service.starts_at);loads.set(k,(loads.get(k)||0)+1);
     busy.add(pick.id);result.push({service_id:service.id,profile_id:pick.id,ministry_id:ministry.id,function_id:need.id,state:'pending'});
    }
   }
  }
 }
 return {assignments:result,missing};
}
