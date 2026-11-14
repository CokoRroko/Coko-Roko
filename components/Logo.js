export default function Logo({size=36,text=true}){return(<span className="inline-flex items-center gap-2 font-extrabold">
<svg width={size} height={size} viewBox="0 0 48 48"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7c3aed"/><stop offset=".55" stopColor="#ff4d6d"/><stop offset="1" stopColor="#ffb703"/></linearGradient></defs>
<rect width="48" height="48" rx="14" fill="url(#g)"/><path d="M30 14a11 11 0 1 0 0 20" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none"/><path d="M24 19l10 5-10 5z" fill="#fff"/></svg>
{text&&<span className="text-xl bg-gradient-to-r from-brand to-sun bg-clip-text text-transparent">CoKo Rroco</span>}</span>)}
