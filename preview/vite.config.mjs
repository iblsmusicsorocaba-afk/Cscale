import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({
 root:resolve(process.cwd(),'preview'),
 base:'/functions/v1/cscale-site/',
 define:{
  'process.env.NEXT_PUBLIC_SUPABASE_URL':JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL),
  'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY':JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
 },
 build:{outDir:resolve(process.cwd(),'dist-pages'),emptyOutDir:true,rollupOptions:{input:{home:resolve(process.cwd(),'preview/index.html'),demo:resolve(process.cwd(),'preview/demo/index.html')}}}
});
