'use client';
import {useEffect,useState} from 'react';import {supabase} from '@/lib/supabase';import useUser from '@/lib/useUser';import VideoCard from '@/components/VideoCard';import Logo from '@/components/Logo';
export const Q='*,profiles(username,avatar_url),likes(count),comments(count)';
export default function Home(){const me=useUser();const [vs,setVs]=useState(null);
useEffect(()=>{supabase.from('videos').select(Q).order('created_at',{ascending:false}).limit(30).then(({data})=>setVs(data||[]))},[]);
return(<div className="relative"><div className="absolute top-3 inset-x-0 z-20 flex justify-center pointer-events-none"><Logo size={28}/></div>
<div className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory">
{vs?.map(v=><VideoCard key={v.id} v={v} me={me}/>)}
{vs&&!vs.length&&<div className="h-full grid place-items-center text-center p-8"><div><Logo size={64}/><p className="mt-4 text-white/60">Ende nuk ka video. Ngarko të parën me butonin ＋</p></div></div>}</div></div>)}
