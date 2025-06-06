// src/app/components/CampaignSelector.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Campaign {
    _id: string;
    name: string;
}

interface CampaignSelectorProps {
    currentCampaignId: string;
    onCampaignChange: (campaignId: string) => void;
    isAdmin?: boolean;
}

export default function CampaignSelector({
                                             currentCampaignId,
                                             onCampaignChange,
                                             isAdmin = false
                                         }: CampaignSelectorProps) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Only fetch campaigns once on mount and when currentCampaignId changes
    useEffect(() => {
        const fetchCampaigns = async () => {
            if (!currentCampaignId) return; // Don't fetch if no ID is set

            setLoading(true);
            try {
                const response = await fetch('/api/campaigns');
                const data = await response.json();

                if (data.success) {
                    setCampaigns(data.campaigns);
                }
            } catch (err) {
                console.error('Error fetching campaigns:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaigns();
    }, [currentCampaignId]); // Only depend on currentCampaignId, not onCampaignChange

    // Don't automatically call onCampaignChange when initializing
    // This was causing a loop

    if (loading) {
        return (
            <div className="flex items-center space-x-2">
                <span className="text-gray-700 dark:text-gray-300">Campaign:</span>
                <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            </div>
        );
    }

    if (campaigns.length === 0) {
        return <div className="text-gray-700 dark:text-gray-300">No campaigns available</div>;
    }

    return (
        <div className="flex items-center space-x-2">
            <label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Campaign:</label>
            <select
                value={currentCampaignId}
                onChange={(e) => onCampaignChange(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
                {campaigns.map(campaign => (
                    <option key={campaign._id} value={campaign._id}>
                        {campaign.name}
                    </option>
                ))}
            </select>

            {isAdmin && (
                <button
                    onClick={() => router.push('/admin/campaigns')}
                    className="p-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                    aria-label="Manage Campaigns"
                    title="Manage Campaigns"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            )}
        </div>
    );
}