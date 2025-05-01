// src/app/components/ScheduledSessionForm.tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, getDay, addDays, isSameMonth, isSameDay, parseISO, isToday } from 'date-fns';
import { formatTime } from '@/utils/dateTimeFormatter';

interface ScheduledSessionFormProps {
    campaignId: string;
    date: Date;
    onClose: () => void;
    onSessionCreated: () => void;
    timeFormat?: '12h' | '24h';
}

export default function ScheduledSessionForm({
                                                 campaignId,
                                                 date: initialDate,
                                                 onClose,
                                                 onSessionCreated,
                                                 timeFormat = '12h'
                                             }: ScheduledSessionFormProps) {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(initialDate);
    const [startTime, setStartTime] = useState(12); // Default to noon
    const [endTime, setEndTime] = useState(14); // Default to 2 hours
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(initialDate);

    const datePickerRef = useRef<HTMLDivElement>(null);

    // Available time slots (8 AM to 10 PM)
    const timeSlots = Array.from({ length: 15 }, (_, i) => i + 8);

    // Handle clicks outside the date picker
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

    // Generate calendar for date picker
    const generateCalendarMonth = () => {
        // Get first day of month and last day of month
        const firstDayOfMonth = startOfMonth(currentMonth);
        const lastDayOfMonth = endOfMonth(currentMonth);

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
        const currentMonthDays = Array.from(
            {length: lastDayOfMonth.getDate()},
            (_, i) => addDays(firstDayOfMonth, i)
        );

        // Generate days from next month to complete the grid (6 weeks = 42 days)
        const totalDays = 42; // 6 weeks
        const daysFromNextMonth = totalDays - prevMonthDays.length - currentMonthDays.length;
        const nextMonthDays = Array.from({length: daysFromNextMonth}, (_, i) =>
            addDays(lastDayOfMonth, i + 1)
        );

        // Combine all days
        return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Please enter a title');
            return;
        }

        if (startTime >= endTime) {
            setError('End time must be after start time');
            return;
        }

        setIsSubmitting(true);

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
            } else {
                setError(data.message || 'Failed to create session');
                setIsSubmitting(false);
            }
        } catch (err) {
            console.error('Error creating session:', err);
            setError('An error occurred while creating the session');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Schedule Session
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Session Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                placeholder="e.g., Dungeon Delve #5"
                                required
                            />
                        </div>

                        <div className="mb-4 relative">
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Date
                            </label>
                            <div className="mt-1 relative">
                                <button
                                    type="button"
                                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-left focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-700 dark:text-gray-300"
                                    onClick={() => setShowDatePicker(!showDatePicker)}
                                >
                                    <div className="flex justify-between items-center">
                                        <span>{format(date, 'EEEE, MMMM d, yyyy')}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </button>

                                {showDatePicker && (
                                    <div
                                        ref={datePickerRef}
                                        className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden"
                                    >
                                        <div className="p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {format(currentMonth, 'MMMM yyyy')}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-7 gap-1">
                                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                                    <div key={i} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                                        {day}
                                                    </div>
                                                ))}

                                                {generateCalendarMonth().map((day, i) => {
                                                    const isCurrentMonth = isSameMonth(day, currentMonth);
                                                    const isSelectedDay = isSameDay(day, date);
                                                    const isCurrentDay = isToday(day);

                                                    return (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => {
                                                                setDate(day);
                                                                setShowDatePicker(false);
                                                            }}
                                                            className={`
                                                                py-1 text-sm rounded-full
                                                                ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}
                                                                ${isSelectedDay ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
                                                                ${isCurrentDay && !isSelectedDay ? 'border border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : ''}
                                                                ${isCurrentMonth && !isSelectedDay && !isCurrentDay ? 'text-gray-700 dark:text-gray-300' : ''}
                                                            `}
                                                        >
                                                            {format(day, 'd')}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Start Time
                                </label>
                                <select
                                    id="startTime"
                                    value={startTime}
                                    onChange={(e) => setStartTime(parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                >
                                    {timeSlots.map((hour) => (
                                        <option key={hour} value={hour}>
                                            {formatTime(hour)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    End Time
                                </label>
                                <select
                                    id="endTime"
                                    value={endTime}
                                    onChange={(e) => setEndTime(parseInt(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                >
                                    {timeSlots.map((hour) => (
                                        <option key={hour} value={hour}>
                                            {formatTime(hour)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Notes (optional)
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Any additional information about the session"
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Scheduling...' : 'Schedule Session'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}