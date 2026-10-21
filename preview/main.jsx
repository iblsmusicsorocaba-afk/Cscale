import React from 'react';
import {createRoot} from 'react-dom/client';
import CScaleApp from '../src/components/CScaleApp.jsx';
import DemoPortal from '../src/components/DemoPortal.jsx';
import '../src/app/globals.css';
const isDemo=/\/demo\/?$/.test(window.location.pathname);
document.addEventListener('click',e=>{const a=e.target.closest?.('a[href="/demo"],a[href="/"]');if(!a)return;const base=window.location.pathname.startsWith('/functions/v1/cscale-site')?'/functions/v1/cscale-site':window.location.hostname.endsWith('.github.io')?'/Cscale':null;if(!base)return;e.preventDefault();window.location.assign(base+(a.getAttribute('href')==='/demo'?'/demo/':'/'))});
createRoot(document.getElementById('root')).render(<React.StrictMode>{isDemo?<DemoPortal/>:<CScaleApp/>}</React.StrictMode>);
