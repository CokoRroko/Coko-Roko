'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function A({ on, i, l }) {
  return (
    <button onClick={on} className="flex flex-col items-center text-xs gap-1">
      <span className="text-3xl drop-shadow">{i}</span>
      {l}
    </button>
  );
}

export default function VideoCard({ v, me }) {
  const ref = useRef();
  const counted = useRef(false);
  const [liked, setLiked] = useState(false);
  const [n, setN] = useState(v.likes?.[0]?.count || 0);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);
  const [cs, setCs] = useState([]);
  const [t, setT] = useState('');
  const [fol, setFol] = useState(false);
  const [views, setViews] = useState(v.views || 0);

  useEffect(() => {
    let timer;
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          ref.current.play().catch(() => {});
          // numërohet një shikim pasi videoja shihet 2 sekonda
          if (!counted.current) {
            timer = setTimeout(async () => {
              counted.current = true;
              setViews((x) => x + 1);
              await supabase.rpc('increment_views', { vid: v.id });
            }, 2000);
          }
        } else {
          ref.current.pause();
          clearTimeout(timer);
        }
      },
      { threshold: 0.7 }
    );
    o.observe(ref.current);
    return () => {
      clearTimeout(timer);
      o.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!me) return;
    supabase
      .from('likes')
      .select('video_id')
      .match({ video_id: v.id, user_id: me.id })
      .then(({ data }) => setLiked(!!data?.length));
    supabase
      .from('follows')
      .select('follower_id')
      .match({ follower_id: me.id, following_id: v.user_id })
      .then(({ data }) => setFol(!!data?.length));
    supabase
      .from('saves')
      .select('video_id')
      .match({ video_id: v.id, user_id: me.id })
      .then(({ data }) => setSaved(!!data?.length));
  }, [me]);

  const need = () => {
    if (!me) {
      location.href = '/login';
      return true;
    }
  };

  async function like() {
    if (need()) return;
    const k = { user_id: me.id, video_id: v.id };
    if (liked) {
      await supabase.from('likes').delete().match(k);
      setN(n - 1);
    } else {
      await supabase.from('likes').insert(k);
      setN(n + 1);
    }
    setLiked(!liked);
  }

  async function save() {
    if (need()) return;
    const k = { user_id: me.id, video_id: v.id };
    if (saved) await supabase.from('saves').delete().match(k);
    else await supabase.from('saves').insert(k);
    setSaved(!saved);
  }

  async function follow() {
    if (need()) return;
    const k = { follower_id: me.id, following_id: v.user_id };
    if (fol) await supabase.from('follows').delete().match(k);
    else await supabase.from('follows').insert(k);
    setFol(!fol);
  }

  async function loadC() {
    setOpen(true);
    const { data } = await supabase
      .from('comments')
      .select('*,profiles(username)')
      .eq('video_id', v.id)
      .order('created_at');
    setCs(data || []);
  }

  async function send(e) {
    e.preventDefault();
    if (need() || !t.trim()) return;
    await supabase.from('comments').insert({ user_id: me.id, video_id: v.id, body: t });
    setT('');
    loadC();
  }

  async function share() {
    const url = `${location.origin}/video/${v.id}`;
    if (navigator.share) {
      navigator.share({ title: 'CoKo Rroco', text: v.caption, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Linku u kopjua!');
    }
  }

  return (
    <section className="relative isolate h-[100dvh] w-full snap-start overflow-hidden bg-black">
      <video
        ref={ref}
        src={v.url}
        loop
        playsInline
        muted
        className="absolute inset-0 z-0 h-full w-full object-cover"
        onClick={(e) => {
          e.target.muted = false;
          e.target.paused ? e.target.play() : e.target.pause();
        }}
      />

      {/* Kolona djathtas: profili, like, komente, ruaj, share */}
      <div className="absolute right-3 bottom-28 z-30 flex flex-col items-center gap-5 text-white">
        <div className="relative mb-2">
          <Link href={`/profile/${v.user_id}`}>
            {v.profiles?.avatar_url ? (
              <img
                src={v.profiles.avatar_url}
                alt=""
                className="h-12 w-12 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-card text-lg font-bold">
                {(v.profiles?.username || '?')[0].toUpperCase()}
              </div>
            )}
          </Link>
          {me?.id !== v.user_id && !fol && (
            <button
              onClick={follow}
              className="absolute -bottom-2 left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full bg-brand text-xs font-bold"
            >
              +
            </button>
          )}
        </div>
<A on={like} i={liked ? '❤️' : '🤍'} l={n} />
<A on={loadC} i="💬" l={v.comments?.[0]?.count || 0} />
<A on={() => {}} i="👁" l={views} />
<A on={save} i={saved ? '🔖' : '📑'} l={saved ? 'Ruajtur' : 'Ruaj'} />
<A on={share} i="↗️" l="Ndaj" />
      
      </div>

      {/* Emri, follow, përshkrimi dhe shikimet poshtë majtas */}
      <div className="absolute left-4 bottom-28 right-20 z-30 rounded bg-gradient-to-t from-black/60 p-2 text-white">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${v.user_id}`} className="font-bold">
            @{v.profiles?.username}
          </Link>
          {me?.id !== v.user_id && (
            <button
              onClick={follow}
              className={`rounded-full border px-3 py-1 text-xs ${
                fol ? 'border-white/40' : 'bg-brand border-brand'
              }`}
            >
              {fol ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        <p className="mt-1 text-sm">{v.caption}</p>
        <p className="mt-1 text-xs text-white/70">👁 {views} shikime</p>
      </div>

      {open && (
        <div className="absolute inset-x-0 bottom-0 z-40 flex h-3/5 flex-col rounded-t-3xl bg-card p-4 text-white">
          <div className="mb-2 flex justify-between">
            <b>Komente</b>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {cs.map((c) => (
              <p key={c.id} className="text-sm">
                <b>@{c.profiles?.username}</b> {c.body}
              </p>
            ))}
            {!cs.length && <p className="text-sm text-white/50">Asnjë koment ende.</p>}
          </div>
          <form onSubmit={send} className="mb-14 mt-2 flex gap-2">
            <input
              className="inp"
              value={t}
              onChange={(e) => setT(e.target.value)}
              placeholder="Shto koment..."
            />
            <button className="btn">↑</button>
          </form>
        </div>
      )}
    </section>
  );
}
