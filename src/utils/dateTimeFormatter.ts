// src/utils/dateTimeFormatter.ts - Optimized version
import { convertFromEasternToLocal, isUserInEasternTime } from './timezoneUtils';

// Format time with caching
const timeCache = new Map<string, string>();

// Format time (hour number to display time)
export function formatTime(hour: number, format: '12h' | '24h' = '12h'): string {
    const cacheKey = `${hour}-${format}`;

    if (timeCache.has(cacheKey)) {
        return timeCache.get(cacheKey)!;
    }

    // Convert EST hour to user's local hour
    const localHour = convertFromEasternToLocal(hour);

    // Check if it's a half hour
    const isHalf = !Number.isInteger(localHour);
    const hourNum = Math.floor(localHour);
    const minutes = isHalf ? '30' : '00';

    let result: string;
    if (format === '12h') {
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum % 12 || 12;
        result = `${displayHour}:${minutes} ${period}`;
    } else {
        result = `${hourNum.toString().padStart(2, '0')}:${minutes}`;
    }

    timeCache.set(cacheKey, result);
    return result;
}

// Format time range (start and end hours)
export function formatTimeRange(startHour: number, endHour: number, format: '12h' | '24h' = '12h'): string {
    return `${formatTime(startHour, format)} - ${formatTime(endHour, format)}`;
}

// Display timezone indicator (only if not in EST) - cached
const timezoneText = isUserInEasternTime() ? '' : ` (Your local time)`;

export function getTimezoneDisplayText(): string {
    return timezoneText;
}

export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
        return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Get user's preferred time format from localStorage
export function getUserTimeFormat(): '12h' | '24h' {
    if (typeof window !== 'undefined') {
        const savedFormat = localStorage.getItem('timeFormat');
        return savedFormat === '24h' ? '24h' : '12h'; // Default to 12h
    }
    return '12h';
}

// Set user's preferred time format to localStorage
export function setUserTimeFormat(format: '12h' | '24h'): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('timeFormat', format);
    }
}