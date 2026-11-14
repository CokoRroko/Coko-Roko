'use client';
import {useState} from 'react';import {supabase} from '@/lib/supabase';import Logo from '@/components/Logo';
export default function Login(){const [reg,setReg]=useState(false),[email,setE]=useState(''),[pw,setP]=useState(''),[un,setU]=useState(''),[msg,setM]=useState('');
async function go(e){e.preventDefault();setM('');
const r=reg?await supabase.auth.signUp({email,password:pw,options:{data:{username:un||email.split('@')[0]}}}):await supabase.auth.signInWithPassword({email,password:pw});
if(r.error)return setM(r.error.message);if(reg&&!r.data.session)return setM('Kontrollo email-in për të konfirmuar llogarinë.');location.href='/'}
return(<form onSubmit={go} className="p-8 pt-24 space-y-4"><div className="flex justify-center mb-6"><Logo size={56}/></div>
{reg&&<input className="inp" placeholder="Emri i përdoruesit" value={un} onChange={e=>setU(e.target.value)} required/>}
<input className="inp" type="email" placeholder="Email" value={email} onChange={e=>setE(e.target.value)} required/>
<input className="inp" type="password" placeholder="Fjalëkalimi (min. 6)" minLength={6} value={pw} onChange={e=>setP(e.target.value)} required/>
{msg&&<p className="text-sm text-sun">{msg}</p>}<button className="btn w-full">{reg?'Regjistrohu':'Hyr'}</button>
<button type="button" onClick={()=>setReg(!reg)} className="w-full text-sm text-white/60">{reg?'Ke llogari? Hyr':'Nuk ke llogari? Regjistrohu'}</button></form>)}
