// src/app/components/CreatePollForm.tsx
"use client";
import { useState, useEffect } from 'react';

interface Campaign {
    _id: string;
    name: string;
}

interface CreatePollFormProps {
    onPollCreated?: () => void;
    selectedCampaign?: string;
}

export default function CreatePollForm({ onPollCreated, selectedCampaign }: CreatePollFormProps) {
    const [newPoll, setNewPoll] = useState({
        question: '',
        options: ['', ''],
        isBlind: false,
        campaignId: selectedCampaign || '',
    });
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [error, setError] = useState('');

    // Fetch available campaigns
    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await fetch('/api/campaigns');
                const data = await response.json();

                if (data.success) {
                    setCampaigns(data.campaigns);

                    // If a campaign is selected or there's only one campaign, use it
                    if (selectedCampaign) {
                        setNewPoll(prev => ({ ...prev, campaignId: selectedCampaign }));
                    } else if (data.campaigns.length === 1) {
                        setNewPoll(prev => ({ ...prev, campaignId: data.campaigns[0]._id }));
                    }
                }
            } catch (err) {
                console.error('Error fetching campaigns:', err);
            }
        };

        fetchCampaigns();
    }, [selectedCampaign]);

    const handleAddOption = () => {
        setNewPoll({
            ...newPoll,
            options: [...newPoll.options, '']
        });
    };

    const handleOptionChange = (index: number, value: string) => {
        const updatedOptions = [...newPoll.options];
        updatedOptions[index] = value;

        setNewPoll({
            ...newPoll,
            options: updatedOptions
        });
    };

    const handleRemoveOption = (index: number) => {
        if (newPoll.options.length <= 2) return; // Keep at least 2 options

        const updatedOptions = newPoll.options.filter((_, i) => i !== index);

        setNewPoll({
            ...newPoll,
            options: updatedOptions
        });
    };

    const handleCreatePoll = async () => {
        // Reset error
        setError('');

        // Validate poll
        if (!newPoll.question.trim()) {
            setError('Question is required');
            return;
        }

        if (!newPoll.campaignId) {
            setError('Please select a campaign');
            return;
        }

        const emptyOptions = newPoll.options.filter(option => !option.trim());
        if (emptyOptions.length > 0) {
            setError('All options must have content');
            return;
        }

        try {
            const response = await fetch('/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPoll),
            });

            const data = await response.json();

            if (data.success) {
                // Reset form
                setNewPoll({
                    question: '',
                    options: ['', ''],
                    isBlind: false,
                    campaignId: newPoll.campaignId,
                });

                // Call callback if provided
                if (onPollCreated) {
                    onPollCreated();
                }
            } else {
                setError(data.error || 'Failed to create poll');
            }
        } catch (err) {
            console.error('Error creating poll:', err);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div>
            <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-gray-200">Create New Poll</h3>

            {error && (
                <div className="mb-4 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-2 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {campaigns.length > 1 && !selectedCampaign && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Campaign
                        </label>
                        <select
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={newPoll.campaignId}
                            onChange={(e) => setNewPoll({ ...newPoll, campaignId: e.target.value })}
                        >
                            <option value="">Select a campaign</option>
                            {campaigns.map(campaign => (
                                <option key={campaign._id} value={campaign._id}>
                                    {campaign.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Question
                    </label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={newPoll.question}
                        onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                        placeholder="Enter your question"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Options
                        </label>
                        <div className="flex items-center">
                            <label className="text-sm text-gray-700 dark:text-gray-300 mr-2 flex items-center">
                                <input
                                    type="checkbox"
                                    className="mr-1"
                                    checked={newPoll.isBlind}
                                    onChange={(e) => setNewPoll({ ...newPoll, isBlind: e.target.checked })}
                                />
                                Blind Poll (Results hidden until voting)
                            </label>
                        </div>
                    </div>

                    {newPoll.options.map((option, index) => (
                        <div key={index} className="flex mb-2">
                            <input
                                type="text"
                                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                placeholder={`Option ${index + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveOption(index)}
                                className="px-3 py-2 bg-red-600 dark:bg-red-700 text-white rounded-r hover:bg-red-700 dark:hover:bg-red-800"
                                disabled={newPoll.options.length <= 2}
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddOption}
                        className="mt-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                        + Add Option
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handleCreatePoll}
                    className="w-full p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700
                    dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                    Create Poll
                </button>
            </div>
        </div>
    );
}