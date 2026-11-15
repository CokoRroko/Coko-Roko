'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import VideoCard from '@/components/VideoCard';

export default function ProfileVideoViewer({
  videos,
  profile,
  me,
  startIndex = 0,
  onClose,
}) {
  const box = useRef(null);
  const [commentCounts, setCommentCounts] = useState({});
  const [current, setCurrent] = useState(startIndex);

  // hapet direkt te video që prekët dhe bllokon scroll-in e faqes pas tij
  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTo({ top: startIndex * el.clientHeight, behavior: 'instant' });
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = old;
    };
  }, [startIndex]);

  // numri i komenteve për çdo video
  useEffect(() => {
    let active = true;
    const ids = videos.map((v) => v.id);
    if (!ids.length) return;
    supabase
      .from('comments')
      .select('video_id')
      .in('video_id', ids)
      .then(({ data }) => {
        if (!active) return;
        const counts = {};
        (data || []).forEach((c) => {
          counts[c.video_id] = (counts[c.video_id] || 0) + 1;
        });
        setCommentCounts(counts);
      });
    return () => {
      active = false;
    };
  }, [videos]);

  // tastiera (kompjuter)
  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  const onScroll = (e) => {
    const el = e.currentTarget;
    setCurrent(Math.round(el.scrollTop / el.clientHeight));
  };

  const prepared = videos.map((v) => ({
    ...v,
    profiles: profile
      ? { id: profile.id, username: profile.username, avatar_url: profile.avatar_url }
      : null,
    likes: v.likes?.length ? v.likes : [{ count: 0 }],
    comments: [{ count: commentCounts[v.id] || 0 }],
  }));

  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-black">
      <main
        ref={box}
        onScroll={onScroll}
        className="h-[100dvh] w-full overflow-y-auto snap-y snap-mandatory bg-black"
        style={{ overscrollBehavior: 'contain' }}
      >
        {prepared.map((video) => (
          <section
            key={video.id}
            className="h-[100dvh] w-full snap-start snap-always"
          >
            <VideoCard v={video} me={me} />
          </section>
        ))}
      </main>

      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-[1001] rounded-full bg-black/60 px-4 py-2 text-white font-bold"
      >
        ✕
      </button>
      <span className="absolute top-5 left-1/2 -translate-x-1/2 z-[1001] text-xs text-white/60 pointer-events-none">
        {current + 1} / {videos.length}
      </span>
    </div>,
    document.body
  );
}
