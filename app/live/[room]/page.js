'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { supabase } from '@/lib/supabase';

export default function LivePage() {
  const { room } = useParams();
  const search = useSearchParams();
  const role = search.get('role') || 'viewer';
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function getToken() {
      const { data } = await supabase.auth.getSession();
      const jwt = data.session?.access_token;
      if (!jwt) {
        setError('Duhet të hysh në llogari.');
        return;
      }
      const res = await fetch(`/api/livekit-token?room=${room}&role=${role}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const json = await res.json();
      if (json.token) setToken(json.token);
      else setError(json.error || 'Gabim');
    }
    getToken();
  }, [room, role]);

  if (error) return <p className="p-4 text-red-400">{error}</p>;
  if (!token) return <p className="p-4 text-white">Duke u lidhur...</p>;

  const canPublish = role === 'host' || role === 'guest';

  return (
    <div className="h-[100dvh] bg-black" data-lk-theme="default">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        video={canPublish}
        audio={canPublish}
        onDisconnected={() => (window.location.href = '/')}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
