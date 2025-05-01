// src/app/no-campaign/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

export default function NoCampaign() {
    const [username, setUsername] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [availableCampaigns, setAvailableCampaigns] = useState<any[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const router = useRouter();

    useEffect(() => {
        const fetchUserAndCampaigns = async () => {
            try {
                setLoading(true);
                // Check authentication
                const userResponse = await fetch('/api/auth/me');
                const userData = await userResponse.json();

                if (!userData.success) {
                    // If not authenticated, redirect to login
                    router.push('/login');
                    return;
                }

                setUsername(userData.username);
                setIsAdmin(userData.isAdmin);

                // Fetch available campaigns
                const campaignsResponse = await fetch('/api/campaigns');
                const campaignsData = await campaignsResponse.json();

                if (campaignsData.success) {
                    const campaigns = campaignsData.campaigns;
                    setAvailableCampaigns(campaigns);

                    // If there's only one campaign, auto-select it
                    if (campaigns.length === 1) {
                        setSelectedCampaign(campaigns[0]._id);
                    }
                }
            } catch (err) {
                console.error('Error fetching initial data:', err);
                setError('Failed to load campaigns. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndCampaigns();
    }, [router]);

    const handleSelectCampaign = () => {
        if (!selectedCampaign) return;

        // Save selected campaign to localStorage
        localStorage.setItem('lastCampaignId', selectedCampaign);

        // Redirect to calendar
        router.push('/calendar');
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

            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-10">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Campaign Selection Required
                </h1>

                {error && (
                    <div className="mb-4 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4">
                        {error}
                    </div>
                )}

                {availableCampaigns.length > 0 ? (
                    <>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Please select a campaign to continue to the calendar.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Available Campaigns
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={selectedCampaign}
                                onChange={(e) => setSelectedCampaign(e.target.value)}
                            >
                                <option value="">-- Select a Campaign --</option>
                                {availableCampaigns.map(campaign => (
                                    <option key={campaign._id} value={campaign._id}>
                                        {campaign.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleSelectCampaign}
                            disabled={!selectedCampaign}
                            className={`w-full px-4 py-2 rounded ${
                                selectedCampaign
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                            }`}
                        >
                            Continue to Calendar
                        </button>
                    </>
                ) : (
                    <div className="text-center">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            There are currently no campaigns available for you.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Please contact an administrator to be added to a campaign.
                        </p>

                        {isAdmin && (
                            <div className="mt-6">
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    As an admin, you can create a new campaign:
                                </p>
                                <button
                                    onClick={() => router.push('/admin/campaigns')}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700
                                    dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                >
                                    Create Campaign
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}