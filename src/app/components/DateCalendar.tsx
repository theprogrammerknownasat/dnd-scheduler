// src/app/components/DateCalendar.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    subDays,
    isSameMonth,
    isSameWeek,
    differenceInCalendarDays
} from 'date-fns';
import { formatTime, formatTimeRange } from '@/utils/dateTimeFormatter';
import { daysInWeek } from 'date-fns/constants';
import GroupAvailability from "@/app/components/GroupAvailability.tsx";

// Zoom level configurations for different views
const ZOOM_LEVELS = {
    OUT: 'out', // 2-week view
    NORMAL: 'normal', // 1-week view (default)
    IN: 'in' // 3-day view
};

// Time slot configurations for different zoom levels
// Default time slots from 8 AM to 10 PM
const DEFAULT_TIME_SLOTS = Array.from({ length: 15 }, (_, i) => i + 8);
// Half-hour time slots (for zoom-in view)
const HALF_HOUR_SLOTS = Array.from({ length: 29 }, (_, i) => i / 2 + 8);

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
    fetchAllUsersAvailability?: (startDate: string, endDate: string) => Promise<void>;
    fetchScheduledSessions?: (startDate: string, endDate: string) => Promise<void>;
    timeFormat?: '12h' | '24h';
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
                                         onScheduleSession,
                                         fetchAllUsersAvailability,
                                         fetchScheduledSessions,
                                         timeFormat = '12h'
                                     }: DateCalendarProps) {
    // Calendar state
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        // Start the week on the current day
        return new Date();
    });

    const [availability, setAvailability] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

    // Additional state for new features
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(ZOOM_LEVELS.NORMAL);
    const [dragStart, setDragStart] = useState<string | null>(null);
    const [dragState, setDragState] = useState<boolean | null>(null);
    const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
    const [hoveredTimeSlot, setHoveredTimeSlot] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStartCell, setDragStartCell] = useState<string | null>(null);
    const [dragValue, setDragValue] = useState<boolean | null>(null);

    // Refs
    const datePickerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const prevDaysRef = useRef<Date[]>([]);

    // Get time slots based on current zoom level
    const timeSlots = zoomLevel === ZOOM_LEVELS.IN
        ? HALF_HOUR_SLOTS
        : DEFAULT_TIME_SLOTS;

    // Generate days based on current zoom level
    const getDaysForView = useCallback(() => {
        switch (zoomLevel) {
            case ZOOM_LEVELS.OUT:
                // 2-week view (14 days)
                return eachDayOfInterval({
                    start: startOfWeek(currentWeekStart, {weekStartsOn: 1}),
                    end: endOfWeek(addWeeks(currentWeekStart, 1), {weekStartsOn: 1})
                });
            case ZOOM_LEVELS.IN:
                // 3-day view centered on current day
                const middleDay = currentWeekStart;
                const dayBefore = subDays(middleDay, 1);
                const dayAfter = addDays(middleDay, 1);
                return [dayBefore, middleDay, dayAfter];
            case ZOOM_LEVELS.NORMAL:
            default:
                // 1-week view (default)
                return eachDayOfInterval({
                    start: startOfWeek(currentWeekStart, {weekStartsOn: 1}),
                    end: endOfWeek(currentWeekStart, {weekStartsOn: 1})
                });
        }
    }, [currentWeekStart, zoomLevel]);

    const daysInView = getDaysForView();

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

    useEffect(() => {
        const handleDragEnd = () => {
            if (isDragging) {
                setIsDragging(false);
                setDragStartCell(null);
                setDragValue(null);
            }
        };

        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchend', handleDragEnd);

        return () => {
            window.removeEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchend', handleDragEnd);
        };
    }, [isDragging]);

    // Handle drag actions for the calendar
    useEffect(() => {
        function handleMouseUp() {
            if (isDragging) {
                setIsDragging(false);
                setDragStart(null);
                setDragState(null);
            }
        }

        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("touchend", handleMouseUp);
        return () => {
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("touchend", handleMouseUp);
        };
    }, [isDragging]);

    // Auto-select current day's time slot when nothing is selected
    useEffect(() => {
        if (!selectedTimeSlot && daysInView.length > 0) {
            // Find today in the view, or use the first day
            const today = new Date();
            const dayInView = daysInView.find(day => isSameDay(day, today)) || daysInView[0];

            // Use current hour or default to noon
            const currentHour = today.getHours();
            const hour = (currentHour >= 8 && currentHour < 22) ? currentHour : 12;

            // Set the selected time slot
            const dateStr = format(dayInView, 'yyyy-MM-dd');
            setSelectedTimeSlot(`${dateStr}-${hour}`);
        }
    }, [selectedTimeSlot, daysInView]);

    // Fetch data when view changes
    useEffect(() => {
        if (!campaignId) return;

        // Only fetch data when the view has significantly changed (first day is different)
        // This prevents repeated fetches for minor UI updates
        const fetchData = async () => {
            // Store the current days in a ref to prevent re-fetching for the same days
            if (prevDaysRef.current &&
                prevDaysRef.current.length > 0 &&
                daysInView.length > 0 &&
                format(prevDaysRef.current[0], 'yyyy-MM-dd') === format(daysInView[0], 'yyyy-MM-dd')) {
                // Skip if first day hasn't changed
                return;
            }

            // Update ref to current days
            prevDaysRef.current = daysInView;

            setIsLoading(true);

            // Format dates for API calls
            const startDate = format(daysInView[0], 'yyyy-MM-dd');
            const endDate = format(daysInView[daysInView.length - 1], 'yyyy-MM-dd');

            try {
                // Fetch personal availability
                const response = await fetch(`/api/calendar/availability?campaignId=${campaignId}&start=${startDate}&end=${endDate}`);
                const data = await response.json();

                if (data.success) {
                    setAvailability(data.availability);
                }

                // Fetch all users' availability and sessions - only if the functions exist
                if (fetchAllUsersAvailability) {
                    await fetchAllUsersAvailability(startDate, endDate);
                }

                if (fetchScheduledSessions) {
                    await fetchScheduledSessions(startDate, endDate);
                }
            } catch (err) {
                console.error('Error fetching calendar data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        // Fetch data with delay to avoid rapid consecutive fetches
        const timer = setTimeout(() => {
            fetchData();
        }, 300);

        return () => clearTimeout(timer);
    }, [daysInView, campaignId, fetchAllUsersAvailability, fetchScheduledSessions]);

    // Change zoom level
    const handleZoomChange = (level: string) => {
        setZoomLevel(level);

        // Reset any selections to avoid confusion
        setSelectedTimeSlot(null);
        setExpandedDay(null);
    };

    // Handle navigation between time periods
    const navigatePrevious = () => {
        switch (zoomLevel) {
            case ZOOM_LEVELS.OUT:
                setCurrentWeekStart(prev => subWeeks(prev, 2));
                break;
            case ZOOM_LEVELS.IN:
                setCurrentWeekStart(prev => subDays(prev, 3));
                break;
            case ZOOM_LEVELS.NORMAL:
            default:
                setCurrentWeekStart(prev => subWeeks(prev, 1));
                break;
        }
        setShowDatePicker(false);
    };

    const navigateNext = () => {
        // Check if we've reached the max number of weeks in the future
        const maxDate = addWeeks(new Date(), maxWeeks);
        let nextDate;

        switch (zoomLevel) {
            case ZOOM_LEVELS.OUT:
                nextDate = addWeeks(currentWeekStart, 2);
                break;
            case ZOOM_LEVELS.IN:
                nextDate = addDays(currentWeekStart, 3);
                break;
            case ZOOM_LEVELS.NORMAL:
            default:
                nextDate = addWeeks(currentWeekStart, 1);
                break;
        }

        // Only navigate if we're not exceeding the max date
        if (nextDate <= maxDate) {
            setCurrentWeekStart(nextDate);
            setShowDatePicker(false);
        }
    };

    const goToCurrentWeek = () => {
        setCurrentWeekStart(new Date());
        setShowDatePicker(false);
    };

    // Format the current view's date range for display
    const formatDateRange = () => {
        const firstDay = daysInView[0];
        const lastDay = daysInView[daysInView.length - 1];

        if (isSameMonth(firstDay, lastDay)) {
            return `${format(firstDay, 'MMM d')} - ${format(lastDay, 'd, yyyy')}`;
        } else if (isSameYear(firstDay, lastDay)) {
            return `${format(firstDay, 'MMM d')} - ${format(lastDay, 'MMM d, yyyy')}`;
        } else {
            return `${format(firstDay, 'MMM d, yyyy')} - ${format(lastDay, 'MMM d, yyyy')}`;
        }
    };

    // Helper to check if two dates are in the same year
    const isSameYear = (date1: Date, date2: Date) => {
        return format(date1, 'yyyy') === format(date2, 'yyyy');
    };

    // Handle toggling availability with drag support
    const toggleAvailability = async (date: Date, hour: number, forceState?: boolean) => {
        if (!campaignId) return;

        const dateStr = format(date, 'yyyy-MM-dd');
        const key = `${dateStr}-${hour}`;
        const isAvailable = forceState !== undefined ? forceState : !availability[key];

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
                    campaignId,  // Make sure this is included
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

    // Handle mouse down to start dragging
    const handleMouseDown = (date: Date, hour: number) => {
        // Don't allow dragging in the past
        if (isPastDate(date) || (isToday(date) && new Date().getHours() >= hour)) {
            return;
        }

        // If user is holding shift key, initiate drag selection mode
        if (window.event && (window.event as MouseEvent).shiftKey) {
            const dateStr = format(date, 'yyyy-MM-dd');
            const key = `${dateStr}-${hour}`;

            // Set initial drag state (invert current state)
            setIsDragging(true);
            setDragStart(key);
            setDragState(!availability[key]);

            // Toggle this cell immediately
            toggleAvailability(date, hour, !availability[key]);
        } else {
            // Regular click - just toggle the availability
            toggleAvailability(date, hour);
        }
    };

    // Handle mouse enter during drag
    const handleMouseEnter = (date: Date, hour: number) => {
        // Set hovered cell for tooltip/preview
        setHoveredDay(date);
        setHoveredTimeSlot(hour);

        // Continue drag operation if active
        if (isDragging && dragState !== null) {
            // Don't allow dragging in the past
            if (isPastDate(date) || (isToday(date) && new Date().getHours() >= hour)) {
                return;
            }

            // Toggle to the same state as drag start
            toggleAvailability(date, hour, dragState);
        }
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
        setHoveredDay(null);
        setHoveredTimeSlot(null);
    };

    const handleDragStart = (date: Date, hour: number, event: React.MouseEvent) => {
        // Prevent text selection during drag
        event.preventDefault();

        if (isPastDate(date) || (isToday(date) && new Date().getHours() >= hour)) {
            return; // Don't allow dragging on past dates/hours
        }

        const dateStr = format(date, 'yyyy-MM-dd');
        const key = `${dateStr}-${hour}`;

        // Set the start cell and current value (we'll toggle to the opposite)
        setDragStartCell(key);

        // Set the drag value (opposite of current value)
        const currentValue = !!availability[key];
        setDragValue(!currentValue);

        // Start dragging
        setIsDragging(true);

        // Toggle the cell
        toggleAvailability(date, hour);
    };

    const handleDragOver = (date: Date, hour: number) => {
        if (!isDragging || dragValue === null) return;

        if (isPastDate(date) || (isToday(date) && new Date().getHours() >= hour)) {
            return; // Don't allow dragging on past dates/hours
        }

        const dateStr = format(date, 'yyyy-MM-dd');
        const key = `${dateStr}-${hour}`;

        // Toggle to the drag value if it's different from current value
        const currentValue = !!availability[key];
        if (currentValue !== dragValue) {
            toggleAvailability(date, hour, dragValue);
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

        timeSlots.forEach(hour => {
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

    // Toggle expanded day on mobile
    const toggleExpandDay = (dateStr: string) => {
        if (expandedDay === dateStr) {
            setExpandedDay(null);
        } else {
            setExpandedDay(dateStr);
        }
    };

    // Handle time slot selection for details panel
    const handleTimeSlotClick = (date: Date, hour: number) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const key = `${dateStr}-${hour}`;

        // Always set the selected time slot when clicked, regardless of whether it was previously selected
        setSelectedTimeSlot(key);

        // Toggle availability only if holding Ctrl/Cmd key (for better selection experience)
        if (window.event && (window.event as MouseEvent).ctrlKey) {
            toggleAvailability(date, hour);
        }
    };

    // Format time for display based on user preference
    const displayTime = useCallback((hour: number) => {
        // Check if it's a half hour
        const isHalf = !Number.isInteger(hour);
        const hourNum = Math.floor(hour);
        const minutes = isHalf ? '30' : '00';

        if (timeFormat === '12h') {
            const period = hourNum >= 12 ? 'PM' : 'AM';
            const displayHour = hourNum % 12 || 12;
            return `${displayHour}:${minutes} ${period}`;
        } else {
            return `${hourNum}:${minutes}`;
        }
    }, [timeFormat]);

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

    // Render selected time slot details or hovered time slot preview
    // Replace the renderTimeSlotDetails function in DateCalendar.tsx

    const renderTimeSlotDetails = () => {
        if (!selectedTimeSlot) return null;

        // Parse the selected time slot
        const [dateStr, hourStr] = selectedTimeSlot.split('-');
        const date = parseISO(dateStr);
        const hour = parseFloat(hourStr);

        // Get availability info and session info
        const {availableUsers, unavailableUsers} = getUsersAvailability(date, hour);
        const session = getScheduledSession(date, hour);

        return (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                    {format(date, 'EEEE, MMMM d')} at {displayTime(hour)}
                </h3>

                {session && (
                    <div className="p-3 mb-3 bg-indigo-100 dark:bg-indigo-900/30 border-l-4 border-indigo-500 text-indigo-700 dark:text-indigo-300">
                        <div className="font-medium">Scheduled Session: {session.title}</div>
                        <div className="text-sm">
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
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
                            onClick={() => {
                                // We need to ensure this function exists and is working
                                console.log("Scheduling session for", date);
                                if (onScheduleSession) {
                                    onScheduleSession(date);
                                } else {
                                    console.error("onScheduleSession function is not defined");
                                }
                            }}
                            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600"
                        >
                            Schedule Session
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const formattedDays = daysInView.map(day => format(day, 'yyyy-MM-dd'));

    // Create a handler for scheduling from GroupAvailability
    const handleGroupScheduleSession = (dateStr: string) => {
        if (onScheduleSession) {
            const date = parseISO(dateStr);
            onScheduleSession(date);
        }
    };


    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            {/* Calendar Navigation and Zoom Controls */}
            <div className="p-4 flex flex-wrap items-center justify-between bg-gray-50 dark:bg-gray-700 relative">
                <div className="flex items-center">
                    <button
                        onClick={navigatePrevious}
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
                            className="inline-flex items-center px-4 py-2 text-lg font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none"
                            aria-label="Select date range"
                        >
                            <span>{formatDateRange()}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
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
                                        const isSelected = daysInView.some(day => isSameDay(day, date));
                                        const isCurrentDay = isToday(date);
                                        const hasSession = hasScheduledSession(date);
                                        // Always show color for days with availability data
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
                        onClick={navigateNext}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                        disabled={addWeeks(currentWeekStart, 1) > addWeeks(new Date(), maxWeeks)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                             stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                        </svg>
                    </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center mt-2 sm:mt-0">
                    <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                        <button
                            onClick={() => handleZoomChange(ZOOM_LEVELS.OUT)}
                            className={`px-3 py-1 text-xs sm:text-sm ${
                                zoomLevel === ZOOM_LEVELS.OUT
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                            title="2 Weeks View"
                        >
                            <span className="hidden sm:inline">2 Weeks</span>
                            <span className="sm:hidden">2W</span>
                        </button>
                        <button
                            onClick={() => handleZoomChange(ZOOM_LEVELS.NORMAL)}
                            className={`px-3 py-1 text-xs sm:text-sm ${
                                zoomLevel === ZOOM_LEVELS.NORMAL
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                            } border-l border-r border-gray-300 dark:border-gray-600`}
                            title="1 Week View"
                        >
                            <span className="hidden sm:inline">Week</span>
                            <span className="sm:hidden">1W</span>
                        </button>
                        <button
                            onClick={() => handleZoomChange(ZOOM_LEVELS.IN)}
                            className={`px-3 py-1 text-xs sm:text-sm ${
                                zoomLevel === ZOOM_LEVELS.IN
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                            title="3 Days View"
                        >
                            <span className="hidden sm:inline">3 Days</span>
                            <span className="sm:hidden">3D</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop View - Calendar Grid */}
            <div className="hidden md:block overflow-x-auto">
                <div ref={calendarRef} className="grid grid-cols-8 min-w-max">
                    {/* Header row */}
                    <div
                        className="p-3 border-b border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-medium"></div>
                    {daysInView.map((day) => (
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
                    {timeSlots.map((hour) => (
                        <React.Fragment key={`hour-${hour}`}>
                            <div
                                className="p-3 border-b border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-300">
                                {displayTime(hour)}
                            </div>

                            {daysInView.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const key = `${dateStr}-${hour}`;
                                const isAvailable = !!availability[key];
                                const isPast = isPastDate(day) || (isToday(day) && new Date().getHours() >= hour);
                                const {count, total} = countAvailableUsers(day, hour);
                                const availabilityColor = getAvailabilityColor(count, total);
                                const session = getScheduledSession(day, hour);
                                const isSelected = selectedTimeSlot === key;
                                const isHovered = hoveredDay && isSameDay(hoveredDay, day) && hoveredTimeSlot === hour;

                                return (
                                    <div
                                        key={key}
                                        data-time-slot={`${dateStr}-${hour}`}
                                        className={`p-3 border-b border-r border-gray-200 dark:border-gray-600 text-center 
                                            ${!isPast ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                                            ${isAvailable ? 'bg-green-50 dark:bg-green-900/20' : ''}
                                            ${isToday(day) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
                                            ${session ? 'bg-indigo-100 dark:bg-indigo-900/30 border-l-4 border-indigo-500' : ''}
                                            ${availabilityColor}
                                            ${isSelected ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
                                            ${isHovered ? 'ring-2 ring-gray-400 dark:ring-gray-500' : ''}
                                        `}
                                        onClick={() => !isPast && handleTimeSlotClick(day, hour)}
                                        onMouseDown={(e) => !isPast && handleDragStart(day, hour, e)}
                                        onMouseEnter={() => !isPast && handleDragOver(day, hour)}
                                        onMouseLeave={handleMouseLeave}
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

            {/* Mobile View - Collapsible Days */}
            <div className="md:hidden">
                {daysInView.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isExpanded = expandedDay === dateStr;
                    const hasAvailability = timeSlots.some(hour => {
                        const key = `${dateStr}-${hour}`;
                        return availability[key];
                    });

                    // Count users available for this day
                    const totalUsersAvailable = timeSlots.reduce((acc, hour) => {
                        const {count} = countAvailableUsers(day, hour);
                        return acc + count;
                    }, 0);

                    // Get sessions for this day
                    const daySessions = scheduledSessions.filter(session =>
                        session.date === dateStr
                    );

                    return (
                        <div key={dateStr} className="border-b border-gray-200 dark:border-gray-600">
                            <div
                                className={`p-3 font-medium ${
                                    isToday(day) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-700'
                                } cursor-pointer`}
                                onClick={() => toggleExpandDay(dateStr)}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <span className={`
                                            ${isToday(day) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}
                                            font-bold text-lg mr-2
                                        `}>
                                            {format(day, 'd')}
                                        </span>
                                        <span className="text-gray-700 dark:text-gray-300">{format(day, 'EEEE')}</span>
                                    </div>
                                    <div className="flex items-center">
                                        {hasAvailability && (
                                            <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                                        )}
                                        {daySessions.length > 0 && (
                                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded mr-2">
                                                {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className={`w-5 h-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </div>
                                </div>
                                {!isExpanded && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {totalUsersAvailable > 0 ? (
                                            <span>{totalUsersAvailable} availability marker{totalUsersAvailable !== 1 ? 's' : ''}</span>
                                        ) : (
                                            <span>No availability marked</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {isExpanded && (
                                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                                    {timeSlots.map((hour) => {
                                        const key = `${dateStr}-${hour}`;
                                        const isAvailable = !!availability[key];
                                        const isPast = isPastDate(day) || (isToday(day) && new Date().getHours() >= hour);
                                        const {count, total} = countAvailableUsers(day, hour);
                                        const session = getScheduledSession(day, hour);
                                        const isSelected = selectedTimeSlot === key;

                                        return (
                                            <div
                                                key={key}
                                                data-time-slot={`${dateStr}-${hour}`}
                                                className={`p-3 flex justify-between items-center
                                                    ${!isPast ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                                                    ${isAvailable ? 'bg-green-50 dark:bg-green-900/20' : ''}
                                                    ${session ? 'bg-indigo-100 dark:bg-indigo-900/30 border-l-4 border-indigo-500' : ''}
                                                    ${getAvailabilityColor(count, total)}
                                                    ${isSelected ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
                                                `}
                                                onClick={() => !isPast && handleTimeSlotClick(day, hour)}
                                                onTouchStart={(e) => {
                                                    if (!isPast) {
                                                        e.preventDefault();
                                                        handleDragStart(day, hour, e as unknown as React.MouseEvent);
                                                    }
                                                }}
                                                onTouchMove={(e) => {
                                                    if (isDragging && !isPast) {
                                                        e.preventDefault();
                                                        const touch = e.touches[0];
                                                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                                                        if (element) {
                                                            // Try to find the closest time slot element
                                                            const timeSlotElement = element.closest('[data-time-slot]');
                                                            if (timeSlotElement) {
                                                                const key = timeSlotElement.getAttribute('data-time-slot');
                                                                if (key) {
                                                                    const [dateStr, hourStr] = key.split('-');
                                                                    const date = parseISO(dateStr);
                                                                    const hour = parseFloat(hourStr);
                                                                    handleDragOver(date, hour);
                                                                }
                                                            }
                                                        }
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center">
                                                    <span className="text-gray-700 dark:text-gray-300">{displayTime(hour)}</span>
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
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
                <GroupAvailability
                    allUsersAvailability={allUsersAvailability}
                    days={daysInView.map(day => format(day, 'yyyy-MM-dd'))}
                    timeSlots={timeSlots.filter(Number.isInteger)} // Only use full hours for group view
                    isAdmin={isAdmin}
                    onScheduleSession={(dateStr) => {
                        if (onScheduleSession) {
                            const date = parseISO(dateStr);
                            onScheduleSession(date);
                        }
                    }}
                    timeFormat={timeFormat}
                    campaignId={campaignId}
                />
            </div>
        </div>
    );
}