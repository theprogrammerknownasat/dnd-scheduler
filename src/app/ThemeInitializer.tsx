// src/app/ThemeInitializer.tsx
"use client";
import { useEffect } from 'react';

const ThemeInitializer = () => {
    // Initialize theme
    useEffect(() => {
        // Check for dark mode preference
        if (localStorage.theme === 'dark' ||
            (!('theme' in localStorage) &&
                window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Set up listener for system preference changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (!('theme' in localStorage)) {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Initialize database on client-side only
    useEffect(() => {
        const initializeDatabase = async () => {
            try {
                const response = await fetch('/api/init', { cache: 'no-store' });
                await response.json();
            } catch (error) {
                console.error('Failed to initialize database:', error);
            }
        };

        initializeDatabase();
    }, []);

    // This component doesn't render anything visible
    return null;
};

export default ThemeInitializer;