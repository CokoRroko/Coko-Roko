'use client';
import Link from 'next/link';

export default function SoundDisc({ sound }) {
  if (!sound) return null;
  const owner = sound.owner;

  return (
    <Link
      href={`/sound/${sound.id}`}
      onClick={(e) => e.stopPropagation()}
      aria-label="Shiko zërin"
      className="block"
    >
      <style>{`@keyframes coko-spin{to{transform:rotate(360deg)}}`}</style>
      <div
        className="h-12 w-12 rounded-full border border-white/20 bg-gradient-to-br from-zinc-600 to-black p-1 shadow-lg"
        style={{ animation: 'coko-spin 6s linear infinite' }}
      >
        <img
          src={owner?.avatar_url || '/avatar.svg'}
          alt=""
          className="h-full w-full rounded-full object-cover"
        />
      </div>
    </Link>
  );
}
