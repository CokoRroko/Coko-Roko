import { AccessToken } from 'livekit-server-sdk';
import { supabase } from '@/lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get('room');
  const role = searchParams.get('role') || 'viewer';

  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '');
  const { data } = await supabase.auth.getUser(token);
  const user = data?.user;

  if (!user || !room) {
    return Response.json({ error: 'Nuk je i identifikuar' }, { status: 401 });
  }

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: user.id }
  );

  at.addGrant({
    roomJoin: true,
    room,
    canSubscribe: true,
    canPublish: role === 'host' || role === 'guest',
    canPublishData: true,
  });

  return Response.json({ token: await at.toJwt() });
}
