import type { Metadata } from 'next';
import Link from 'next/link';
import { Brand } from '@/components/Brand';

export const metadata: Metadata = { title: 'Room privacy' };
export default function PrivacyPage() {
  return <main id="main-content" className="entry-screen wrap"><Brand /><article className="privacy-paper">
    <h1>Room privacy</h1>
    <p>Closely uses a guest cookie to recognize your seat when you refresh. The room stores the names and avatar colors you choose, plus the chat and activity data needed to keep both players in sync.</p>
    <p>Share the invitation with the person you want to play with. Each room has two seats. In Answer &amp; Reveal, responses stay private until you both lock an answer. Passing clears the sealed responses.</p>
    <p>Rooms expire seven days after creation. Expired rooms and their related data are removed by scheduled cleanup. Closely uses Ably for room updates and presence. Shared update messages carry a state version.</p>
    <Link className="button secondary" href="/">Back to Closely</Link>
  </article></main>;
}
