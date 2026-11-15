'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

/* ICONS - SVG, pa instaluar libra shtesë */
function Icon({ name, size = 26, filled = false }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'shrink-0',
    'aria-hidden': true,
  };

  switch (name) {
    case 'heart':
      return (
        <svg {...common}>
          <path
            d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
            fill={filled ? 'currentColor' : 'none'}
          />
        </svg>
      );

    case 'comment':
      return (
        <svg {...common}>
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
        </svg>
      );

    case 'bookmark':
      return (
        <svg {...common}>
          <path
            d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z"
            fill={filled ? 'currentColor' : 'none'}
          />
        </svg>
      );

    case 'share':
      return (
        <svg {...common}>
          <path d="M12 16V3m-5 5 5-5 5 5" />
          <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
        </svg>
      );

    case 'volume':
      return (
        <svg {...common}>
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 5a10 10 0 0 1 0 14" />
        </svg>
      );

    case 'mute':
      return (
        <svg {...common}>
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="m16 9 5 6m0-6-5 6" />
        </svg>
      );

    case 'play':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="m7 4 13 8-13 8V4Z" />
        </svg>
      );

    case 'pause':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
        </svg>
      );

    case 'close':
      return (
        <svg {...common}>
          <path d="m18 6-12 12M6 6l12 12" />
        </svg>
      );

    case 'send':
      return (
        <svg {...common}>
          <path d="m22 2-7 20-4-9-9-4 20-7Z" />
          <path d="M22 2 11 13" />
        </svg>
      );

    default:
      return null;
  }
}

/* BUTONAT E VEPRIMEVE */
function ActionButton({ icon, label, onClick, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group flex min-w-[52px] flex-col items-center gap-1.5 text-white"
    >
      <span
        className={`grid h-[50px] w-[50px] place-items-center rounded-full bg-black/35 shadow-lg backdrop-blur-md transition duration-200 group-active:scale-75 ${
          active ? 'text-pink-500' : 'text-white'
        }`}
      >
        <Icon name={icon} size={29} filled={active} />
      </span>

      <span className="max-w-[65px] text-center text-xs font-bold drop-shadow-md">
        {label}
      </span>
    </button>
  );
}

