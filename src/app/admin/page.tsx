// src/app/admin/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import CreatePollForm from '../components/CreatePollForm';
import CampaignSelector from '../components/CampaignSelector';

interface User {
    _id: string;
    username: string;
    displayName: string;
    isAdmin: boolean;
    password: string | null;
    contactRequested: boolean;
}

interface Poll {
    _id: string;
    campaignId: string;
    question: string;
    options: string[];
    votes: Record<string, string>;
    isBlind: boolean;
    isActive: boolean;
}

interface Campaign {
    _id: string;
    name: string;
}

interface ActiveUser {
    username: string;
    lastActive: number;
    status: 'active' | 'away' | 'inactive';
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [, setActiveUsers] = useState<ActiveUser[]>([]);
    const [announcement, setAnnouncement] = useState({
        text: '',
        color: 'yellow',
        campaignId: ''
    });
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState('');
    const [newUser, setNewUser] = useState({ username: '', displayName: '' });
    const [polls, setPolls] = useState<Poll[]>([]);
    const [username, setUsername] = useState('');
    const [maxFutureWeeks, setMaxFutureWeeks] = useState(12);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState({
        username: '',
        displayName: '',
        password: ''
    });
    const [changeAdminPassword, setChangeAdminPassword] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordChangeError, setPasswordChangeError] = useState('');
    const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
    const [disableDisplayNameEditing, setDisableDisplayNameEditing] = useState(false);
    const [displayNameFilter, setDisplayNameFilter] = useState('');
    const [displayNameFilterEnabled, setDisplayNameFilterEnabled] = useState(false);

    const router = useRouter();

    // Colors for announcement
    const announcementColors = [
        { name: 'Yellow', value: 'yellow' },
        { name: 'Red', value: 'red' },
        { name: 'Green', value: 'green' },
        { name: 'Blue', value: 'blue' }
    ];

    const handleDismissContact = async (userId: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contactRequested: false }),
            });

            const data = await response.json();

            if (data.success) {
                // Refresh users list
                const updatedResponse = await fetch('/api/admin/users');
                const updatedData = await updatedResponse.json();

                if (updatedData.success) {
                    setUsers(updatedData.users);
                }
            }
        } catch (err) {
            console.error('Error dismissing contact request:', err);
        }
    };


    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch user info
                const userResponse = await fetch('/api/auth/me');
                const userData = await userResponse.json();

                if (userData.success) {
                    setUsername(userData.username);

                    if (!userData.isAdmin) {
                        // Redirect to calendar if not admin
                        router.push('/calendar');
                        return;
                    }
                } else {
                    // If not authenticated, redirect to login
                    router.push('/login');
                    return;
                }

                // Fetch campaigns
                const campaignsResponse = await fetch('/api/campaigns');
                const campaignsData = await campaignsResponse.json();

                if (campaignsData.success) {
                    setCampaigns(campaignsData.campaigns);

                    // Set first campaign if available
                    if (campaignsData.campaigns.length > 0) {
                        setSelectedCampaign(campaignsData.campaigns[0]._id);
                        setAnnouncement(prev => ({ ...prev, campaignId: campaignsData.campaigns[0]._id }));
                    }
                }

                // Fetch users
                const usersResponse = await fetch('/api/admin/users');
                const usersData = await usersResponse.json();

                if (usersData.success) {
                    setUsers(usersData.users);
                }

                /*// Fetch active users
                const activeUsersResponse = await fetch('/api/admin/active-users');
                const activeUsersData = await activeUsersResponse.json();

                if (activeUsersData.success) {
                    setActiveUsers(activeUsersData.activeUsers);
                }*/

                // Fetch settings
                const settingsResponse = await fetch('/api/settings');
                const settingsData = await settingsResponse.json();

                if (settingsData.success && settingsData.settings) {
                    if (settingsData.settings.maxFutureWeeks) {
                        setMaxFutureWeeks(settingsData.settings.maxFutureWeeks);
                    }

                    if (settingsData.settings.disableDisplayNameEditing !== undefined) {
                        setDisableDisplayNameEditing(settingsData.settings.disableDisplayNameEditing);
                    }

                    if (settingsData.settings.displayNameFilter) {
                        setDisplayNameFilter(settingsData.settings.displayNameFilter);
                        setDisplayNameFilterEnabled(true);
                    }
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Set up polling for active users
        const interval = setInterval(async () => {
            try {
                const response = await fetch('/api/admin/active-users');
                const data = await response.json();

                if (data.success) {
                    setActiveUsers(data.activeUsers);
                }
            } catch (err) {
                console.error('Error fetching active users:', err);
            }
        }, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [router]);

    // Fetch campaign-specific data when selected campaign changes
    useEffect(() => {
        if (!selectedCampaign) return;

        const fetchCampaignData = async () => {
            try {
                // Fetch announcement for selected campaign
                const announcementResponse = await fetch(`/api/announcements/latest?campaignId=${selectedCampaign}`);
                const announcementData = await announcementResponse.json();

                if (announcementData.success && announcementData.announcement) {
                    setAnnouncement({
                        ...announcementData.announcement,
                        campaignId: selectedCampaign
                    });
                } else {
                    // Reset announcement if none found
                    setAnnouncement({
                        text: '',
                        color: 'yellow',
                        campaignId: selectedCampaign
                    });
                }

                // Fetch polls for selected campaign
                const pollsResponse = await fetch(`/api/polls?campaignId=${selectedCampaign}`);
                const pollsData = await pollsResponse.json();

                if (pollsData.success) {
                    setPolls(pollsData.polls);
                }

                const settingsResponse = await fetch('/api/settings');
                const settingsData = await settingsResponse.json();

                if (settingsData.success && settingsData.settings) {
                    // Set max weeks if available
                    if (settingsData.settings.maxFutureWeeks) {
                        setMaxFutureWeeks(settingsData.settings.maxFutureWeeks);
                    }

                    // Set display name restrictions
                    if (settingsData.settings.disableDisplayNameEditing !== undefined) {
                        setDisableDisplayNameEditing(settingsData.settings.disableDisplayNameEditing);
                    }

                    if (settingsData.settings.displayNameFilter) {
                        setDisplayNameFilter(settingsData.settings.displayNameFilter);
                        setDisplayNameFilterEnabled(true);
                    }
                }
            } catch (err) {
                console.error('Error fetching campaign data:', err);
            }
        };

        fetchCampaignData();
    }, [selectedCampaign]);

    // Handle adding a new user
    const handleAddUser = async () => {
        if (!newUser.username) return;

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });

            const data = await response.json();

            if (data.success) {
                // Refresh users list
                const updatedResponse = await fetch('/api/admin/users');
                const updatedData = await updatedResponse.json();

                if (updatedData.success) {
                    setUsers(updatedData.users);
                }

                // Reset form
                setNewUser({ username: '', displayName: '' });
            }
        } catch (err) {
            console.error('Error adding user:', err);
        }
    };

    // Handle deleting a user
    const handleDeleteUser = async (username: string) => {
        try {
            const response = await fetch(`/api/admin/users?username=${username}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                // Refresh users list
                const updatedResponse = await fetch('/api/admin/users');
                const updatedData = await updatedResponse.json();

                if (updatedData.success) {
                    setUsers(updatedData.users);
                }
            }
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    };

    // Start editing a user
    const handleEditUser = (user: User) => {
        setEditingUser(user._id);
        setEditFormData({
            username: user.username,
            displayName: user.displayName || '',
            password: ''
        });
    };

    // Save user edits
    const handleSaveUserEdit = async () => {
        if (!editingUser) return;

        try {
            const response = await fetch(`/api/admin/users/${editingUser}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData),
            });

            const data = await response.json();

            if (data.success) {
                // Refresh users list
                const updatedResponse = await fetch('/api/admin/users');
                const updatedData = await updatedResponse.json();

                if (updatedData.success) {
                    setUsers(updatedData.users);
                }

                // Exit edit mode
                setEditingUser(null);
            }
        } catch (err) {
            console.error('Error updating user:', err);
        }
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingUser(null);
    };

    // Handle updating announcement
    const handleUpdateAnnouncement = async () => {
        try {
            const response = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(announcement),
            });

            const data = await response.json();

            if (!data.success) {
                console.error('Failed to update announcement');
            }
        } catch (err) {
            console.error('Error updating announcement:', err);
        }
    };

    // Handle clearing announcement
    const handleClearAnnouncement = async () => {
        setAnnouncement({
            text: '',
            color: 'yellow',
            campaignId: selectedCampaign
        });

        try {
            await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: '',
                    color: 'yellow',
                    campaignId: selectedCampaign
                }),
            });
        } catch (err) {
            console.error('Error clearing announcement:', err);
        }
    };

    // Handle deleting a poll
    const handleDeletePoll = async (pollId: string) => {
        try {
            const response = await fetch(`/api/polls?id=${pollId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                // Refresh polls
                const updatedResponse = await fetch(`/api/polls?campaignId=${selectedCampaign}`);
                const updatedData = await updatedResponse.json();

                if (updatedData.success) {
                    setPolls(updatedData.polls);
                }
            }
        } catch (err) {
            console.error('Error deleting poll:', err);
        }
    };

    // Update max future weeks setting
    const handleUpdateMaxWeeks = async () => {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maxFutureWeeks,
                    disableDisplayNameEditing,
                    displayNameFilter: displayNameFilterEnabled ? displayNameFilter : ''
                }),
            });

            const data = await response.json();

            if (!data.success) {
                console.error('Failed to update settings');
            }
        } catch (err) {
            console.error('Error updating settings:', err);
        }
    };

    // Update display name editing restriction
    const handleUpdateDisplayNameRestriction = async () => {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    disableDisplayNameEditing,
                    displayNameFilter: displayNameFilterEnabled ? displayNameFilter : '',
                    maxFutureWeeks
                }),
            });

            const data = await response.json();

            if (!data.success) {
                console.error('Failed to update display name settings');
            }
        } catch (err) {
            console.error('Error updating display name settings:', err);
        }
    };

    // Handle changing admin password
    const handleChangeAdminPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordChangeError('');

        // Validate passwords
        if (!changeAdminPassword.currentPassword ||
            !changeAdminPassword.newPassword ||
            !changeAdminPassword.confirmPassword) {
            setPasswordChangeError('All fields are required');
            return;
        }

        if (changeAdminPassword.newPassword !== changeAdminPassword.confirmPassword) {
            setPasswordChangeError('New passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: changeAdminPassword.currentPassword,
                    newPassword: changeAdminPassword.newPassword
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Reset form and close it
                setChangeAdminPassword({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setShowChangePasswordForm(false);
            } else {
                setPasswordChangeError(data.error || 'Failed to change password');
            }
        } catch (err) {
            console.error('Error changing password:', err);
            setPasswordChangeError('An error occurred. Please try again.');
        }
    };

    // Handle campaign change
    const handleCampaignChange = (campaignId: string) => {
        setSelectedCampaign(campaignId);
    };

    if (isLoading) {
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
            <Header username={username} isAdmin={true} />

            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">Admin Dashboard</h1>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => router.push('/admin/campaigns')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700
                      dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                        Manage Campaigns
                    </button>
                    <button
                        onClick={() => router.push('/calendar')}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300
                      dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Back to Calendar
                    </button>
                </div>
            </div>

            {campaigns.length > 0 && (
                <div className="mb-6">
                    <CampaignSelector
                        currentCampaignId={selectedCampaign}
                        onCampaignChange={handleCampaignChange}
                        isAdmin={true}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Active Users Section */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Active Users</h2>
                    <p className="text-gray-500 dark:text-gray-400">Active user tracking is currently disabled</p>
                </div>

                {/* Announcement Section */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Announcement</h2>
                    <div className="space-y-4">
                        {selectedCampaign ? (
                            <>
                                <textarea
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    rows={3}
                                    value={announcement.text}
                                    onChange={(e) => setAnnouncement({...announcement, text: e.target.value})}
                                    placeholder="Enter announcement here..."
                                ></textarea>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {announcementColors.map(color => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            className={`px-3 py-1 rounded text-white ${
                                                announcement.color === color.value ? 'ring-2 ring-offset-2 ring-gray-500' : ''
                                            } ${
                                                color.value === 'yellow' ? 'bg-yellow-500' :
                                                    color.value === 'red' ? 'bg-red-500' :
                                                        color.value === 'green' ? 'bg-green-500' :
                                                            'bg-blue-500'
                                            }`}
                                            onClick={() => setAnnouncement({...announcement, color: color.value})}
                                        >
                                            {color.name}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleUpdateAnnouncement}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700
                                        dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                    >
                                        Update Announcement
                                    </button>

                                    <button
                                        onClick={handleClearAnnouncement}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300
                                        dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">
                                Please select a campaign to manage announcements
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Settings Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Settings</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Max Weeks Setting */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Maximum Future Weeks
                        </label>
                        <div className="flex">
                            <input
                                type="number"
                                min="1"
                                max="52"
                                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={maxFutureWeeks}
                                onChange={(e) => setMaxFutureWeeks(parseInt(e.target.value) || 12)}
                            />
                            <button
                                onClick={handleUpdateMaxWeeks}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-r hover:bg-indigo-700
                                dark:bg-indigo-500 dark:hover:bg-indigo-600"
                            >
                                Save
                            </button>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Sets how many weeks in the future users can see and schedule
                        </p>
                    </div>

                    {/* Admin Password Change */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Admin Password
                            </label>
                            <button
                                onClick={() => setShowChangePasswordForm(!showChangePasswordForm)}
                                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                {showChangePasswordForm ? 'Cancel' : 'Change Password'}
                            </button>
                        </div>

                        {showChangePasswordForm && (
                            <form onSubmit={handleChangeAdminPassword} className="space-y-3">
                                {passwordChangeError && (
                                    <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-2 text-sm">
                                        {passwordChangeError}
                                    </div>
                                )}

                                <div>
                                    <input
                                        type="password"
                                        placeholder="Current Password"
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={changeAdminPassword.currentPassword}
                                        onChange={(e) => setChangeAdminPassword({
                                            ...changeAdminPassword,
                                            currentPassword: e.target.value
                                        })}
                                    />
                                </div>

                                <div>
                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={changeAdminPassword.newPassword}
                                        onChange={(e) => setChangeAdminPassword({
                                            ...changeAdminPassword,
                                            newPassword: e.target.value
                                        })}
                                    />
                                </div>

                                <div>
                                    <input
                                        type="password"
                                        placeholder="Confirm New Password"
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={changeAdminPassword.confirmPassword}
                                        onChange={(e) => setChangeAdminPassword({
                                            ...changeAdminPassword,
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
                        )}
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200">Display Name Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Display Name Editing Restriction */}
                        <div>
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="disableDisplayNameEditing"
                                    checked={disableDisplayNameEditing}
                                    onChange={(e) => setDisableDisplayNameEditing(e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="disableDisplayNameEditing" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    Prevent users from changing display names
                                </label>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                Once users set their display name initially, they cannot change it
                            </p>
                        </div>

                        {/* Display Name Filtering */}
                        <div>
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="displayNameFilterEnabled"
                                    checked={displayNameFilterEnabled}
                                    onChange={(e) => setDisplayNameFilterEnabled(e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="displayNameFilterEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    Enable display name filtering
                                </label>
                            </div>

                            {displayNameFilterEnabled && (
                                <div className="mt-2">
                                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                                        Blocked Terms (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={displayNameFilter}
                                        onChange={(e) => setDisplayNameFilter(e.target.value)}
                                        placeholder="e.g. profanity,offensive,term"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Display names containing these terms will be rejected
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-3">
                        <button
                            onClick={handleUpdateDisplayNameRestriction}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700
            dark:bg-indigo-500 dark:hover:bg-indigo-600"
                        >
                            Save Display Name Settings
                        </button>
                    </div>
                </div>
            </div>

                {/* User Management Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">User Management</h2>

                {/* Add User Form */}
                <div className="mb-6">
                    <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">Add New User</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={newUser.username}
                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                placeholder="Enter username"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Display Name (Optional)
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={newUser.displayName}
                                onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                                placeholder="Enter display name"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAddUser}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700
                        dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                        Add User
                    </button>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Username
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Display Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Password Set
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <tr key={user._id}>
                                {editingUser === user._id ? (
                                    // Edit mode
                                    <>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                className="p-1 border border-gray-300 dark:border-gray-600 rounded
                                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
                                                value={editFormData.username}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    username: e.target.value
                                                })}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                className="p-1 border border-gray-300 dark:border-gray-600 rounded
                                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
                                                value={editFormData.displayName}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    displayName: e.target.value
                                                })}
                                                placeholder="Display name (optional)"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                            {user.isAdmin ? 'Admin' : 'User'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="password"
                                                className="p-1 border border-gray-300 dark:border-gray-600 rounded
                                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
                                                value={editFormData.password}
                                                onChange={(e) => setEditFormData({
                                                    ...editFormData,
                                                    password: e.target.value
                                                })}
                                                placeholder="New password (optional)"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                            <button
                                                onClick={handleSaveUserEdit}
                                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                Cancel
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    // View mode
                                    <>
                                        <div className="flex items-center">
                                            {user.username}
                                            {user.contactRequested && (
                                                <span className="ml-2 flex">
                                                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                    <button
                                                        onClick={() => handleDismissContact(user._id)}
                                                        className="ml-2 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </span>
                                            )}
                                        </div>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                            {user.displayName || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                            {user.isAdmin ? 'Admin' : 'User'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                            {user.password ? 'Yes' : 'No'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                Edit
                                            </button>
                                            {!user.isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.username)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Poll Management Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Poll Management</h2>

                {selectedCampaign ? (
                    <>
                        {/* Create Poll Form */}
                        <CreatePollForm
                            onPollCreated={() => {
                                // Refresh polls after creation
                                fetch(`/api/polls?campaignId=${selectedCampaign}`)
                                    .then(res => res.json())
                                    .then(data => {
                                        if (data.success) {
                                            setPolls(data.polls);
                                        }
                                    })
                                    .catch(err => console.error('Error fetching polls:', err));
                            }}
                            selectedCampaign={selectedCampaign}
                        />

                        {/* Existing Polls */}
                        <div className="mt-6">
                            <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">Existing Polls</h3>

                            {polls.length > 0 ? (
                                <div className="space-y-4">
                                    {polls.map(poll => (
                                        <div key={poll._id} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                                                        {poll.question}
                                                        {poll.isBlind && (
                                                            <span className="ml-2 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                                                                Blind Poll
                                                            </span>
                                                        )}
                                                    </h4>

                                                    <div className="mt-2">
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">Options:</p>
                                                        <ul className="mt-1 space-y-1">
                                                            {poll.options.map((option, index) => {
                                                                const votes = Object.values(poll.votes).filter(vote => vote === option).length;
                                                                const totalVotes = Object.keys(poll.votes).length;
                                                                const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

                                                                return (
                                                                    <li key={index} className="text-gray-600 dark:text-gray-400 flex justify-between">
                                                                        <span>{option}</span>
                                                                        <span>{votes} votes ({percentage}%)</span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>

                                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                        Total votes: {Object.keys(poll.votes).length}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => handleDeletePoll(poll._id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400">No polls created yet</p>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                        Please select a campaign to manage polls
                    </p>
                )}
            </div>
        </div>
    );

}