// src/app/admin/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [users, setUsers] = useState<any[]>([]);
    const [activeUsers, setActiveUsers] = useState<string[]>([]);
    const [announcement, setAnnouncement] = useState('');
    const [newUser, setNewUser] = useState({ username: '', isAdmin: false });
    const router = useRouter();

    // Fetch users and active users on component mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/admin/users');
                const data = await response.json();

                if (data.success) {
                    setUsers(data.users);
                } else {
                    // If not authorized, redirect to calendar
                    router.push('/calendar');
                }
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };

        const fetchActiveUsers = async () => {
            try {
                const response = await fetch('/api/admin/active-users');
                const data = await response.json();

                if (data.success) {
                    setActiveUsers(data.activeUsers);
                }
            } catch (err) {
                console.error('Error fetching active users:', err);
            }
        };

        const fetchAnnouncement = async () => {
            try {
                const response = await fetch('/api/announcements/latest');
                const data = await response.json();

                if (data.success && data.announcement) {
                    setAnnouncement(data.announcement);
                }
            } catch (err) {
                console.error('Error fetching announcement:', err);
            }
        };

        fetchUsers();
        fetchActiveUsers();
        fetchAnnouncement();

        // Set up polling for active users
        const interval = setInterval(fetchActiveUsers, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [router]);

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
                setNewUser({ username: '', isAdmin: false });
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

    // Handle updating announcement
    const handleUpdateAnnouncement = async () => {
        try {
            const response = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ announcement }),
            });

            const data = await response.json();

            if (!data.success) {
                console.error('Failed to update announcement');
            }
        } catch (err) {
            console.error('Error updating announcement:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <header className="bg-white shadow rounded-lg p-4 mb-4 flex items-center justify-between">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <button
                    onClick={() => router.push('/calendar')}
                    className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                >
                    Back to Calendar
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Users Section */}
                <div className="bg-white shadow rounded-lg p-4">
                    <h2 className="text-lg font-medium mb-4">Active Users</h2>
                    {activeUsers.length > 0 ? (
                        <ul className="space-y-2">
                            {activeUsers.map(user => (
                                <li key={user} className="flex items-center">
                                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                                    {user}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">No active users</p>
                    )}
                </div>

                {/* Announcement Section */}
                <div className="bg-white shadow rounded-lg p-4">
                    <h2 className="text-lg font-medium mb-4">Announcement</h2>
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded mb-2"
                        rows={3}
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        placeholder="Enter announcement here..."
                    ></textarea>
                    <button
                        onClick={handleUpdateAnnouncement}
                        className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                        Update Announcement
                    </button>
                </div>

                {/* User Management Section */}
                <div className="bg-white shadow rounded-lg p-4 md:col-span-2">
                    <h2 className="text-lg font-medium mb-4">User Management</h2>

                    {/* Add User Form */}
                    <div className="mb-6 flex items-end space-x-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded"
                                value={newUser.username}
                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                placeholder="Enter username"
                            />
                        </div>
                        <div className="flex items-center mb-1">
                            <input
                                type="checkbox"
                                id="isAdmin"
                                className="mr-2"
                                checked={newUser.isAdmin}
                                onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                            />
                            <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">
                                Admin?
                            </label>
                            <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">
                                Admin?
                            </label>
                        </div>
                        <button
                            onClick={handleAddUser}
                            className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700"
                        >
                            Add User
                        </button>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Username
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Password Set
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.username}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.username}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.isAdmin ? 'Admin' : 'User'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.password ? 'Yes' : 'No'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleDeleteUser(user.username)}
                                            className="text-red-600 hover:text-red-900 mr-2"
                                        >
                                            Delete
                                        </button>
                                        {/*
                      // We could add more actions here, like reset password
                      <button
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Reset Password
                      </button>
                      */}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}