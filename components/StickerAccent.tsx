'use client';

import { SparkleTrioSticker } from 'stick-it-up';

export function StickerAccent({ className }: { className?: string }) {
  return <span className={className} aria-hidden="true"><SparkleTrioSticker size={61} focusable="false" /></span>;
}
