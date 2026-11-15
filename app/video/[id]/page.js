'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import VideoCard from '@/components/VideoCard';

export default function VideoPage() {
  const { id } = useParams();
  const router = useRouter();
  const [video, setVideo] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setMe(user || null);

      const { data: v } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!active) return;
      if (!v) {
        setMissing(true);
        setLoading(false);
        return;
      }

      const [prof, likes, comments] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', v.user_id)
          .maybeSingle(),
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('video_id', v.id),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('video_id', v.id),
      ]);

      if (!active) return;
      setVideo({
        ...v,
        profiles: prof.data || null,
        likes: [{ count: likes.count || 0 }],
        comments: [{ count: comments.count || 0 }],
      });
      setLoading(false);
    }

    if (id) load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-black text-white">
        Duke ngarkuar videon...
      </main>
    );
  }

  if (missing || !video) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-black p-5 text-center text-white/60">
        Videoja nuk u gjet.
      </main>
    );
  }

  return (
    <main className="relative h-[100dvh] w-full bg-black">
      <VideoCard v={video} me={me} />
      <button
        onClick={() => router.back()}
        aria-label="Kthehu"
        className="absolute left-4 top-5 z-40 grid h-11 w-11 place-items-center rounded-full bg-black/40 text-xl font-bold text-white backdrop-blur-md"
      >
        ←
      </button>
    </main>
  );
}
