import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const META_URL = "https://closely.example.com";
const META_IMG = `${META_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(META_URL),
  title: {
    default: "Closely",
    template: "%s | Closely",
  },
  description: "Get Closer to your LDR Partner. Share moments, play games, and stay connected with your long-distance love.",
  keywords: ["LDR", "long distance relationship", "couples", "connection", "together", " Valentine's Day", "gift"],
  authors: [{ name: "Fluxorr" }],
  creator: "Fluxorr",
  publisher: "Closely",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: {
      default: "Closely",
      template: "%s | Closely",
    },
    description: "Get Closer to your LDR Partner. Share moments, play games, and stay connected with your long-distance love.",
    url: META_URL,
    siteName: "Closely",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: META_IMG,
        width: 1200,
        height: 630,
        alt: "Closely - Stay connected with your loved ones",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "Closely",
      template: "%s | Closely",
    },
    description: "Get Closer to your LDR Partner. Share moments, play games, and stay connected with your long-distance love.",
    images: [META_IMG],
    creator: "@Fluxorr",
  },
  alternates: {
    canonical: META_URL,
    languages: {
      en: META_URL,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <Analytics />

<body className="min-h-full flex flex-col">
        <ThemeProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "Closely",
                description: "Get Closer to your LDR Partner. Share moments, play games, and stay connected with your long-distance love.",
                url: META_URL,
                applicationCategory: "SocialNetworking",
                operatingSystem: "Web Browser",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                },
                creator: {
                  "@type": "Organization",
                  name: "Closely",
                  creator: "Fluxorr",
                },
              }),
            }}
          />
          {children}
        </ThemeProvider>
        <div className="-my-6">
          <header className="flex items-center justify-center text-xs font-serif font-semibold">made with love, for love</header>
          <header className="flex items-center justify-center text-[10px] font-mono font-light">-Fluxorr</header>
        </div>
      </body>
    </html>
  );
}
