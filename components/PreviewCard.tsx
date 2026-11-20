'use client';

import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowCounterClockwise';
import { useState } from 'react';
import Image from 'next/image';

export function PreviewCard({ prompt }: { prompt: string }) {
  const [open, setOpen] = useState(false);
  return <button className={`preview-card${open ? ' is-open' : ''}`} type="button" onClick={() => setOpen(v => !v)} aria-pressed={open}>
    <span className="preview-face preview-front" aria-hidden={open}>
      <Image src="/brand/closely-mark.svg" width={48} height={48} unoptimized alt="" />
      <span>Turn me over</span>
      <ArrowCounterClockwiseIcon size={16} aria-hidden />
    </span>
    <span className="preview-face preview-back" aria-hidden={!open}><span className="tag">Fun</span><strong>{prompt}</strong><ArrowCounterClockwiseIcon size={16} aria-hidden /></span>
  </button>;
}
