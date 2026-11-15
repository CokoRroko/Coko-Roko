
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
        // Merr videon
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('*')
          .eq('id', id)
          .single();

        if (videoError) throw videoError;

        // Merr profilin e pronarit të videos
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', videoData.user_id)
          .maybeSingle();

        if (profileError) throw profileError;

        // Merr numrin e pëlqimeve
        const { count: likesCount, error: likesError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('video_id', id);

        if (likesError) throw likesError;

        // Merr numrin e komenteve
        const { count: commentsCount, error: commentsError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('video_id', id);

        if (commentsError) throw commentsError;

        // Merr përdoruesin aktual
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!active) return;

        // Përgatit të dhënat për VideoCard
        const preparedVideo = {
          ...videoData,
          profiles: profileData,
          likes: [{ count: likesCount || 0 }],
          comments: [{ count: commentsCount || 0 }],
        };

        setVideo(preparedVideo);
        setMe(user || null);

      } catch (err) {
        console.error('Gabim gjatë ngarkimit të videos:', err);

        if (active) {
          setError(err.message || 'Nuk u arrit të ngarkohet videoja.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadVideo();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-black text-white">
        Duke ngarkuar videon...
      </main>
    );
  }

  if (error || !video) {
    return (
      <main className="grid min-h-screen place-items-center bg-black p-5 text-center text-white">
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
