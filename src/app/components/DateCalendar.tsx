// src/app/components/DateCalendar.tsx
"use client";
import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addWeeks,
    subWeeks,
    isToday,
    isSameDay,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    getDay,
    addDays,
    subDays,
    isSameMonth
} from 'date-fns';
import { formatTime, getTimezoneDisplayText } from '@/utils/dateTimeFormatter';
import SessionList from "@/app/components/SessionList";
import TimeSlotCell from "@/app/components/TimeSlotCell";
import MobileCellWithTooltip from "@/app/components/MobileCellWithTooltip";
import CurrentTimeIndicator from "@/app/components/CurrentTimeIndicator";
import { convertFromEasternToLocal, convertFromLocalToEastern } from '@/utils/timezoneUtils';

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
    campaignId: string;
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
    maxPreviousSessions?: number;
    maxFutureSessions?: number;
}

export default function DateCalendar({
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
                                         timeFormat = '12h',
                                     }: DateCalendarProps) {
    // Calendar state
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        // Start the week on the current day
        return new Date();
    });

    const [availability, setAvailability] = useState<Record<string, boolean>>({});
    const [, setIsLoading] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

    // Additional state for new features
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(ZOOM_LEVELS.NORMAL);
    const [, setDragStart] = useState<string | null>(null);
    const [, setDragState] = useState<boolean | null>(null);
    const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
    const [hoveredTimeSlot, setHoveredTimeSlot] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [, setDragStartCell] = useState<string | null>(null);
    const [dragValue, setDragValue] = useState<boolean | null>(null);
    const [, setLocalScheduledSessions] = useState<ScheduledSession[]>([]);

    // Refs
    const datePickerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null!);
    useRef<Date[]>([]);
    const timeDisplayCache = useMemo(() => new Map<number, string>(), []);
    useMemo(() => new Map<string, unknown>(), []);
