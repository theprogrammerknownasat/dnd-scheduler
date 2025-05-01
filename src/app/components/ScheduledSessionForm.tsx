// src/app/components/ScheduledSessionForm.tsx
"use client";
import { useState } from 'react';
import { format } from 'date-fns';

interface ScheduledSessionFormProps {
    campaignId: string;
    date: Date;
    onClose: () => void;
    onSessionCreated: () => void;
}

export default function ScheduledSessionForm({
                                                 campaignId,
                                                 date,
                                                 onClose,
                                                 onSessionCreated
                                             }: ScheduledSessionFormProps) {
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState(18); // Default to 6 PM
    const [endTime, setEndTime] = useState(22); // Default to 10 PM
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const timeOptions = Array.from({ length: 24 }, (_, i) => ({
        value: i,
        label: i === 0 ? '12 AM' : i === 12 ? '12 PM' : i < 12 ? `${i} AM` : `${i - 12} PM`
    }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate form
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        if (startTime >= endTime) {
            setError('End time must be after start time');
            return;
        }

        try {
            const response = await fetch('/api/scheduled-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId,
                    title,
                    date: format(date, 'yyyy-MM-dd'),
                    startTime,
                    endTime,
                    notes
                }),
            });

            const data = await response.json();

            if (data.success) {
                onSessionCreated();
                onClose();
            } else {
                setError(data.error || 'Failed to create session');
            }
        } catch (err) {
            console.error('Error creating session:', err);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Schedule a Game Session</h2>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                    {format(date, 'EEEE, MMMM d, yyyy')}
                </p>

                {error && (
                    <div className="mb-4 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-3">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Session Title
                        </label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter session title"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Time
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={startTime}
                                onChange={(e) => setStartTime(parseInt(e.target.value))}
                            >
                                {timeOptions.map(option => (
                                    <option key={`start-${option.value}`} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Time
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={endTime}
                                onChange={(e) => setEndTime(parseInt(e.target.value))}
                            >
                                {timeOptions.map(option => (
                                    <option key={`end-${option.value}`} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any additional notes..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300
                        dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700
                        dark:bg-indigo-500 dark:hover:bg-indigo-600"
                        >
                            Schedule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}