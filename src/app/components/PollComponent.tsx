// src/app/components/PollComponent.tsx
"use client";
import { useState, useEffect } from 'react';

interface Poll {
    id: string;
    question: string;
    options: string[];
    votes: Record<string, string>;
}

export default function PollComponent() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [username, setUsername] = useState('');
    const [newPoll, setNewPoll] = useState({
        question: '',
        options: ['', '']
    });

    useEffect(() => {
        const fetchPolls = async () => {
            try {
                const response = await fetch('/api/polls');
                const data = await response.json();

                if (data.success) {
                    setPolls(data.polls);
                }
            } catch (err) {
                console.error('Error fetching polls:', err);
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
        // Validate poll
        if (!newPoll.question.trim()) return;
        if (newPoll.options.some(option => !option.trim())) return;

        try {
            const response = await fetch('/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPoll),
            });

            const data = await response.json();

            if (data.success) {
                // Refresh polls
                const updatedResponse = await fetch('/api/polls');
                const updatedData = await updatedResponse.json();

                if (updatedData.success) {
                    setPolls(updatedData.polls);
                }

                // Reset form
                setNewPoll({
                    question: '',
                    options: ['', '']
                });
            }
        } catch (err) {
            console.error('Error creating poll:', err);
        }
    };

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

    const countVotes = (poll: Poll, option: string) => {
        return Object.values(poll.votes).filter(vote => vote === option).length;
    };

    const getUserVote = (poll: Poll) => {
        return poll.votes[username];
    };

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

    return (
        <div className="mt-6">
            <h2 className="text-lg font-medium mb-4">Polls</h2>

            {/* Existing Polls */}
            {polls.length > 0 ? (
                <div className="space-y-4">
                    {polls.map(poll => (
                        <div key={poll.id} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-md font-medium">{poll.question}</h3>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDeletePoll(poll.id)}
                                            className="text-red-600 hover:text-red-900 text-sm"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 space-y-2">
                                    {poll.options.map(option => {
                                        const votes = countVotes(poll, option);
                                        const totalVotes = Object.keys(poll.votes).length;
                                        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                                        const userVote = getUserVote(poll);

                                        return (
                                            <div
                                                key={option}
                                                className={`p-3 border rounded-md cursor-pointer ${
                                                    userVote === option ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                                                }`}
                                                onClick={() => handleVote(poll.id, option)}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span>{option}</span>
                                                    <span className="text-sm text-gray-500">{votes} vote{votes !== 1 ? 's' : ''} ({percentage}%)</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-indigo-600 h-2 rounded-full"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No polls available</p>
            )}

            {/* Create Poll Form (Admin Only) */}
            {isAdmin && (
                <div className="mt-6 bg-white rounded-lg shadow p-4">
                    <h3 className="text-md font-medium mb-4">Create New Poll</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Question
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded"
                                value={newPoll.question}
                                onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                                placeholder="Enter your question"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Options
                            </label>
                            {newPoll.options.map((option, index) => (
                                <div key={index} className="flex mb-2">
                                    <input
                                        type="text"
                                        className="flex-1 p-2 border border-gray-300 rounded-l"
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOption(index)}
                                        className="px-3 py-2 bg-red-600 text-white rounded-r hover:bg-red-700"
                                        disabled={newPoll.options.length <= 2}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={handleAddOption}
                                className="mt-2 text-indigo-600 hover:text-indigo-900"
                            >
                                + Add Option
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleCreatePoll}
                            className="w-full p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Create Poll
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}