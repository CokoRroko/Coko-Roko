'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';import {supabase} from '@/lib/supabase';
export default function Search(){const [q,setQ]=useState(''),[us,setUs]=useState([]),[top,setTop]=useState([]);
useEffect(()=>{supabase.from('videos').select('*,likes(count)').order('created_at',{ascending:false}).limit(60).then(({data})=>setTop((data||[]).sort((a,b)=>b.likes[0].count-a.likes[0].count).slice(0,18)))},[]);
useEffect(()=>{if(!q.trim())return setUs([]);supabase.from('profiles').select('*').ilike('username',`%${q}%`).limit(20).then(({data})=>setUs(data||[]))},[q]);
return(<div className="p-4 space-y-4"><input className="inp" placeholder="Kërko përdorues..." value={q} onChange={e=>setQ(e.target.value)}/>
{us.map(u=><Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-3 p-2 rounded-xl bg-card"><img src={u.avatar_url||'/avatar.svg'} className="w-10 h-10 rounded-full bg-white/10 object-cover"/>@{u.username}</Link>)}
<h2 className="font-bold text-lg">🔥 Më të popullarizuarat</h2>
<div className="grid grid-cols-3 gap-1">{top.map(v=><Link key={v.id} href={`/profile/${v.user_id}`} className="relative aspect-[9/16] bg-card">
<video src={v.url} preload="metadata" muted className="w-full h-full object-cover"/><span className="absolute bottom-1 left-1 text-xs">❤️ {v.likes[0].count}</span></Link>)}</div></div>)}
