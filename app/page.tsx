import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Copy, HeartHandshake, Layers2, Send, Sparkles } from 'lucide-react';
import { Brand } from '@/components/Brand';
import { EntryButton } from '@/components/RoomEntry';
import { GameCover } from '@/components/GameCover';
import { PreviewCard } from '@/components/PreviewCard';
import { CARDS } from '@/lib/cards/data';
import { newGames } from '@/lib/rooms/catalog';

const sample = CARDS.find(card => card.id === '19')!;
const steps = [
  { title: 'Make a room', text: 'Pick a name and get a little corner of your own.', Icon: Layers2 },
  { title: 'Send the invite', text: 'Share a private link with your favorite person.', Icon: Send },
  { title: 'Pick something to play', text: 'Flip a card, draw something odd, or see if you think alike.', Icon: HeartHandshake },
];
export default function Home() {
  return <>
    <header className="site-header wrap"><Brand />
      <nav aria-label="Main navigation"><a href="#cards">Cards</a><a href="#games">Games</a><a href="#how">How it works</a></nav>
      <EntryButton kind="create" className="button small primary">Create a room <ArrowUpRight size={15} aria-hidden /></EntryButton>
    </header>
    <main id="main-content" className="wrap landing">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={15} aria-hidden /> Close, even when you’re not.</p>
          <h1 id="hero-title">A little world<br /> <em>for just us.</em></h1>
          <p className="hero-description">Draw terrible things. Guess each other’s thoughts. Ask the questions that matter. All together, live.</p>
          <div className="actions"><EntryButton kind="create">Create a room <ArrowUpRight size={17} aria-hidden /></EntryButton><EntryButton kind="join" className="button secondary" /></div>
          <p className="hero-foot">Two people, one private room. Just bring your person.</p>
        </div>
        <figure className="hero-art"><Image src="/assets/illustrations/world.webp" fill sizes="(max-width: 760px) 94vw, (max-width: 1200px) 55vw, 680px" alt="A paper note travels between two glowing rooms at twilight." preload /></figure>
      </section>
      <div className="section-divider"><a href="#cards" aria-label="Explore conversation cards"><ArrowDown size={16} aria-hidden /></a></div>
      <section id="cards" className="card-feature" aria-labelledby="cards-title">
        <div className="feature-copy"><p className="eyebrow">Conversation cards</p><h2 id="cards-title">Good questions.<br /> Better rabbit holes.</h2><p>Get silly, get thoughtful, or see what you both wrote when your answers turn over together.</p><EntryButton kind="create" className="button secondary">Play cards <ArrowUpRight size={16} aria-hidden /></EntryButton></div>
        <div className="card-demo"><Image src="/assets/illustrations/notes.webp" alt="" fill sizes="(max-width: 760px) 94vw, 58vw" /><PreviewCard prompt={sample.text} /></div>
      </section>
      <section id="games" className="landing-section" aria-labelledby="games-title"><div className="section-heading"><div><p className="eyebrow">Games for two</p><h2 id="games-title">What are we playing?</h2></div><p>A little teamwork, a little mischief, and something to draw very badly.</p></div>
        <div className="game-grid">{newGames.map(kind => <GameCover key={kind} kind={kind} action={<EntryButton kind="create" className="button text-button">Play together <ArrowUpRight size={16} aria-hidden /></EntryButton>} />)}</div>
      </section>
      <section id="how" className="landing-section how" aria-labelledby="how-title"><h2 id="how-title">From link to date night</h2><ol>{steps.map(({ title, text, Icon }) => <li key={title}><Icon size={27} strokeWidth={1.5} aria-hidden /><h3>{title}</h3><p>{text}</p></li>)}</ol></section>
      <section className="closing"><Image src="/assets/illustrations/waiting.webp" alt="" fill sizes="(max-width: 760px) 94vw, 54vw" /><div><Copy size={23} aria-hidden /><h2>Send a little closer.</h2><p>Make a room. We’ll save a seat for your person.</p><EntryButton kind="create">Create a room <ArrowUpRight size={16} aria-hidden /></EntryButton></div></section>
    </main>
    <footer className="site-footer wrap"><Brand /><p>Close, even when you’re not.</p><div className="footer-links"><Link href="/privacy">Privacy</Link><a href="https://github.com/fluxorr/closely">GitHub <ArrowUpRight size={14} aria-hidden /></a></div></footer>
  </>;
}
