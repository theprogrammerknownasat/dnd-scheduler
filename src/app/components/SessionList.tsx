// src/app/components/SessionList.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { formatTime } from '@/utils/dateTimeFormatter';

interface ScheduledSession {
    _id: string;
    title: string;
    date: string;
    startTime: number;
    endTime: number;
    notes: string;
}

interface SessionListProps {
    campaignId: string;
    scheduledSessions: ScheduledSession[];
    timeFormat?: '12h' | '24h';
    onScheduleNewSession?: () => void;
    isAdmin?: boolean;
}

export default function SessionList({
                                        campaignId,
                                        scheduledSessions,
                                        timeFormat = '12h',
                                        onScheduleNewSession,
                                        isAdmin = false
                                    }: SessionListProps) {
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

    // Group sessions by date
    const sessionsByDate = scheduledSessions.reduce((acc: Record<string, ScheduledSession[]>, session) => {
        if (!acc[session.date]) {
            acc[session.date] = [];
        }
        acc[session.date].push(session);
        return acc;
    }, {});

    // Sort dates in ascending order
    const sortedDates = Object.keys(sessionsByDate).sort((a, b) => {
        const dateA = parseISO(a);
        const dateB = parseISO(b);
        return dateA.getTime() - dateB.getTime();
    });

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Scheduled Sessions</h2>
                {isAdmin && onScheduleNewSession && (
                    <button
                        onClick={onScheduleNewSession}
                        className="px-3 py-1 bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Session
                    </button>
                )}
            </div>

            {sortedDates.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No sessions scheduled yet</p>
                    {isAdmin && onScheduleNewSession && (
                        <button
                            onClick={onScheduleNewSession}
                            className="mt-4 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600"
                        >
                            Schedule Your First Session
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedDates.map(date => (
                        <div key={date} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                    {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                                </h3>
                            </div>

                            <div className="divide-y divide-gray-200 dark:divide-gray-600">
                                {sessionsByDate[date].map(session => (
                                    <div key={session._id} className="p-4">
                                        <div
                                            className="flex justify-between items-start cursor-pointer"
                                            onClick={() => setExpandedSessionId(expandedSessionId === session._id ? null : session._id)}
                                        >
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">{session.title}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                                </p>
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className={`h-5 w-5 transition-transform ${expandedSessionId === session._id ? 'transform rotate-180' : ''}`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>

                                        {expandedSessionId === session._id && session.notes && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                <div className="prose dark:prose-invert prose-sm max-w-none">
                                                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</h5>
                                                    <p className="text-gray-600 dark:text-gray-400">{session.notes}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}