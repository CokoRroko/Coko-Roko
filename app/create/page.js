'use client';
import {useState} from 'react';import {supabase} from '@/lib/supabase';import useUser from '@/lib/useUser';
export default function Create(){const me=useUser();const [f,setF]=useState(null),[cap,setC]=useState(''),[busy,setB]=useState(false),[err,setErr]=useState('');
if(me===null){location.href='/login';return null}
async function up(e){e.preventDefault();if(!f)return;setB(true);setErr('');
const path=`${me.id}/${Date.now()}.${f.name.split('.').pop()}`;
const {error}=await supabase.storage.from('videos').upload(path,f,{contentType:f.type});if(error){setB(false);return setErr(error.message)}
const {data}=supabase.storage.from('videos').getPublicUrl(path);
const r=await supabase.from('videos').insert({user_id:me.id,url:data.publicUrl,caption:cap});setB(false);if(r.error)return setErr(r.error.message);location.href='/'}
return(<form onSubmit={up} className="p-6 space-y-4"><h1 className="text-2xl font-bold">Krijo video</h1>
<label className="block border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer">{f?f.name:'📹 Regjistro ose zgjidh video'}
<input type="file" accept="video/*" capture="user" hidden onChange={e=>setF(e.target.files[0])}/></label>
{f&&<video src={URL.createObjectURL(f)} controls className="w-full rounded-xl max-h-72"/>}
<textarea className="inp" placeholder="Përshkrimi..." value={cap} onChange={e=>setC(e.target.value)}/>
{err&&<p className="text-sun text-sm">{err}</p>}<button disabled={busy||!f} className="btn w-full disabled:opacity-40">{busy?'Po ngarkohet...':'Publiko'}</button></form>)}
