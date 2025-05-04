// src/app/profile/page.tsx

"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

export default function Profile() {
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [use24HourFormat, setUse24HourFormat] = useState(false);
    const [displayNameEditDisabled, setDisplayNameEditDisabled] = useState(false);

    // Password change state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const router = useRouter();

    const [sessionDisplay, setSessionDisplay] = useState({
        maxPreviousSessions: 3,
        maxFutureSessions: 5
    });

    // Fetch user profile on component mount
    // Fetch user profile on component mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);

                // First, check if user is authenticated
                const authResponse = await fetch('/api/auth/me');
                const authData = await authResponse.json();

                if (!authData.success) {
                    // Redirect to login if not authenticated
                    router.push('/login');
                    return;
                }

                // Set admin status
                setIsAdmin(authData.isAdmin);
                setUsername(authData.username);

                // Fetch profile data
                const profileResponse = await fetch('/api/profile');
                const profileData = await profileResponse.json();

                if (profileData.success) {
                    setDisplayName(profileData.profile.displayName || '');
                    setUse24HourFormat(profileData.profile.use24HourFormat || false);
                    setDisplayNameEditDisabled(profileData.profile.displayNameEditDisabled || false);

                    // Set session display preferences if available
                    if (profileData.profile.maxPreviousSessions !== undefined) {
                        setSessionDisplay(prev => ({
                            ...prev,
                            maxPreviousSessions: profileData.profile.maxPreviousSessions
                        }));
                    }

                    if (profileData.profile.maxFutureSessions !== undefined) {
                        setSessionDisplay(prev => ({
                            ...prev,
                            maxFutureSessions: profileData.profile.maxFutureSessions
                        }));
                    }
                }

                // Fetch settings (for display name editing restrictions)
                if (authData.isAdmin) {
                    const settingsResponse = await fetch('/api/settings');
                    const settingsData = await settingsResponse.json();

                    if (settingsData.success && settingsData.settings) {
                        // Check if display name editing is disabled globally
                        if (settingsData.settings.disableDisplayNameEditing !== undefined) {
                            setDisplayNameEditDisabled(settingsData.settings.disableDisplayNameEditing);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('Failed to load profile. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);
// Handle display name update
    const handleUpdateDisplayName = async () => {
        try {
            setError('');
            setSuccess('');

            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Display name updated successfully!');
            } else {
                setError(data.error || 'Failed to update display name');
            }
        } catch (err) {
            console.error('Error updating display name:', err);
            setError('An error occurred. Please try again.');
        }
    };

    // Handle time format update
    const handleUpdateTimeFormat = async () => {
        try {
            setError('');
            setSuccess('');

            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ use24HourFormat }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Time format preference updated successfully!');
            } else {
                setError(data.error || 'Failed to update time format preference');
            }
        } catch (err) {
            console.error('Error updating time format preference:', err);
            setError('An error occurred. Please try again.');
        }
    };

    // Handle password change
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate passwords
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Password changed successfully!');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setShowPasswordForm(false);
            } else {
                setError(data.error || 'Failed to change password');
            }
        } catch (err) {
            console.error('Error changing password:', err);
            setError('An error occurred. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Header username={username} isAdmin={isAdmin} />

            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Profile</h1>

                {error && (
                    <div className="mb-4 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 bg-green-100 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-400 p-4">
                        {success}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Profile Information</h2>

                    <div className="space-y-4">
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
                                Your username cannot be changed
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Display Name
                            </label>
                            <div className="flex">
                                <input
                                    type="text"
                                    className={`flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                    ${displayNameEditDisabled ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Set your display name"
                                    disabled={displayNameEditDisabled}
                                />
                                <button
                                    onClick={handleUpdateDisplayName}
                                    disabled={displayNameEditDisabled}
                                    className={`px-4 py-2 rounded-r
                                    ${displayNameEditDisabled
                                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'}`}
                                >
                                    Save
                                </button>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {displayNameEditDisabled
                                    ? 'Display name editing has been disabled by the administrator'
                                    : 'This is how your name will appear to others'}
                            </p>
                        </div>

                        {/* Time Format Preference */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Time Format Preference
                            </label>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="12hour"
                                        name="timeFormat"
                                        checked={!use24HourFormat}
                                        onChange={() => setUse24HourFormat(false)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                    />
                                    <label htmlFor="12hour" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        12-hour (1:00 PM)
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="24hour"
                                        name="timeFormat"
                                        checked={use24HourFormat}
                                        onChange={() => setUse24HourFormat(true)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                    />
                                    <label htmlFor="24hour" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        24-hour (13:00)
                                    </label>
                                </div>
                            </div>
                            <div className="mt-2">
                                <button
                                    onClick={handleUpdateTimeFormat}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700
                                    dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                >
                                    Save Time Format
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Password</h2>
                        <button
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            {showPasswordForm ? 'Cancel' : 'Change Password'}
                        </button>
                    </div>

                    {showPasswordForm ? (
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({
                                        ...passwordData,
                                        currentPassword: e.target.value
                                    })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({
                                        ...passwordData,
                                        newPassword: e.target.value
                                    })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({
                                        ...passwordData,
                                        confirmPassword: e.target.value
                                    })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700
                          dark:bg-indigo-500 dark:hover:bg-indigo-600"
                            >
                                Update Password
                            </button>
                        </form>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">
                            You can change your password at any time to keep your account secure.
                        </p>
                    )}
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={() => router.push('/calendar')}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300
                      dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Back to Calendar
                    </button>
                </div>
            </div>
        </div>
    );
}


{/* Session Display Preferences */}
/* <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Session Display Preferences
    </label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label htmlFor="maxPreviousSessions" className="block text-sm text-gray-700 dark:text-gray-300">
                Previous Sessions to Display
            </label>
            <div className="mt-1 flex">
                <input
                    type="number"
                    id="maxPreviousSessions"
                    name="maxPreviousSessions"
                    min="1"
                    max="10"
                    value={sessionDisplay.maxPreviousSessions}
                    onChange={(e) => setSessionDisplay({
                        ...sessionDisplay,
                        maxPreviousSessions: parseInt(e.target.value) || 3
                    })}
                    className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded
                                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 my-auto">
                                            previous sessions
                                        </span>
            </div>
        </div>

        <div>
            <label htmlFor="maxFutureSessions" className="block text-sm text-gray-700 dark:text-gray-300">
                Future Sessions to Display
            </label>
            <div className="mt-1 flex">
                <input
                    type="number"
                    id="maxFutureSessions"
                    name="maxFutureSessions"
                    min="1"
                    max="10"
                    value={sessionDisplay.maxFutureSessions}
                    onChange={(e) => setSessionDisplay({
                        ...sessionDisplay,
                        maxFutureSessions: parseInt(e.target.value) || 5
                    })}
                    className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded
                                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 my-auto">
                                            upcoming sessions
                                        </span>
            </div>
        </div>
    </div>
    <div className="mt-2">
        <button
            onClick={handleUpdateSessionDisplay}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700
                                    dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
            Save Display Settings
        </button>
    </div>
</div> */
