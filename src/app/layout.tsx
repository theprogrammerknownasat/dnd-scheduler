import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeInitializer from './ThemeInitializer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'DnD Scheduler',
    description: 'Scheduling app for D&D sessions',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <ThemeInitializer />
        {children}
        </body>
        </html>
    );
}