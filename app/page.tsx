import { ArrowDownIcon } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import Image from 'next/image';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { EntryButton } from '@/components/RoomEntry';
import { GameCover } from '@/components/GameCover';
import { PreviewCard } from '@/components/PreviewCard';
import { games, newGames } from '@/lib/rooms/catalog';

const steps = [
  { title: 'Make a room', text: 'Pick a name and get a little corner of your own.' },
  { title: 'Send the invite', text: 'Share a private link with your favorite person.' },
  { title: 'Pick something to play', text: 'Flip a card, draw something odd, or see if you think alike.' },
];
export default function Home() {
  return <>
    <header className="site-header wrap"><Brand />
      <nav aria-label="Main navigation"><a href="#cards">Cards</a><a href="#games">Games</a><a href="#how">How it works</a></nav>
      <EntryButton kind="create" className="button small primary" />
    </header>
    <main id="main-content" className="wrap landing">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Close, even when you’re not.</p>
          <h1 id="hero-title">A little world<br /> <em>for just us.</em></h1>
          <p className="hero-description">Draw terrible things. Guess each other’s thoughts. Ask the questions that matter. All together, live.</p>
          <div className="actions"><EntryButton kind="create">Create a room <ArrowUpRightIcon size={17} aria-hidden /></EntryButton><EntryButton kind="join" className="button secondary" /></div>
          <p className="hero-foot">Two people, one private room. Just bring your person.</p>
        </div>
        <figure className="hero-art"><Image src="/assets/illustrations/world.webp" fill sizes="(max-width: 760px) 94vw, (max-width: 1200px) 55vw, 680px" alt="A paper note travels between two glowing rooms at twilight." preload /></figure>
      </section>
      <div className="section-divider"><a href="#cards" aria-label="Explore conversation cards"><ArrowDownIcon size={16} aria-hidden /></a></div>
      <section id="cards" className="card-feature" aria-labelledby="cards-title">
        <div className="feature-copy"><p className="eyebrow">Conversation cards</p><h2 id="cards-title">Good questions.<br /> Better rabbit holes.</h2><p>Get silly, get thoughtful, or see what you both wrote when your answers turn over together.</p><EntryButton kind="create" className="button secondary">Play cards</EntryButton></div>
        <div className="card-demo"><Image src="/assets/illustrations/notes.webp" alt="" fill sizes="(max-width: 760px) 94vw, 58vw" /><PreviewCard /></div>
      </section>
      <section id="games" className="landing-section" aria-labelledby="games-title"><div className="section-heading"><div><p className="eyebrow">Games for two</p><h2 id="games-title">What are we playing?</h2></div><p>A little teamwork, a little mischief, and something to draw very badly.</p></div>
        <div className="game-grid">{newGames.map((kind, index) => <GameCover key={kind} kind={kind} variant={index === 0 ? 'featured' : 'standard'} action={<EntryButton kind="create" className="button text-button">Play {games[kind].title} <ArrowRightIcon size={16} aria-hidden /></EntryButton>} />)}</div>
      </section>
      <section id="how" className="landing-section how" aria-labelledby="how-title"><h2 id="how-title">From link to date night</h2><ol>{steps.map(({ title, text }) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol></section>
      <section className="closing"><Image src="/assets/illustrations/waiting.webp" alt="" fill sizes="(max-width: 760px) 94vw, 54vw" /><div><h2>Send a little closer.</h2><p>Make a room. We’ll save a seat for your person.</p><EntryButton kind="create" /></div></section>
    </main>
    <footer className="site-footer wrap"><Brand /><p>Close, even when you’re not.</p><div className="footer-links"><Link href="/privacy">Privacy</Link><a href="https://github.com/fluxorr/closely">GitHub <ArrowUpRightIcon size={14} aria-hidden /></a></div></footer>
  </>;
}
