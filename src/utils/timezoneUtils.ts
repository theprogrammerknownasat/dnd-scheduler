// src/utils/timezoneUtils.ts - Optimized version

// Cache timezone information
const cachedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const cachedIsEastern = isEasternTimezone(cachedTimezone);

// Check if the timezone is in Eastern Time
function isEasternTimezone(timezone: string): boolean {
    return timezone.includes('America/New_York') ||
        timezone.includes('America/Toronto') ||
        timezone.includes('America/Detroit') ||
        timezone.includes('America/Montreal');
}

// Get user's timezone (cached)
export function getUserTimezone(): string {
    return cachedTimezone;
}

// Check if the user is in EST/EDT (cached)
export function isUserInEasternTime(): boolean {
    return cachedIsEastern;
}

// If user is in Eastern Time, return hour unchanged
// Otherwise, convert from EST to local
export function convertFromEasternToLocal(hour: number): number {
    if (cachedIsEastern) {
        return hour;
    }

    // Calculate time difference once
    const now = new Date();
    const estDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);

    const localHour = parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: cachedTimezone,
        hour: 'numeric',
        hour12: false
    }).format(estDate));

    const estHour = parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hour12: false
    }).format(estDate));

    return hour + (localHour - estHour);
}

// If user is in Eastern Time, return hour unchanged
// Otherwise, convert from local to EST
export function convertFromLocalToEastern(hour: number): number {
    if (cachedIsEastern) {
        return hour;
    }

    const now = new Date();
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);

    const localHour = parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: cachedTimezone,
        hour: 'numeric',
        hour12: false
    }).format(localDate));

    const estHour = parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hour12: false
    }).format(localDate));

    return hour + (estHour - localHour);
}