export default function VideoCard({ v, me }) {
  const videoRef = useRef(null);
  const observerRef = useRef(null);

  const counted = useRef(false);
  const viewTimer = useRef(null);
  const tapTimer = useRef(null);
  const heartTimer = useRef(null);

  const likeLock = useRef(false);
  const saveLock = useRef(false);
  const followLock = useRef(false);
  const commentLock = useRef(false);

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(
    Number(v.likes?.[0]?.count || 0)
  );

  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);

  const [views, setViews] = useState(Number(v.views || 0));

  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [heartVisible, setHeartVisible] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [commentsCount, setCommentsCount] = useState(
    Number(v.comments?.[0]?.count || 0)
  );

  const username = v.profiles?.username || 'user';
  const avatar = v.profiles?.avatar_url;
  const ownVideo = me?.id === v.user_id;

  /* KONTROLLO LOGIN */
  const needLogin = useCallback(() => {
    if (!me) {
      window.location.assign('/login');
      return true;
    }

    return false;
  }, [me]);

  /* AUTOPLAY + NUMËRIMI I SHIKIMEVE */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          video.play().catch(() => {});

          if (!counted.current && !viewTimer.current) {
            viewTimer.current = setTimeout(async () => {
              viewTimer.current = null;

              if (counted.current) return;

              counted.current = true;

              const { error } = await supabase.rpc(
                'increment_views',
                { vid: v.id }
              );

              if (!error) {
                setViews((old) => old + 1);
              } else {
                counted.current = false;
                console.error('View error:', error.message);
              }
            }, 2000);
          }
        } else {
          video.pause();

          if (viewTimer.current) {
            clearTimeout(viewTimer.current);
            viewTimer.current = null;
          }
        }
      },
      { threshold: [0, 0.7] }
    );

    observerRef.current = observer;
    observer.observe(video);

    return () => {
      observer.disconnect();
      observerRef.current = null;
      video.pause();

      if (viewTimer.current) clearTimeout(viewTimer.current);
      if (tapTimer.current) clearTimeout(tapTimer.current);
      if (heartTimer.current) clearTimeout(heartTimer.current);
    };
  }, [v.id]);

  /* NGARKO STATUSIN E PËRDORUESIT */
  useEffect(() => {
    let active = true;

    async function loadStatus() {
      if (!me?.id) {
        setLiked(false);
        setSaved(false);
        setFollowing(false);
        return;
      }

      const [likeResult, saveResult, followResult] =
        await Promise.all([
          supabase
            .from('likes')
            .select('video_id')
            .match({ video_id: v.id, user_id: me.id })
            .maybeSingle(),

          supabase
            .from('saves')
            .select('video_id')
            .match({ video_id: v.id, user_id: me.id })
            .maybeSingle(),

          supabase
            .from('follows')
            .select('follower_id')
            .match({
              follower_id: me.id,
              following_id: v.user_id,
            })
            .maybeSingle(),
        ]);

      if (!active) return;

      if (likeResult.error) {
        console.error('Like status:', likeResult.error.message);
      } else {
        setLiked(!!likeResult.data);
      }

      if (saveResult.error) {
        console.error('Save status:', saveResult.error.message);
      } else {
        setSaved(!!saveResult.data);
      }

      if (followResult.error) {
        console.error('Follow status:', followResult.error.message);
      } else {
        setFollowing(!!followResult.data);
      }
    }

    loadStatus();

    return () => {
      active = false;
    };
  }, [me?.id, v.id, v.user_id]);

  /* LIKE / UNLIKE */
  async function toggleLike() {
    if (needLogin() || likeLock.current) return;

    likeLock.current = true;

    const previous = liked;

    setLiked(!previous);
    setLikes((old) => Math.max(0, old + (previous ? -1 : 1)));

    try {
      const key = {
        user_id: me.id,
        video_id: v.id,
      };

      const { error } = previous
        ? await supabase.from('likes').delete().match(key)
        : await supabase.from('likes').insert(key);

      if (error) throw error;
    } catch (error) {
      setLiked(previous);
      setLikes((old) => Math.max(0, old + (previous ? 1 : -1)));
      console.error('Like error:', error.message);
    } finally {
      likeLock.current = false;
    }
  }

  /* SAVE / UNSAVE */
  async function toggleSave() {
    if (needLogin() || saveLock.current) return;

    saveLock.current = true;

    const previous = saved;
    setSaved(!previous);

    try {
      const key = {
        user_id: me.id,
        video_id: v.id,
      };

      const { error } = previous
        ? await supabase.from('saves').delete().match(key)
        : await supabase.from('saves').insert(key);

      if (error) throw error;
    } catch (error) {
      setSaved(previous);
      console.error('Save error:', error.message);
    } finally {
      saveLock.current = false;
    }
  }

  /* FOLLOW / UNFOLLOW */
  async function toggleFollow() {
    if (needLogin() || ownVideo || followLock.current) return;

    followLock.current = true;

    const previous = following;
    setFollowing(!previous);

    try {
      const key = {
        follower_id: me.id,
        following_id: v.user_id,
      };

      const { error } = previous
        ? await supabase.from('follows').delete().match(key)
        : await supabase.from('follows').insert(key);

      if (error) throw error;
    } catch (error) {
      setFollowing(previous);
      console.error('Follow error:', error.message);
    } finally {
      followLock.current = false;
    }
  }

  /* NGARKO KOMENTET */
  async function loadComments() {
    setCommentsOpen(true);
    setCommentsLoading(true);

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(username, avatar_url)')
        .eq('video_id', v.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(data || []);
      setCommentsCount(data?.length || 0);
    } catch (error) {
      console.error('Comments error:', error.message);
    } finally {
      setCommentsLoading(false);
    }
  }

  /* DËRGO KOMENT */
  async function sendComment(e) {
    e.preventDefault();

    if (needLogin() || !commentText.trim() || commentLock.current) {
      return;
    }

    commentLock.current = true;
    setSending(true);

    const body = commentText.trim();

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: me.id,
          video_id: v.id,
          body,
        });

      if (error) throw error;

      setCommentText('');
      await loadComments();
    } catch (error) {
      console.error('Send comment error:', error.message);
    } finally {
      commentLock.current = false;
      setSending(false);
    }
  }

  /* SHARE */
  async function shareVideo() {
    const url = `${window.location.origin}/video/${v.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Coko Roco',
          text: v.caption || 'Shiko këtë video!',
          url,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        window.alert('Linku u kopjua!');
      } else {
        window.prompt('Kopjo linkun:', url);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error.message);
      }
    }
  }

  /* PLAY / PAUSE */
  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  /* ZËRI */
  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
  }

  /* ANIMACIONI I ZEMRËS */
  function showLikeAnimation() {
    setHeartVisible(true);

    if (heartTimer.current) {
      clearTimeout(heartTimer.current);
    }

    heartTimer.current = setTimeout(() => {
      setHeartVisible(false);
      heartTimer.current = null;
    }, 750);
  }

  /* DOUBLE TAP SI TIKTOK */
  function handleVideoClick() {
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;

      if (!liked) {
        toggleLike();
      }

      showLikeAnimation();
      return;
    }

    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      togglePlay();
    }, 250);
  }

  return (
    <section className="relative isolate h-[100dvh] w-full snap-start snap-always overflow-hidden bg-black text-white">

      {/* VIDEO */}
      <video
        ref={videoRef}
        src={v.url}
        loop
        playsInline
        muted={muted}
        preload="metadata"
        className="absolute inset-0 z-0 h-full w-full object-cover"
        onClick={handleVideoClick}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* GRADIENT SIPËR */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/40 to-transparent" />

      {/* GRADIENT POSHTË */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-80 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* DOUBLE TAP HEART */}
      {heartVisible && (
        <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center">
          <div className="animate-[heartPop_0.75s_ease-out_forwards] text-pink-500 drop-shadow-2xl">
            <Icon name="heart" size={105} filled />
          </div>
        </div>
      )}

      {/* PLAY / PAUSE */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Luaj videon"
          className="absolute left-1/2 top-1/2 z-20 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/40 backdrop-blur-md"
        >
          <Icon name="play" size={34} />
        </button>
      )}

      {/* SOUND BUTTON */}
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? 'Aktivizo zërin' : 'Çaktivizo zërin'}
        className="absolute right-4 top-5 z-30 grid h-11 w-11 place-items-center rounded-full bg-black/40 backdrop-blur-md"
      >
        <Icon name={muted ? 'mute' : 'volume'} size={23} />
      </button>

      {/* IKONAT DJATHTAS */}
      <div className="absolute bottom-28 right-3 z-30 flex flex-col items-center gap-5">

        {/* PROFILE */}
        <div className="relative mb-2">
          <Link
            href={`/profile/${v.user_id}`}
            aria-label={`Profili i ${username}`}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={username}
                loading="lazy"
                className="h-[52px] w-[52px] rounded-full border-2 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="grid h-[52px] w-[52px] place-items-center rounded-full border-2 border-white bg-purple-600 text-xl font-bold">
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
          icon="heart"
          label={likes.toLocaleString()}
          onClick={toggleLike}
          active={liked}
        />

        {/* COMMENTS */}
        <ActionButton
          icon="comment"
          label={commentsCount.toLocaleString()}
          onClick={loadComments}
        />

        {/* SAVE */}
        <ActionButton
          icon="bookmark"
          label={saved ? 'Ruajtur' : 'Ruaj'}
          onClick={toggleSave}
          active={saved}
        />

        {/* SHARE */}
        <ActionButton
          icon="share"
          label="Ndaj"
          onClick={shareVideo}
        />
      </div>

      {/* INFORMACIONI POSHTË MAJTAS */}
      <div className="absolute bottom-7 left-4 right-20 z-20">

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
              className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                following
                  ? 'border-white/60 bg-black/20'
                  : 'border-pink-500 bg-pink-500'
              }`}
            >
              {following ? 'Following ✓' : 'Follow'}
            </button>
          )}
        </div>

        {v.caption && (
          <p className="mb-3 max-w-full break-words text-sm leading-5 drop-shadow-md">
            {v.caption}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-white/80">
          <span>▶</span>
          <span>{views.toLocaleString()} shikime</span>
        </div>
      </div>

      {/* COMMENTS BOTTOM SHEET */}
      {commentsOpen && (
        <div
          className="absolute inset-0 z-50 bg-black/50"
          onClick={() => setCommentsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Komentet"
            className="absolute inset-x-0 bottom-0 flex h-[65%] flex-col rounded-t-3xl border-t border-white/10 bg-[#151515] p-4 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-bold">
                Komente ({commentsCount})
              </span>

              <button
                type="button"
                onClick={() => setCommentsOpen(false)}
                aria-label="Mbyll komentet"
                className="rounded-full p-2 text-white/70 hover:bg-white/10"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            {/* COMMENTS LIST */}
            <div className="flex-1 space-y-4 overflow-y-auto pb-4">
              {commentsLoading ? (
                <p className="py-8 text-center text-sm text-white/50">
                  Duke ngarkuar komentet...
                </p>
              ) : comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-3">
                    {c.profiles?.avatar_url ? (
                      <img
                        src={c.profiles.avatar_url}
                        alt=""
                        loading="lazy"
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
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

                      <p className="break-words text-sm">
                        {c.body}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-white/50">
                  Bëhu i pari që komenton ❤️
                </p>
              )}
            </div>

            {/* COMMENT INPUT */}
            <form
              onSubmit={sendComment}
              className="mb-5 flex items-center gap-2 border-t border-white/10 pt-3"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Shto koment..."
                maxLength={1000}
                className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-1 focus:ring-pink-500"
              />

              <button
                type="submit"
                disabled={!commentText.trim() || sending}
                aria-label="Dërgo komentin"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pink-500 text-white transition disabled:opacity-40"
              >
                <Icon name="send" size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
