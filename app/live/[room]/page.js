'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { supabase } from '@/lib/supabase';

/* PANELI PËR TË FTUAR PERSONA QË JANË LIVE (brenda dhomës) */
function InvitePanel({ room, myId }) {
  const participants = useParticipants();
  const publishers = participants.filter((p) => p.permissions?.canPublish).length;
  const full = publishers >= 4;

  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [sent, setSent] = useState({});

  async function load() {
    const since = new Date(Date.now() - 60000).toISOString();
    const { data: lives } = await supabase
      .from('lives')
      .select('room,user_id,updated_at')
      .gt('updated_at', since)
      .neq('room', room);

    const ids = [
      ...new Set((lives || []).map((l) => l.user_id).filter((id) => id !== myId)),
    ];
    if (!ids.length) {
      setList([]);
      return;
    }
    const { data: profs } = await supabase
      .from('profiles')
      .select('id,username')
      .in('id', ids);

    setList(
      ids.map((id) => ({
        id,
        username: profs?.find((p) => p.id === id)?.username || 'përdorues',
      }))
    );
  }

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function invite(toId) {
    const { error } = await supabase
      .from('live_invites')
      .insert({ from_user: myId, to_user: toId, room });
    if (!error) setSent((s) => ({ ...s, [toId]: true }));
  }

  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 60 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'linear-gradient(90deg,#ff3b6b,#ffb020)',
          color: '#fff',
          border: 'none',
          borderRadius: 999,
          padding: '8px 16px',
          fontWeight: 700,
        }}
      >
        {open ? 'Mbyll' : `Fto (${publishers}/4)`}
      </button>

      {open && (
        <div
          style={{
            marginTop: 8,
            width: 260,
            maxHeight: 320,
            overflowY: 'auto',
            background: 'rgba(20,20,30,0.95)',
            borderRadius: 16,
            padding: 12,
            color: '#fff',
          }}
        >
          {full && (
            <p style={{ color: '#ffb020', marginBottom: 8 }}>
              Live është plot (4 persona).
            </p>
          )}
          {list.length === 0 && (
            <p style={{ opacity: 0.7 }}>Nuk ka persona live tani.</p>
          )}
          {list.map((u) => (
            <div
              key={u.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
              }}
            >
              <span>@{u.username}</span>
              <button
                disabled={full || sent[u.id]}
                onClick={() => invite(u.id)}
                style={{
                  background: sent[u.id] ? '#444' : '#ff3b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 999,
                  padding: '4px 12px',
                  opacity: full ? 0.5 : 1,
                }}
              >
                {sent[u.id] ? 'Dërguar' : 'Fto'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LivePage() {
  const { room } = useParams();
  const search = useSearchParams();
  const role = search.get('role') || 'viewer';
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [myId, setMyId] = useState(null);
  const [invite, setInvite] = useState(null);

  /* ID IME */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setMyId(data.session?.user?.id || null);
    });
  }, []);

  /* TOKEN */
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

  /* REGJISTRO LIVE NË LISTË (vetëm host) */
  useEffect(() => {
    if (role !== 'host' || !token) return;

    let timer;
    let stopped = false;

    async function start() {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (!uid || stopped) return;

      const beat = () =>
        supabase.from('lives').upsert({
          room,
          user_id: uid,
          updated_at: new Date().toISOString(),
        });

      await beat();
      timer = setInterval(beat, 20000);
    }
    start();

    return () => {
      stopped = true;
      clearInterval(timer);
      supabase.from('lives').delete().eq('room', room);
    };
  }, [room, role, token]);

  /* MARRJA E FTESAVE */
  useEffect(() => {
    if (!myId) return;

    async function showInvite(inv) {
      if (!inv || inv.room === room || inv.status !== 'pending') return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', inv.from_user)
        .maybeSingle();
      setInvite({ ...inv, username: prof?.username || 'dikush' });
    }

    // ftesa që ka ardhur në 2 minutat e fundit
    const since = new Date(Date.now() - 120000).toISOString();
    supabase
      .from('live_invites')
      .select('*')
      .eq('to_user', myId)
      .eq('status', 'pending')
      .gt('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data[0]) showInvite(data[0]);
      });

    const channel = supabase
      .channel(`invites-${myId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_invites',
          filter: `to_user=eq.${myId}`,
        },
        (payload) => showInvite(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, room]);

  async function acceptInvite() {
    await supabase
      .from('live_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id);
    window.location.href = `/live/${invite.room}?role=guest`;
  }

  async function declineInvite() {
    await supabase
      .from('live_invites')
      .update({ status: 'declined' })
      .eq('id', invite.id);
    setInvite(null);
  }

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
        onDisconnected={async () => {
          if (role === 'host') {
            await supabase.from('lives').delete().eq('room', room);
          }
          window.location.href = '/';
        }}
      >
        <VideoConference />
        {canPublish && myId && <InvitePanel room={room} myId={myId} />}
      </LiveKitRoom>

      {invite && (
        <div
          style={{
            position: 'fixed',
            left: 12,
            right: 12,
            top: 12,
            zIndex: 100,
            background: 'rgba(20,20,30,0.97)',
            color: '#fff',
            borderRadius: 16,
            padding: 14,
            textAlign: 'center',
          }}
        >
          <p style={{ marginBottom: 10 }}>
            @{invite.username} po të fton në live
          </p>
          <button
            onClick={acceptInvite}
            style={{
              background: '#ff3b6b',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '8px 20px',
              marginRight: 8,
              fontWeight: 700,
            }}
          >
            Prano
          </button>
          <button
            onClick={declineInvite}
            style={{
              background: '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '8px 20px',
            }}
          >
            Refuzo
          </button>
        </div>
      )}
    </div>
  );
}
