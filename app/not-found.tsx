import Image from 'next/image';
import Link from 'next/link';
import { Brand } from '@/components/Brand';

export default function NotFound() {
  return <main className="entry-screen wrap" id="main-content"><Brand /><section className="entry-panel"><Image src="/assets/illustrations/notes.webp" width={520} height={347} alt="" /><div><h1>This note got lost.</h1><p>Head home to make a room or join your partner.</p><Link className="button primary" href="/">Back to Closely</Link></div></section></main>;
}
