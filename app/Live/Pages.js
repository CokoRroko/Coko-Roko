'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function LiveList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data?.user || null))
  }, [])

  async function load() {
    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('lives')
      .select('*')
      .gte('updated_at', since)
      .order('updated_at', { ascending: false })

    const list = data || []
    const ids = list.map((l) => l.user_id)
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
    setItems(list.map((l) => ({ ...l, profile: map[l.user_id] || null })))
    setLoading(false)
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [])

  function goLive() {
    if (!me) window.location.assign('/login')
    else window.location.assign(`/live/${me.id}?role=host`)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#000', color: '#fff', padding: '70px 16px 90px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
        🔴 Live tani
      </h1>

      <button
        onClick={goLive}
        style={{
          width: '100%',
          padding: '14px 0',
          marginBottom: 20,
          borderRadius: 999,
          background: 'linear-gradient(90deg,#ff2d55,#ffa31a)',
          fontWeight: 800,
          fontSize: 16,
        }}
      >
        🔴 Fillo live
      </button>

      {loading ? (
        <p style={{ opacity: 0.6 }}>Duke u ngarkuar...</p>
      ) : items.length === 0 ? (
        <p style={{ opacity: 0.6 }}>Askush nuk është live tani.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((l) => (
            <Link
              key={l.room}
              href={`/live/${l.room}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 16,
                background: '#151515',
              }}
            >
              {l.profile?.avatar_url ? (
                <img
                  src={l.profile.avatar_url}
                  alt=""
                  style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff2d55' }}
                />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#7c3aed', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                  {(l.profile?.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>@{l.profile?.username || 'user'}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>Hyr në live</div>
              </div>
              <span style={{ background: '#ff2d55', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 800 }}>
                LIVE
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
