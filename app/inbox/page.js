'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';import {supabase} from '@/lib/supabase';import useUser from '@/lib/useUser';
const TX={like:'ka pëlqyer videon tënde',comments:'ka komentuar videon tënde',follow:'të ndoqi'};
export default function Inbox(){const me=useUser();const [tab,setTab]=useState('n'),[ns,setNs]=useState([]),[cv,setCv]=useState([]);
useEffect(()=>{if(me===null)location.href='/login';if(!me)return;
supabase.from('notifications').select('*,profiles!notifications_actor_id_fkey(username)').order('created_at',{ascending:false}).limit(50).then(({data})=>setNs(data||[]));
supabase.from('messages').select('*,s:profiles!messages_sender_id_fkey(id,username),r:profiles!messages_receiver_id_fkey(id,username)').order('created_at',{ascending:false}).limit(200).then(({data})=>{const m=new Map();(data||[]).forEach(x=>{const o=x.sender_id===me.id?x.r:x.s;if(!m.has(o.id))m.set(o.id,{o,last:x.body})});setCv([...m.values()])})},[me]);
return(<div className="p-4"><div className="flex gap-2 mb-4">{[['n','Njoftime'],['m','Mesazhe']].map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`px-4 py-1 rounded-full ${tab===k?'bg-brand':'bg-card'}`}>{l}</button>)}</div>
{tab==='n'?<div className="space-y-2">{ns.map(n=><Link key={n.id} href={`/profile/${n.actor_id}`} className="block p-3 rounded-xl bg-card text-sm"><b>@{n.profiles.username}</b> {TX[n.type]}</Link>)}{!ns.length&&<p className="text-white/50">Asnjë njoftim.</p>}</div>
:<div className="space-y-2">{cv.map(c=><Link key={c.o.id} href={`/chat/${c.o.id}`} className="block p-3 rounded-xl bg-card"><b>@{c.o.username}</b><p className="text-sm text-white/60 truncate">{c.last}</p></Link>)}{!cv.length&&<p className="text-white/50">Asnjë bisedë. Hap një profil dhe shtyp "Mesazh".</p>}</div>}</div>)}
