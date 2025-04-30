// src/app/components/DateCalendar.tsx
"use client";
import React, { useState, useEffect } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addWeeks,
    subWeeks,
    isToday,
    parseISO,
    isSameDay
} from 'date-fns';

// Time slots from 8 AM to 10 PM
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => i + 8);

interface DateCalendarProps {
    username: string;
    maxWeeks?: number; // Maximum number of weeks to show in the future
    onAvailabilityChange?: (date: Date, hour: number, isAvailable: boolean) => void;
    allUsersAvailability?: Record<string, Record<string, boolean>>;
}

export default function DateCalendar({
                                         username,
                                         maxWeeks = 12, // Default to 12 weeks (3 months)
                                         onAvailabilityChange,
                                         allUsersAvailability = {}
                                     }: DateCalendarProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        // Start the week on the current day
        return new Date();
    });

    const [availability, setAvailability] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Generate days for the current week
    const daysInWeek = eachDayOfInterval({
        start: startOfWeek(currentWeekStart, { weekStartsOn: 1 }), // Start on Monday
        end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    });

    // Fetch availability data
    useEffect(() => {
        const fetchAvailability = async () => {
            setIsLoading(true);
            try {
                // Format dates for the week for the API
                const startDate = format(daysInWeek[0], 'yyyy-MM-dd');
                const endDate = format(daysInWeek[6], 'yyyy-MM-dd');

                const response = await fetch(`/api/calendar/availability?start=${startDate}&end=${endDate}`);
                const data = await response.json();

                if (data.success) {
                    setAvailability(data.availability);
                }
            } catch (err) {
                console.error('Error fetching availability:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAvailability();
    }, [currentWeekStart, daysInWeek]);

    // Handle navigation between weeks
    const goToPreviousWeek = () => {
        setCurrentWeekStart(prev => subWeeks(prev, 1));
    };

    const goToNextWeek = () => {
        // Check if we've reached the max number of weeks in the future
        const maxDate = addWeeks(new Date(), maxWeeks);
        const nextWeekStart = addWeeks(currentWeekStart, 1);

        if (nextWeekStart <= maxDate) {
            setCurrentWeekStart(nextWeekStart);
        }
    };

    const goToCurrentWeek = () => {
        setCurrentWeekStart(new Date());
    };

    // Handle toggling availability
    const toggleAvailability = async (date: Date, hour: number) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const key = `${dateStr}-${hour}`;
        const isAvailable = !availability[key];

        // Update local state
        setAvailability(prev => ({
            ...prev,
            [key]: isAvailable
        }));

        // Call the parent callback if provided
        if (onAvailabilityChange) {
            onAvailabilityChange(date, hour, isAvailable);
        }

        // Update availability on the server
        try {
            await fetch('/api/calendar/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateStr, hour, isAvailable }),
            });
        } catch (err) {
            console.error('Error updating availability:', err);
            // Revert state on error
            setAvailability(prev => ({
                ...prev,
                [key]: !isAvailable
            }));
        }
    };

    // Count available users for a specific time slot
    const countAvailableUsers = (date: Date, hour: number) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const key = `${dateStr}-${hour}`;
        let count = 0;

        Object.keys(allUsersAvailability).forEach(user => {
            if (allUsersAvailability[user][key]) {
                count++;
            }
        });

        return count;
    };

    // Check if a date is in the past
    const isPastDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            {/* Calendar Navigation */}
            <div className="p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700">
                <button
                    onClick={goToPreviousWeek}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>

                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {format(daysInWeek[0], 'MMM d')} - {format(daysInWeek[6], 'MMM d, yyyy')}
                    </h3>
                    <button
                        onClick={goToCurrentWeek}
                        className="mt-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        Today
                    </button>
                </div>

                <button
                    onClick={goToNextWeek}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                    disabled={addWeeks(currentWeekStart, 1) > addWeeks(new Date(), maxWeeks)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>

            {/* Desktop View - Calendar Grid */}
            <div className="hidden md:block overflow-x-auto">
                <div className="grid grid-cols-8 min-w-max">
                    {/* Header row */}
                    <div className="p-3 border-b border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-medium"></div>
                    {daysInWeek.map((day) => (
                        <div
                            key={format(day, 'yyyy-MM-dd')}
                            className={`p-3 border-b border-r border-gray-200 dark:border-gray-600 text-center font-medium 
                ${isToday(day) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}
                        >
                            <div>{format(day, 'EEE')}</div>
                            <div className={`text-lg ${isToday(day) ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}

                    {/* Time slots */}
                    {TIME_SLOTS.map((hour) => (
                        <React.Fragment key={`hour-${hour}`}>
                            <div className="p-3 border-b border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-medium">
                                {hour}:00
                            </div>

                            {daysInWeek.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const key = `${dateStr}-${hour}`;
                                const isAvailable = !!availability[key];
                                const isPast = isPastDate(day) || (isToday(day) && new Date().getHours() >= hour);
                                const count = countAvailableUsers(day, hour);

                                return (
                                    <div
                                        key={key}
                                        className={`p-3 border-b border-r border-gray-200 dark:border-gray-600 text-center 
                      ${!isPast ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                      ${isAvailable ? 'bg-green-50 dark:bg-green-900/20' : ''}
                      ${isToday(day) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                        onClick={() => !isPast && toggleAvailability(day, hour)}
                                    >
                                        <div className="flex flex-col items-center">
                                            {isAvailable ?
                                                <span className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center">✓</span>
                                                :
                                                <span className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600"></span>
                                            }
                                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {count > 0 ? `${count} available` : ''}
                      </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Mobile View - Day by Day */}
            <div className="md:hidden">
                {daysInWeek.map((day) => (
                    <div key={format(day, 'yyyy-MM-dd')} className="border-b border-gray-200 dark:border-gray-600">
                        <div className={`p-3 font-medium ${
                            isToday(day) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-700'
                        }`}>
                            <div className="flex justify-between items-center">
                                <span>{format(day, 'EEEE')}</span>
                                <span className={`${isToday(day) ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                  {format(day, 'MMM d')}
                </span>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-200 dark:divide-gray-600">
                            {TIME_SLOTS.map((hour) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const key = `${dateStr}-${hour}`;
                                const isAvailable = !!availability[key];
                                const isPast = isPastDate(day) || (isToday(day) && new Date().getHours() >= hour);
                                const count = countAvailableUsers(day, hour);

                                return (
                                    <div
                                        key={key}
                                        className={`p-3 flex justify-between items-center
                      ${!isPast ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                      ${isAvailable ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                                        onClick={() => !isPast && toggleAvailability(day, hour)}
                                    >
                                        <span>{hour}:00</span>
                                        <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                        {count > 0 ? `${count} available` : ''}
                      </span>
                                            <span className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                                isAvailable ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'
                                            }`}>
                        {isAvailable ? '✓' : ''}
                      </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}