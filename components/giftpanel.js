'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase' // ndrysho rrugën nëse duhet

export default function GiftPanel({ receiverId, videoId, room }) {
  const [open, setOpen] = useState(false)
  const [gifts, setGifts] = useState([])
  const [coins, setCoins] = useState(0)
  const [msg, setMsg] = useState('')

  async function loadCoins() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('coins').eq('id', user.id).single()
    setCoins(data?.coins ?? 0)
  }

  useEffect(() => {
    if (!open) return
    supabase.from('gifts').select('*').order('price').then(({ data }) => setGifts(data || []))
    loadCoins()
  }, [open])

  async function send(g) {
    setMsg('')
    const { error } = await supabase.rpc('send_gift', {
      p_receiver: receiverId,
      p_gift: g.id,
      p_video: videoId ? String(videoId) : null,
      p_room: room || null,
    })
    if (error) setMsg(error.message)
    else { setMsg('U dërgua ' + g.emoji); loadCoins() }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', fontSize: 30, cursor: 'pointer' }}>
        🎁
      </button>

      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.5)' }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '60%',
              overflowY: 'auto', background: '#111', color: '#fff',
              borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <b>Dërgo dhuratë</b>
              <span>🪙 {coins}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {gifts.map((g) => (
                <button key={g.id} onClick={() => send(g)}
                  style={{
                    background: '#222', border: '1px solid #333', borderRadius: 12,
                    padding: '10px 4px', color: '#fff', cursor: 'pointer'
                  }}>
                  <div style={{ fontSize: 32 }}>{g.emoji}</div>
                  <div style={{ fontSize: 11 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: '#facc15' }}>🪙 {g.price}</div>
                </button>
              ))}
            </div>

            {msg && <p style={{ textAlign: 'center', marginTop: 12 }}>{msg}</p>}
          </div>
        </div>
      )}
    </>
  )
}
