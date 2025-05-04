// src/app/components/SessionList.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { format, isAfter, isBefore, isEqual } from 'date-fns';
import { formatTime } from '@/utils/dateTimeFormatter';

interface ScheduledSession {
    _id: string;
    title: string;
    date: string | Date;
    startTime: number;
    endTime: number;
    notes: string;
    campaignId: string;
    isRecurring?: boolean;
    recurringGroupId?: string;
    recurringIndex?: number;
    maxRecurrences?: number;
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
                                        isAdmin = false,
                                    }: SessionListProps) {
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
    const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [editingSession, setEditingSession] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{
        title: string;
        date: string;
        startTime: number;
        endTime: number;
        notes: string;
    } | null>(null);
    const [showAllPast, setShowAllPast] = useState(false);
    const [showAllFuture, setShowAllFuture] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Parse any date format to a Date object
    const parseSessionDate = (dateValue: string | Date): Date => {
        if (dateValue instanceof Date) {
            // When creating a date without time, JavaScript creates it at 00:00:00 UTC
            // We need to adjust for the timezone offset
            return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
        }

        // If it's a string, parse it as a local date
        if (typeof dateValue === 'string') {
            // Check if it's YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                // Parse as local date to avoid UTC conversion issues
                const [year, month, day] = dateValue.split('-').map(Number);
                return new Date(year, month - 1, day); // month is 0-indexed
            }
            // For other string formats
            return new Date(dateValue);
        }

        return new Date(dateValue);
    };


    // Format date to YYYY-MM-DD for display and comparison
    const formatToYMD = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Check if session is currently in progress
    const isSessionInProgress = (session: ScheduledSession): boolean => {
        const sessionDate = parseSessionDate(session.date);
        const today = currentTime;

        // Compare dates using YYYY-MM-DD format
        const sessionDateStr = formatToYMD(sessionDate);
        const todayStr = formatToYMD(today);

        if (sessionDateStr !== todayStr) {
            return false;
        }

        // Get current time in hours (with decimal for minutes)
        const currentHour = today.getHours() + (today.getMinutes() / 60);

        // Check if current time is within session time range
        return currentHour >= session.startTime && currentHour < session.endTime;
    };

    // Categorize sessions
    const categorizeSession = (session: ScheduledSession): 'in-progress' | 'today' | 'past' | 'future' => {
        if (isSessionInProgress(session)) {
            return 'in-progress';
        }

        const sessionDate = parseSessionDate(session.date);
        const todayDate = currentTime;

        const sessionDateStr = formatToYMD(sessionDate);
        const todayStr = formatToYMD(todayDate);

        if (sessionDateStr === todayStr) {
            return 'today';
        }

        if (isBefore(sessionDate, todayDate)) {
            return 'past';
        }

        return 'future';
    };

    // Categorize all sessions
    const inProgressSessions: ScheduledSession[] = [];
    const todaySessions: ScheduledSession[] = [];
    const pastSessions: ScheduledSession[] = [];
    const futureSessions: ScheduledSession[] = [];

    scheduledSessions.forEach(session => {
        const category = categorizeSession(session);
        switch (category) {
            case 'in-progress':
                inProgressSessions.push(session);
                break;
            case 'today':
                todaySessions.push(session);
                break;
            case 'past':
                pastSessions.push(session);
                break;
            case 'future':
                futureSessions.push(session);
                break;
        }
    });

    // Sort sessions
    const sortSessions = (a: ScheduledSession, b: ScheduledSession) => {
        const dateA = parseSessionDate(a.date);
        const dateB = parseSessionDate(b.date);

        if (!isEqual(dateA, dateB)) {
            return isAfter(dateA, dateB) ? 1 : -1;
        }

        return a.startTime - b.startTime;
    };

    inProgressSessions.sort(sortSessions);
    todaySessions.sort(sortSessions);
    pastSessions.sort(sortSessions).reverse();
    futureSessions.sort(sortSessions);

    // Display limits
    const displayedPastSessions = showAllPast ? pastSessions : pastSessions.slice(0, 3);
    const displayedFutureSessions = showAllFuture ? futureSessions : futureSessions.slice(0, 3);

    // Handle edit session
    const startEditing = (session: ScheduledSession) => {
        setEditingSession(session._id);

        // Ensure proper date formatting
        let dateString: string;
        if (session.date instanceof Date) {
            // Convert to YYYY-MM-DD in local timezone
            const year = session.date.getFullYear();
            const month = String(session.date.getMonth() + 1).padStart(2, '0');
            const day = String(session.date.getDate()).padStart(2, '0');
            dateString = `${year}-${month}-${day}`;
        } else {
            dateString = session.date;
        }

        setEditForm({
            title: session.title,
            date: dateString,
            startTime: session.startTime,
            endTime: session.endTime,
            notes: session.notes || ''
        });
        setUpdateError(null);
    };

    const cancelEditing = () => {
        setEditingSession(null);
        setEditForm(null);
        setUpdateError(null);
    };

    const saveEdit = async () => {
        if (!editForm || !editingSession) return;

        setIsUpdating(true);
        setUpdateError(null);

        try {
            const response = await fetch(`/api/scheduled-sessions/${editingSession}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    campaignId,
                    ...editForm
                })
            });

            const data = await response.json();

            if (data.success) {
                cancelEditing();
                window.location.reload();
            } else {
                setUpdateError(data.error || "Failed to update session");
            }
        } catch (error) {
            console.error("Error updating session:", error);
            setUpdateError("An error occurred while updating the session");
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle session deletion
    const deleteSession = async (sessionId: string) => {
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
                setDeleteSuccess("Session deleted successfully");
                setTimeout(() => {
                    setDeleteSuccess(null);
                }, 3000);
                window.location.reload();
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

    // Render edit form
    const renderEditForm = () => {
        if (!editForm) return null;

        return (
            <div className="mt-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Start Time
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={editForm.startTime}
                            onChange={(e) => setEditForm({ ...editForm, startTime: parseInt(e.target.value) })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            End Time
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={editForm.endTime}
                            onChange={(e) => setEditForm({ ...editForm, endTime: parseInt(e.target.value) })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
                <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes
                    </label>
                    <textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows={2}
                    />
                </div>
                {updateError && (
                    <div className="mt-2 text-red-500 text-sm">{updateError}</div>
                )}
                <div className="mt-3 flex justify-end space-x-2">
                    <button
                        onClick={cancelEditing}
                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300
                            dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={saveEdit}
                        disabled={isUpdating}
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700
                            dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 text-sm"
                    >
                        {isUpdating ? 'Updating...' : 'Save'}
                    </button>
                </div>
            </div>
        );
    };

    // Render session card
    const renderSessionCard = (session: ScheduledSession, type: 'in-progress' | 'today' | 'future' | 'past') => {
        const isEditing = editingSession === session._id;
        const sessionDate = parseSessionDate(session.date);

        return (
            <div
                key={session._id}
                className={`p-3 rounded-lg ${
                    type === 'in-progress'
                        ? 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500'
                        : type === 'today'
                            ? 'bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-500'
                            : 'bg-gray-50 dark:bg-gray-700'
                } ${type === 'past' ? 'opacity-80' : ''}`}
            >
                <div className="flex justify-between items-start">
                    <div
                        className="flex-grow cursor-pointer"
                        onClick={() => !isEditing && setExpandedSessionId(expandedSessionId === session._id ? null : session._id)}
                    >
                        {type !== 'today' && type !== 'in-progress' && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {format(sessionDate, 'EEEE, MMMM d, yyyy')}
                            </div>
                        )}
                        <h4 className="font-medium text-gray-900 dark:text-white">
                            {session.title}
                            {type === 'in-progress' && (
                                <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">In Progress</span>
                            )}
                            {session.isRecurring && session.recurringGroupId && (
                                <span className="ml-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                                    Recurring {session.recurringIndex + 1}/{session.maxRecurrences}
                                </span>
                            )}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatTime(session.startTime, timeFormat)} - {formatTime(session.endTime, timeFormat)}
                        </p>
                    </div>

                    <div className="flex items-center">
                        {isAdmin && !isEditing && (
                            <>
                                <button
                                    onClick={() => startEditing(session)}
                                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mr-2"
                                    title="Edit Session"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
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
                            </>
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

                {expandedSessionId === session._id && session.notes && !isEditing && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400">{session.notes}</p>
                    </div>
                )}

                {isEditing && renderEditForm()}
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
                    {/* In Progress sessions - Always at the top */}
                    {inProgressSessions.length > 0 && (
                        <div className="p-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">In Progress</h3>
                            <div className="space-y-3">
                                {inProgressSessions.map(session => renderSessionCard(session, 'in-progress'))}
                            </div>
                        </div>
                    )}

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
                    {displayedFutureSessions.length > 0 && (
                        <div className="p-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Upcoming Sessions</h3>
                            <div className="space-y-3">
                                {displayedFutureSessions.map(session => renderSessionCard(session, 'future'))}

                                {futureSessions.length > 3 && (
                                    <button
                                        onClick={() => setShowAllFuture(!showAllFuture)}
                                        className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-2"
                                    >
                                        {showAllFuture
                                            ? 'Show less'
                                            : `Show ${futureSessions.length - 3} more upcoming sessions`}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Past sessions */}
                    {displayedPastSessions.length > 0 && (
                        <div className="p-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Previous Sessions</h3>
                            <div className="space-y-3">
                                {displayedPastSessions.map(session => renderSessionCard(session, 'past'))}

                                {pastSessions.length > 3 && (
                                    <button
                                        onClick={() => setShowAllPast(!showAllPast)}
                                        className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-2"
                                    >
                                        {showAllPast
                                            ? 'Show less'
                                            : `Show ${pastSessions.length - 3} more previous sessions`}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}