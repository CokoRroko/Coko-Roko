'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import VideoCard from '../components/VideoCard'

const NAV_H = 60

function countBy(rows) {
  const m = {}
  ;(rows || []).forEach((r) => {
    m[r.video_id] = (m[r.video_id] || 0) + 1
  })
  return m
}

export default function Home() {
  const [tab, setTab] = useState('viral')
  const [videos, setVideos] = useState([])
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data?.user || null))
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)

      let q = supabase.from('videos').select('*')
      if (tab === 'viral') {
        q = q
          .order('views', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
      } else {
        q = q.order('created_at', { ascending: false })
      }

      const { data, error } = await q.limit(30)
      if (error) console.error('Videos error:', error.message)
      const list = data || []

      const ids = list.map((v) => v.id)
      const userIds = [...new Set(list.map((v) => v.user_id).filter(Boolean))]

      const empty = Promise.resolve({ data: [] })
      const [likesRes, commentsRes, savesRes, profsRes] = await Promise.all([
        ids.length
          ? supabase.from('likes').select('video_id').in('video_id', ids)
          : empty,
        ids.length
          ? supabase.from('comments').select('video_id').in('video_id', ids)
          : empty,
        ids.length
          ? supabase.from('saves').select('video_id').in('video_id', ids)
          : empty,
        userIds.length
          ? supabase.from('profiles').select('*').in('id', userIds)
          : empty,
      ])

      const likeMap = countBy(likesRes.data)
      const commentMap = countBy(commentsRes.data)
      const saveMap = countBy(savesRes.data)

      const profMap = {}
      ;(profsRes.data || []).forEach((p) => {
        profMap[p.id] = p
      })

      setVideos(
        list.map((v) => ({
          ...v,
          likes: [{ count: likeMap[v.id] || 0 }],
          comments: [{ count: commentMap[v.id] || 0 }],
          saves: [{ count: saveMap[v.id] || 0 }],
          profiles: profMap[v.user_id] || null,
          profile: profMap[v.user_id] || null,
        }))
      )
      setLoading(false)
    }
    load()
  }, [tab])

  return (
    <div style={{ position: 'relative', background: '#000' }}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          padding: '14px 0',
          color: '#fff',
          fontWeight: 700,
          background: 'linear-gradient(#000a, transparent)',
        }}
      >
        <button
          onClick={() => setTab('viral')}
          style={{ opacity: tab === 'viral' ? 1 : 0.5 }}
        >
          🔥 Viral
        </button>
        <button
          onClick={() => setTab('new')}
          style={{ opacity: tab === 'new' ? 1 : 0.5 }}
        >
          Të rejat
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#fff', textAlign: 'center', paddingTop: '40vh' }}>
          Duke u ngarkuar...
        </div>
      ) : videos.length === 0 ? (
        <div style={{ color: '#fff', textAlign: 'center', paddingTop: '40vh' }}>
          Ende nuk ka video.
        </div>
      ) : (
        <div
          style={{
            height: `calc(100dvh - ${NAV_H}px)`,
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
          }}
        >
          {videos.map((v) => (
            <div
              key={v.id}
              style={{
                height: `calc(100dvh - ${NAV_H}px)`,
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                overflow: 'hidden',
              }}
            >
              <VideoCard v={v} me={me} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
