
import { AccessToken } from 'livekit-server-sdk';
import { supabase } from '@/lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room');
    const role = searchParams.get('role') || 'viewer';

    const auth = req.headers.get('authorization') || '';
    const jwt = auth.replace('Bearer ', '');

    const { data, error } = await supabase.auth.getUser(jwt);
    const user = data?.user;

    if (error || !user || !room) {
      return Response.json(
        { error: 'Duhet të hysh në llogari.' },
        { status: 401 }
      );
    }

    if (role === 'host' && room !== user.id) {
      return Response.json(
        { error: 'Nuk ke leje të nisësh këtë LIVE.' },
        { status: 403 }
      );
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
      canPublish: role === 'host',
      canPublishData: true,
    });

    const token = await at.toJwt();

    return Response.json({ token });
  } catch (err) {
    console.error('LiveKit error:', err);
    return Response.json(
      { error: 'Gabim gjatë lidhjes me LIVE.' },
      { status: 500 }
    );
  }
}
