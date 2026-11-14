'use client';
import Link from 'next/link';import {usePathname} from 'next/navigation';
const T=[['/','🏠','Home'],['/search','🔍','Search'],['/create','＋','Create'],['/inbox','💬','Inbox'],['/profile/me','👤','Profile']];
export default function Nav(){const p=usePathname();if(p==='/login')return null;
return(<nav className="fixed bottom-0 inset-x-0 z-50 bg-ink/90 backdrop-blur border-t border-white/10 flex justify-around items-center h-16 md:max-w-md md:mx-auto">
{T.map(([h,i,l])=>h==='/create'?<Link key={h} href={h} className="btn !px-5 !py-1 text-2xl">{i}</Link>:
<Link key={h} href={h} className={`flex flex-col items-center text-xs ${p===h?'text-brand':'text-white/60'}`}><span className="text-xl">{i}</span>{l}</Link>)}</nav>)}
