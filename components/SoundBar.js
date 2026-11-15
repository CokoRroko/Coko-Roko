import Link from 'next/link';

export default function SoundBar({ sound }) {
  if (!sound) return null;
  const name = sound.creator?.username || 'përdorues';

  return (
    <div className="flex flex-col gap-2 text-white">
      <Link
        href={`/sound/${sound.id}`}
        className="flex items-center gap-2 text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
      >
        <span>🎵</span>
        <span className="truncate max-w-[180px]">
          {sound.title} · {name}
        </span>
        <img
          src={sound.creator?.avatar_url || '/default-avatar.png'}
          alt=""
          className="w-9 h-9 rounded-full object-cover border-2 border-white animate-spin"
          style={{ animationDuration: '4s' }}
        />
      </Link>

      <Link
        href={`/create?sound=${sound.id}`}
        className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-yellow-400 px-4 py-2 text-xs font-bold text-black active:scale-95"
      >
        <span className="text-base leading-none">+</span>
        Posto videon tënde
      </Link>
    </div>
  );
}
