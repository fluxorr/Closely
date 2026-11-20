'use client';

import { Brush, Eraser, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { inkColors } from '@/lib/rooms/catalog';
import type { Stroke } from '@/lib/rooms/actions';
import type { SendAction } from './ConversationTable';

const colors = { ink: '#292827', rose: '#b13d64', sage: '#486a40', sky: '#295b91' };
function paint(context: CanvasRenderingContext2D, stroke: Stroke, width: number, height: number) {
  const [[x,y], ...points] = stroke.points;
  context.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = stroke.erase ? width * .033 : width * .009;
  context.strokeStyle = context.fillStyle = colors[stroke.ink];
  context.beginPath();
  if (points.length === 0) {
    context.arc(x * width, y * height, context.lineWidth / 2, 0, 2 * Math.PI);
    context.fill();
  } else {
    context.moveTo(x * width, y * height);
    for (const [px,py] of points) context.lineTo(px * width, py * height);
    context.stroke();
  }
  context.globalCompositeOperation = 'source-over';
}
export function DrawingBoard({ drawing, editable, send, disabled }: { drawing: Stroke[]; editable: boolean; send: SendAction; disabled: boolean }) {
  const board = useRef<HTMLCanvasElement>(null);
  const draft = useRef<Stroke | null>(null);
  const latest = useRef(drawing);
  const pointer = useRef<number | null>(null);
  const buffering = useRef(false);
  const carried = useRef(false);
  const [ink, setInk] = useState<Stroke['ink']>('ink');
  const [erase, setErase] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const repaint = () => {
    const canvas = board.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of latest.current) paint(context, stroke, canvas.width, canvas.height);
    if (draft.current) paint(context, draft.current, canvas.width, canvas.height);
  };
  useEffect(() => {
    latest.current = drawing;
    repaint();
  }, [drawing]);
  useEffect(() => {
    const canvas = board.current;
    if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => {
      const ratio = Math.min(devicePixelRatio, 2);
      canvas.width = Math.max(1, Math.round(entry.contentRect.width * ratio));
      canvas.height = Math.max(1, Math.round(entry.contentRect.height * ratio));
      repaint();
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  const point = (e: PointerEvent<HTMLCanvasElement>): [number,number] => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.round(Math.min(1, Math.max(0,v)) * 10000) / 10000;
    return [clamp((e.clientX-left)/width), clamp((e.clientY-top)/height)];
  };
  useEffect(() => {
    if (!editable) return;
    const flush = async () => {
      const stroke = draft.current;
      const drawingNow = pointer.current !== null;
      if (!stroke || buffering.current || disabled || drawingNow && stroke.points.length < 2) return;
      if (!drawingNow && carried.current && stroke.points.length === 1) { draft.current = null; return; }
      buffering.current = true;
      const count = stroke.points.length;
      const last = stroke.points.at(-1)!;
      const accepted = await send({ type: 'stroke', stroke: { ...stroke, points: stroke.points.slice() } });
      if (accepted && draft.current?.group === stroke.group) {
        carried.current = true;
        const remaining = stroke.points.slice(count);
        if (pointer.current !== null || remaining.length) stroke.points = [last, ...remaining];
        else draft.current = null;
        repaint();
      }
      buffering.current = false;
    };
    const timer = window.setInterval(() => void flush(), 360);
    return () => window.clearInterval(timer);
  }, [disabled, editable, send]);
  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!editable || disabled || draft.current || pointer.current !== null || e.button !== 0) return;
    pointer.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    carried.current = false;
    draft.current = { group: crypto.randomUUID(), points: [point(e)], ink, erase };
    repaint();
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    const stroke = draft.current;
    if (!stroke || pointer.current !== e.pointerId) return;
    const next = point(e);
    const last = stroke.points.at(-1)!;
    if (Math.hypot(next[0]-last[0], next[1]-last[1]) < .002) return;
    if (stroke.points.length >= 179) return;
    stroke.points.push(next);
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (ctx) paint(ctx, { ...stroke, points: [last, next] }, canvas.width, canvas.height);
  };
  const finish = (e: PointerEvent<HTMLCanvasElement>) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  return <div className="drawing-board">
    <canvas ref={board} className={editable ? 'drawable' : ''} aria-label={editable ? 'Drawing canvas. Use your finger, mouse, or pen to sketch the secret prompt.' : 'Your partner’s drawing canvas'} onPointerDown={down} onPointerMove={move} onPointerUp={finish} onLostPointerCapture={finish} onPointerCancel={finish} />
    {editable && <div className="drawing-tools" role="group" aria-label="Drawing tools">
      <button className="icon-button" title="Brush" aria-label="Brush" aria-pressed={!erase} onClick={() => setErase(false)}><Brush size={18} aria-hidden /></button>
      <button className="icon-button" title="Eraser" aria-label="Eraser" aria-pressed={erase} onClick={() => setErase(true)}><Eraser size={18} aria-hidden /></button>
      {inkColors.map(color => <button key={color} className={`icon-button pen pen-${color}`} aria-label={`${color} ink`} aria-pressed={ink === color && !erase} onClick={() => { setInk(color); setErase(false); }}><span aria-hidden /></button>)}
      <button className="icon-button" title="Undo stroke" aria-label="Undo stroke" disabled={disabled || !drawing.length} onClick={() => void send({ type: 'drawing-undo' })}><RotateCcw size={17} aria-hidden /></button>
      <button className="icon-button" title="Clear drawing" aria-label="Clear drawing" disabled={disabled || !drawing.length} onClick={() => setConfirmClear(true)}><Trash2 size={17} aria-hidden /></button>
    </div>}
    {editable && confirmClear && <div className="actions" role="group" aria-label="Confirm clear drawing"><button className="button primary" disabled={disabled} onClick={() => { setConfirmClear(false); void send({ type: 'drawing-clear' }); }}>Clear the canvas</button><button className="button secondary" onClick={() => setConfirmClear(false)}>Keep drawing</button></div>}
  </div>;
}
