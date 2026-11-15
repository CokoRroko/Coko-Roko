
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import VideoCard from '@/components/VideoCard';

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadFeed() {
      try {
        setLoading(true);
        setError('');

        // Merr përdoruesin aktual
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;
        setMe(user || null);

        // Merr videot e publikuara
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('*');

        if (videoError) throw videoError;

        if (!videoData || videoData.length === 0) {
          setVideos([]);
          return;
        }

        const videoIds = videoData.map((v) => v.id);
        const userIds = [...new Set(videoData.map((v) => v.user_id))];

        // Merr profilet
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Merr pëlqimet
        const { data: likes, error: likesError } = await supabase
          .from('likes')
          .select('video_id')
          .in('video_id', videoIds);

        if (likesError) throw likesError;

        // Merr komentet
        const { data: comments, error: commentsError } = await supabase
          .from('comments')
          .select('video_id')
          .in('video_id', videoIds);

        if (commentsError) throw commentsError;

        // Llogarit numrin e pëlqimeve dhe komenteve
        const likeCounts = {};
        const commentCounts = {};

        (likes || []).forEach((item) => {
          likeCounts[item.video_id] =
            (likeCounts[item.video_id] || 0) + 1;
        });

        (comments || []).forEach((item) => {
          commentCounts[item.video_id] =
            (commentCounts[item.video_id] || 0) + 1;
        });

        const profileMap = {};
        (profiles || []).forEach((profile) => {
          profileMap[profile.id] = profile;
        });

        // Përgatit videot për VideoCard
        const preparedVideos = videoData.map((video) => ({
          ...video,
          profiles: profileMap[video.user_id] || null,
          likes: [{ count: likeCounts[video.id] || 0 }],
          comments: [{ count: commentCounts[video.id] || 0 }],
        }));

        // Rendit videot sipas popullaritetit
        const now = Date.now();

        preparedVideos.sort((a, b) => {
          function viralScore(video) {
            const views = Number(video.views || 0);
            const likes = Number(video.likes?.[0]?.count || 0);
            const comments = Number(video.comments?.[0]?.count || 0);

            const postedAt = video.created_at
              ? new Date(video.created_at).getTime()
              : now;

            const hoursOld = Math.max(
              0,
              (now - postedAt) / (1000 * 60 * 60)
            );

            const freshness = Math.max(0, 500 - hoursOld * 5);

            return views + likes * 5 + comments * 8 + freshness;
          }

          return viralScore(b) - viralScore(a);
        });

        if (active) setVideos(preparedVideos);

      } catch (err) {
        console.error('Feed error:', err);
        if (active) {
          setError(err.message || 'Nuk u arrit të ngarkohen videot.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFeed();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-black text-white">
        Duke ngarkuar videot...
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-black p-5 text-center text-red-400">
        {error}
      </main>
    );
  }

  if (videos.length === 0) {
    return (
      <main className="grid min-h-screen place-items-center bg-black text-white">
        Ende nuk ka video të publikuara.
      </main>
    );
  }

  return (
    <main className="h-[100dvh] w-full overflow-y-auto snap-y snap-mandatory bg-black">
      {videos.map((video) => (
        <section
          key={video.id}
          className="h-[100dvh] w-full snap-start snap-always"
        >
          <VideoCard v={video} me={me} />
        </section>
      ))}
    </main>
  );
}
