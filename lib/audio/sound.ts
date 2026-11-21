const cues = {
  card: 'book-flip-3',
  sealed: 'select-007',
  reveal: 'confirmation-003',
  finish: 'success-chime',
  notice: 'notification-pop',
} as const;
export type SoundCue = keyof typeof cues;
type SoundSettings = { enabled: boolean; volume: number };
const settingsKey = 'closely:sound';
const defaults: SoundSettings = { enabled: false, volume: 0.35 };
const listeners = new Set<() => void>();
let settings: SoundSettings | undefined;
let context: AudioContext | undefined;
const buffers = new Map<SoundCue, Promise<AudioBuffer>>();

export const serverSoundSettings = () => defaults;

export function soundSettings() {
  if (settings) return settings;
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey) ?? 'null');
    if (saved && typeof saved.enabled === 'boolean' && Number.isFinite(saved.volume)) {
      return settings = { enabled: saved.enabled, volume: Math.min(1, Math.max(0, saved.volume)) };
    }
  } catch { /* Sound still works for this session when storage is unavailable. */ }
  return settings = defaults;
}

export function subscribeToSound(listener: () => void) {
  listeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (event.key !== settingsKey && event.key !== null) return;
    settings = undefined;
    listener();
  };
  window.addEventListener('storage', sync);
  return () => { listeners.delete(listener); window.removeEventListener('storage', sync); };
}

export function setSoundSettings(next: SoundSettings) {
  settings = next;
  try { localStorage.setItem(settingsKey, JSON.stringify(next)); } catch { /* Keep the session preference. */ }
  for (const listener of listeners) listener();
}

export async function unlockSound() {
  if (!soundSettings().enabled || typeof AudioContext === 'undefined') return;
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') await context.resume();
  } catch { /* The browser may require another gesture. */ }
}

function load(audio: AudioContext, cue: SoundCue) {
  const previous = buffers.get(cue);
  if (previous) return previous;
  const pending = fetch(`/assets/audio/${cues[cue]}.mp3`)
    .then(response => {
      if (!response.ok) throw new Error('Sound unavailable');
      return response.arrayBuffer();
    })
    .then(data => audio.decodeAudioData(data))
    .catch(error => {
      buffers.delete(cue);
      throw error;
    });
  buffers.set(cue, pending);
  return pending;
}

export async function playSound(cue: SoundCue) {
  const audio = context;
  if (!audio || audio.state !== 'running' || !soundSettings().enabled || !soundSettings().volume || document.hidden) return;
  try {
    const buffer = await load(audio, cue);
    const { enabled, volume } = soundSettings();
    if (!enabled || !volume || document.hidden) return;
    const source = audio.createBufferSource();
    const gain = audio.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain).connect(audio.destination);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start();
  } catch { /* Interaction feedback remains visible when audio is unavailable. */ }
}
