import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeInitializer from './ThemeInitializer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'DnD Scheduler',
    description: 'Scheduling app for D&D sessions',
    icons: {
        icon: '/favicon.ico',
    },

};

const initializeDatabase = async () => {
    try {
        const response = await fetch(process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000/api/init'
                : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/init`,
            { cache: 'no-store' });

        const data = await response.json();
        console.log('Database initialization:', data.message);
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
};

// Call the init function in server component
initializeDatabase();

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
        {children}
        </body>
        </html>
    );
}