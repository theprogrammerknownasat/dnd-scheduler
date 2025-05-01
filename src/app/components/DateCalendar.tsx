// src/app/components/DateCalendar.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addWeeks,
    subWeeks,
    isToday,
    parseISO,
    isSameDay,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    getMonth,
    getYear,
    getDay,
    addDays,
    isSameMonth
} from 'date-fns';

// Time slots from 8 AM to 10 PM
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => i + 8);

interface User {
    _id: string;
    username: string;
    displayName: string;
}

interface ScheduledSession {
    _id: string;
    title: string;
    date: string;
    startTime: number;
    endTime: number;
    notes: string;
}

interface DateCalendarProps {
    username: string;
    campaignId: string;
    maxWeeks?: number; // Maximum number of weeks to show in the future
    onAvailabilityChange?: (date: Date, hour: number, isAvailable: boolean) => void;
    allUsersAvailability?: Record<string, Record<string, boolean>>;
    allUsers?: Record<string, User>;
    scheduledSessions?: ScheduledSession[];
    isAdmin?: boolean;
    onScheduleSession?: (date: Date) => void;
}

export default function DateCalendar({
                                         username,
                                         campaignId,
                                         maxWeeks = 12, // Default to 12 weeks (3 months)
                                         onAvailabilityChange,
                                         allUsersAvailability = {},
                                         allUsers = {},
                                         scheduledSessions = [],
                                         isAdmin = false,
                                         onScheduleSession
                                     }: DateCalendarProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        // Start the week on the current day
        return new Date();
    });

    const [availability, setAvailability] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

    const datePickerRef = useRef<HTMLDivElement>(null);

    // Generate days for the current week
    const daysInWeek = eachDayOfInterval({
        start: startOfWeek(currentWeekStart, {weekStartsOn: 1}), // Start on Monday
        end: endOfWeek(currentWeekStart, {weekStartsOn: 1})
    });

    // Click outside handler for date picker
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setShowDatePicker(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Fetch availability data
    useEffect(() => {
        if (!campaignId) return;

        const fetchAvailability = async () => {
            setIsLoading(true);
            try {
                // Format dates for the week for the API
                const startDate = format(daysInWeek[0], 'yyyy-MM-dd');
                const endDate = format(daysInWeek[6], 'yyyy-MM-dd');

                const response = await fetch(`/api/calendar/availability?campaignId=${campaignId}&start=${startDate}&end=${endDate}`);
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
    }, [currentWeekStart, daysInWeek, campaignId]);

    // Handle navigation between weeks
    const goToPreviousWeek = () => {
        setCurrentWeekStart(prev => subWeeks(prev, 1));
        setShowDatePicker(false);
    };

    const goToNextWeek = () => {
        // Check if we've reached the max number of weeks in the future
        const maxDate = addWeeks(new Date(), maxWeeks);
        const nextWeekStart = addWeeks(currentWeekStart, 1);

        if (nextWeekStart <= maxDate) {
            setCurrentWeekStart(nextWeekStart);
            setShowDatePicker(false);
        }
    };

    const goToCurrentWeek = () => {
        setCurrentWeekStart(new Date());
        setShowDatePicker(false);
    };

    // Handle toggling availability
    const toggleAvailability = async (date: Date, hour: number) => {
        if (!campaignId) return;

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
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    campaignId,
                    date: dateStr,
                    hour,
                    isAvailable
                }),
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
        let total = 0;

        Object.keys(allUsers).forEach(username => {
            total++;
            if (allUsersAvailability[username]?.[key]) {
                count++;
            }
        });

        return {count, total};
    };

    // Get color based on availability ratio
    const getAvailabilityColor = (count: number, total: number) => {
        if (total === 0) return 'bg-gray-100 dark:bg-gray-700';

        const percentage = count / total;

        if (percentage === 0) return 'bg-gray-100 dark:bg-gray-700';
        if (percentage < 0.25) return 'bg-red-200 dark:bg-red-800';
        if (percentage < 0.5) return 'bg-yellow-200 dark:bg-yellow-800';
        if (percentage < 0.75) return 'bg-green-200 dark:bg-green-800';
        if (percentage < 1) return 'bg-green-300 dark:bg-green-700';
        return 'bg-green-400 dark:bg-green-600'; // 100%
    };

    // Check if a date is in the past
    const isPastDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    // Check if a time slot has a scheduled session
    const getScheduledSession = (date: Date, hour: number) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        return scheduledSessions.find(session => {
            return session.date === dateStr &&
                hour >= session.startTime &&
                hour < session.endTime;
        });
    };

    // Get list of available and unavailable users for a time slot
    const getUsersAvailability = (date: Date, hour: number) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const key = `${dateStr}-${hour}`;
        const availableUsers: string[] = [];
        const unavailableUsers: string[] = [];

        Object.keys(allUsers).forEach(username => {
            const user = allUsers[username];
            const isAvailable = allUsersAvailability[username]?.[key];
            const displayName = user.displayName || user.username;

            if (isAvailable) {
                availableUsers.push(displayName);
            } else {
                unavailableUsers.push(displayName);
            }
        });

        return {availableUsers, unavailableUsers};
    };

    // Generate calendar for date picker
    const generateCalendarMonth = () => {
        // Get first day of month and last day of month
        const firstDayOfMonth = startOfMonth(selectedMonth);
        const lastDayOfMonth = endOfMonth(selectedMonth);

        // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
        const firstDayOfWeek = getDay(firstDayOfMonth);

        // Adjust for starting week on Monday
        const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        // Generate days from previous month to fill first week
        const daysFromPrevMonth = adjustedFirstDay;
        const prevMonthDays = Array.from({length: daysFromPrevMonth}, (_, i) =>
            addDays(firstDayOfMonth, -(daysFromPrevMonth - i))
        );

        // Generate days of current month
        const currentMonthDays = eachDayOfInterval({
            start: firstDayOfMonth,
            end: lastDayOfMonth
        });

        // Generate days from next month to complete the grid (6 weeks = 42 days)
        const totalDays = 42; // 6 weeks
        const daysFromNextMonth = totalDays - prevMonthDays.length - currentMonthDays.length;
        const nextMonthDays = Array.from({length: daysFromNextMonth}, (_, i) =>
            addDays(lastDayOfMonth, i + 1)
        );

        // Combine all days
        return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    };

    // Navigate to a specific date
    const goToDate = (date: Date) => {
        setCurrentWeekStart(date);
        setShowDatePicker(false);
    };

    // Get availability summary for a date (for mini calendar)
    const getDateAvailabilitySummary = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        let totalAvailable = 0;
        let totalSlots = 0;

        TIME_SLOTS.forEach(hour => {
            const key = `${dateStr}-${hour}`;
            let usersAvailable = 0;

            Object.keys(allUsers).forEach(username => {
                if (allUsersAvailability[username]?.[key]) {
                    usersAvailable++;
                }
            });

            if (usersAvailable > 0) {
                totalAvailable += usersAvailable;
                totalSlots += Object.keys(allUsers).length;
            }
        });

        if (totalSlots === 0) return 0;
        return totalAvailable / totalSlots;
    };

    // Get color for date in mini calendar
    const getDateColor = (date: Date) => {
        const availability = getDateAvailabilitySummary(date);

        if (availability === 0) return '';
        if (availability < 0.25) return 'bg-red-100 dark:bg-red-900/30';
        if (availability < 0.5) return 'bg-yellow-100 dark:bg-yellow-900/30';
        if (availability < 0.75) return 'bg-green-100 dark:bg-green-900/30';
        return 'bg-green-200 dark:bg-green-900/50';
    };

    // Check if a date has a scheduled session
    const hasScheduledSession = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return scheduledSessions.some(session => session.date === dateStr);
    };

    // Render selected time slot details
    const renderSelectedTimeSlot = () => {
        if (!selectedTimeSlot) return null;

        const [dateStr, hourStr] = selectedTimeSlot.split('-');
        const date = parseISO(dateStr);
        const hour = parseInt(hourStr);

        const {availableUsers, unavailableUsers} = getUsersAvailability(date, hour);
        const session = getScheduledSession(date, hour);

        return (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                    {format(date, 'EEEE, MMMM d')} at {hour}:00
                </h3>

                {session && (
                    <div
                        className="p-3 mb-3 bg-indigo-100 dark:bg-indigo-900/30 border-l-4 border-indigo-500 text-indigo-700 dark:text-indigo-300">
                        <div className="font-medium">Scheduled Session: {session.title}</div>
                        <div className="text-sm">
                            {session.startTime}:00 - {session.endTime}:00
                            {session.notes && <p className="mt-1">{session.notes}</p>}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
                            Available ({availableUsers.length}/{availableUsers.length + unavailableUsers.length})
                        </h4>
                        {availableUsers.length > 0 ? (
                            <ul className="text-gray-700 dark:text-gray-300 space-y-1">
                                {availableUsers.map(name => (
                                    <li key={name} className="flex items-center">
                                        <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                                        {name}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">No one available</p>
                        )}
                    </div>

                    <div>
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
                            Unavailable ({unavailableUsers.length}/{availableUsers.length + unavailableUsers.length})
                        </h4>
                        {unavailableUsers.length > 0 ? (
                            <ul className="text-gray-700 dark:text-gray-300 space-y-1">
                                {unavailableUsers.map(name => (
                                    <li key={name} className="flex items-center">
                                        <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                                        {name}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Everyone available!</p>
                        )}
                    </div>
                </div>

                {isAdmin && !session && (
                    <div className="mt-4">
                        <button
                            onClick={() => onScheduleSession && onScheduleSession(date)}
                            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600"
                        >
                            Schedule Session
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            {/* Calendar Navigation */}
            <div className="p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700 relative">
                <button
                    onClick={goToPreviousWeek}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                         stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
                    </svg>
                </button>

                <div className="text-center">
                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="text-lg font-medium text-gray-900 dark:text-white hover:underline focus:outline-none"
                    >
                        {format(daysInWeek[0], 'MMM d')} - {format(daysInWeek[6], 'MMM d, yyyy')}
                    </button>
                    <div className="mt-1">
                        <button
                            onClick={goToCurrentWeek}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Today
                        </button>
                    </div>

                    {/* Date Picker Popup */}
                    {showDatePicker && (
                        <div
                            ref={datePickerRef}
                            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-10 w-80"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <button
                                    onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                         strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M15.75 19.5L8.25 12l7.5-7.5"/>
                                    </svg>
                                </button>

                                <h3 className="font-medium text-gray-900 dark:text-white">
                                    {format(selectedMonth, 'MMMM yyyy')}
                                </h3>

                                <button
                                    onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                         strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center">
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                                    <div key={index} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {day}
                                    </div>
                                ))}

                                {generateCalendarMonth().map((date, index) => {
                                    const isCurrentMonth = isSameMonth(date, selectedMonth);
                                    const isSelected = daysInWeek.some(day => isSameDay(day, date));
                                    const isCurrentDay = isToday(date);
                                    const hasSession = hasScheduledSession(date);
                                    const dateColor = getDateColor(date);

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => goToDate(date)}
                                            disabled={isPastDate(date) || date > addWeeks(new Date(), maxWeeks)}
                                            className={`p-1 rounded-full text-sm relative ${
                                                isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                                            } ${
                                                isSelected ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''
                                            } ${
                                                dateColor
                                            } ${
                                                isCurrentDay ? 'font-bold ring-2 ring-indigo-500 dark:ring-indigo-400' : ''
                                            } ${
                                                isPastDate(date) || date > addWeeks(new Date(), maxWeeks) ?
                                                    'opacity-50 cursor-not-allowed' :
                                                    'hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {format(date, 'd')}
                                            {hasSession && (
                                                <span
                                                    className="absolute top-0 right-0 h-2 w-2 bg-indigo-500 rounded-full"></span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={goToNextWeek}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                    disabled={addWeeks(currentWeekStart, 1) > addWeeks(new Date(), maxWeeks)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                         stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                    </svg>
                </button>
            </div>

            {/* Desktop View - Calendar Grid */}
            <div className="hidden md:block overflow-x-auto">
                <div className="grid grid-cols-8 min-w-max">
                    {/* Header row */}
                    <div
                        className="p-3 border-b border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-medium"></div>
                    {daysInWeek.map((day) => (
                        <div
                            key={format(day, 'yyyy-MM-dd')}
                            className={`p-3 border-b border-r border-gray-200 dark:border-gray-600 text-center font-medium 
                ${isToday(day) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}
                        >
                            <div className="text-gray-500 dark:text-gray-300">{format(day, 'EEE')}</div>
                            <div
                                className={`text-lg ${isToday(day) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}

                    {/* Time slots */}
                    {TIME_SLOTS.map((hour) => (
                        <React.Fragment key={`hour-${hour}`}>
                            <div
                                className="p-3 border-b border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-300">
                                {hour}:00
                            </div>

                            {daysInWeek.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const key = `${dateStr}-${hour}`;
                                const isAvailable = !!availability[key];
                                const isPast = isPastDate(day) || (isToday(day) && new Date().getHours() >= hour);
                                const {count, total} = countAvailableUsers(day, hour);
                                const availabilityColor = getAvailabilityColor(count, total);
                                const session = getScheduledSession(day, hour);

                                return (
                                    <div
                                        key={key}
                                        className={`p-3 border-b border-r border-gray-200 dark:border-gray-600 text-center 
                      ${!isPast ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                      ${isAvailable ? 'bg-green-50 dark:bg-green-900/20' : ''}
                      ${isToday(day) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
                      ${session ? 'bg-indigo-100 dark:bg-indigo-900/30 border-l-4 border-indigo-500' : ''}
                      ${availabilityColor}
                    `}
                                        onClick={() => {
                                            if (!isPast) {
                                                toggleAvailability(day, hour);
                                                setSelectedTimeSlot(key);
                                            }
                                        }}
                                    >
                                        <div className="flex flex-col items-center">
                                            {isAvailable ?
                                                <span
                                                    className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center">✓</span>
                                                :
                                                <span
                                                    className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600"></span>
                                            }
                                            <span className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                        {count}/{total} {session && `• ${session.title}`}
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
                                <span className="text-gray-700 dark:text-gray-300">{format(day, 'EEEE')}</span>
                                <span
                                    className={`${isToday(day) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
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
                                const {count, total} = countAvailableUsers(day, hour);
                                const session = getScheduledSession(day, hour);
                                const availabilityColor = getAvailabilityColor(count, total);

                                return (
                                    <div
                                        key={key}
                                        className={`p-3 flex justify-between items-center
                      ${!isPast ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                      ${isAvailable ? 'bg-green-50 dark:bg-green-900/20' : ''}
                      ${session ? 'bg-indigo-100 dark:bg-indigo-900/30 border-l-4 border-indigo-500' : ''}
                      ${availabilityColor}
                    `}
                                        onClick={() => {
                                            if (!isPast) {
                                                toggleAvailability(day, hour);
                                                setSelectedTimeSlot(key);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center">
                                            <span className="text-gray-700 dark:text-gray-300">{hour}:00</span>
                                            {session && (
                                                <span className="ml-2 text-sm text-indigo-600 dark:text-indigo-400">
                          {session.title}
                        </span>
                                            )}
                                        </div>
                                        <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                        {count}/{total}
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

            {/* Selected Time Slot Details */}
            {selectedTimeSlot && renderSelectedTimeSlot()}
        </div>
    );
}