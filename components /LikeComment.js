'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LikeComment({ v, me }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(v.likes?.[0]?.count || 0);
  const [commentCount, setCommentCount] = useState(v.comments?.[0]?.count || 0);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  // a e ka pëlqyer ky përdorues videon?
  useEffect(() => {
    if (!me?.id) return;
    supabase
      .from('likes')
      .select('video_id')
      .eq('video_id', v.id)
      .eq('user_id', me.id)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [v.id, me?.id]);

  // ngarko komentet kur hapet dritarja
  useEffect(() => {
    if (!open) return;
    supabase
      .from('comments')
      .select('id,text,created_at,user_id,profiles(username,avatar_url)')
      .eq('video_id', v.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setComments(data || []));
  }, [open, v.id]);

  function needLogin() {
    window.location.href = '/login';
  }

  async function toggleLike() {
    if (!me?.id) return needLogin();
    if (liked) {
      setLiked(false);
      setLikes((n) => Math.max(0, n - 1));
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('video_id', v.id)
        .eq('user_id', me.id);
      if (error) {
        setLiked(true);
        setLikes((n) => n + 1);
      }
    } else {
      setLiked(true);
      setLikes((n) => n + 1);
      const { error } = await supabase
        .from('likes')
        .insert({ video_id: v.id, user_id: me.id });
      if (error) {
        setLiked(false);
        setLikes((n) => Math.max(0, n - 1));
      }
    }
  }

  async function addComment() {
    if (!me?.id) return needLogin();
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({ video_id: v.id, user_id: me.id, text: t })
      .select('id,text,created_at,user_id,profiles(username,avatar_url)')
      .single();
    setBusy(false);
    if (!error && data) {
      setComments((c) => [data, ...c]);
      setCommentCount((n) => n + 1);
      setText('');
    }
  }

  async function removeComment(id) {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (!error) {
      setComments((c) => c.filter((x) => x.id !== id));
      setCommentCount((n) => Math.max(0, n - 1));
    }
  }

  return (
    <>
      {/* butonat në anën e djathtë */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5 text-white">
        <button onClick={toggleLike} className="flex flex-col items-center active:scale-90">
          <span className="text-3xl">{liked ? '❤️' : '🤍'}</span>
          <span className="text-xs">{likes}</span>
        </button>
        <button onClick={() => setOpen(true)} className="flex flex-col items-center active:scale-90">
          <span className="text-3xl">💬</span>
          <span className="text-xs">{commentCount}</span>
        </button>
      </div>

      {/* dritarja e komenteve */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="flex max-h-[70vh] w-full flex-col rounded-t-3xl bg-[#161625] p-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">{commentCount} komente</h3>
              <button onClick={() => setOpen(false)} className="text-2xl">✕</button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {comments.length === 0 && (
                <p className="text-sm text-white/50">Ende nuk ka komente. Shkruaj të parin!</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{c.profiles?.username || 'përdorues'}</p>
                    <p className="text-sm text-white/90">{c.text}</p>
                  </div>
                  {me?.id === c.user_id && (
                    <button onClick={() => removeComment(c.id)} className="text-xs text-red-400">
                      Fshi
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addComment()}
                placeholder="Shto koment..."
                className="flex-1 rounded-full border border-white/10 bg-[#0b0b14] px-4 py-2 text-white outline-none placeholder-white/40"
              />
              <button
                onClick={addComment}
                disabled={busy || !text.trim()}
                className="rounded-full bg-gradient-to-r from-pink-500 to-yellow-400 px-5 font-bold text-black disabled:opacity-40"
              >
                Dërgo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
