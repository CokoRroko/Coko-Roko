'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import VideoCard from '../components/VideoCard'

const NAV_H = 60

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
      const { data } = await q.limit(30)
      const list = data || []

      const ids = [...new Set(list.map((v) => v.user_id).filter(Boolean))]
      const map = {}
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('*')
          .in('id', ids)
        ;(profs || []).forEach((p) => {
          map[p.id] = p
        })
      }

      setVideos(
        list.map((v) => ({
          ...v,
          profiles: map[v.user_id] || null,
          profile: map[v.user_id] || null,
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
