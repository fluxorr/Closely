'use client';

import { useState } from 'react';
import Image from 'next/image';
import { RotateCcw } from 'lucide-react';

export function PreviewCard({ prompt }: { prompt: string }) {
  const [open, setOpen] = useState(false);
  return <button className={`preview-card${open ? ' is-open' : ''}`} type="button" onClick={() => setOpen(v => !v)} aria-pressed={open}>
    <span className="preview-face preview-front" aria-hidden={open}>
      <Image src="/brand/closely-mark.svg" width={48} height={48} unoptimized alt="" />
      <span>Turn me over</span>
      <RotateCcw size={16} aria-hidden />
    </span>
    <span className="preview-face preview-back" aria-hidden={!open}><span className="tag">Fun</span><strong>{prompt}</strong><RotateCcw size={16} aria-hidden /></span>
  </button>;
}
