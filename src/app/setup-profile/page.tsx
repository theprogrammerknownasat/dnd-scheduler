// src/app/setup-profile/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HelpButton from '../components/guided-help/HelpButton';

export default function SetupProfile() {
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showHelp, setShowHelp] = useState(false);

    const router = useRouter();

    // Check if user is authenticated and needs to set up profile
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // First, check if user is authenticated
                const authResponse = await fetch('/api/auth/me');
                const authData = await authResponse.json();

                if (!authData.success) {
                    // Redirect to login if not authenticated
                    router.push('/login');
                    return;
                }

                setUsername(authData.username);

                // Check if user already has a display name
                const profileResponse = await fetch('/api/profile');
                const profileData = await profileResponse.json();

                if (profileData.success && profileData.profile.displayName) {
                    // Redirect to calendar if profile is already set up
                    router.push('/calendar');
                    return;
                }

                setLoading(false);
            } catch (err) {
                console.error('Error checking auth:', err);
                setError('An error occurred. Please try again.');
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate form
        if (!displayName.trim()) {
            setError('Display name is required');
            return;
        }

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName }),
            });

            const data = await response.json();

            if (data.success) {
                // Show help guide instead of immediately redirecting
                router.push('/calendar');
                setShowHelp(true);
            } else {
                setError(data.error || 'Failed to update profile');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('An error occurred. Please try again.');
        }
    };

    // Handle help completion - redirect to calendar
    const handleHelpCompleted = () => {
        router.push('/calendar');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (showHelp) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                <HelpButton onboardingMode={true} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome to DnD Scheduler!</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Let's set up your profile before we continue.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                        bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                            value={username}
                            readOnly
                            disabled
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Your username is assigned by the admin and cannot be changed
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Display Name
                        </label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Set your display name"
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            This is how your name will appear to others in the scheduler
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 px-4 border border-transparent text-sm font-medium
                     rounded-md text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Continue to Scheduler
                    </button>
                </form>
            </div>
        </div>
    );
}