'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export default function SoundPage({ params }) {
  const [sound, setSound] = useState(null);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase
        .from('sounds')
        .select('*, creator:profiles(username, avatar_url)')
        .eq('id', params.id).single();
      setSound(s);
      const { data: v } = await supabase
        .from('videos').select('*').eq('sound_id', params.id)
        .order('created_at', { ascending: false });
      setVideos(v || []);
    })();
  }, [params.id]);

  if (!sound) return <p className="p-4 text-white">Duke ngarkuar...</p>;

  return (
    <div className="p-4 text-white">
      <div className="flex items-center gap-3">
        <img src={sound.creator?.avatar_url || '/default-avatar.png'}
             className="w-20 h-20 rounded-full object-cover animate-spin"
             style={{ animationDuration: '6s' }} alt="" />
        <div>
          <h1 className="font-bold">{sound.title}</h1>
          <p className="text-sm opacity-70">@{sound.creator?.username}</p>
          <p className="text-sm opacity-70">{videos.length} video</p>
        </div>
      </div>
      <Link href={`/create?sound=${sound.id}`}
            className="block text-center bg-pink-600 rounded-lg py-3 mt-4 font-semibold">
        Përdor këtë zë
      </Link>
      <div className="grid grid-cols-3 gap-1 mt-4">
        {videos.map(v => (
          <Link key={v.id} href={`/video/${v.id}`}>
            <video src={v.url} className="w-full aspect-[9/16] object-cover" muted />
          </Link>
        ))}
      </div>
    </div>
  );
}