// Get time slots based on current zoom level
    const timeSlots = zoomLevel === ZOOM_LEVELS.IN
        ? HALF_HOUR_SLOTS
        : DEFAULT_TIME_SLOTS;

    // Generate days based on current zoom level
    const getDaysForView = useCallback(() => {
        switch (zoomLevel) {
            case ZOOM_LEVELS.OUT:
                // 2-week view as two stacked weeks
                // We'll handle the rendering differently rather than changing the days
                return eachDayOfInterval({
                    start: startOfWeek(currentWeekStart, {weekStartsOn: 1}),
                    end: endOfWeek(addWeeks(currentWeekStart, 1), {weekStartsOn: 1})
                });
            case ZOOM_LEVELS.IN:
                // 3-day view centered on current day
                return [
                    subDays(currentWeekStart, 1),
                    currentWeekStart,
                    addDays(currentWeekStart, 1),
                ];
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

    useEffect(() => {
        if (!campaignId) return;

        const fetchData = async () => {
            // Calculate start and end dates based on zoom level
            let startDate, endDate;

            if (zoomLevel === ZOOM_LEVELS.OUT) {
                // For 2-week view, make sure to get the full range of days
                startDate = format(startOfWeek(currentWeekStart, {weekStartsOn: 1}), 'yyyy-MM-dd');
                endDate = format(endOfWeek(addWeeks(currentWeekStart, 1), {weekStartsOn: 1}), 'yyyy-MM-dd');
            } else {
                // For other views, use the current daysInView
                startDate = format(daysInView[0], 'yyyy-MM-dd');
                endDate = format(daysInView[daysInView.length - 1], 'yyyy-MM-dd');
            }

            // Store the current date range to prevent re-fetching
            const dateRangeKey = `${startDate}-${endDate}`;
            if (prevDateRangeRef.current === dateRangeKey) {
                return; // Skip if same date range
            }
            prevDateRangeRef.current = dateRangeKey;

            setIsLoading(true);

            try {
                // Fetch personal availability
                const response = await fetch(`/api/calendar/availability?campaignId=${campaignId}&start=${startDate}&end=${endDate}`);
                const data = await response.json();

                if (data.success) {
                    setAvailability(data.availability);
                }

                // Fetch all users' availability and sessions
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

        // Fetch data with slight delay to avoid rapid consecutive fetches
        const timer = setTimeout(() => {
            fetchData();
        }, 300);

        return () => clearTimeout(timer);
    }, [currentWeekStart, campaignId, fetchAllUsersAvailability, fetchScheduledSessions, zoomLevel, daysInView]);

    // Add this ref at the top of your component:
    const prevDateRangeRef = useRef<string>('');

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

    const formatDateRange = () => {
        const firstDay = daysInView[0];
        const lastDay = daysInView[daysInView.length - 1];

        // Special handling for 2-week view
        if (zoomLevel === ZOOM_LEVELS.OUT) {
            // Find first day of second week (usually the 8th day)
            const secondWeekStart = daysInView[7];

            if (isSameMonth(firstDay, lastDay)) {
                // All days in the same month
                return `${format(firstDay, 'MMM d')} - ${format(lastDay, 'd, yyyy')}`;
            } else if (isSameMonth(firstDay, secondWeekStart) && !isSameMonth(secondWeekStart, lastDay)) {
                // Second week is in a different month than first week
                return `${format(firstDay, 'MMM d')} - ${format(secondWeekStart, 'd')} / ${format(secondWeekStart, 'MMM d')} - ${format(lastDay, 'd, yyyy')}`;
            } else if (!isSameMonth(firstDay, secondWeekStart) && isSameMonth(secondWeekStart, lastDay)) {
                // First week spans two months
                return `${format(firstDay, 'MMM d')} - ${format(secondWeekStart, 'MMM d')} - ${format(lastDay, 'd, yyyy')}`;
            } else {
                // Spans three different months
                return `${format(firstDay, 'MMM d, yyyy')} - ${format(lastDay, 'MMM d, yyyy')}`;
            }
        }

        // Standard formatting for other views
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
    const toggleAvailability = async (date: Date, localHour: number, forceState?: boolean) => {
        if (!campaignId) return;

        const dateStr = format(date, 'yyyy-MM-dd');
        const key = `${dateStr}-${localHour}`;
        const isAvailable = forceState !== undefined ? forceState : !availability[key];

        // Update local state
        setAvailability(prev => ({
            ...prev,
            [key]: isAvailable
        }));

        // Call the parent callback if provided
        if (onAvailabilityChange) {
            onAvailabilityChange(date, localHour, isAvailable);
        }

        // Convert to EST before sending to server
        const estHour = convertFromLocalToEastern(localHour);

        // Update availability on the server
        try {
            await fetch('/api/calendar/availability', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    campaignId,
                    date: dateStr,
                    hour: estHour, // Send EST hour to server
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
    const handleMouseEnter = (date: Date, hour: number) => {
        // Set hovered cell for tooltip/preview
        setHoveredDay(date);
        setHoveredTimeSlot(hour);

        // Continue drag operation if active
        if (isDragging && dragValue !== null) {
            // Don't allow dragging in the past
            if (isPastDate(date) || (isToday(date) && new Date().getHours() >= hour)) {
                return;
            }

            // Toggle to the drag value
            const dateStr = format(date, 'yyyy-MM-dd');
            const key = `${dateStr}-${hour}`;
            const currentValue = !!availability[key];

            // Only toggle if different from current drag state
            if (currentValue !== dragValue) {
                toggleAvailability(date, hour, dragValue);
            }
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

        // Toggle the starting cell immediately
        toggleAvailability(date, hour, !currentValue);
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
    const getAvailabilityColor = (count: number, total: number, hasSession = false) => {
        // If there's a session, always return blue
        if (hasSession) {
            return 'bg-blue-200 dark:bg-blue-800/40';
        }

        // If there are no users, show gray
        if (total === 0) return 'bg-gray-100 dark:bg-gray-700';

        // Calculate percentage of users available
        const percentage = count / total;

        // Color based on percentage ranges
        if (percentage === 0) return 'bg-gray-100 dark:bg-gray-700';
        if (percentage < 0.25) return 'bg-red-300 dark:bg-red-800/50';
        if (percentage < 0.5) return 'bg-orange-300 dark:bg-orange-700/50';
        if (percentage < 0.75) return 'bg-yellow-300 dark:bg-yellow-600/50';
        if (percentage < 1) return 'bg-green-400 dark:bg-green-700/50';
// 100% availability - darkest green to show full agreement
        return 'bg-green-700 dark:bg-green-900/70';
    };

    // Check if a date is in the past
    const isPastDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const parseSessionDate = (dateValue: string | Date | unknown): string => {
        // If it's already a string in YYYY-MM-DD format, return it
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }

        // If it's already a proper YYYY-MM-DD string, return it
        if (typeof dateValue === 'string') {
            // Try to parse it as a date
            const date = new Date(dateValue);

            // If it's invalid, return empty string
            if (isNaN(date.getTime())) {
                console.error('Invalid date value:', dateValue);
                return '';
            }

            // Return formatted date
            return format(date, 'yyyy-MM-dd');
        }

        // If it's a Date object or any other date format, parse it
        const date = new Date(dateValue as string | Date);

        // If it's invalid, return empty string
        if (isNaN(date.getTime())) {
            console.error('Invalid date value:', dateValue);
            return '';
        }

        // Return formatted date
        return format(date, 'yyyy-MM-dd');
    };

// In DateCalendar.tsx, update the getScheduledSession function:

// Replace your getScheduledSession function with this fixed version:
    const getScheduledSession = (date: Date, hour: number) => {
        // If no sessions, return null immediately
        if (!scheduledSessions || scheduledSessions.length === 0) {
            return null;
        }

        // Format the date string for matching with session.date
        const dateStr = format(date, 'yyyy-MM-dd');

        // Find the session that matches this date and time slot
        return scheduledSessions.find(session => {
            // Parse the session date using our universal handler
            const sessionDate = parseSessionDate(session.date as string | Date);

            // Check if the date matches (both should be YYYY-MM-DD now)
            const dateMatches = sessionDate === dateStr;

            // Convert startTime and endTime to numbers
            // Since ScheduledSession interface has startTime: number, we don't need conversion
            const startTime = Number(session.startTime);
            const endTime = Number(session.endTime);

            // Check if this hour is within the session's time range
            const timeInRange = hour >= startTime && hour < endTime;

            // Both date and time must match
            return dateMatches && timeInRange;
        });
    };


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
        const userCount = Object.keys(allUsers).length;

        // If no users or no availability data, return 0
        if (userCount === 0 || Object.keys(allUsersAvailability).length === 0) {
            return 0;
        }

        // Default time slots (8 AM to 10 PM)
        const slots = Array.from({ length: 15 }, (_, i) => i + 8);

        // For each time slot, calculate the ratio of users available
        let totalAvailable = 0;
        let totalSlots = 0;

        // Loop through each time slot
        slots.forEach(hour => {
            const key = `${dateStr}-${hour}`;
            let usersAvailable = 0;

            // Count users available for this slot
            Object.keys(allUsersAvailability).forEach(username => {
                if (allUsersAvailability[username]?.[key]) {
                    usersAvailable++;
                }
            });

            totalAvailable += usersAvailable;
            totalSlots += userCount;
        });

        // Return the average availability ratio
        return totalSlots > 0 ? totalAvailable / totalSlots : 0;
    };

    // Update the getDateColor function with stronger colors
    const getDateColor = (date: Date) => {
        const availability = getDateAvailabilitySummary(date);

        if (availability === 0) return '';
        if (availability < 0.25) return 'bg-red-200 dark:bg-red-900/40';
        if (availability < 0.5) return 'bg-yellow-200 dark:bg-yellow-900/40';
        if (availability < 0.75) return 'bg-green-200 dark:bg-green-900/40';
        return 'bg-green-300 dark:bg-green-800/60';
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
        if (timeDisplayCache.has(hour)) {
            return timeDisplayCache.get(hour)!;
        }

        // Convert EST hour to user's local hour
        const localHour = convertFromEasternToLocal(hour);

        // Check if it's a half hour
        const isHalf = !Number.isInteger(localHour);
        const hourNum = Math.floor(localHour);
        const minutes = isHalf ? '30' : '00';

        let result: string;
        if (timeFormat === '12h') {
            const period = hourNum >= 12 ? 'PM' : 'AM';
            const displayHour = hourNum % 12 || 12;
            result = `${displayHour}:${minutes} ${period}`;
        } else {
            result = `${hourNum}:${minutes}`;
        }

        timeDisplayCache.set(hour, result);
        return result;
    }, [timeFormat, timeDisplayCache]);

    daysInView.map(day => format(day, 'yyyy-MM-dd'));

    useEffect(() => {
        const fetchAllCampaignSessions = async () => {
            if (!campaignId) return;

            try {
                // Show loading state
                setIsLoading(true);

                // Fetch all sessions for this campaign without date filtering
                const response = await fetch(`/api/scheduled-sessions?campaignId=${campaignId}`);

                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {

                    if (data.sessions && data.sessions.length > 0) {
                        // Update local state directly with the fetched sessions
                        setLocalScheduledSessions(data.sessions);

                        // Also update parent component if the callback exists
                        if (fetchScheduledSessions) {
                            await fetchScheduledSessions('all', 'all');
                        }
                    }
                } else {
                    console.error('Failed to fetch sessions:', data.error || 'Unknown error');
                }
            } catch (err) {
                console.error('Error fetching campaign sessions:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllCampaignSessions();
    }, [campaignId, fetchScheduledSessions]);

    useEffect(() => {
        if (scheduledSessions && scheduledSessions.length > 0) {
            setLocalScheduledSessions(scheduledSessions);
        }
    }, [scheduledSessions]);

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

                        {/* Date Picker Popup */}
                        {showDatePicker && (
                            <div
                                ref={datePickerRef}
                                className="fixed top-20 left-1/2 transform -translate-x-1/2 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-[1000] w-80"
                                style={{
                                    position: 'fixed',
                                    zIndex: 1000,
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                                }}
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

                                        // Get the color class - important to call it here
                                        getDateColor(date);
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => goToDate(date)}
                                                disabled={isPastDate(date) || date > addWeeks(new Date(), maxWeeks)}
                                                className={`p-1 rounded-full text-sm relative flex items-center justify-center
                                ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}
                                ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''}
                                ${isCurrentDay ? 'font-bold ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
                                ${isPastDate(date) || date > addWeeks(new Date(), maxWeeks) ?
                                                    'opacity-50 cursor-not-allowed' :
                                                    'hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                {format(date, 'd')}
                                                {hasSession && (
                                                    <span className="absolute top-0 right-0 h-2 w-2 bg-indigo-500 rounded-full"></span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

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

                    <div className="text-sm text-gray-500 dark:text-gray-400 ml-4">
                        All times are displayed in your local timezone
                        {getTimezoneDisplayText()}
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center mt-2 sm:mt-0">
                        <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden mx-auto sm:mx-0">
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
                                disabled={true}
                                className="px-3 py-1 text-xs sm:text-sm bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                title="3 Days View (Coming Soon)"
                            >
                                <span className="hidden sm:inline">3 Days</span>
                                <span className="sm:hidden">3D</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Desktop View - Calendar Grid */}
                <div className="hidden md:block overflow-x-auto pb-2">
                    <div ref={calendarRef} className={zoomLevel === ZOOM_LEVELS.OUT ? "flex flex-col space-y-4 relative" : "grid grid-cols-8 min-w-max relative"}>
                        {daysInView.some(day => isToday(day)) && (
                            <CurrentTimeIndicator
                                calendarRef={calendarRef}
                                timeFormat={timeFormat}
                            />
                        )}

                        {zoomLevel === ZOOM_LEVELS.OUT ? (
                            // 2-week view as stacked weeks
                            <>
                                {/* First week */}
                                <div className="grid grid-cols-8 min-w-max border-b-2 border-gray-300 dark:border-gray-600 pb-4">
                                    <div className="p-3 border-b border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-medium">
                                        Week 1
                                    </div>
                                    {daysInView.slice(0, 7).map((day) => (
                                        <div
                                            key={format(day, 'yyyy-MM-dd')}
                                            className={`p-3 border-b border-r border-gray-200 dark:border-gray-600 text-center font-medium 
                                                ${isToday(day) ? '' : 'bg-gray-50 dark:bg-gray-700'}`}
                                        >
                                            <div className="text-gray-500 dark:text-gray-300">{format(day, 'EEE')}</div>
                                            <div
                                                className={`text-lg ${isToday(day) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                                                {format(day, 'd')}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Time slots for first week */}
                                    {timeSlots.map((hour) => (
                                        <React.Fragment key={`week1-hour-${hour}`}>
                                            <div
                                                className="p-3 border-b border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-300">
                                                {displayTime(hour)}
                                            </div>

                                            {daysInView.slice(0, 7).map((day) => {
                                                const dateStr = format(day, 'yyyy-MM-dd');
                                                const key = `${dateStr}-${hour}`;
                                                const isAvailable = !!availability[key];
                                                const isPast = isPastDate(day) || (isToday(day) && new Date().getHours() >= hour);
                                                const {count, total} = countAvailableUsers(day, hour);
                                                const session = getScheduledSession(day, hour);
                                                const availabilityColor = getAvailabilityColor(count, total, !!session);
                                                const isSelected = selectedTimeSlot === key;
                                                const isHovered = hoveredDay !== null && isSameDay(hoveredDay, day) && hoveredTimeSlot === hour;

                                                return (
                                                    <TimeSlotCell
                                                        key={key}
                                                        day={day}
                                                        hour={hour}
                                                        dateStr={dateStr}
                                                        isAvailable={isAvailable}
                                                        isPast={isPast}
                                                        availabilityColor={availabilityColor}
                                                        isSelected={isSelected}
                                                        isHovered={isHovered}
                                                        count={count}
                                                        total={total}
                                                        session={session}
                                                        onTimeSlotClick={handleTimeSlotClick}
                                                        onDragStart={handleDragStart}
                                                        onMouseEnter={handleMouseEnter}
                                                        onMouseLeave={handleMouseLeave}
                                                        getAvailableUsers={getUsersAvailability}
                                                        displayTime={displayTime}
                                                    />
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* Second week */}
                                <div className="grid grid-cols-8 min-w-max">
                                    <div className="p-3 border-b border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-medium">
                                        Week 2
                                    </div>
                                    {daysInView.slice(7, 14).map((day) => (
                                        <div
                                            key={format(day, 'yyyy-MM-dd')}
                                            className={`p-3 border-b border-r border-gray-200 dark:border-gray-600 text-center font-medium 
                                                ${isToday(day) ? '' : 'bg-gray-50 dark:bg-gray-700'}`}
                                        >
                                            <div className="text-gray-500 dark:text-gray-300">{format(day, 'EEE')}</div>
                                            <div
                                                className={`text-lg ${isToday(day) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                                                {format(day, 'd')}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Time slots for second week */}
                                    {timeSlots.map((hour) => (
                                        <React.Fragment key={`week2-hour-${hour}`}>
                                            <div
                                                className="p-3 border-b border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-300">
                                                {displayTime(hour)}
                                            </div>

                                            {daysInView.slice(7, 14).map((day) => {
                                                const dateStr = format(day, 'yyyy-MM-dd');
                                                const key = `${dateStr}-${hour}`;
                                                const isAvailable = !!availability[key];
                                                const isPast = isPastDate(day) || (isToday(day) && new Date().getHours() >= hour);
                                                const {count, total} = countAvailableUsers(day, hour);
                                                const session = getScheduledSession(day, hour);
                                                const availabilityColor = getAvailabilityColor(count, total, !!session);
                                                const isSelected = selectedTimeSlot === key;
                                                const isHovered = hoveredDay !== null && isSameDay(hoveredDay, day) && hoveredTimeSlot === hour;

                                                return (
                                                    <TimeSlotCell
                                                        key={key}
                                                        day={day}
                                                        hour={hour}
                                                        dateStr={dateStr}
                                                        isAvailable={isAvailable}
                                                        isPast={isPast}
                                                        availabilityColor={availabilityColor}
                                                        isSelected={isSelected}
                                                        isHovered={isHovered}
                                                        count={count}
                                                        total={total}
                                                        session={session}
                                                        onTimeSlotClick={handleTimeSlotClick}
                                                        onDragStart={handleDragStart}
                                                        onMouseEnter={handleMouseEnter}
                                                        onMouseLeave={handleMouseLeave}
                                                        getAvailableUsers={getUsersAvailability}
                                                        displayTime={displayTime}
                                                    />
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </>
                        ) : (
                            // Regular view (1-week or 3-day)
                            <>
                                {/* Header row */}
                                <div
                                    className="p-3 border-b border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-medium"></div>
                                {daysInView.map((day) => (
                                    <div
                                        key={format(day, 'yyyy-MM-dd')}
                                        className={`p-3 border-b border-r border-gray-200 dark:border-gray-600 text-center font-medium 
                                            ${isToday(day) ? '' : 'bg-gray-50 dark:bg-gray-700'}`}
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
                                            const session = getScheduledSession(day, hour);
                                            const availabilityColor = getAvailabilityColor(count, total, !!session);
                                            const isSelected = selectedTimeSlot === key;
                                            const isHovered = hoveredDay !== null && isSameDay(hoveredDay, day) && hoveredTimeSlot === hour;

                                            return (
                                                <TimeSlotCell
                                                    key={key}
                                                    day={day}
                                                    hour={hour}
                                                    dateStr={dateStr}
                                                    isAvailable={isAvailable}
                                                    isPast={isPast}
                                                    availabilityColor={availabilityColor}
                                                    isSelected={isSelected}
                                                    isHovered={isHovered}
                                                    count={count}
                                                    total={total}
                                                    session={session}
                                                    onTimeSlotClick={handleTimeSlotClick}
                                                    onDragStart={handleDragStart}
                                                    onMouseEnter={handleMouseEnter}
                                                    onMouseLeave={handleMouseLeave}
                                                    getAvailableUsers={getUsersAvailability}
                                                    displayTime={displayTime}
                                                />
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </>
                        )}
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
                                        isToday(day) ? '' : 'bg-gray-50 dark:bg-gray-700'
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
                                            const { availableUsers, unavailableUsers } = getUsersAvailability(day, hour);

                                            return (
                                                <MobileCellWithTooltip
                                                    key={key}
                                                    day={day}
                                                    hour={hour}
                                                    dateStr={dateStr}
                                                    isAvailable={isAvailable}
                                                    isPast={isPast}
                                                    availabilityColor={getAvailabilityColor(count, total, !!session)}
                                                    isSelected={isSelected}
                                                    count={count}
                                                    total={total}
                                                    session={session}
                                                    // Directly call toggleAvailability to toggle cell state
                                                    onCellClick={() => !isPast && toggleAvailability(day, hour)}
                                                    // Remove the preventDefault to allow normal touch behavior
                                                    onTouchStart={() => {
                                                        if (!isPast) {
                                                            // Don't call preventDefault here
                                                            // Don't use the drag system for mobile
                                                        }
                                                    }}
                                                    onTouchMove={() => {
                                                        // Keep empty to prevent drag behavior on mobile
                                                    }}
                                                    availableUsers={availableUsers}
                                                    unavailableUsers={unavailableUsers}
                                                    displayTime={(h) => formatTime(h, timeFormat)}

                                                    data-time-slot={key}
                                                    data-date={dateStr}
                                                    data-hour={hour}
                                                />
                                            );

                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>


                <div className="mt-8">
                    <SessionList
                        campaignId={campaignId}
                        scheduledSessions={scheduledSessions}
                        timeFormat={timeFormat}
                        onScheduleNewSession={isAdmin && onScheduleSession ? () => onScheduleSession(new Date()) : undefined}
                        isAdmin={isAdmin}
                    />
                </div>
            </div>
    );
}