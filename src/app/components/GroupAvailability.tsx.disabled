// src/app/components/GroupAvailability.tsx
"use client";
import React from 'react';
import { useState, useEffect } from 'react';
import { formatTime } from '@/utils/dateTimeFormatter';

interface GroupAvailabilityProps {
    allUsersAvailability: Record<string, Record<string, boolean>>;
    days: string[];
    timeSlots: number[];
    isAdmin?: boolean;
    onScheduleSession?: (date: string) => void;
    timeFormat?: '12h' | '24h';
    campaignId?: string;
}

export default function GroupAvailability({
                                              allUsersAvailability,
                                              days,
                                              timeSlots,
                                              isAdmin = false,
                                              onScheduleSession,
                                              timeFormat = '12h',
                                              campaignId
                                          }: GroupAvailabilityProps) {
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [users, setUsers] = useState<string[]>([]);

    // Cleanup whenever campaignId changes to avoid data leakage between campaigns
    useEffect(() => {
        setSelectedTimeSlot(null);
    }, [campaignId]);

    useEffect(() => {
        // Extract list of users
        setUsers(Object.keys(allUsersAvailability));
    }, [allUsersAvailability]);

    // Count how many users are available for a time slot
    const countAvailableUsers = (day: string, time: number) => {
        const key = `${day}-${time}`;
        let count = 0;

        users.forEach(user => {
            if (allUsersAvailability[user]?.[key]) {
                count++;
            }
        });

        return count;
    };

    // Get color based on availability ratio
    const getAvailabilityColor = (count: number) => {
        const total = users.length;
        if (total === 0) return 'bg-gray-100 dark:bg-gray-700';

        const ratio = count / total;

        if (ratio === 0) return 'bg-gray-100 dark:bg-gray-700';
        if (ratio < 0.25) return 'bg-red-100 dark:bg-red-800/30';
        if (ratio < 0.5) return 'bg-yellow-100 dark:bg-yellow-800/30';
        if (ratio < 0.75) return 'bg-blue-100 dark:bg-blue-800/30';
        return 'bg-green-100 dark:bg-green-800/30';
    };

    // Format time display based on user preference
    const displayTime = (hour: number) => {
        if (timeFormat === '12h') {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:00 ${period}`;
        } else {
            return `${hour}:00`;
        }
    };

    // Handle scheduling a session
    const handleScheduleSession = (day: string, time: number) => {
        if (onScheduleSession) {
            console.log("Scheduling session for", day, "at", time);
            onScheduleSession(day);
        } else {
            console.error("onScheduleSession function is not defined");
        }
    };

    return (
        <div className="mt-6">
            <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Group Availability</h2>

            {/* Mobile view */}
            <div className="md:hidden space-y-4">
                {days.map(day => (
                    <div key={day} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 font-medium text-gray-800 dark:text-gray-200">{day}</div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-600">
                            {timeSlots.map(time => {
                                const count = countAvailableUsers(day, time);
                                const color = getAvailabilityColor(count);
                                const key = `${day}-${time}`;

                                return (
                                    <div
                                        key={key}
                                        className={`p-3 flex justify-between items-center ${color} cursor-pointer hover:bg-opacity-80`}
                                        onClick={() => setSelectedTimeSlot(selectedTimeSlot === key ? null : key)}
                                    >
                                        <span className="text-gray-800 dark:text-gray-200">{displayTime(time)}</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{count}/{users.length} available</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop view */}
            <div className="hidden md:block bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="grid grid-cols-8 gap-px bg-gray-200 dark:bg-gray-600">
                    {/* Header row */}
                    <div className="bg-gray-100 dark:bg-gray-700 p-2"></div>
                    {days.map(day => (
                        <div key={day} className="bg-gray-100 dark:bg-gray-700 p-2 text-center font-medium text-gray-800 dark:text-gray-200">
                            {day}
                        </div>
                    ))}

                    {/* Time slots */}
                    {timeSlots.map(time => (
                        <React.Fragment key={`time-${time}`}>
                            <div className="bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                {displayTime(time)}
                            </div>

                            {days.map(day => {
                                const count = countAvailableUsers(day, time);
                                const color = getAvailabilityColor(count);
                                const key = `${day}-${time}`;
                                const isSelected = selectedTimeSlot === key;

                                return (
                                    <div
                                        key={key}
                                        className={`${color} p-2 border-b border-gray-200 dark:border-gray-600 text-center cursor-pointer hover:bg-opacity-80 ${
                                            isSelected ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''
                                        }`}
                                        onClick={() => setSelectedTimeSlot(selectedTimeSlot === key ? null : key)}
                                    >
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{count}/{users.length}</span>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* User detail panel when a time slot is selected */}
            {selectedTimeSlot && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-md font-medium text-gray-900 dark:text-white">
                            Available for {selectedTimeSlot.split('-')[0]} at {displayTime(parseInt(selectedTimeSlot.split('-')[1]))}
                        </h3>

                        {/* Schedule button for admins */}
                        {isAdmin && (
                            <button
                                onClick={() => handleScheduleSession(selectedTimeSlot.split('-')[0], parseInt(selectedTimeSlot.split('-')[1]))}
                                className="px-3 py-1 bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm"
                            >
                                Schedule Session
                            </button>
                        )}
                    </div>

                    <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                        {users.map(user => (
                            <li
                                key={user}
                                className="py-2 flex items-center"
                            >
                                <span
                                    className={`mr-2 h-3 w-3 rounded-full ${
                                        allUsersAvailability[user]?.[selectedTimeSlot]
                                            ? 'bg-green-500'
                                            : 'bg-red-500'
                                    }`}
                                />
                                <span className="text-gray-700 dark:text-gray-300">
                                    {user} {allUsersAvailability[user]?.[selectedTimeSlot] ? '(Available)' : '(Unavailable)'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}