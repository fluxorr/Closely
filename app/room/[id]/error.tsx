'use client';

import Image from 'next/image';
import { Brand } from '@/components/Brand';

export default function RoomError({ reset }: { reset: () => void }) {
  return <main className="entry-screen wrap" id="main-content"><Brand /><section className="entry-panel">
    <Image src="/assets/illustrations/notes.webp" width={520} height={347} alt="" />
    <div><h1>The room couldn’t open.</h1><p>Try connecting again in a moment.</p><button className="button primary" onClick={reset}>Try again</button></div>
  </section></main>;
}
