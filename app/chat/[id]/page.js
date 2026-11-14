'use client';
import {useEffect,useRef,useState} from 'react';import {useParams} from 'next/navigation';import {supabase} from '@/lib/supabase';import useUser from '@/lib/useUser';
export default function Chat(){const {id}=useParams();const me=useUser();const [ms,setMs]=useState([]),[t,setT]=useState(''),end=useRef();
useEffect(()=>{if(me===null)location.href='/login';if(!me)return;
const mine=m=>(m.sender_id===me.id&&m.receiver_id===id)||(m.sender_id===id&&m.receiver_id===me.id);
supabase.from('messages').select('*').or(`and(sender_id.eq.${me.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${me.id})`).order('created_at').then(({data})=>setMs(data||[]));
const ch=supabase.channel('m'+id+me.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},p=>{if(mine(p.new))setMs(x=>x.some(y=>y.id===p.new.id)?x:[...x,p.new])}).subscribe();return()=>supabase.removeChannel(ch)},[me,id]);
useEffect(()=>end.current?.scrollIntoView(),[ms]);
async function send(e){e.preventDefault();if(!t.trim())return;const {data}=await supabase.from('messages').insert({sender_id:me.id,receiver_id:id,body:t}).select().single();if(data)setMs(x=>x.some(y=>y.id===data.id)?x:[...x,data]);setT('')}
return(<div className="flex flex-col h-[calc(100dvh-4rem)]"><div className="flex-1 overflow-y-auto p-4 space-y-2">{ms.map(m=><div key={m.id} className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${m.sender_id===me?.id?'ml-auto bg-gradient-to-r from-brand to-sun text-black':'bg-card'}`}>{m.body}</div>)}<div ref={end}/></div>
<form onSubmit={send} className="flex gap-2 p-3"><input className="inp" value={t} onChange={e=>setT(e.target.value)} placeholder="Shkruaj mesazh..."/><button className="btn">↑</button></form></div>)}
