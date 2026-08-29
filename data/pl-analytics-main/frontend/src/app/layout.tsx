import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'PL Analytics Pro - Premier League Statistics & Analysis', description: 'Professional football analytics platform with advanced stats, shot maps, player comparisons, and tactical analysis for Premier League and major competitions.', keywords: ['football analytics', 'Premier League stats', 'xG', 'shot maps', 'player comparison', 'football data'], authors: [{ name: 'PL Analytics Pro' }], openGraph: { title: 'PL Analytics Pro - Premier League Statistics', description: 'Advanced football analytics with xG, shot maps, player radar charts, and tactical analysis', type: 'website', locale: 'en_US', siteName: 'PL Analytics Pro' }, twitter: { card: 'summary_large_image', title: 'PL Analytics Pro', description: 'Professional football analytics platform' }, robots: { index: true, follow: true } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return ( <html lang="en"> <head> <link rel="preconnect" href="https://fonts.googleapis.com" /> <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" /> </head> <body className="antialiased">{children}</body> </html> );
}