import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Closely",
  description: "Get Closer to your LDR Partner.",
  metadataBase: new URL("https://closely.example.com"),
  openGraph: {
    title: "Closely",
    description: "Get Closer to your LDR Partner.",
    url: "https://closely.example.com",
    siteName: "Closely",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Closely",
    description: "Get Closer to your LDR Partner.",
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

        {children}</body>
      <div className="-my-6" >
        <header className="flex items-center justify-center text-xs font-serif font-semibold" >made with love, for love</header>
        <header className="flex items-center justify-center text-[10px] font-mono font-light" >-Fluxorr</header>
      </div>

    </html>
  );
}
