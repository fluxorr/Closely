'use client';

import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowCounterClockwise';
import { useState } from 'react';
import Image from 'next/image';
import { playSound } from '@/lib/audio/sound';

export function PreviewCard() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function turn() {
    void playSound('card');
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (prompt || loading) return;
    setFailed(false);
    setLoading(true);
    try {
      const response = await fetch('/api/questions/preview', { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Preview unavailable');
      const { question } = await response.json() as { question: { text: string } | null };
      setPrompt(question?.text ?? null);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const message = loading ? 'Loading preview…' : failed ? 'The preview couldn’t load.' : prompt ?? 'No preview card yet.';
  return <button className={`preview-card${open ? ' is-open' : ''}`} type="button" onClick={() => void turn()} aria-pressed={open} aria-busy={loading}>
    <span className="preview-face preview-front" aria-hidden={open}>
      <Image src="/brand/closely-mark.svg" width={48} height={48} unoptimized alt="" />
      <span>Turn me over</span>
      <ArrowCounterClockwiseIcon size={16} aria-hidden />
    </span>
    <span className="preview-face preview-back" aria-hidden={!open}><strong aria-live="polite">{message}</strong><ArrowCounterClockwiseIcon size={16} aria-hidden /></span>
  </button>;
}
