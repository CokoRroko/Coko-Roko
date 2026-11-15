'use client';
import { useEffect, useRef, useState } from 'react';

export default function ProfileVideoViewer({ videos, startIndex = 0, onClose }) {
  const box = useRef(null);
  const [muted, setMuted] = useState(true);

  // hapet direkt te video që prekët
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.scrollTo({ top: startIndex * el.clientHeight, behavior: 'instant' });
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [startIndex]);

  // luan vetëm video që duket, të tjerat ndalen
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = e.target;
          if (e.isIntersecting && e.intersectionRatio > 0.7) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { root: el, threshold: [0, 0.7, 1] }
    );
    el.querySelectorAll('video').forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [videos]);

  // zëri ndizet/fiket për të gjitha videot
  useEffect(() => {
    box.current?.querySelectorAll('video').forEach((v) => {
      v.muted = muted;
    });
  }, [muted, videos]);

  const toggle = (e) => {
    const v = e.currentTarget;
    v.paused ? v.play().catch(() => {}) : v.pause();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <div
        ref={box}
        className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory"
        style={{ overscrollBehavior: 'contain' }}
      >
        {videos.map((v) => (
          <div
            key={v.id}
            className="relative h-[100dvh] w-full snap-start snap-always flex items-center justify-center"
          >
            <video
              src={v.url}
              loop
              muted
              playsInline
              preload="metadata"
              onClick={toggle}
              className="h-full w-full object-contain"
            />
            {v.caption && (
              <p className="absolute bottom-6 left-4 right-4 text-white text-sm drop-shadow">
                {v.caption}
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 rounded-full bg-black/60 px-4 py-2 text-white font-bold"
      >
        ✕
      </button>
      <button
        onClick={() => setMuted((m) => !m)}
        className="absolute top-4 right-4 z-10 rounded-full bg-black/60 px-4 py-2 text-white"
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}
