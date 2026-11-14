'use client';
import {useEffect,useRef,useState} from 'react';import Link from 'next/link';import {supabase} from '@/lib/supabase';
export default function VideoCard({v,me}){
const ref=useRef();const [liked,setLiked]=useState(false),[n,setN]=useState(v.likes[0].count),[open,setOpen]=useState(false),[cs,setCs]=useState([]),[t,setT]=useState(''),[fol,setFol]=useState(false);
useEffect(()=>{const o=new IntersectionObserver(([e])=>{e.isIntersecting?ref.current.play().catch(()=>{}):ref.current.pause()},{threshold:.7});o.observe(ref.current);return()=>o.disconnect()},[]);
useEffect(()=>{if(!me)return;
supabase.from('likes').select('video_id').match({video_id:v.id,user_id:me.id}).then(({data})=>setLiked(!!data?.length));
supabase.from('follows').select('follower_id').match({follower_id:me.id,following_id:v.user_id}).then(({data})=>setFol(!!data?.length))},[me]);
const need=()=>{if(!me){location.href='/login';return true}};
async function like(){if(need())return;const k={user_id:me.id,video_id:v.id};
if(liked){await supabase.from('likes').delete().match(k);setN(n-1)}else{await supabase.from('likes').insert(k);setN(n+1)}setLiked(!liked)}
async function follow(){if(need())return;const k={follower_id:me.id,following_id:v.user_id};
if(fol)await supabase.from('follows').delete().match(k);else await supabase.from('follows').insert(k);setFol(!fol)}
async function loadC(){setOpen(true);const {data}=await supabase.from('comments').select('*,profiles(username)').eq('video_id',v.id).order('created_at');setCs(data||[])}
async function send(e){e.preventDefault();if(need()||!t.trim())return;await supabase.from('comments').insert({user_id:me.id,video_id:v.id,body:t});setT('');loadC()}
async function share(){const url=`${location.origin}/profile/${v.user_id}`;if(navigator.share)navigator.share({title:'CoKo Rroco',text:v.caption,url});else{await navigator.clipboard.writeText(url);alert('Linku u kopjua!')}}
const A=({on,i,l})=><button onClick={on} className="flex flex-col items-center text-xs gap-1"><span className="text-3xl drop-shadow">{i}</span>{l}</button>;
return(<section className="relative h-[100dvh] snap-start bg-black">
<video ref={ref} src={v.url} loop playsInline muted className="h-full w-full object-cover" onClick={e=>{e.target.muted=false;e.target.paused?e.target.play():e.target.pause()}}/>
<div className="absolute right-3 bottom-28 flex flex-col gap-5 items-center">
<A on={like} i={liked?'❤️':'🤍'} l={n}/><A on={loadC} i="💬" l={v.comments[0].count}/><A on={share} i="↗️" l="Ndaj"/></div>
<div className="absolute left-4 bottom-24 right-20 bg-gradient-to-t from-black/60 p-2 rounded">
<div className="flex items-center gap-3"><Link href={`/profile/${v.user_id}`} className="font-bold">@{v.profiles.username}</Link>
{me?.id!==v.user_id&&<button onClick={follow} className={`text-xs px-3 py-1 rounded-full border ${fol?'border-white/40':'bg-brand border-brand'}`}>{fol?'Following':'Follow'}</button>}</div>
<p className="text-sm mt-1">{v.caption}</p></div>
{open&&<div className="absolute inset-x-0 bottom-0 h-3/5 bg-card rounded-t-3xl p-4 flex flex-col z-10">
<div className="flex justify-between mb-2"><b>Komente</b><button onClick={()=>setOpen(false)}>✕</button></div>
<div className="flex-1 overflow-y-auto space-y-2">{cs.map(c=><p key={c.id} className="text-sm"><b>@{c.profiles.username}</b> {c.body}</p>)}{!cs.length&&<p className="text-white/50 text-sm">Asnjë koment ende.</p>}</div>
<form onSubmit={send} className="flex gap-2 mt-2 mb-14"><input className="inp" value={t} onChange={e=>setT(e.target.value)} placeholder="Shto koment..."/><button className="btn">↑</button></form></div>}
</section>)}
