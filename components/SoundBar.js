'use client';
import Link from 'next/link';

export default function SoundBar({ sound }) {
  if (!sound) return null;

  return (
    <Link
      href={`/sound/${sound.id}`}
      className="flex max-w-full items-center gap-2 text-xs font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
    >
      <span>🎵</span>
      <span className="truncate">{sound.title}</span>
    </Link>
  );
}
