
import test from 'node:test';
import assert from 'node:assert/strict';
import {available,draft} from '../src/lib/scheduler.js';

const service=(id,day='2030-11-06',start='20:00',end='22:00')=>({id,title:'Culto '+id,starts_at:day+'T'+start+':00-03:00',ends_at:day+'T'+end+':00-03:00',status:'published'});
const ministry=(id='m',min=1)=>({id,name:'Louvor',min_people:min,arrival_minutes:120,departure_minutes:60});
const volunteer=(id,groups=[],monthly_limit=3,intervals=[{weekday:3,start_minute:1080,end_minute:1380}])=>({id,full_name:id,approved:true,monthly_limit,vocal_group:groups[0]||'nao_informada',profile_roles:[{id:'pr'+id,ministry_id:'m',function_id:groups[1]||null,approved:true}],availability:intervals,availability_exceptions:[]});

test('disponibilidade inclui chegada e saída',()=>{
 const s=service('1');const m=ministry();
 assert.equal(available(volunteer('a'),s,m),true);
 assert.equal(available(volunteer('b',[],2,[{weekday:3,start_minute:1140,end_minute:1380}]),s,m),false);
 assert.equal(available(volunteer('c',[],2,[{weekday:3,start_minute:1080,end_minute:1320}]),s,m),false);
});
test('intervalos atravessando meia-noite são aceitos',()=>{
 const m={...ministry(),arrival_minutes:0,departure_minutes:0};
 const s=service('2','2030-11-06','22:00','23:00');
 const v=volunteer('v',[],3,[{weekday:3,start_minute:1200,end_minute:1920}]);
 assert.equal(available(v,s,m),true);
});
test('escala uma pessoa compatível',()=>{
 const s=service('1');const result=draft([s],[volunteer('a')],[ministry()],[],[]);
 assert.equal(result.assignments.length,1);
 assert.equal(result.assignments[0].profile_id,'a');
});
test('distribui entre voluntários com limite de um por mês',()=>{
 const list=[service('1'),service('2','2030-11-13')];
 const result=draft(list,[volunteer('a',[],1),volunteer('b',[],1)],[ministry()],[],[]);
 assert.equal(result.assignments.length,2);
 assert.equal(new Set(result.assignments.map(a=>a.profile_id)).size,2);
});
test('não duplica pessoa no mesmo culto',()=>{
 const m=ministry('m',2);
 const result=draft([service('1')],[volunteer('a')],[m],[],[]);
 assert.equal(result.assignments.length,1);
 assert.equal(result.missing.length,1);
});
test('respeita gênero mínimo entre quatro cantores',()=>{
 const roles=[{id:'cantor',name:'Cantor',ministry_id:'m',min_people:4}];
 const people=[
 volunteer('a',['masculina','cantor']),volunteer('b',['feminina','cantor']),
 volunteer('c',['masculina','cantor']),volunteer('d',['feminina','cantor'])
 ];
 const result=draft([service('1')],people,[ministry('m',4)],roles,[]);
 assert.equal(result.assignments.length,4);
 const chosen=result.assignments.map(a=>people.find(p=>p.id===a.profile_id)?.vocal_group);
 assert.ok(chosen.includes('masculina'));
 assert.ok(chosen.includes('feminina'));
});
