import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

const sans = localFont({ src: '../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2', variable: '--dm-sans', weight: '100 1000', display: 'swap' });
const serif = localFont({ src: [
  { path: '../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2', weight: '100 900', style: 'normal' },
  { path: '../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-italic.woff2', weight: '100 900', style: 'italic' },
], variable: '--fraunces', display: 'swap' });

const description = 'Draw terrible things, guess each other’s thoughts, and ask the questions that matter. A private place to play for two.';
export const metadata: Metadata = {
  metadataBase: new URL('https://closely.byflux.me'),
  title: { default: 'Closely · A little world for just us', template: '%s · Closely' },
  description,
  manifest: '/manifest.json',
  icons: { apple: '/apple-touch-icon.png' },
  referrer: 'no-referrer',
  openGraph: { title: 'Closely · A little world for just us', description, url: '/', siteName: 'Closely', type: 'website', images: [{ url: '/og-closely.png', width: 1200, height: 630, alt: 'Closely. A little world for just us.' }] },
  twitter: { card: 'summary_large_image', title: 'Closely · A little world for just us', description, images: ['/og-closely.png'] },
};
export const viewport: Viewport = { themeColor: '#F9F7F1' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${sans.variable} ${serif.variable}`}><body>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <ServiceWorkerRegistration />
    {children}
  </body></html>;
}
