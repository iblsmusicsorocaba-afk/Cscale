'use client';
import React from 'react';
import {Inbox,ChevronRight} from 'lucide-react';
export function initials(name=''){return (name||'?').trim().split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('')}
export const dateFmt=(date,opts={dateStyle:'medium',timeStyle:'short'})=>date?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',...opts}).format(new Date(date)):'—';
export const monthLabel=(key)=>{const [y,m]=(key||'').split('-').map(Number);if(!y||!m)return '';return new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(y,m-1,1))}
export const monthKey=(date)=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).formatToParts(new Date(date));const o=Object.fromEntries(p.map(x=>[x.type,x.value]));return o.year+'-'+o.month}
export const dayNumber=date=>dateFmt(date,{day:'2-digit'});
export const shortMonth=date=>dateFmt(date,{month:'short'}).replace('.','');
export const formatPercent=(n,d)=>d?Math.round(100*n/d):0;
export function Avatar({name,size='',dark=false}){return <div className={'avatar '+size+(dark?' dark':'')}>{initials(name)}</div>}
export function Badge({children,tone=''}){return <span className={'badge '+tone}>{children}</span>}
export function Panel({title,subtitle,action,children,className='',style}){return <section className={'panel '+className} style={style}>{(title||action)&&<div className="panel-head"><div>{title&&<h3 className="panel-title">{title}</h3>}{subtitle&&<p>{subtitle}</p>}</div>{action}</div>}{children}</section>}
export function Empty({icon:Icon=Inbox,title='Nada por aqui ainda',subtitle='Quando houver informações, elas aparecerão neste espaço.',action}){return <div className="empty"><Icon size={27} strokeWidth={1.7}/><h3>{title}</h3><p>{subtitle}</p>{action}</div>}
export function Btn({children,icon:Icon,variant='',small=false,disabled,onClick,type='button',className='',title}){return <button type={type} disabled={disabled} title={title} onClick={onClick} className={'btn '+variant+(small?' small':'')+' '+className}>{Icon&&<Icon size={small?14:16}/>} {children}</button>}
export function PageHead({eyebrow,title,description,action}){return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{action}</div>}
export function Progress({value=0,tone=''}){return <div className="bar-track"><div className={'bar-fill '+tone} style={{width:Math.max(0,Math.min(100,value))+'%'}}/></div>}
export function Modal({title,children,onClose,footer}){return <div className="modal-overlay" onClick={onClose} role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={e=>e.stopPropagation()}><div className="row spread mb-3"><h2>{title}</h2><button className="circle-btn" aria-label="Fechar" onClick={onClose}>×</button></div>{children}{footer&&<div className="modal-footer">{footer}</div>}</div></div>}
export function Metric({icon:Icon,label,value,caption,tone='purple'}){return <div className="metric-card"><div className={'metric-icon '+tone}><Icon size={20}/></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-caption">{caption}</div></div>}
export function SectionTabs({items,value,onChange}){return <div className="section-tabs">{items.map(t=><button key={t.id} type="button" onClick={()=>onChange(t.id)} className={value===t.id?'current':''}>{t.label}</button>)}</div>}
export function Route({children,className=''}){return <span className={className}><ChevronRight size={15}/>{children}</span>}
