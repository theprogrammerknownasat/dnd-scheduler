// src/app/login/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [stage, setStage] = useState('username'); // 'username', 'password', or 'create-password'
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleUsernameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Username is required');
            return;
        }

        try {
            const response = await fetch('/api/auth/check-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            const data = await response.json();

            if (data.exists) {
                if (data.hasPassword) {
                    // User exists and has a password, move to password stage
                    setStage('password');
                } else {
                    // User exists but needs to create a password
                    setStage('create-password');
                }
            } else {
                setError('Username not found. Please contact your admin.');
            }
        } catch (err) {
            console.error('Error checking username:', err);
            setError('An error occurred. Please try again.');
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password) {
            setError('Password is required');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                // Check if user needs to set up profile
                if (data.needsSetup) {
                    router.push('/setup-profile');
                } else {
                    // Redirect to the main app
                    router.push('/calendar');
                }
            } else {
                setError('Incorrect password. Please try again.');
            }
        } catch (err) {
            console.error('Error logging in:', err);
            setError('An error occurred. Please try again.');
        }
    };

    const handleCreatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password) {
            setError('Password is required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/auth/create-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                // Check if user needs to set up profile
                if (data.needsSetup) {
                    router.push('/setup-profile');
                } else {
                    // Redirect to the main app
                    router.push('/calendar');
                }
            } else {
                setError('Could not create password. Please try again.');
            }
        } catch (err) {
            console.error('Error creating password:', err);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full space-y-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">DnD Scheduler</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {stage === 'username' && 'Enter your username to get started'}
                    {stage === 'password' && 'Enter your password to continue'}
                    {stage === 'create-password' && 'Create a new password for your account'}
                </p>
                {error && (
                    <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
                        {error}
                    </div>
                )}

                {stage === 'username' && (
                    <form className="mt-8 space-y-6" onSubmit={handleUsernameSubmit}>
                        <div>
                            <label htmlFor="username" className="sr-only">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600
                         placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white
                         bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium
                         rounded-md text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Continue
                            </button>
                        </div>
                    </form>
                )}

                {stage === 'password' && (
                    <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600
                         placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white
                         bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium
                         rounded-md text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Sign in
                            </button>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={() => setStage('username')}
                                className="w-full text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-center"
                            >
                                Back
                            </button>
                        </div>
                    </form>
                )}

                {stage === 'create-password' && (
                    <form className="mt-8 space-y-6" onSubmit={handleCreatePassword}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="new-password" className="sr-only">New Password</label>
                                <input
                                    id="new-password"
                                    name="new-password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600
                           placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white
                           bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="New Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div>
                                <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600
                           placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white
                           bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium
                         rounded-md text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Create Password
                            </button>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={() => setStage('username')}
                                className="w-full text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-center"
                            >
                                Back
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}