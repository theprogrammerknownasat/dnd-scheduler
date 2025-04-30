// src/app/admin/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import CreatePollForm from '../components/CreatePollForm';

interface User {
    _id: string;
    username: string;
    isAdmin: boolean;
    password: string | null;
}

interface Poll {
    _id: string;
    question: string;
    options: string[];
    votes: Record<string, string>;
    isBlind: boolean;
    isActive: boolean;
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [activeUsers, setActiveUsers] = useState<string[]>([]);
    const [announcement, setAnnouncement] = useState({text: '', color: 'yellow'});
    const [newUser, setNewUser] = useState({username: ''});
    const [polls, setPolls] = useState<Poll[]>([]);
    const [username, setUsername] = useState('');
    const [maxFutureWeeks, setMaxFutureWeeks] = useState(12);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState({username: '', password: ''});
    const [changeAdminPassword, setChangeAdminPassword] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordChangeError, setPasswordChangeError] = useState('');
    const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);

    const router = useRouter();

    // Colors for announcement
    const announcementColors = [
        {name: 'Yellow', value: 'yellow'},
        {name: 'Red', value: 'red'},
        {name: 'Green', value: 'green'},
        {name: 'Blue', value: 'blue'}
    ];

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

                // Fetch users
                const usersResponse = await fetch('/api/admin/users');
                const usersData = await usersResponse.json();

                if (usersData.success) {
                    setUsers(usersData.users);
                }

                // Fetch active users
                const activeUsersResponse = await fetch('/api/admin/active-users');
                const activeUsersData = await activeUsersResponse.json();

                if (activeUsersData.success) {
                    setActiveUsers(activeUsersData.activeUsers);
                }

                // Fetch announcement
                const announcementResponse = await fetch('/api/announcements/latest');
                const announcementData = await announcementResponse.json();

                if (announcementData.success && announcementData.announcement) {
                    setAnnouncement(announcementData.announcement);
                }

                // Fetch polls
                const pollsResponse = await fetch('/api/polls');
                const pollsData = await pollsResponse.json();

                if (pollsData.success) {
                    setPolls(pollsData.polls);
                }

                // Fetch settings
                const settingsResponse = await fetch('/api/settings');
                const settingsData = await settingsResponse.json();

                if (settingsData.success && settingsData.settings) {
                    if (settingsData.settings.maxFutureWeeks) {
                        setMaxFutureWeeks(settingsData.settings.maxFutureWeeks);
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

    // Handle adding a new user
    const handleAddUser = async () => {
        if (!newUser.username) return;

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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
                setNewUser({username: ''});
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
            password: ''
        });
    };

    // Save user edits
    const handleSaveUserEdit = async () => {
        if (!editingUser) return;

        try {
            const response = await fetch(`/api/admin/users/${editingUser}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
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
                headers: {'Content-Type': 'application/json'},
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
        setAnnouncement({text: '', color: 'yellow'});

        try {
            await fetch('/api/announcements', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: '', color: 'yellow'}),
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
                const updatedResponse = await fetch('/api/polls');
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
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({maxFutureWeeks}),
            });

            const data = await response.json();

            if (!data.success) {
                console.error('Failed to update max weeks setting');
            }
        } catch (err) {
            console.error('Error updating max weeks setting:', err);
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
                headers: {'Content-Type': 'application/json'},
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
            <Header username={username} isAdmin={true}/>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Active Users Section */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Active Users</h2>
                    {activeUsers.length > 0 ? (
                        <ul className="space-y-2">
                            {activeUsers.map(user => (
                                <li key={user} className="flex items-center">
                                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                                    <span className="text-gray-700 dark:text-gray-300">{user}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No active users</p>
                    )}
                </div>

                {/* Announcement Section */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Announcement</h2>
                    <div className="space-y-4">
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
                                    <div
                                        className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-2 text-sm">
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
            </div>

            {/* User Management Section */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">User Management</h2>

                {/* Add User Form */}
                <div className="mb-6">
                    <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">Add New User</h3>

                    <div className="flex">
                        <input
                            type="text"
                            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={newUser.username}
                            onChange={(e) => setNewUser({username: e.target.value})}
                            placeholder="Enter username"
                        />
                        <button
                            onClick={handleAddUser}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-r hover:bg-indigo-700
                        dark:bg-indigo-500 dark:hover:bg-indigo-600"
                        >
                            Add User
                        </button>
                    </div>
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.isAdmin ? 'Admin' : 'User'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
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

                {/* Create Poll Form */}
                <CreatePollForm onPollCreated={() => {
                    // Refresh polls after creation
                    fetch('/api/polls')
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                setPolls(data.polls);
                            }
                        })
                        .catch(err => console.error('Error fetching polls:', err));
                }}/>

                {/* Existing Polls */}
                <div className="mt-6">
                    <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">Existing Polls</h3>

                    {polls.length > 0 ? (
                        <div className="space-y-4">
                            {polls.map(poll => (
                                <div key={poll._id} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                                    <div className="flex justify-between">
                                        <h4 className="font-medium">{poll.question}</h4>
                                        <div className="flex items-center space-x-2">
                                            {poll.isBlind && (
                                                <span
                                                    className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded">
                          Blind Poll
                        </span>
                                            )}
                                            <button
                                                onClick={() => handleDeletePoll(poll._id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Options:</p>
                                        <ul className="list-disc list-inside">
                                            {poll.options.map(option => (
                                                <li key={option}
                                                    className="text-gray-700 dark:text-gray-300">{option}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {Object.keys(poll.votes).length} vote(s)
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No polls created yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}