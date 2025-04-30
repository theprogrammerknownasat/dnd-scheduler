"use client";
import { useState, useEffect } from 'react';

interface Poll {
    _id: string;
    question: string;
    options: string[];
    votes: Record<string, string>;
    isBlind: boolean;
    isActive: boolean;
    createdAt: string;
}

export default function PollComponent() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPolls = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/polls');
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

        fetchPolls();
        fetchUserInfo();
    }, []);

    // Handle voting
    const handleVote = async (pollId: string, option: string) => {
        try {
            const response = await fetch('/api/polls/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pollId, option }),
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
    const PollResults = ({ poll }: { poll: Poll }) => {
        // Don't show results for blind polls unless admin
        if (poll.isBlind && !isAdmin && !poll.votes[username]) {
            return (
                <div className="text-center text-gray-500 dark:text-gray-400 my-4">
                    <p>This is a blind poll. Results will be hidden until you vote.</p>
                </div>
            );
        }

        // Don't show results for blind polls until user votes
        if (poll.isBlind && !isAdmin && !getUserVote(poll)) {
            return (
                <div className="text-center text-gray-500 dark:text-gray-400 my-4">
                    <p>Results will be visible after you vote</p>
                </div>
            );
        }

        const totalVotes = Object.keys(poll.votes).length;

        return (
            <div className="space-y-2 mt-4">
                {poll.options.map(option => {
                    const votes = countVotes(poll, option);
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const userVote = getUserVote(poll);

                    return (
                        <div
                            key={option}
                            className={`p-3 border rounded-md cursor-pointer ${
                                userVote === option ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'
                            }`}
                            onClick={() => handleVote(poll._id, option)}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span>{option}</span>
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
                            <div className="flex justify-between items-start">
                                <h3 className="text-md font-medium text-gray-900 dark:text-white">{poll.question}</h3>
                                {poll.isBlind && (
                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded">
                    Blind Poll
                  </span>
                                )}
                            </div>

                            <PollResults poll={poll} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}