// src/app/components/SessionList.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { format, parseISO, isToday, isBefore, isAfter, compareAsc } from 'date-fns';
import { formatTime } from '@/utils/dateTimeFormatter';

interface ScheduledSession {
    _id: string;
    title: string;
    date: string;
    startTime: number;
    endTime: number;
    notes: string;
    campaignId: string;
}

interface SessionListProps {
    campaignId: string;
    scheduledSessions: ScheduledSession[];
    timeFormat?: '12h' | '24h';
    onScheduleNewSession?: () => void;
    isAdmin?: boolean;
    maxPreviousSessions?: number;
    maxFutureSessions?: number;
}

export default function SessionList({
                                        campaignId,
                                        scheduledSessions,
                                        timeFormat = '12h',
                                        onScheduleNewSession,
                                        isAdmin = false,
                                        maxPreviousSessions = 3,
                                        maxFutureSessions = 5
                                    }: SessionListProps) {
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
    const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const now = new Date();

    // Separate sessions into past, today, and future
    const todaySessions: ScheduledSession[] = [];
    const pastSessions: ScheduledSession[] = [];
    const futureSessions: ScheduledSession[] = [];

    // Sort sessions into categories
    scheduledSessions.forEach(session => {
        const sessionDate = parseISO(session.date);

        if (isToday(sessionDate)) {
            todaySessions.push(session);
        } else if (isBefore(sessionDate, now)) {
            pastSessions.push(session);
        } else {
            futureSessions.push(session);
        }
    });

    // Sort by date and time
    const sortSessions = (a: ScheduledSession, b: ScheduledSession) => {
        const dateCompare = compareAsc(parseISO(a.date), parseISO(b.date));
        if (dateCompare !== 0) return dateCompare;
        return a.startTime - b.startTime;
    };

    // Sort all session arrays
    todaySessions.sort(sortSessions);
    pastSessions.sort(sortSessions).reverse(); // Most recent first
    futureSessions.sort(sortSessions);

    // Limit the number of sessions displayed
    const limitedPastSessions = pastSessions.slice(0, maxPreviousSessions);
    const limitedFutureSessions = futureSessions.slice(0, maxFutureSessions);

    // Check if a session is currently in progress
    const isSessionInProgress = (session: ScheduledSession): boolean => {
        if (!isToday(parseISO(session.date))) return false;

        const currentHour = now.getHours() + (now.getMinutes() >= 30 ? 0.5 : 0);
        return currentHour >= session.startTime && currentHour < session.endTime;
    };

    // Handle session deletion
    const deleteSession = async (sessionId: string) => {
        // Update local state to show loading
        setIsDeleting(prev => ({ ...prev, [sessionId]: true }));
        setDeleteSuccess(null);
        setDeleteError(null);

        try {
            const response = await fetch(`/api/scheduled-sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ campaignId })
            });

            const data = await response.json();

            if (data.success) {
                // Show success message
                setDeleteSuccess("Session deleted successfully");

                // Hide success message after 3 seconds
                setTimeout(() => {
                    setDeleteSuccess(null);
                }, 3000);

                // Trigger a reload or update of sessions
                // This would ideally be handled via a callback to the parent component
                window.location.reload(); // Simple but effective approach
            } else {
                setDeleteError(data.error || "Failed to delete session");
            }
        } catch (error) {
            console.error("Error deleting session:", error);
            setDeleteError("An error occurred while deleting the session");
        } finally {
            setIsDeleting(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    // Render a session card
    const renderSessionCard = (session: ScheduledSession, type: 'today' | 'future' | 'past') => {
        const isInProgress = isSessionInProgress(session);
        const isPast = type === 'past';

        return (
            <div
                key={session._id}
                className={`p-3 rounded-lg ${
                    isInProgress
                        ? 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500'
                        : type === 'today'
                            ? 'bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-500'
                            : 'bg-gray-50 dark:bg-gray-700'
                } ${isPast ? 'opacity-80' : ''}`}
            >
                <div
                    className="flex justify-between items-start"
                >
                    <div
                        className="flex-grow cursor-pointer"
                        onClick={() => setExpandedSessionId(expandedSessionId === session._id ? null : session._id)}
                    >
                        {type !== 'today' && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {format(parseISO(session.date), 'EEEE, MMMM d, yyyy')}
                            </div>
                        )}
                        <h4 className="font-medium text-gray-900 dark:text-white">
                            {session.title}
                            {isInProgress && (
                                <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">In Progress</span>
                            )}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatTime(session.startTime, timeFormat)} - {formatTime(session.endTime, timeFormat)}
                        </p>
                    </div>

                    <div className="flex items-center">
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to delete this session?")) {
                                        deleteSession(session._id);
                                    }
                                }}
                                disabled={isDeleting[session._id]}
                                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 mr-2"
                                title="Delete Session"
                            >
                                {isDeleting[session._id] ? (
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                )}
                            </button>
                        )}

                        <button
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            onClick={() => setExpandedSessionId(expandedSessionId === session._id ? null : session._id)}
                        >
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
                </div>

                {expandedSessionId === session._id && session.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400">{session.notes}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
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

            {/* Success/Error messages */}
            {deleteSuccess && (
                <div className="mx-4 mt-2 p-2 bg-green-100 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-400">
                    {deleteSuccess}
                </div>
            )}

            {deleteError && (
                <div className="mx-4 mt-2 p-2 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400">
                    {deleteError}
                </div>
            )}

            {scheduledSessions.length === 0 ? (
                <div className="p-6 text-center">
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
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {/* Today's sessions */}
                    {todaySessions.length > 0 && (
                        <div className="p-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Today</h3>
                            <div className="space-y-3">
                                {todaySessions.map(session => renderSessionCard(session, 'today'))}
                            </div>
                        </div>
                    )}

                    {/* Future sessions */}
                    {limitedFutureSessions.length > 0 && (
                        <div className="p-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Upcoming Sessions</h3>
                            <div className="space-y-3">
                                {limitedFutureSessions.map(session => renderSessionCard(session, 'future'))}

                                {futureSessions.length > maxFutureSessions && (
                                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        + {futureSessions.length - maxFutureSessions} more upcoming sessions
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Past sessions */}
                    {limitedPastSessions.length > 0 && (
                        <div className="p-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Previous Sessions</h3>
                            <div className="space-y-3">
                                {limitedPastSessions.map(session => renderSessionCard(session, 'past'))}

                                {pastSessions.length > maxPreviousSessions && (
                                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        + {pastSessions.length - maxPreviousSessions} more previous sessions
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}