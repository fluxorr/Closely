'use client';

import { SpeakerHighIcon } from '@phosphor-icons/react/dist/ssr/SpeakerHigh';
import { SpeakerXIcon } from '@phosphor-icons/react/dist/ssr/SpeakerX';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { playSound, serverSoundSettings, setSoundSettings, soundSettings, subscribeToSound, unlockSound } from '@/lib/audio/sound';

export function SoundControl() {
  const settings = useSyncExternalStore(subscribeToSound, soundSettings, serverSoundSettings);
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const unlock = () => { void unlockSound(); };
    const closeOutside = (event: PointerEvent) => {
      if (details.current?.open && event.target instanceof Node && !details.current.contains(event.target)) details.current.open = false;
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('pointerdown', closeOutside);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return <details className="sound-control" ref={details} onKeyDown={event => {
    if (event.key !== 'Escape' || !details.current?.open) return;
    details.current.open = false;
    details.current.querySelector('summary')?.focus();
  }}>
    <summary className="icon-button" aria-label="Sound settings" title={settings.enabled ? 'Sound on' : 'Sound muted'}>
      {settings.enabled ? <SpeakerHighIcon size={19} aria-hidden /> : <SpeakerXIcon size={19} aria-hidden />}
    </summary>
    <div className="sound-panel">
      <label><input type="checkbox" checked={settings.enabled} onChange={event => {
        const enabled = event.target.checked;
        setSoundSettings({ ...settings, enabled });
        if (enabled) void unlockSound().then(() => playSound('reveal'));
      }} /> Sound effects</label>
      <label className="sound-volume">Volume
        <input type="range" min="0" max="100" value={Math.round(settings.volume * 100)} disabled={!settings.enabled} onChange={event => setSoundSettings({ ...settings, volume: Number(event.target.value) / 100 })} />
      </label>
    </div>
  </details>;
}
