'use client';
import {useEffect,useState} from 'react';import {useParams} from 'next/navigation';import Link from 'next/link';import {supabase} from '@/lib/supabase';import useUser from '@/lib/useUser';
export default function Profile(){const {id:pid}=useParams();const me=useUser();const id=pid==='me'?me?.id:pid;
const [p,setP]=useState(null),[vs,setVs]=useState([]),[c,setC]=useState({f:0,g:0}),[fol,setFol]=useState(false),[ed,setEd]=useState(false),[form,setForm]=useState({});
const isMe=me?.id===id;
async function load(){const [a,b,f1,f2]=await Promise.all([supabase.from('profiles').select('*').eq('id',id).single(),supabase.from('videos').select('*,likes(count)').eq('user_id',id).order('created_at',{ascending:false}),
supabase.from('follows').select('*',{count:'exact',head:true}).eq('following_id',id),supabase.from('follows').select('*',{count:'exact',head:true}).eq('follower_id',id)]);
setP(a.data);setForm(a.data||{});setVs(b.data||[]);setC({f:f1.count||0,g:f2.count||0});
if(me&&me.id!==id){const {data}=await supabase.from('follows').select('*').match({follower_id:me.id,following_id:id});setFol(!!data?.length)}}
useEffect(()=>{if(pid==='me'&&me===null)location.href='/login';if(id)load()},[id,me]);
async function follow(){if(!me)return location.href='/login';const k={follower_id:me.id,following_id:id};if(fol)await supabase.from('follows').delete().match(k);else await supabase.from('follows').insert(k);load()}
async function save(e){e.preventDefault();let avatar_url=form.avatar_url;if(form.file){const path=`${me.id}/avatar-${Date.now()}`;await supabase.storage.from('avatars').upload(path,form.file);avatar_url=supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}
await supabase.from('profiles').update({username:form.username,bio:form.bio,avatar_url}).eq('id',id);setEd(false);load()}
if(!p)return<p className="p-8 text-white/50">Po ngarkohet...</p>;
return(<div className="p-4"><div className="flex flex-col items-center gap-2 pt-4">
<img src={p.avatar_url||'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E'} className="w-24 h-24 rounded-full bg-gradient-to-br from-violet to-brand object-cover"/>
<h1 className="text-xl font-bold">@{p.username}</h1><p className="text-white/70 text-sm text-center">{p.bio}</p>
<div className="flex gap-6 text-center text-sm"><div><b>{c.g}</b><br/>Ndjek</div><div><b>{c.f}</b><br/>Ndjekës</div><div><b>{vs.reduce((s,v)=>s+v.likes[0].count,0)}</b><br/>Pëlqime</div></div>
{isMe?<div className="flex gap-2"><button className="btn" onClick={()=>setEd(!ed)}>Ndrysho profilin</button><button className="rounded-full px-5 py-2 bg-card" onClick={async()=>{await supabase.auth.signOut();location.href='/login'}}>Dil</button></div>
:<div className="flex gap-2"><button className="btn" onClick={follow}>{fol?'Unfollow':'Follow'}</button><Link href={`/chat/${id}`} className="rounded-full px-5 py-2 bg-card">Mesazh</Link></div>}</div>
{ed&&<form onSubmit={save} className="space-y-3 my-4"><input className="inp" value={form.username||''} onChange={e=>setForm({...form,username:e.target.value})}/><textarea className="inp" placeholder="Përshkrimi" value={form.bio||''} onChange={e=>setForm({...form,bio:e.target.value})}/>
<input type="file" accept="image/*" onChange={e=>setForm({...form,file:e.target.files[0]})}/><button className="btn w-full">Ruaj</button></form>}
<div className="grid grid-cols-3 gap-1 mt-6">{vs.map(v=><div key={v.id} className="relative aspect-[9/16] bg-card"><video src={v.url} preload="metadata" controls className="w-full h-full object-cover"/><span className="absolute top-1 left-1 text-xs pointer-events-none">❤️ {v.likes[0].count}</span></div>)}</div></div>)}
