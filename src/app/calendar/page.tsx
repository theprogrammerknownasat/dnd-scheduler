// src/app/calendar/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import GroupAvailability from '../components/GroupAvailability';
import PollComponent from '../components/PollComponent';
import React from 'react';

export default function Calendar() {
    const [username, setUsername] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const router = useRouter();

    // For simplicity, let's create a 7-day calendar with time slots
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

    // State to track availability
    const [availability, setAvailability] = useState<Record<string, boolean>>({});
    const [allUsersAvailability, setAllUsersAvailability] = useState<Record<string, Record<string, boolean>>>({});

    // Fetch user info and availability on component mount
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();

                if (data.success) {
                    setUsername(data.username);
                    setIsAdmin(data.isAdmin);
                } else {
                    // If not authenticated, redirect to login
                    router.push('/login');
                }
            } catch (err) {
                console.error('Error fetching user info:', err);
            }
        };

        const fetchAvailability = async () => {
            try {
                const response = await fetch('/api/calendar/availability');
                const data = await response.json();

                if (data.success) {
                    setAvailability(data.availability);
                }
            } catch (err) {
                console.error('Error fetching availability:', err);
            }
        };

        const fetchAllUsersAvailability = async () => {
            try {
                const response = await fetch('/api/calendar/all-availability');
                const data = await response.json();

                if (data.success) {
                    setAllUsersAvailability(data.availability);
                }
            } catch (err) {
                console.error('Error fetching all users availability:', err);
            }
        };

        const fetchAnnouncement = async () => {
            try {
                const response = await fetch('/api/announcements/latest');
                const data = await response.json();

                if (data.success && data.announcement) {
                    setAnnouncement(data.announcement);
                }
            } catch (err) {
                console.error('Error fetching announcement:', err);
            }
        };

        fetchUserInfo();
        fetchAvailability();
        fetchAllUsersAvailability();
        fetchAnnouncement();
    }, [router]);

    // Handle toggling availability for a time slot
    const toggleAvailability = async (day: string, time: number) => {
        const key = `${day}-${time}`;
        const newAvailability = {
            ...availability,
            [key]: !availability[key]
        };

        setAvailability(newAvailability);

        // Update availability on the server
        try {
            await fetch('/api/calendar/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availability: newAvailability }),
            });
        } catch (err) {
            console.error('Error updating availability:', err);
        }
    };

    // Count how many users are available for a time slot
    const countAvailableUsers = (day: string, time: number) => {
        const key = `${day}-${time}`;
        let count = 0;

        Object.keys(allUsersAvailability).forEach(user => {
            if (allUsersAvailability[user][key]) {
                count++;
            }
        });

        return count;
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <Header username={username} isAdmin={isAdmin} />

            {announcement && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
                    <p className="font-bold">Announcement</p>
                    <p>{announcement}</p>
                </div>
            )}

            <h2 className="text-lg font-medium mb-4">Your Availability</h2>

            {/* Mobile View - Day Selector */}
            <div className="md:hidden mb-4">
                <label htmlFor="day-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Day
                </label>
                <select
                    id="day-select"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={selectedDay || ''}
                    onChange={(e) => setSelectedDay(e.target.value || null)}
                >
                    <option value="">Select a day</option>
                    {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>

                {selectedDay && (
                    <div className="mt-4 bg-white shadow rounded-lg overflow-hidden">
                        <div className="p-3 bg-gray-100 font-medium">{selectedDay}</div>
                        {timeSlots.map(time => {
                            const key = `${selectedDay}-${time}`;
                            const isAvailable = availability[key];
                            const count = countAvailableUsers(selectedDay, time);

                            return (
                                <div
                                    key={key}
                                    className={`p-3 border-b border-gray-200 flex justify-between items-center ${
                                        isAvailable ? 'bg-green-50' : ''
                                    }`}
                                    onClick={() => toggleAvailability(selectedDay, time)}
                                >
                                    <span>{time}:00 - {time + 1}:00</span>
                                    <div className="flex items-center">
                                        <span className="text-sm text-gray-500 mr-2">{count} available</span>
                                        <span className={`h-5 w-5 rounded-full flex items-center justify-center ${
                                            isAvailable ? 'bg-green-500 text-white' : 'bg-gray-200'
                                        }`}>
                      {isAvailable ? '✓' : ''}
                    </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Desktop View - Full Calendar Grid */}
            <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
                <div className="grid grid-cols-8 gap-px bg-gray-200">
                    {/* Header row */}
                    <div className="bg-gray-100 p-2"></div> {/* Empty cell for time column */}
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
                                const key = `${day}-${time}`;
                                const isAvailable = availability[key];
                                const count = countAvailableUsers(day, time);

                                return (
                                    <div
                                        key={key}
                                        className={`bg-white p-2 border-b border-gray-200 text-center cursor-pointer ${
                                            isAvailable ? 'bg-green-50' : ''
                                        }`}
                                        onClick={() => toggleAvailability(day, time)}
                                    >
                                        <div className="flex flex-col items-center">
                                            {isAvailable ?
                                                <span className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center">✓</span>
                                                :
                                                <span className="h-6 w-6 rounded-full bg-gray-200"></span>
                                            }
                                            <span className="text-xs text-gray-500 mt-1">{count > 0 ? `${count} available` : ''}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Add Group Availability Component */}
            <GroupAvailability
                allUsersAvailability={allUsersAvailability}
                days={days}
                timeSlots={timeSlots}
            />

            {/* Add Poll Component */}
            <PollComponent />
        </div>
    );
}