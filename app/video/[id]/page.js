'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase' // rregulloje rrugën sipas projektit

export default function CreateVideoPage() {
  const router = useRouter()
  const galleryRef = useRef(null)
  const cameraRef = useRef(null)

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setError(null)
  }

  async function publish() {
    if (!file) {
      setError('Zgjidh ose regjistro një video fillimisht.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        router.push('/login') // ndrysho nëse faqja e hyrjes ka emër tjetër
        return
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('videos') // emri i bucket-it në Supabase Storage
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path)

      const { data: inserted, error: insertError } = await supabase
        .from('videos')
        .insert({
          url: urlData.publicUrl,
          caption: caption.trim(),
          user_id: user.id,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      router.push(`/video/${inserted.id}`) // ndrysho nëse rruga e shikimit është tjetër
    } catch (err) {
      setError(err.message || 'Ndodhi një gabim gjatë ngarkimit.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b14] px-4 pb-32 pt-12 text-white">
      <h1 className="mb-6 text-3xl font-bold">Krijo video</h1>

      {/* Inputet e fshehura: pa "capture" për galerinë, me "capture" për kamerën */}
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
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {previewUrl ? (
        <div className="mb-4 overflow-hidden rounded-3xl border border-white/10">
          <video
            src={previewUrl}
            controls
            playsInline
            className="max-h-[50vh] w-full bg-black object-contain"
          />
        </div>
      ) : (
        <div className="mb-4 flex h-40 items-center justify-center rounded-3xl border-2 border-dashed border-white/20 text-white/60">
          Zgjidh një video nga galeria ose regjistro
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          disabled={uploading}
          className="rounded-2xl border border-white/10 bg-[#161625] py-3 font-medium active:scale-95"
        >
          📁 Nga galeria
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="rounded-2xl border border-white/10 bg-[#161625] py-3 font-medium active:scale-95"
        >
          📹 Regjistro
        </button>
      </div>

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
        disabled={uploading || !file}
        className="w-full rounded-full bg-gradient-to-r from-pink-500 to-yellow-400 py-4 text-lg font-bold text-black transition-opacity active:scale-95 disabled:opacity-40"
      >
        {uploading ? 'Duke u ngarkuar...' : 'Publiko'}
      </button>
    </div>
  )
}
