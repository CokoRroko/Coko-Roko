'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const pushed = useRef(false);
  const closedByPop = useRef(false);
  const [commentCounts, setCommentCounts] = useState({});
  const [current, setCurrent] = useState(startIndex);

  // hapet direkt te video që prekët (para se të shfaqet ekrani)
  useLayoutEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = startIndex * el.clientHeight;
  }, [startIndex]);

  // bllokon scroll-in e faqes pas shikuesit
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = old;
    };
  }, []);

  // butoni Back i telefonit mbyll shikuesin
  useEffect(() => {
    window.history.pushState({ viewer: true }, '');
    pushed.current = true;
    const onPop = () => {
      closedByPop.current = true;
      pushed.current = false;
      onClose();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const close = () => {
    if (pushed.current && !closedByPop.current) {
      window.history.back(); // popstate e mbyll shikuesin
    } else {
      onClose();
    }
  };

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
      const el = box.current;
      if (!el) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowDown')
        el.scrollBy({ top: el.clientHeight, behavior: 'smooth' });
      if (e.key === 'ArrowUp')
        el.scrollBy({ top: -el.clientHeight, behavior: 'smooth' });
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
      ? {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
        }
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
          <div
            key={video.id}
            className="h-[100dvh] w-full snap-start snap-always"
          >
            <VideoCard v={video} me={me} />
          </div>
        ))}
      </main>

      <button
        onClick={close}
        aria-label="Mbyll"
        className="absolute left-4 top-5 z-[1001] grid h-11 w-11 place-items-center rounded-full bg-black/40 text-xl font-bold text-white backdrop-blur-md"
      >
        ✕
      </button>
      <span className="pointer-events-none absolute left-1/2 top-6 z-[1001] -translate-x-1/2 text-xs text-white/70 drop-shadow">
        {Math.min(current + 1, videos.length)} / {videos.length}
      </span>
    </div>,
    document.body
  );
}
