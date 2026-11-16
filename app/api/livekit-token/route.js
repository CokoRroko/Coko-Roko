import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room');
    const role = searchParams.get('role') || 'viewer';

    const auth = req.headers.get('authorization') || '';
    const jwt = auth.replace('Bearer ', '');

    // klient Supabase që vepron si përdoruesi (që RLS të funksionojë)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

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

    // mysafiri duhet të ketë ftesë të pranuar për këtë dhomë
    if (role === 'guest') {
      const { data: inv } = await supabase
        .from('live_invites')
        .select('id')
        .eq('to_user', user.id)
        .eq('room', room)
        .eq('status', 'accepted')
        .limit(1);

      if (!inv || inv.length === 0) {
        return Response.json(
          { error: 'Nuk ke ftesë për këtë LIVE.' },
          { status: 403 }
        );
      }
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
