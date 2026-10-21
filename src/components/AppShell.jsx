'use client';
import React,{useState} from 'react';
import {Church,LayoutDashboard,CalendarRange,UsersRound,UserRound,Clock3,Layers3,Settings2,LogOut,Menu,X,ChartNoAxesCombined,Bell,HeartHandshake,Shield,ArrowUpRight} from 'lucide-react';
import {Avatar,initials,dateFmt} from './ui';
const nav={
 dashboard:{title:'Visão geral',icon:LayoutDashboard},
 escalas:{title:'Escalas e cultos',icon:CalendarRange},
 equipe:{title:'Voluntários',icon:UsersRound},
 ministerios:{title:'Ministérios',icon:Layers3},
 minhas:{title:'Minhas escalas',icon:HeartHandshake},
 disponibilidade:{title:'Disponibilidade',icon:Clock3},
 perfil:{title:'Meu perfil',icon:UserRound},
 lideres:{title:'Gestão de líderes',icon:Shield}
};
export function AppShell({profile,role='volunteer',section,setSection,pending=0,signOut,children}){
 const [open,setOpen]=useState(false);
 const isAdmin=role==='pastor'||role==='leader';
 const groups=isAdmin?[{caption:'GESTÃO',items:['dashboard','escalas','equipe','ministerios',...(role==='pastor'?['lideres']:[])]},{caption:'MINHA PARTICIPAÇÃO',items:['minhas','disponibilidade','perfil']}]:[{caption:'MEU MINISTÉRIO',items:['minhas','disponibilidade','perfil']}];
 const choose=s=>{setSection(s);setOpen(false)};
 const today=dateFmt(new Date(),{weekday:'long',day:'2-digit',month:'long'});
 const isDemo=profile.church_id==='22222222-2222-4222-8222-222222222222';
 return <div className="app">
  <div className={'nav-overlay '+(open?'open':'')} onClick={()=>setOpen(false)}/>
  <aside className={'sidebar '+(open?'open':'')}>
    <div className="sidebar-header"><div className="logo-mark"><Church size={24}/></div><div><div className="logo-title">C Scale<span style={{color:'#a39dff'}}>.</span></div><div className="logo-sub">CHURCH MANAGEMENT</div></div><button className="circle-btn mobile-menu" onClick={()=>setOpen(false)} aria-label="Fechar"><X size={17}/></button></div>
    <div className="sidebar-divider"/>
    {groups.map(group=><div key={group.caption}><div className="nav-caption">{group.caption}</div>{group.items.map(id=>{const {icon:Icon,title}=nav[id];return <button key={id} className={'nav-item '+(section===id?'active':'')} onClick={()=>choose(id)}><Icon size={18} strokeWidth={1.8}/><span>{title}</span>{id==='minhas'&&pending>0&&<span className="nav-count">{pending}</span>}</button>})}</div>)}
    <div className="sidebar-spacer"/>
    <div className="sidebar-promo"><HeartHandshake size={22} color="#c5c3ff"/><strong>Servir com excelência</strong><p>Cada escala organizada, cada voluntário valorizado e cada ministério conectado.</p></div>
    <div className="sidebar-user"><Avatar name={profile.full_name} dark/><div className="text"><b>{profile.full_name}</b><small>{role==='pastor'?'Pastor · Visão geral':role==='leader'?'Liderança de ministério':'Voluntário'}</small></div><button className="circle-btn" onClick={signOut} title="Sair" style={{width:31,height:31,background:'#263653',borderColor:'#394b68',color:'#c2cfe2'}}><LogOut size={15}/></button></div>
  </aside>
  <div className="main">
    <header className="topbar"><div className="row"><button className="circle-btn mobile-menu" onClick={()=>setOpen(true)} aria-label="Abrir menu"><Menu size={19}/></button><div className="breadcrumbs"><span>{isDemo?'C Scale • Demonstração':'Lagoinha'}</span><span style={{color:'#b8c1cd'}}>/</span><b>{nav[section]?.title||'C Scale'}</b></div></div><div className="top-actions"><div className="top-date">{today.charAt(0).toUpperCase()+today.slice(1)}</div><button className="circle-btn" onClick={()=>choose('minhas')} title="Minhas convocações" style={{position:'relative'}}><Bell size={18}/>{pending>0&&<span style={{position:'absolute',right:7,top:6,width:8,height:8,background:'#e78286',borderRadius:'50%',border:'2px solid white'}}/>}</button><Avatar name={profile.full_name}/></div></header>
    <main className="content">{isDemo&&<div role="status" className="alert" style={{marginBottom:16}}>Ambiente de demonstração • Dados fictícios para testes. Nenhum voluntário real foi incluído.</div>}{children}</main>
  </div>
 </div>
}
