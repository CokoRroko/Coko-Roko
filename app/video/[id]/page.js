
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import VideoCard from '@/components/VideoCard';

export default function VideoPage() {
  const params = useParams();
  const id = params?.id;

  const [video, setVideo] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadVideo() {
      setLoading(true);
      setError('');

      try {
        // Merr videon dhe të dhënat e saj
        const { data, error: videoError } = await supabase
          .from('videos')
          .select(`
            *,
            profiles (
              username,
              avatar_url
            ),
            likes (
              count
            ),
            comments (
              count
            )
          `)
          .eq('id', id)
          .single();

        if (videoError) throw videoError;

        // Merr përdoruesin aktual
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!active) return;

        setVideo(data);
        setMe(user);
      } catch (err) {
        console.error('Video loading error:', err);

        if (active) {
          setError(err.message || 'Videoja nuk u gjet.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVideo();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="grid h-[100dvh] place-items-center bg-black text-white">
        Duke ngarkuar videon...
      </main>
    );
  }

  if (error || !video) {
    return (
      <main className="grid h-[100dvh] place-items-center bg-black p-5 text-center text-white">
        <div>
          <p className="mb-3 text-lg font-bold">
            Videoja nuk u gjet!
          </p>
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-black">
      <VideoCard
        key={video.id}
        v={video}
        me={me}
      />
    </main>
  );
}
