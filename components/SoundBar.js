import Link from 'next/link';

export default function SoundBar({ sound }) {
  if (!sound) return null;
  const name = sound.creator?.username || 'përdorues';
  return (
    <Link href={`/sound/${sound.id}`} className="flex items-center gap-2 text-white text-sm">
      <span>🎵</span>
      <span className="truncate max-w-[180px]">{sound.title} · {name}</span>
      <img
        src={sound.creator?.avatar_url || '/default-avatar.png'}
        alt=""
        className="w-9 h-9 rounded-full object-cover border-2 border-white animate-spin"
        style={{ animationDuration: '4s' }}
      />
    </Link>
  );
}
