
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function ActionButton({ icon, label, onClick, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group flex min-w-[52px] flex-col items-center gap-1.5 text-white"
    >
      <span
        className={`grid h-12 w-12 place-items-center rounded-full bg-black/30 text-[27px] shadow-lg backdrop-blur-sm transition-all duration-200 group-active:scale-75 ${
          active ? 'scale-110' : ''
        }`}
      >
        {icon}
      </span>
      <span className="text-xs font-semibold drop-shadow-md">
        {label}
      </span>
    </button>
  );
}

export default function VideoCard({ v, me }) {
  const videoRef = useRef(null);
  const counted = useRef(false);
  const viewTimer = useRef(null);
  const likeLock = useRef(false);
  const saveLock = useRef(false);
  const followLock = useRef(false);

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(v.likes?.[0]?.count || 0);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [views, setViews] = useState(v.views || 0);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const ownVideo = me?.id === v.user_id;

  // Kontrollo nëse përdoruesi është kyçur
  const needLogin = useCallback(() => {
    if (!me) {
      window.location.assign('/login');
      return true;
    }
    return false;
  }, [me]);

  // Luaj videon automatikisht kur është në ekran
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          video.play()
            .then(() => setPlaying(true))
            .catch(() => setPlaying(false));

          if (!counted.current && !viewTimer.current) {
            viewTimer.current = setTimeout(async () => {
              counted.current = true;
              viewTimer.current = null;

              const { error } = await supabase.rpc(
                'increment_views',
                { vid: v.id }
              );

              if (!error) {
                setViews((old) => old + 1);
              }
            }, 2000);
          }
        } else {
          video.pause();
          setPlaying(false);

          if (viewTimer.current) {
            clearTimeout(viewTimer.current);
            viewTimer.current = null;
          }
        }
      },
      { threshold: [0, 0.7] }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();

      if (viewTimer.current) {
        clearTimeout(viewTimer.current);
        viewTimer.current = null;
      }
    };
  }, [v.id]);

  // Kontrollo like, follow dhe save nga Supabase
  useEffect(() => {
    if (!me) {
      setLiked(false);
      setSaved(false);
      setFollowing(false);
      return;
    }

    let active = true;

    async function loadStatus() {
      const [likeResult, saveResult, followResult] =
        await Promise.all([
          supabase
            .from('likes')
            .select('video_id')
            .match({
              video_id: v.id,
              user_id: me.id,
            }),

          supabase
            .from('saves')
            .select('video_id')
            .match({
              video_id: v.id,
              user_id: me.id,
            }),

          supabase
            .from('follows')
            .select('follower_id')
            .match({
              follower_id: me.id,
              following_id: v.user_id,
            }),
        ]);

      if (!active) return;

      setLiked(!!likeResult.data?.length);
      setSaved(!!saveResult.data?.length);
      setFollowing(!!followResult.data?.length);
    }

    loadStatus();

    return () => {
      active = false;
    };
  }, [me?.id, v.id, v.user_id]);

  // Like / Unlike
  async function toggleLike() {
    if (needLogin() || likeLock.current) return;

    likeLock.current = true;

    const previous = liked;

    setLiked(!previous);
    setLikes((old) => Math.max(0, old + (previous ? -1 : 1)));

    const key = {
      user_id: me.id,
      video_id: v.id,
    };

    const { error } = previous
      ? await supabase.from('likes').delete().match(key)
      : await supabase.from('likes').insert(key);

    if (error) {
      setLiked(previous);
      setLikes((old) => Math.max(0, old + (previous ? 1 : -1)));
    }

    likeLock.current = false;
  }

  // Ruaj videon
  async function toggleSave() {
    if (needLogin() || saveLock.current) return;

    saveLock.current = true;

    const previous = saved;
    setSaved(!previous);

    const key = {
      user_id: me.id,
      video_id: v.id,
    };

    const { error } = previous
      ? await supabase.from('saves').delete().match(key)
      : await supabase.from('saves').insert(key);

    if (error) setSaved(previous);

    saveLock.current = false;
  }

  // Follow / Unfollow
  async function toggleFollow() {
    if (needLogin() || followLock.current || ownVideo) return;

    followLock.current = true;

    const previous = following;
    setFollowing(!previous);

    const key = {
      follower_id: me.id,
      following_id: v.user_id,
    };

    const { error } = previous
      ? await supabase.from('follows').delete().match(key)
      : await supabase.from('follows').insert(key);

    if (error) setFollowing(previous);

    followLock.current = false;
  }

  // Komentet
  async function loadComments() {
    setCommentsOpen(true);
    setCommentsLoading(true);

    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('video_id', v.id)
      .order('created_at', { ascending: true });

    if (!error) setComments(data || []);

    setCommentsLoading(false);
  }

  // Dërgo koment
  async function sendComment(e) {
    e.preventDefault();

    if (needLogin() || !commentText.trim() || sending) return;

    setSending(true);

    const body = commentText.trim();

    const { error } = await supabase
      .from('comments')
      .insert({
        user_id: me.id,
        video_id: v.id,
        body,
      });

    if (!error) {
      setCommentText('');
      await loadComments();
    }

    setSending(false);
  }

  // Share video
  async function shareVideo() {
    const url = `${window.location.origin}/video/${v.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Coko Roco',
          text: v.caption || 'Shiko këtë video!',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Linku u kopjua!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
      }
    }
  }

  // Aktivizo / çaktivizo zërin
  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);
  }

  // Pause / Play
  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  // Like me dy klikime mbi video
  function handleVideoDoubleClick() {
    if (!liked) toggleLike();

    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 750);
  }

  const username = v.profiles?.username || 'user';
  const avatar = v.profiles?.avatar_url;

  return (
    <section
      className="relative isolate h-[100dvh] w-full snap-start overflow-hidden bg-black text-white"
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        src={v.url}
        loop
        playsInline
        muted={muted}
        preload="metadata"
        className="absolute inset-0 z-0 h-full w-full object-cover"
        onClick={togglePlay}
        onDoubleClick={handleVideoDoubleClick}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* GRADIENT SIPËR */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black/40 to-transparent" />

      {/* GRADIENT POSHTË */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-72 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* LIKE ANIMACION */}
      {showHeart && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
          <span className="animate-ping text-8xl drop-shadow-2xl">
            ❤️
          </span>
        </div>
      )}

      {/* PLAY / PAUSE */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Luaj videon"
          className="absolute left-1/2 top-1/2 z-20 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-4xl backdrop-blur-sm"
        >
          ▶
        </button>
      )}

      {/* IKONA ZËRIT */}
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? 'Aktivizo zërin' : 'Hesht videon'}
        className="absolute right-4 top-5 z-30 grid h-10 w-10 place-items-center rounded-full bg-black/35 text-xl backdrop-blur-md"
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* KOLONA E I KONAVE - TIKTOK STYLE */}
      <div className="absolute bottom-28 right-3 z-30 flex flex-col items-center gap-5">

        {/* PROFILI */}
        <div className="relative mb-2">
          <Link href={`/profile/${v.user_id}`}>
            {avatar ? (
              <img
                src={avatar}
                alt={username}
                className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-purple-600 text-xl font-bold">
                {username[0].toUpperCase()}
              </div>
            )}
          </Link>

          {!ownVideo && !following && (
            <button
              type="button"
              onClick={toggleFollow}
              aria-label="Follow"
              className="absolute -bottom-2 left-1/2 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full bg-pink-500 text-lg font-bold shadow-lg"
            >
              +
            </button>
          )}
        </div>

        {/* LIKE */}
        <ActionButton
          icon={liked ? '❤️' : '🤍'}
          label={likes.toLocaleString()}
          onClick={toggleLike}
          active={liked}
        />

        {/* KOMENTE */}
        <ActionButton
          icon="💬"
          label={v.comments?.[0]?.count || 0}
          onClick={loadComments}
        />

        {/* SAVE */}
        <ActionButton
          icon={saved ? '🔖' : '📑'}
          label={saved ? 'Ruajtur' : 'Ruaj'}
          onClick={toggleSave}
          active={saved}
        />

        {/* SHARE */}
        <ActionButton
          icon="↗️"
          label="Ndaj"
          onClick={shareVideo}
        />
      </div>

      {/* INFORMACIONI POSHTË MAJTAS */}
      <div className="absolute bottom-7 left-4 right-20 z-20 text-white">

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Link
            href={`/profile/${v.user_id}`}
            className="text-base font-bold drop-shadow-md"
          >
            @{username}
          </Link>

          {!ownVideo && (
            <button
              type="button"
              onClick={toggleFollow}
              className={`rounded-full border px-4 py-1 text-xs font-bold transition ${
                following
                  ? 'border-white/60 bg-black/20'
                  : 'border-pink-500 bg-pink-500'
              }`}
            >
              {following ? 'Following ✓' : 'Follow'}
            </button>
          )}
        </div>

        <p className="mb-3 max-w-full break-words text-sm leading-5 drop-shadow-md">
          {v.caption}
        </p>

        <div className="flex items-center gap-2 text-xs text-white/90">
          <span>👁</span>
          <span>{views.toLocaleString()} shikime</span>
        </div>
      </div>

      {/* PANELI I KOMENTEVE */}
      {commentsOpen && (
        <div
          className="absolute inset-x-0 bottom-0 z-50 flex h-[65%] flex-col rounded-t-3xl border-t border-white/10 bg-[#151515] p-4 text-white shadow-2xl"
        >
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <span className="font-bold">
              Komente ({comments.length})
            </span>

            <button
              type="button"
              onClick={() => setCommentsOpen(false)}
              className="text-2xl text-white/70"
            >
              ×
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pb-4">
            {commentsLoading ? (
              <p className="py-5 text-center text-sm text-white/50">
                Duke ngarkuar komentet...
              </p>
            ) : comments.length ? (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  {c.profiles?.avatar_url ? (
                    <img
                      src={c.profiles.avatar_url}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-purple-600 text-sm font-bold">
                      {(c.profiles?.username || '?')[0].toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white/60">
                      @{c.profiles?.username || 'user'}
                    </p>
                    <p className="break-words text-sm">{c.body}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-white/50">
                Bëhu i pari që komenton ❤️
              </p>
            )}
          </div>

          <form
            onSubmit={sendComment}
            className="mb-5 flex items-center gap-2 border-t border-white/10 pt-3"
          >
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Shto koment..."
              maxLength={1000}
              className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-1 focus:ring-pink-500"
            />

            <button
              type="submit"
              disabled={!commentText.trim() || sending}
              className="rounded-full bg-pink-500 px-5 py-3 text-sm font-bold disabled:opacity-40"
            >
              {sending ? '...' : 'Dërgo'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
