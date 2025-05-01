// src/utils/dateTimeFormatter.ts
import { format, parse } from 'date-fns';

// Get the user's time format preference from localStorage
export const getUserTimeFormat = (): '12h' | '24h' => {
    if (typeof window !== 'undefined') {
        const savedFormat = localStorage.getItem('timeFormat');
        return (savedFormat === '12h' || savedFormat === '24h') ? savedFormat : '12h'; // Default to 12h
    }
    return '12h'; // Default for SSR
};

// Set the user's time format preference
export const setUserTimeFormat = (format: '12h' | '24h'): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('timeFormat', format);
    }
};

// Format a time based on user preference
export const formatTime = (hour: number): string => {
    const timeFormat = getUserTimeFormat();

    if (timeFormat === '12h') {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:00 ${period}`;
    } else {
        return `${hour}:00`;
    }
};

// Format a time range based on user preference
export const formatTimeRange = (startHour: number, endHour: number): string => {
    return `${formatTime(startHour)} - ${formatTime(endHour)}`;
};

// Format a date with time based on user preference
export const formatDateTime = (dateString: string, hour: number): string => {
    const date = new Date(dateString);
    const dateFormatted = format(date, 'MMM d, yyyy');
    return `${dateFormatted} at ${formatTime(hour)}`;
};

// Format a timestamp for announcements and polls
export const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const timeFormat = getUserTimeFormat();

    if (timeFormat === '12h') {
        return format(date, 'MMM d, yyyy h:mm a');
    } else {
        return format(date, 'MMM d, yyyy HH:mm');
    }
};