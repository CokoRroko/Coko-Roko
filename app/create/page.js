'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Madhësia maksimale e videos në MB (ndryshoje nëse të duhet)
const MAX_MB = 30

export default function CreateVideoPage() {
  const router = useRouter()
  const galleryRef = useRef(null)
  const cameraRef = useRef(null)

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [facing, setFacing] = useState('environment')

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    e.target.value = ''

    const sizeMb = f.size / (1024 * 1024)
    if (sizeMb > MAX_MB) {
      setError(
        `Videoja është shumë e madhe (${sizeMb.toFixed(0)} MB). Maksimumi është ${MAX_MB} MB. Vendose kamerën në 720p ose 1080p 30fps dhe provo prapë.`
      )
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setError(null)
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setError(null)
  }

  async function publish() {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        router.push('/login')
        return
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
      const path = `${user.id}/${Date.now()}.${ext}`

      // cacheControl: shfletuesi e ruan videon 1 vit, nuk e shkarkon çdo herë
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
          cacheControl: '31536000',
        })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path)

      // ZËRI: nëse vjen nga /create?sound=ID përdor atë zë,
      // përndryshe krijo zë të ri me emrin e atij që po poston
      let soundId = new URLSearchParams(window.location.search).get('sound')

      if (!soundId) {
        const { data: newSound } = await supabase
          .from('sounds')
          .insert({
            title: 'Zëri origjinal',
            audio_url: urlData.publicUrl,
            created_by: user.id,
          })
          .select('id')
          .single()
        soundId = newSound?.id || null
      }

      const { data: inserted, error: insertError } = await supabase
        .from('videos')
        .insert({
          url: urlData.publicUrl,
          caption: caption.trim(),
          user_id: user.id,
          sound_id: soundId,
        })
        .select('id')
        .single()
      if (insertError) throw insertError

      router.push(`/video/${inserted.id}`)
    } catch (err) {
      setError(err.message || 'Ndodhi një gabim gjatë ngarkimit.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b14] px-4 pb-32 pt-12 text-white">
      <h1 className="mb-6 text-3xl font-bold">Krijo video</h1>

      {/* Dy input të veçanta */}
      <input
        ref={galleryRef}
        type="file"
        accept="video/*"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="video/*"
        capture={facing}
        onChange={handleFile}
        className="hidden"
      />

      {!file ? (
        /* HAPI 1: zgjedh mënyrën, dy opsione të ndara */
        <div className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="rounded-3xl border border-white/10 bg-[#161625] p-5">
            <p className="mb-1 text-lg font-bold">📹 Regjistro me kamerë</p>
            <p className="mb-4 text-sm text-white/60">Hap kamerën dhe regjistro direkt.</p>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="w-full rounded-full bg-gradient-to-r from-pink-500 to-yellow-400 py-3 font-bold text-black active:scale-95"
            >
              Hap kamerën
            </button>
            <button
              type="button"
              onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
              className="mt-3 w-full text-sm text-white/70 underline"
            >
              🔄 Kamera: {facing === 'environment' ? 'prapa' : 'para (selfie)'}
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#161625] p-5">
            <p className="mb-1 text-lg font-bold">📁 Zgjidh nga galeria</p>
            <p className="mb-4 text-sm text-white/60">Merr një video që e ke tashmë në telefon.</p>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="w-full rounded-full border border-white/20 py-3 font-bold active:scale-95"
            >
              Hap galerinë
            </button>
          </div>
        </div>
      ) : (
        /* HAPI 2: pamja paraprake + përshkrimi + publiko */
        <div>
          <div className="mb-3 overflow-hidden rounded-3xl border border-white/10">
            <video
              src={previewUrl}
              controls
              playsInline
              className="max-h-[50vh] w-full bg-black object-contain"
            />
          </div>

          <button
            type="button"
            onClick={reset}
            disabled={uploading}
            className="mb-4 w-full rounded-2xl border border-white/10 bg-[#161625] py-2 text-sm active:scale-95"
          >
            ↩️ Ndrysho (kamera ose galeria)
          </button>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Përshkrimi..."
            rows={3}
            className="mb-4 w-full resize-none rounded-2xl border border-white/10 bg-[#161625] p-4 text-white placeholder-white/40 outline-none"
          />

          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={publish}
            disabled={uploading}
            className="w-full rounded-full bg-gradient-to-r from-pink-500 to-yellow-400 py-4 text-lg font-bold text-black transition-opacity active:scale-95 disabled:opacity-40"
          >
            {uploading ? 'Duke u ngarkuar...' : 'Publiko'}
          </button>
        </div>
      )}
    </div>
  )
}
