"use client";
import { useEffect } from 'react';

export default function ThemeInitializer() {
    useEffect(() => {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');

        // Check if user has dark mode preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Set initial state based on saved preference or system preference
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    return null;
}