'use client';
import React,{useState} from 'react';
import {Church,LayoutDashboard,CalendarRange,UsersRound,UserRound,Clock3,Layers3,Settings2,LogOut,Menu,X,ChartNoAxesCombined,Bell,HeartHandshake,Shield,ArrowUpRight} from 'lucide-react';
import {Avatar,initials,dateFmt} from './ui';
const nav={
 dashboard:{title:'Início',icon:LayoutDashboard},
 escalas:{title:'Escalas',icon:CalendarRange},
 equipe:{title:'Pessoas',icon:UsersRound},
 ministerios:{title:'Ministérios',icon:Layers3},
 minhas:{title:'Minhas escalas',icon:HeartHandshake},
 disponibilidade:{title:'Disponibilidade',icon:Clock3},
 perfil:{title:'Meu perfil',icon:UserRound},
 lideres:{title:'Líderes',icon:Shield}
};
export function AppShell({profile,role='volunteer',section,setSection,pending=0,signOut,children}){
 const [open,setOpen]=useState(false);
 const isAdmin=role==='pastor'||role==='leader';
 const primary=isAdmin?['dashboard','escalas','equipe']:['minhas','disponibilidade'];
 const secondary=isAdmin?['ministerios',...(role==='pastor'?['lideres']:[]),'minhas','disponibilidade','perfil']:['perfil'];
 const [showMore,setShowMore]=useState(false);
 const moreOpen=showMore||secondary.includes(section);
 const choose=s=>{setSection(s);setOpen(false)};
 const today=dateFmt(new Date(),{weekday:'long',day:'2-digit',month:'long'});
 const isDemo=profile.church_id==='22222222-2222-4222-8222-222222222222';
 return <div className="app simplified-shell">
  <div className={'nav-overlay '+(open?'open':'')} onClick={()=>setOpen(false)}/>
  <aside className={'sidebar '+(open?'open':'')}>
    <div className="sidebar-header"><div className="logo-mark"><Church size={24}/></div><div><div className="logo-title">C Scale<span style={{color:'#a39dff'}}>.</span></div><div className="logo-sub">CHURCH MANAGEMENT</div></div><button className="circle-btn mobile-menu" onClick={()=>setOpen(false)} aria-label="Fechar"><X size={17}/></button></div>
    <div className="sidebar-divider"/>
    <div className="nav-caption">{isAdmin?'PAINEL':'MEU ESPAÇO'}</div>
    {primary.map(id=>{const {icon:Icon,title}=nav[id];return <button type="button" key={id} className={'nav-item '+(section===id?'active':'')} aria-current={section===id?'page':undefined} onClick={()=>choose(id)}><Icon size={18}/><span>{title}</span>{id==='minhas'&&pending>0&&<span className="nav-count">{pending}</span>}</button>})}
    <button type="button" className={'nav-item nav-more '+(moreOpen?'more-open':'')} aria-expanded={moreOpen} onClick={()=>setShowMore(v=>!moreOpen)}><Layers3 size={18}/><span>Mais opções</span><span className="more-indicator">{moreOpen?'−':'+'}</span></button>
    {moreOpen&&<div className="nav-submenu">{secondary.map(id=>{const {icon:Icon,title}=nav[id];return <button type="button" key={id} className={'nav-item '+(section===id?'active':'')} onClick={()=>choose(id)}><Icon size={17}/><span>{title}</span>{id==='minhas'&&pending>0&&<span className="nav-count">{pending}</span>}</button>})}</div>}
    <div className="sidebar-spacer"/>
    <div className="sidebar-user"><Avatar name={profile.full_name} dark/><div className="text"><b>{profile.full_name}</b><small>{role==='pastor'?'Pastor · Visão geral':role==='leader'?'Liderança de ministério':'Voluntário'}</small></div><button className="circle-btn" onClick={signOut} title="Sair" style={{width:31,height:31,background:'#263653',borderColor:'#394b68',color:'#c2cfe2'}}><LogOut size={15}/></button></div>
  </aside>
  <div className="main">
    <header className="topbar"><div className="row"><button className="circle-btn mobile-menu" onClick={()=>setOpen(true)} aria-label="Abrir menu"><Menu size={19}/></button><div className="breadcrumbs"><span>{isDemo?'C Scale • Demonstração':'Lagoinha'}</span><span style={{color:'#b8c1cd'}}>/</span><b>{nav[section]?.title||'C Scale'}</b></div></div><div className="top-actions">{pending>0&&<button type="button" className="top-pending" onClick={()=>choose('minhas')}>{pending} {pending===1?'convite':'convites'} para responder</button>}<Avatar name={profile.full_name}/></div></header>
    <main className="content">{children}</main>
  </div>
 </div>
}
