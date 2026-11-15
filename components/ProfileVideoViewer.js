'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ProfileVideoViewer({ videos, startIndex = 0, onClose }) {
  const [i, setI] = useState(startIndex);
  const [dy, setDy] = useState(0);
  const [drag, setDrag] = useState(false);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const startY = useRef(null);
  const startT = useRef(0);
  const wheelLock = useRef(false);
  const refs = useRef([]);
  const mutedRef = useRef(false);
  mutedRef.current = muted;

  const go = (n) =>
    setI((cur) => Math.max(0, Math.min(videos.length - 1, cur + n)));

  // bllokon scroll-in e faqes pas videos
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = old;
    };
  }, []);

  // luan vetëm videon aktive, të tjerat ndalen dhe rikthehen në fillim
  useEffect(() => {
    setPaused(false);
    setProgress(0);
    refs.current.forEach((v, idx) => {
      if (!v) return;
      if (idx === i) {
        v.muted = mutedRef.current;
        v.play().catch(() => {
          // telefoni e bllokoi zërin: provo pa zë
          v.muted = true;
          setMuted(true);
          v.play().catch(() => {});
        });
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [i]);

  // zëri ndizet/fiket për videon aktive
  useEffect(() => {
    const v = refs.current[i];
    if (v) v.muted = muted;
  }, [muted, i]);

  // tastiera (kompjuter)
  useEffect(() => {
    const key = (e) => {
      if (e.key === 'ArrowDown') go(1);
      if (e.key === 'ArrowUp') go(-1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  // rrota e mausit (kompjuter)
  const onWheel = (e) => {
    if (wheelLock.current || Math.abs(e.deltaY) < 20) return;
    wheelLock.current = true;
    go(e.deltaY > 0 ? 1 : -1);
    setTimeout(() => (wheelLock.current = false), 450);
  };

  // gishti (telefon)
  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    startT.current = Date.now();
    setDrag(true);
  };
  const onTouchMove = (e) => {
    if (startY.current === null) return;
    let d = e.touches[0].clientY - startY.current;
    if ((i === 0 && d > 0) || (i === videos.length - 1 && d < 0)) d = d / 4;
    setDy(d);
  };
  const onTouchEnd = () => {
    if (startY.current === null) return;
    const dt = Math.max(Date.now() - startT.current, 1);
    const velocity = dy / dt; // px për ms
    if (dy < -60 || velocity < -0.5) go(1);
    else if (dy > 60 || velocity > 0.5) go(-1);
    setDy(0);
    setDrag(false);
    startY.current = null;
  };

  const toggle = () => {
    const v = refs.current[i];
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] bg-black overflow-hidden"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        style={{
          transform: `translate3d(0, calc(${-i * 100}dvh + ${dy}px), 0)`,
          transition: drag ? 'none' : 'transform 0.3s ease',
          willChange: 'transform',
        }}
      >
        {videos.map((v, idx) => (
          <div
            key={v.id}
            className="relative w-full flex items-center justify-center bg-black"
            style={{ height: '100dvh' }}
          >
            {Math.abs(idx - i) <= 1 && (
              <video
                ref={(el) => (refs.current[idx] = el)}
                src={v.url}
                loop
                playsInline
                preload="auto"
                onClick={toggle}
                onTimeUpdate={(e) => {
                  if (idx === i && e.currentTarget.duration) {
                    setProgress(
                      e.currentTarget.currentTime / e.currentTarget.duration
                    );
                  }
                }}
                className="h-full w-full object-contain"
              />
            )}

            {idx === i && paused && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="rounded-full bg-black/50 px-6 py-4 text-4xl text-white">
                  ⏸
                </span>
              </div>
            )}

            {v.caption && (
              <p className="absolute bottom-10 left-4 right-4 text-white text-sm drop-shadow pointer-events-none">
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
      <span className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-xs text-white/60 pointer-events-none">
        {i + 1} / {videos.length}
      </span>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 pointer-events-none">
        <div
          className="h-full bg-white"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>,
    document.body
  );
}
