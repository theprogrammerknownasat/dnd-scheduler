// src/app/components/Header.tsx
"use client";
import { useRouter } from 'next/navigation';

interface HeaderProps {
    username: string;
    isAdmin: boolean;
}

export default function Header({ username, isAdmin }: HeaderProps) {
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
        <header className="bg-white shadow rounded-lg p-4 mb-4 flex flex-col sm:flex-row items-center justify-between">
            <h1 className="text-xl font-bold mb-2 sm:mb-0">DnD Scheduler</h1>
            <div className="flex flex-col sm:flex-row items-center">
                <span className="mr-0 sm:mr-4 mb-2 sm:mb-0">Welcome, {username}</span>
                <div className="flex space-x-2">
                    {isAdmin && (
                        <button
                            onClick={() => router.push('/admin')}
                            className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                        >
                            Admin Dashboard
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}