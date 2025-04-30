// src/app/calendar/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import DateCalendar from '../components/DateCalendar';
import PollComponent from '../components/PollComponent';
import { format } from 'date-fns';

export default function Calendar() {
    const [username, setUsername] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [announcement, setAnnouncement] = useState({ text: '', color: 'yellow' });
    const [allUsersAvailability, setAllUsersAvailability] = useState<Record<string, Record<string, boolean>>>({});
    const [maxWeeks, setMaxWeeks] = useState(12); // Default to 12 weeks
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fetch user info and settings on component mount
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

        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                const data = await response.json();

                if (data.success && data.settings) {
                    // Set max weeks if available
                    if (data.settings.maxFutureWeeks) {
                        setMaxWeeks(data.settings.maxFutureWeeks);
                    }
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
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
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
        fetchSettings();
        fetchAllUsersAvailability();
        fetchAnnouncement();
    }, [router]);

    // Handle updating availability
    const handleAvailabilityChange = async (date: Date, hour: number, isAvailable: boolean) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        // Update the all users availability local state
        setAllUsersAvailability(prev => {
            const newState = { ...prev };
            if (!newState[username]) {
                newState[username] = {};
            }
            newState[username][`${dateStr}-${hour}`] = isAvailable;
            return newState;
        });
    };

    const getAnnouncementClasses = () => {
        const baseClasses = "border-l-4 p-4 mb-4 rounded";

        switch (announcement.color) {
            case 'red':
                return `${baseClasses} bg-red-100 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-400`;
            case 'green':
                return `${baseClasses} bg-green-100 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-500 dark:text-green-400`;
            case 'blue':
                return `${baseClasses} bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-400`;
            case 'yellow':
            default:
                return `${baseClasses} bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-500 dark:text-yellow-400`;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Header username={username} isAdmin={isAdmin} />

            {announcement.text && (
                <div className={getAnnouncementClasses()}>
                    <p className="font-bold">Announcement</p>
                    <p>{announcement.text}</p>
                </div>
            )}

            <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Your Availability</h2>

            <DateCalendar
                username={username}
                maxWeeks={maxWeeks}
                onAvailabilityChange={handleAvailabilityChange}
                allUsersAvailability={allUsersAvailability}
            />

            {/* Add Poll Component */}
            <div className="mt-8">
                <PollComponent />
            </div>
        </div>
    );
}