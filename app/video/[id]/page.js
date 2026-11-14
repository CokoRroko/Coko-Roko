'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase' // kontrollo emrin e skedarit te lib/

export default function VideoPage() {
  const { id } = useParams()
  const router = useRouter()

  const videoRef = useRef(null)
  const lastTap = useRef(0)
  const tapTimeout = useRef(null)
  const viewCounted = useRef(false)

  const [video, setVideo] = useState(null)
  const [userId, setUserId] = useState(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [views, setViews] = useState(0)
  const [showHeart, setShowHeart] = useState(false)
  const [error, setError] = useState(null)

  // 1. Përdoruesi aktual
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // 2. Merr video-n
  useEffect(() => {
    if (!id) return
    supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
          return
        }
        setVideo(data)
        setViews(data.views ?? 0)
      })
  }, [id])

  // 3. Numëro një shikim
  useEffect(() => {
    if (!id || viewCounted.current) return
    viewCounted.current = true

    const key = `viewed_${id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    supabase.rpc('increment_views', { p_video_id: id }).then(({ data, error }) => {
      if (!error && typeof data === 'number') setViews(data)
    })
  }, [id])

  // 4. Like-et
  useEffect(() => {
    if (!id) return
    async function loadLikes() {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', id)
      setLikeCount(count ?? 0)

      if (userId) {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('video_id', id)
          .eq('user_id', userId)
          .maybeSingle()
        setLiked(!!data)
      } else {
        setLiked(false)
      }
    }
    loadLikes()
  }, [id, userId])

  async function like() {
    if (!userId) {
      router.push('/login') // ndrysho nëse faqja e hyrjes ka emër tjetër
      return
    }
    if (liked) return
    setLiked(true)
    setLikeCount((c) => c + 1)
    const { error } = await supabase
      .from('likes')
      .insert({ video_id: id, user_id: userId })
    if (error) {
      setLiked(false)
      setLikeCount((c) => c - 1)
      console.error(error.message)
    }
  }

  async function unlike() {
    if (!userId || !liked) return
    setLiked(false)
    setLikeCount((c) => c - 1)
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('video_id', id)
      .eq('user_id', userId)
    if (error) {
      setLiked(true)
      setLikeCount((c) => c + 1)
      console.error(error.message)
    }
  }

  function toggleLike() {
    if (liked) unlike()
    else like()
  }

  // Double tap = like, një tap = play/pause
  function handleTap() {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      if (tapTimeout.current) clearTimeout(tapTimeout.current)
      lastTap.current = 0
      like()
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 800)
    } else {
      lastTap.current = now
      tapTimeout.current = setTimeout(() => {
        const v = videoRef.current
        if (v) {
          if (v.paused) v.play()
          else v.pause()
        }
      }, 300)
    }
  }

  function formatCount(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
    return String(n)
  }

  if (error) {
    return <div className="p-6 text-white">Gabim: {error}</div>
  }
  if (!video) {
    return <div className="p-6 text-white">Duke u ngarkuar...</div>
  }

  const videoUrl = video.url || video.video_url

  return (
    <div className="relative h-screen w-full bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        className="h-full w-full object-cover"
        loop
        playsInline
        autoPlay
        onClick={handleTap}
      />

      <button
        onClick={() => router.back()}
        className="absolute left-4 top-4 z-20 rounded-full bg-black/40 px-3 py-2 text-white"
      >
        ←
      </button>

      <div
        className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-all duration-500 ${
          showHeart ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        <svg width="110" height="110" viewBox="0 0 24 24" fill="#ef4444">
          <path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 2.7 4.5 6.3 4.5c2 0 3.3 1 4.2 2.3.4.5 1.4.5 1.8 0 .9-1.3 2.2-2.3 4.2-2.3 3.6 0 5.5 3.7 3.9 7.3C19.5 16.4 12 21 12 21z" />
        </svg>
      </div>

      <div className="absolute bottom-28 right-4 z-20 flex flex-col items-center gap-5">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={toggleLike}
            aria-label="Like"
            className="rounded-full bg-black/40 p-3 transition-transform active:scale-90"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill={liked ? '#ef4444' : 'none'}
              stroke={liked ? '#ef4444' : 'white'}
              strokeWidth="2"
            >
              <path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 2.7 4.5 6.3 4.5c2 0 3.3 1 4.2 2.3.4.5 1.4.5 1.8 0 .9-1.3 2.2-2.3 4.2-2.3 3.6 0 5.5 3.7 3.9 7.3C19.5 16.4 12 21 12 21z" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-white">{formatCount(likeCount)}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="rounded-full bg-black/40 p-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">{formatCount(views)}</span>
        </div>
      </div>

      {video.caption && (
        <p className="absolute bottom-24 left-4 right-24 z-20 text-white">{video.caption}</p>
      )}
    </div>
  )
}
