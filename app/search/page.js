'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const fmt = (n) => {
  n = Number(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.0', '') + 'K';
  return String(n);
};

export default function Search() {
  const [q, setQ] = useState('');
  const [us, setUs] = useState([]);
  const [top, setTop] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Videot më të popullarizuara
  useEffect(() => {
    let alive = true;
    supabase
      .from('videos')
      .select('*,likes(count)')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (!alive) return;
        const sorted = (data || [])
          .map((v) => ({ ...v, likeCount: v.likes?.[0]?.count ?? 0 }))
          .sort(
            (a, b) =>
              b.likeCount - a.likeCount ||
              (Number(b.views) || 0) - (Number(a.views) || 0)
          )
          .slice(0, 18);
        setTop(sorted);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Kërkimi i përdoruesve
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setUs([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    let alive = true;
    const t = setTimeout(() => {
      supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${term}%`)
        .limit(20)
        .then(({ data }) => {
          if (!alive) return;
          setUs(data || []);
          setSearching(false);
        });
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  const hasQuery = q.trim().length > 0;

  return (
    <div className="p-4 space-y-4 pb-24">
      <input
        className="inp"
        placeholder="Kërko përdorues..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {hasQuery && (
        <div className="space-y-2">
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
              <span className="font-semibold">@{u.username}</span>
            </Link>
          ))}
          {!searching && us.length === 0 && (
            <p className="text-sm text-white/50">
              Nuk u gjet asnjë përdorues.
            </p>
          )}
        </div>
      )}

      <h2 className="font-bold text-lg">🔥 Më të popullarizuarat</h2>

      {loading ? (
        <p className="text-sm text-white/50">Duke ngarkuar...</p>
      ) : top.length === 0 ? (
        <p className="text-sm text-white/50">Ende nuk ka video.</p>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {top.map((v) => (
            <Link
              key={v.id}
              href={`/video/${v.id}`}
              className="relative aspect-[9/16] bg-card overflow-hidden"
            >
              <video
                src={`${v.url}#t=0.1`}
                poster={v.thumbnail_url || undefined}
                preload="metadata"
                muted
                playsInline
                className="w-full h-full object-cover pointer-events-none"
              />
              <span className="absolute top-1 left-1 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
                ❤️ {fmt(v.likeCount)}
              </span>
              <span className="absolute bottom-1 left-1 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
                👁 {fmt(v.views)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
