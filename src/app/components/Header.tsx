// src/app/components/Header.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
    username: string;
    isAdmin: boolean;
}

export default function Header({ username, isAdmin }: HeaderProps) {
    const router = useRouter();
    const [darkMode, setDarkMode] = useState(false);

    // Initialize theme on component mount
    useEffect(() => {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');

        // Check if user has dark mode preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Set initial state based on saved preference or system preference
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Toggle dark mode
    const toggleDarkMode = () => {
        if (darkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }

        setDarkMode(!darkMode);
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });

            // Redirect to login page
            router.push('/login');
        } catch (err) {
            console.error('Error logging out:', err);
        }
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">DnD Scheduler</h1>
                <div className="flex flex-col sm:flex-row items-center">
          <span className="mr-0 sm:mr-4 mb-2 sm:mb-0 text-gray-700 dark:text-gray-300">
            Welcome, {username}
          </span>
                    <div className="flex space-x-2">
                        <button
                            onClick={toggleDarkMode}
                            className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {darkMode ? (
                                // Sun icon for light mode
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                // Moon icon for dark mode
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        {isAdmin && (
                            <button
                                onClick={() => router.push('/admin')}
                                className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700
                          dark:bg-indigo-500 dark:hover:bg-indigo-600"
                            >
                                Admin Dashboard
                            </button>
                        )}

                        <button
                            onClick={() => router.push('/calendar')}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700
                        dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            Calendar
                        </button>

                        <button
                            onClick={handleLogout}
                            className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300
                        dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}