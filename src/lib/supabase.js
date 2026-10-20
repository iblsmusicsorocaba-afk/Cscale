
import {createClient} from '@supabase/supabase-js';
let instance;
export const CHURCH='11111111-1111-4111-8111-111111111111';
export function db(){
 if(!instance){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw new Error('Supabase não configurado');
  instance=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 }
 return instance;
}
