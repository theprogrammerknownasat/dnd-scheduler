// src/app/admin/campaigns/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';

interface Campaign {
    _id: string;
    name: string;
    description: string;
    users: string[];
    isDefault: boolean;
}

interface User {
    _id: string;
    username: string;
    displayName: string;
}

export default function CampaignManagement() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [newCampaign, setNewCampaign] = useState({ name: '', description: '' });
    const [editingCampaign, setEditingCampaign] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', users: [] as string[] });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const router = useRouter();

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch user info to check if admin
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
                }

                // Fetch users
                const usersResponse = await fetch('/api/admin/users');
                const usersData = await usersResponse.json();

                if (usersData.success) {
                    setUsers(usersData.users);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to fetch data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

    // Create a new campaign
    const handleCreateCampaign = async () => {
        setError('');

        if (!newCampaign.name.trim()) {
            setError('Campaign name is required');
            return;
        }

        try {
            const response = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCampaign.name,
                    description: newCampaign.description,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Refresh campaigns
                const campaignsResponse = await fetch('/api/campaigns');
                const campaignsData = await campaignsResponse.json();

                if (campaignsData.success) {
                    setCampaigns(campaignsData.campaigns);
                }

                // Reset form
                setNewCampaign({ name: '', description: '' });
            } else {
                setError(data.error || 'Failed to create campaign');
            }
        } catch (err) {
            console.error('Error creating campaign:', err);
            setError('An error occurred. Please try again.');
        }
    };

    // Start editing a campaign
    const handleEditCampaign = (campaign: Campaign) => {
        setEditingCampaign(campaign._id);
        setEditForm({
            name: campaign.name,
            description: campaign.description,
            users: campaign.users
        });
    };

    // Save campaign edits
    const handleSaveCampaign = async () => {
        setError('');

        if (!editForm.name.trim()) {
            setError('Campaign name is required');
            return;
        }

        if (!editingCampaign) return;

        try {
            const response = await fetch(`/api/campaigns/${editingCampaign}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editForm.name,
                    description: editForm.description,
                    users: editForm.users
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Refresh campaigns
                const campaignsResponse = await fetch('/api/campaigns');
                const campaignsData = await campaignsResponse.json();

                if (campaignsData.success) {
                    setCampaigns(campaignsData.campaigns);
                }

                // Reset edit state
                setEditingCampaign(null);
            } else {
                setError(data.error || 'Failed to update campaign');
            }
        } catch (err) {
            console.error('Error updating campaign:', err);
            setError('An error occurred. Please try again.');
        }
    };

    // Delete a campaign
    const handleDeleteCampaign = async (campaignId: string) => {
        setError('');

        try {
            const response = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                // Refresh campaigns
                const campaignsResponse = await fetch('/api/campaigns');
                const campaignsData = await campaignsResponse.json();

                if (campaignsData.success) {
                    setCampaigns(campaignsData.campaigns);
                }

                // Reset delete confirmation
                setShowDeleteConfirm(null);
            } else {
                setError(data.error || 'Failed to delete campaign');
            }
        } catch (err) {
            console.error('Error deleting campaign:', err);
            setError('An error occurred. Please try again.');
        }
    };

    // Set campaign as default
    const handleSetDefault = async (campaignId: string) => {
        setError('');

        try {
            const response = await fetch(`/api/campaigns/${campaignId}/default`, {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                // Refresh campaigns
                const campaignsResponse = await fetch('/api/campaigns');
                const campaignsData = await campaignsResponse.json();

                if (campaignsData.success) {
                    setCampaigns(campaignsData.campaigns);
                }
            } else {
                setError(data.error || 'Failed to set campaign as default');
            }
        } catch (err) {
            console.error('Error setting default campaign:', err);
            setError('An error occurred. Please try again.');
        }
    };

    // Handle user selection for campaign
    const handleUserSelection = (username: string) => {
        const updatedUsers = [...editForm.users];

        if (updatedUsers.includes(username)) {
            // Remove user
            const index = updatedUsers.indexOf(username);
            updatedUsers.splice(index, 1);
        } else {
            // Add user
            updatedUsers.push(username);
        }

        setEditForm({
            ...editForm,
            users: updatedUsers
        });
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

            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaign Management</h1>
                <button
                    onClick={() => router.push('/admin')}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300
                    dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                    Back to Dashboard
                </button>
            </div>

            {error && (
                <div className="mb-6 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4">
                    {error}
                </div>
            )}

            {/* Create New Campaign */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Create New Campaign</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Campaign Name
                        </label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={newCampaign.name}
                            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                            placeholder="Enter campaign name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={3}
                            value={newCampaign.description}
                            onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                            placeholder="Enter campaign description"
                        ></textarea>
                    </div>

                    <button
                        onClick={handleCreateCampaign}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700
                      dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                        Create Campaign
                    </button>
                </div>
            </div>

            {/* Campaign List */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Campaigns</h2>

                {campaigns.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No campaigns found. Create one to get started.</p>
                ) : (
                    <div className="space-y-6">
                        {campaigns.map(campaign => (
                            <div key={campaign._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                {editingCampaign === campaign._id ? (
                                    // Edit Mode
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Campaign Name
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                rows={3}
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            ></textarea>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Campaign Members
                                            </label>
                                            <div className="max-h-60 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded">
                                                {users.map(user => (
                                                    <label key={user._id} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                                        <input
                                                            type="checkbox"
                                                            className="mr-2"
                                                            checked={editForm.users.includes(user.username)}
                                                            onChange={() => handleUserSelection(user.username)}
                                                        />
                                                        <span className="text-gray-800 dark:text-gray-200">
                              {user.displayName || user.username}
                            </span>
                                                    </label>
                                                ))}
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                Selected: {editForm.users.length} user(s)
                                            </p>
                                        </div>

                                        <div className="flex space-x-2">
                                            <button
                                                onClick={handleSaveCampaign}
                                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700
                                  dark:bg-green-500 dark:hover:bg-green-600"
                                            >
                                                Save Changes
                                            </button>
                                            <button
                                                onClick={() => setEditingCampaign(null)}
                                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300
                                  dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                                    {campaign.name}
                                                    {campaign.isDefault && (
                                                        <span className="ml-2 text-xs px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded">
                              Default
                            </span>
                                                    )}
                                                </h3>
                                                {campaign.description && (
                                                    <p className="mt-1 text-gray-600 dark:text-gray-400">{campaign.description}</p>
                                                )}
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditCampaign(campaign)}
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    Edit
                                                </button>
                                                {!campaign.isDefault && (
                                                    <>
                                                        <button
                                                            onClick={() => handleSetDefault(campaign._id)}
                                                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                        >
                                                            Set as Default
                                                        </button>
                                                        <button
                                                            onClick={() => setShowDeleteConfirm(campaign._id)}
                                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Members ({campaign.users.length}):
                                            </p>
                                            {campaign.users.length > 0 ? (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {campaign.users.map(username => {
                                                        const user = users.find(u => u.username === username);
                                                        return (
                                                            <span key={username} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                                {user?.displayName || username}
                              </span>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No members assigned</p>
                                            )}
                                        </div>

                                        {/* Delete Confirmation */}
                                        {showDeleteConfirm === campaign._id && (
                                            <div className="mt-4 p-3 border border-red-200 dark:border-red-800 rounded bg-red-50 dark:bg-red-900/20">
                                                <p className="text-red-700 dark:text-red-400">
                                                    Are you sure you want to delete this campaign? This action cannot be undone.
                                                </p>
                                                <div className="mt-2 flex space-x-2">
                                                    <button
                                                        onClick={() => handleDeleteCampaign(campaign._id)}
                                                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700
                                      dark:bg-red-700 dark:hover:bg-red-800"
                                                    >
                                                        Yes, Delete
                                                    </button>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(null)}
                                                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300
                                      dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}