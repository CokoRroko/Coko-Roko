'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function VideoPage() {
  const { id } = useParams()
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadVideo() {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        setError(error.message)
      } else {
        setVideo(data)
      }
      setLoading(false)
    }

    if (id) loadVideo()
  }, [id])

  if (loading) {
    return <p className="p-4 text-white">Duke ngarkuar...</p>
  }

  if (error || !video) {
    return <p className="p-4 text-red-500">Videoja nuk u gjet.</p>
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#0b0b14] p-4 text-white">
      <video
        src={video.url}
        controls
        playsInline
        autoPlay
        loop
        className="max-h-[80vh] rounded-3xl"
      />
      <p className="mt-4 text-lg">{video.caption}</p>
    </main>
  )
}
