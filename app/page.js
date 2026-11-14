'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import useUser from '@/lib/useUser';
import VideoCard from '@/components/VideoCard';

const Q = '*,profiles(username,avatar_url),likes(count),comments(count)';

export default function VideoPage() {
  const { id } = useParams();
  const me = useUser();
  const [v, setV] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('videos')
      .select(Q)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setV(data || null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <p className="p-4 text-white">Duke ngarkuar...</p>;
  }

  if (!v) {
    return <p className="p-4 text-red-500">Videoja nuk u gjet.</p>;
  }

  return (
    <div className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory">
      <VideoCard v={v} me={me} />
    </div>
  );
}
