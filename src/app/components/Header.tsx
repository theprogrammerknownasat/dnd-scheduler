// src/app/components/Header.tsx with tutorial integration
import React, { useState } from 'react';
import HelpButton from './guided-help/HelpButton';
import { useRouter } from 'next/navigation';

interface HeaderProps {
    username: string;
    isAdmin?: boolean;
    children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ username, isAdmin = false, children }) => {
    const router = useRouter();

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
        <header className="bg-gray-800 shadow rounded-lg p-4 mb-4 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center">
                    <h1
                        className="text-xl font-bold cursor-pointer"
                        onClick={() => router.push('/calendar')}
                    >
                        DnD Scheduler
                    </h1>
                    <div className="flex items-center px-10">
                        <HelpButton/>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center mt-2 sm:mt-0">
                    <span className="mr-0 sm:mr-4 mb-2 sm:mb-0 text-gray-300 px-5">
                        Welcome, {username}
                    </span>
                    <div className="flex space-x-2">
                        {isAdmin && (
                            <button
                                onClick={() => router.push('/admin')}
                                className="bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-700"
                            >
                                Admin
                            </button>
                        )}

                        <button
                            onClick={() => router.push('/calendar')}
                            className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                        >
                            Calendar
                        </button>

                        <button
                            onClick={() => router.push('/profile')}
                            className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                        >
                            Profile
                        </button>

                        <button
                            onClick={handleLogout}
                            className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;