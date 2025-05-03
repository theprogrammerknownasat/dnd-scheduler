// CurrentTimeIndicator.tsx
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface CurrentTimeIndicatorProps {
    calendarRef: React.RefObject<HTMLDivElement>;
    timeSlots: number[];
    isVisible: boolean; // Only show on current day
    timeFormat: '12h' | '24h';
    isMobile?: boolean;
    expandedDay?: string | null;
}

const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({
                                                                       calendarRef,
                                                                       timeSlots,
                                                                       isVisible,
                                                                       timeFormat,
                                                                       isMobile = false,
                                                                       expandedDay = null
                                                                   }) => {
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    // Calculate position based on current time
    const updatePosition = () => {
        if (!isVisible || !calendarRef.current) return;

        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // Format date for checking if today is expanded day in mobile view
        setCurrentDate(format(now, 'yyyy-MM-dd'));

        // Format time for display based on user's preference
        if (timeFormat === '12h') {
            setCurrentTime(format(now, 'h:mm a'));
        } else {
            setCurrentTime(format(now, 'HH:mm'));
        }

        // Calculate position
        const currentHour = hours + minutes / 60; // Ex: 14.5 for 2:30 PM

        // For mobile view, we need different positioning
        if (isMobile) {
            // Only proceed if today is the expanded day
            if (expandedDay !== currentDate) return;

            // Find all time cells for today
            const todayCells = calendarRef.current.querySelectorAll(`[data-date="${currentDate}"]`);
            if (todayCells.length === 0) return;

            // Find the cell closest to current time
            let targetCell: Element | null = null;
            let closestDiff = Infinity;

            todayCells.forEach(cell => {
                const hourAttr = cell.getAttribute('data-hour');
                if (!hourAttr) return;

                const cellHour = parseFloat(hourAttr);
                const diff = Math.abs(cellHour - currentHour);

                if (diff < closestDiff) {
                    closestDiff = diff;
                    targetCell = cell;
                }
            });

            if (targetCell) {
                const rect = targetCell.getBoundingClientRect();
                const containerRect = calendarRef.current.getBoundingClientRect();

                // Calculate position
                const hourFraction = currentHour - parseFloat(targetCell.getAttribute('data-hour') || '0');
                const topPosition = rect.top - containerRect.top + (rect.height * hourFraction);

                setPosition({
                    top: topPosition,
                    left: 0,
                    width: containerRect.width
                });
            }
        } else {
            // Desktop view
            // Find the cell for the current hour
            let closestCell: Element | null = null;
            let closestHour = Infinity;

            // Query all hour cells
            const hourCells = calendarRef.current.querySelectorAll('[data-time-slot]');
            hourCells.forEach(cell => {
                const slotKey = cell.getAttribute('data-time-slot');
                if (!slotKey) return;

                const [dateStr, hourStr] = slotKey.split('-');
                // Only consider cells for today
                if (dateStr !== currentDate) return;

                const cellHour = parseFloat(hourStr);
                const diff = Math.abs(cellHour - currentHour);

                if (diff < closestHour) {
                    closestHour = diff;
                    closestCell = cell;
                }
            });

            if (closestCell) {
                const cellHour = parseFloat(closestCell.getAttribute('data-time-slot')?.split('-')[1] || '0');
                const rect = closestCell.getBoundingClientRect();
                const calendarRect = calendarRef.current.getBoundingClientRect();

                // Calculate how far through the hour we are (0-1)
                const hourFraction = currentHour - cellHour;

                // Find the left edge (where time labels are)
                const timeLabels = calendarRef.current.querySelectorAll('[data-time-label]');
                let leftEdge = 0;
                if (timeLabels.length > 0) {
                    const labelRect = timeLabels[0].getBoundingClientRect();
                    leftEdge = labelRect.right - calendarRect.left;
                }

                // Calculate position
                const topPosition = rect.top - calendarRect.top + (rect.height * hourFraction);

                setPosition({
                    top: topPosition,
                    left: leftEdge,
                    width: calendarRect.width - leftEdge
                });
            }
        }
    };

    // Update on mount and every minute thereafter
    useEffect(() => {
        // Initial update
        updatePosition();

        // Update every minute
        const interval = setInterval(updatePosition, 60000);

        // Clean up interval on unmount
        return () => clearInterval(interval);
    }, [isVisible, calendarRef.current, expandedDay]);

    // Don't render if not visible
    if (!isVisible) return null;

    // For mobile, only show if the expanded day is today
    if (isMobile && expandedDay !== currentDate) return null;

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 50 }}>
            {/* The time indicator line */}
            <div
                className="absolute flex items-center"
                style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    width: `${position.width}px`,
                }}
            >
                {/* Triangle pointer */}
                <div className="h-5 flex items-center">
                    <div className="h-3 w-3 bg-red-500 transform rotate-45 relative -left-1.5" />
                </div>

                {/* The actual line */}
                <div className="h-[2px] bg-red-500 flex-grow" />

                {/* Time display */}
                <div className="bg-red-500 text-white text-xs px-1 py-0.5 rounded ml-1">
                    {currentTime}
                </div>
            </div>
        </div>
    );
};

export default CurrentTimeIndicator;