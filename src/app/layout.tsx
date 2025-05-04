import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeInitializer from './ThemeInitializer';
import Footer from './components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'DnD Scheduler',
    description: 'Scheduling app for D&D sessions',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <head>
            <link rel="icon" href="/favicon.ico" />
            <title>DnD Scheduler</title>
        </head>
        <body className={inter.className}>
        <ThemeInitializer />
        <main className="flex-1">
            {children}
        </main>
        <Footer />
        </body>
        </html>
    );
}