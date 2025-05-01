// src/utils/dateTimeFormatter.ts

/**
 * Format a time value (0-23) to display in either 12-hour or 24-hour format
 * @param hour The hour value (0-23)
 * @param use24HourFormat Whether to use 24-hour format
 * @returns Formatted time string
 */
export function formatTime(hour: number, use24HourFormat: boolean = false): string {
    if (use24HourFormat) {
        // 24-hour format: 00:00 - 23:00
        return `${hour.toString().padStart(2, '0')}:00`;
    } else {
        // 12-hour format: 12 AM - 11 PM
        const period = hour < 12 ? 'AM' : 'PM';
        const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${displayHour}:00 ${period}`;
    }
}

/**
 * Format a time range to display in either 12-hour or 24-hour format
 * @param startHour The starting hour (0-23)
 * @param endHour The ending hour (0-23)
 * @param use24HourFormat Whether to use 24-hour format
 * @returns Formatted time range string
 */
export function formatTimeRange(startHour: number, endHour: number, use24HourFormat: boolean = false): string {
    return `${formatTime(startHour, use24HourFormat)} - ${formatTime(endHour, use24HourFormat)}`;
}

/**
 * Convert hour from 24-hour format to 12-hour format with AM/PM
 * @param hour Hour in 24-hour format (0-23)
 * @returns Object with hour (1-12) and period (AM/PM)
 */
export function getHour12Format(hour: number): { hour: number, period: string } {
    const period = hour < 12 ? 'AM' : 'PM';
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    return { hour: hour12, period };
}

/**
 * Convert hour from 12-hour format to 24-hour format
 * @param hour Hour in 12-hour format (1-12)
 * @param period AM or PM
 * @returns Hour in 24-hour format (0-23)
 */
export function getHour24Format(hour: number, period: string): number {
    if (period.toUpperCase() === 'AM') {
        return hour === 12 ? 0 : hour;
    } else {
        return hour === 12 ? 12 : hour + 12;
    }
}