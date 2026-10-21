import React from 'react';
import {createRoot} from 'react-dom/client';
import CScaleApp from '../src/components/CScaleApp.jsx';
import DemoPortal from '../src/components/DemoPortal.jsx';
import '../src/app/globals.css';
const isDemo=/\/demo\/?$/.test(window.location.pathname);
document.addEventListener('click',e=>{const a=e.target.closest?.('a[href="/demo"],a[href="/"]');if(!a||!window.location.hostname.endsWith('.github.io'))return;e.preventDefault();window.location.assign(a.getAttribute('href')==='/demo'?'/Cscale/demo/':'/Cscale/')});
createRoot(document.getElementById('root')).render(<React.StrictMode>{isDemo?<DemoPortal/>:<CScaleApp/>}</React.StrictMode>);
