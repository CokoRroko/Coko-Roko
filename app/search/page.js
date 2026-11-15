'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const fmt = (n) => {
  n = n || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.0', '') + 'K';
  return String(n);
};

export default function Search() {
  const [q, setQ] = useState('');
  const [us, setUs] = useState([]);
  const [top, setTop] = useState([]);

  useEffect(() => {
    supabase
      .from('videos')
      .select('*,likes(count)')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        const sorted = (data || [])
          .map((v) => ({ ...v, likeCount: v.likes?.[0]?.count ?? 0 }))
          .sort((a, b) => b.likeCount - a.likeCount)
          .slice(0, 18);
        setTop(sorted);
      });
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setUs([]);
      return;
    }
    const t = setTimeout(() => {
      supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${q.trim()}%`)
        .limit(20)
        .then(({ data }) => setUs(data || []));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="p-4 space-y-4">
      <input
        className="inp"
        placeholder="Kërko përdorues..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {us.map((u) => (
        <Link
          key={u.id}
          href={`/profile/${u.id}`}
          className="flex items-center gap-3 p-2 rounded-xl bg-card"
        >
          <img
            src={u.avatar_url || '/avatar.svg'}
            alt=""
            className="w-10 h-10 rounded-full bg-white/10 object-cover"
          />
          @{u.username}
        </Link>
      ))}

      <h2 className="font-bold text-lg">🔥 Më të popullarizuarat</h2>

      <div className="grid grid-cols-3 gap-1">
        {top.map((v) => (
          <Link
            key={v.id}
            href={`/video/${v.id}`}
            className="relative aspect-[9/16] bg-card overflow-hidden"
          >
            <video
              src={v.url}
              preload="metadata"
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-between items-center px-1.5 pb-1 pt-4 text-xs font-semibold bg-gradient-to-t from-black/70 to-transparent">
              <span>👁 {fmt(v.views)}</span>
              <span>❤️ {fmt(v.likeCount)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
