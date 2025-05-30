// src/app/components/PollComponent.tsx
"use client";
import { useState, useEffect } from 'react';
import { formatTimestamp } from '@/utils/dateTimeFormatter';

interface Poll {
    _id: string;
    campaignId: string;
    question: string;
    options: string[];
    votes: Record<string, string>;
    isBlind: boolean;
    isActive: boolean;
    createdAt: string;
}

interface PollComponentProps {
    campaignId: string;
}

export default function PollComponent({ campaignId }: PollComponentProps) {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPolls = async () => {
            if (!campaignId) {
                setPolls([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`/api/polls?campaignId=${campaignId}`);
                const data = await response.json();

                if (data.success) {
                    setPolls(data.polls);
                }
            } catch (err) {
                console.error('Error fetching polls:', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchUserInfo = async () => {
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();

                if (data.success) {
                    setUsername(data.username);
                    setIsAdmin(data.isAdmin);
                }
            } catch (err) {
                console.error('Error fetching user info:', err);
            }
        };

        fetchUserInfo();
        fetchPolls();
    }, [campaignId]);

    // Handle voting
    const handleVote = async (pollId: string, option: string, campaignId: string) => {
        try {
            const response = await fetch('/api/polls/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pollId, option, campaignId }),
            });

            const data = await response.json();

            if (data.success) {
                // Refresh polls
                const updatedResponse = await fetch(`/api/polls?campaignId=${campaignId}`);
                const updatedData = await updatedResponse.json();

                if (updatedData.success) {
                    setPolls(updatedData.polls);
                }
            }
        } catch (err) {
            console.error('Error voting:', err);
        }
    };

    // Count votes for an option
    const countVotes = (poll: Poll, option: string) => {
        return Object.values(poll.votes).filter(vote => vote === option).length;
    };

    // Get user's vote for a poll
    const getUserVote = (poll: Poll) => {
        return poll.votes[username];
    };

    // Generate poll results visualization
    // Generate poll results visualization
    // In PollComponent.tsx, update the PollResults component

    const PollResults = ({ poll }: { poll: Poll }) => {
        const userVote = getUserVote(poll);
        const totalVotes = Object.keys(poll.votes).length;

        // For blind polls, only show which option the user voted for
        if (poll.isBlind && !isAdmin) {
            return (
                <div className="space-y-2 mt-4">
                    {poll.options.map(option => {
                        return (
                            <div
                                key={option}
                                className={`p-3 border rounded-md cursor-pointer ${
                                    userVote === option ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'
                                }`}
                                onClick={() => handleVote(poll._id, option, campaignId)}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-900 dark:text-white">{option}</span>
                                    {userVote === option && (
                                        <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                        Your vote
                                    </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center mt-2">
                        Results are hidden for blind polls
                    </p>
                </div>
            );
        }

        // For admins or non-blind polls, show full results with percentages
        return (
            <div className="space-y-2 mt-4">
                {poll.options.map(option => {
                    const votes = countVotes(poll, option);
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

                    return (
                        <div
                            key={option}
                            className={`p-3 border rounded-md cursor-pointer ${
                                userVote === option ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'
                            }`}
                            onClick={() => handleVote(poll._id, option, campaignId)}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-900 dark:text-white">{option}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                {votes} vote{votes !== 1 ? 's' : ''} ({percentage}%)
                            </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
                {poll.isBlind && isAdmin && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center">
                        Admin view: you can see all results for this blind poll
                    </p>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="mt-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (polls.length === 0) {
        return (
            <div className="mt-6">
                <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Polls</h2>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No polls available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6">
            <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Polls</h2>

            <div className="space-y-4">
                {polls.map(poll => (
                    <div key={poll._id} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-md font-medium text-gray-900 dark:text-white">{poll.question}</h3>
                                <div className="flex flex-col items-end">
                                    {poll.isBlind && (
                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded mb-1">
                                            Blind Poll
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatTimestamp(poll.createdAt)}
                                    </span>
                                </div>
                            </div>

                            <PollResults poll={poll} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}