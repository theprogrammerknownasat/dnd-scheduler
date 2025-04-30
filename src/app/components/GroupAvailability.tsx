// src/app/components/GroupAvailability.tsx
"use client";
import React from 'react';
import { useState, useEffect } from 'react';

interface GroupAvailabilityProps {
    allUsersAvailability: Record<string, Record<string, boolean>>;
    days: string[];
    timeSlots: number[];
}

export default function GroupAvailability({
                                              allUsersAvailability,
                                              days,
                                              timeSlots
                                          }: GroupAvailabilityProps) {
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [users, setUsers] = useState<string[]>([]);

    useEffect(() => {
        // Extract list of users
        setUsers(Object.keys(allUsersAvailability));
    }, [allUsersAvailability]);

    // Count how many users are available for a time slot
    const countAvailableUsers = (day: string, time: number) => {
        const key = `${day}-${time}`;
        let count = 0;

        users.forEach(user => {
            if (allUsersAvailability[user][key]) {
                count++;
            }
        });

        return count;
    };

    // Get color based on availability ratio
    const getAvailabilityColor = (count: number) => {
        const total = users.length;
        if (total === 0) return 'bg-gray-100';

        const ratio = count / total;

        if (ratio === 0) return 'bg-gray-100';
        if (ratio < 0.25) return 'bg-red-100';
        if (ratio < 0.5) return 'bg-yellow-100';
        if (ratio < 0.75) return 'bg-blue-100';
        return 'bg-green-100';
    };

    return (
        <div className="mt-6">
            <h2 className="text-lg font-medium mb-4">Group Availability</h2>

            {/* Mobile view */}
            <div className="md:hidden space-y-4">
                {days.map(day => (
                    <div key={day} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-3 bg-gray-100 font-medium">{day}</div>
                        <div className="divide-y divide-gray-200">
                            {timeSlots.map(time => {
                                const count = countAvailableUsers(day, time);
                                const color = getAvailabilityColor(count);
                                const key = `${day}-${time}`;

                                return (
                                    <div
                                        key={key}
                                        className={`p-3 flex justify-between items-center ${color} cursor-pointer`}
                                        onClick={() => setSelectedTimeSlot(selectedTimeSlot === key ? null : key)}
                                    >
                                        <span>{time}:00 - {time + 1}:00</span>
                                        <span className="font-medium">{count}/{users.length} available</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop view */}
            <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
                <div className="grid grid-cols-8 gap-px bg-gray-200">
                    {/* Header row */}
                    <div className="bg-gray-100 p-2"></div>
                    {days.map(day => (
                        <div key={day} className="bg-gray-100 p-2 text-center font-medium">
                            {day}
                        </div>
                    ))}

                    {/* Time slots */}
                    {timeSlots.map(time => (
                        <React.Fragment key={`time-${time}`}>
                            <div className="bg-white p-2 border-b border-gray-200">
                                {time}:00 - {time + 1}:00
                            </div>

                            {days.map(day => {
                                const count = countAvailableUsers(day, time);
                                const color = getAvailabilityColor(count);
                                const key = `${day}-${time}`;

                                return (
                                    <div
                                        key={key}
                                        className={`${color} p-2 border-b border-gray-200 text-center cursor-pointer`}
                                        onClick={() => setSelectedTimeSlot(selectedTimeSlot === key ? null : key)}
                                    >
                                        <span className="font-medium">{count}/{users.length}</span>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* User detail panel when a time slot is selected */}
            {selectedTimeSlot && (
                <div className="mt-4 p-4 bg-white rounded-lg shadow">
                    <h3 className="text-md font-medium mb-2">
                        Available for {selectedTimeSlot.split('-')[0]} at {selectedTimeSlot.split('-')[1]}:00
                    </h3>
                    <ul className="divide-y divide-gray-200">
                        {users.map(user => (
                            <li
                                key={user}
                                className="py-2 flex items-center"
                            >
                <span
                    className={`mr-2 h-3 w-3 rounded-full ${
                        allUsersAvailability[user][selectedTimeSlot]
                            ? 'bg-green-500'
                            : 'bg-red-500'
                    }`}
                />
                                {user} {allUsersAvailability[user][selectedTimeSlot] ? '(Available)' : '(Unavailable)'}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}