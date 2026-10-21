
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const roster=JSON.parse(await readFile(new URL('../fixtures/demo-roster.json',import.meta.url),'utf8'));
test('roster tem 73 pessoas fictícias sem dados sensíveis',()=>{
 assert.equal(roster.length,73);
 assert.equal(new Set(roster.map(r=>r.email)).size,roster.length);
 assert.ok(roster.every(r=>r.email.endsWith('@cscale-demo.test')));
 assert.ok(roster.every(r=>!Object.hasOwn(r,'password')&&!Object.hasOwn(r,'phone')));
});
test('possui pastor e líderes de louvor, mídia e diaconato',()=>{
 assert.equal(roster.filter(r=>r.kind==='pastor').length,1);
 assert.deepEqual(new Set(roster.filter(r=>r.kind==='leader').map(r=>r.ministry)),new Set(['louvor','midia','diaconato']));
});
test('possui os cinco instrumentos e quatro cantores da banda',()=>{
 const music=roster.filter(r=>r.ministry==='louvor'&&r.kind==='volunteer');
 for(const instrument of ['Bateria','Guitarra','Baixo','Violão','Teclado'])
  assert.ok(music.some(p=>p.role===instrument),'Instrumento faltando: '+instrument);
 assert.ok(music.filter(p=>p.role==='Cantor').length>=4);
 assert.ok(music.filter(p=>p.role==='Cantor').some(p=>p.vocal_group==='feminina'));
 assert.ok(music.filter(p=>p.role==='Cantor').some(p=>p.vocal_group==='masculina'));
});
test('equipes cadastradas em 10 ministérios',()=>{
 const expected=['staff','midia','sonoplastia','projecao','cozinha','louvor','diaconato','enfermaria','intercessao','consolidacao'];
 assert.deepEqual(new Set(roster.filter(p=>p.kind==='volunteer').map(p=>p.ministry)),new Set(expected));
 assert.ok(roster.filter(p=>p.ministry==='diaconato').length>=15);
});
