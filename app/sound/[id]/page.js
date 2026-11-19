'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import useUser from '@/lib/useUser';

const fmt = (n) => {
  n = Number(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.0', '') + 'K';
  return String(n);
};

export default function SoundPage() {
  const { id } = useParams();
  const me = useUser();
  const [s, setS] = useState(null);
  const [vs, setVs] = useState([]);
  const [fol, setFol] = useState(false);
  const [missing, setMissing] = useState(false);

  async function load() {
    const { data: snd } = await supabase
      .from('sounds')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!snd) {
      setMissing(true);
      return;
    }

    const ownerId = snd.owner_id || snd.created_by;

    let owner = null;
    if (ownerId) {
      const { data: o } = await supabase
        .from('profiles')
        .select('id,username,avatar_url')
        .eq('id', ownerId)
        .maybeSingle();
      owner = o;
    }
    setS({ ...snd, owner, ownerId });

    const { data: vids } = await supabase
      .from('videos')
      .select('*,likes(count)')
      .eq('sound_id', id)
      .order('created_at', { ascending: false });
    setVs(vids || []);

    if (me && ownerId && me.id !== ownerId) {
      const { data } = await supabase
        .from('follows')
        .select('*')
        .match({ follower_id: me.id, following_id: ownerId });
      setFol(!!data?.length);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id, me]);

  async function follow() {
    if (!me) return (location.href = '/login');
    const k = { follower_id: me.id, following_id: s.ownerId };
    const was = fol;
    setFol(!was);
    const { error } = was
      ? await supabase.from('follows').delete().match(k)
      : await supabase.from('follows').insert(k);
    if (error) setFol(was);
  }

  if (missing) return <p className="p-8 text-white/50">Ky zë nuk u gjet.</p>;
  if (!s) return <p className="p-8 text-white/50">Po ngarkohet...</p>;

  const owner = s.owner;
  const isOwner = me?.id === s.ownerId;

  return (
    <div className="p-4 pb-24 text-white">
      <style>{`@keyframes coko-spin{to{transform:rotate(360deg)}}`}</style>

      <div className="flex flex-col items-center gap-2 pt-4">
        <div
          className="h-28 w-28 rounded-full border border-white/20 bg-gradient-to-br from-zinc-600 to-black p-1.5"
          style={{ animation: 'coko-spin 6s linear infinite' }}
        >
          <img
            src={owner?.avatar_url || '/avatar.svg'}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        </div>

        <h1 className="text-center text-lg font-bold">🎵 {s.title}</h1>

        {owner && (
          <Link href={`/profile/${owner.id}`} className="text-sm text-white/70">
            Hedhur së pari nga <b>@{owner.username}</b>
          </Link>
        )}

        <p className="text-sm text-white/50">{fmt(vs.length)} video</p>

        <div className="mt-1 flex gap-2">
          {owner && !isOwner && (
            <button className="btn" onClick={follow}>
              {fol ? 'Unfollow' : 'Follow'}
            </button>
          )}
          <Link
            href={`/create?sound=${s.id}`}
            className="rounded-full bg-card px-5 py-2 font-semibold"
          >
            🎬 Përdor këtë zë
          </Link>
        </div>
      </div>

      {vs.length === 0 ? (
        <p className="mt-8 text-center text-sm text-white/50">
          Ende nuk ka video me këtë zë.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-1">
          {vs.map((v) => (
            <Link
              key={v.id}
              href={`/video/${v.id}`}
              className="relative aspect-[9/16] overflow-hidden bg-card"
            >
              <video
                src={`${v.url}#t=0.1`}
                preload="metadata"
                muted
                playsInline
                className="pointer-events-none h-full w-full object-cover"
              />
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
