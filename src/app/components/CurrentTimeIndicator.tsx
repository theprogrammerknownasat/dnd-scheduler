// src/app/components/CurrentTimeIndicator.tsx
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface CurrentTimeIndicatorProps {
    calendarRef: React.RefObject<HTMLDivElement>;
    timeFormat: '12h' | '24h';
}

const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({
                                                                       calendarRef,
                                                                       timeFormat
                                                                   }) => {
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const [currentTime, setCurrentTime] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    // Calculate position based on current time
    const updatePosition = () => {
        if (!calendarRef.current) {
            return;
        }

        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // Format time for display
        if (timeFormat === '12h') {
            setCurrentTime(format(now, 'h:mm a'));
        } else {
            setCurrentTime(format(now, 'HH:mm'));
        }

        // Calculate decimal hour (e.g., 14.5 for 2:30 PM)
        const currentDecimalHour = hours + (minutes / 60);

        // Only show indicator between 8 AM and 10 PM
        if (currentDecimalHour < 8 || currentDecimalHour >= 22) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);

        // Get time slot cells for today
        const todayStr = format(now, 'yyyy-MM-dd');
        const timeSlotCells = Array.from(
            calendarRef.current.querySelectorAll(`[data-time-slot*="${todayStr}"]`)
        );

        if (timeSlotCells.length === 0) {
            setIsVisible(false);
            return;
        }

        // Calculate position between time slots
        const slotIndex = Math.floor(currentDecimalHour - 8);
        const progressInHour = (currentDecimalHour - Math.floor(currentDecimalHour));

        // Get current and next time slot cells
        const currentCell = timeSlotCells[slotIndex] as HTMLElement;
        const nextCell = timeSlotCells[slotIndex + 1] as HTMLElement;

        if (!currentCell) {
            setIsVisible(false);
            return;
        }

        // Get positions
        const calendarRect = calendarRef.current.getBoundingClientRect();
        const currentCellRect = currentCell.getBoundingClientRect();
        const cellHeight = currentCellRect.height;
        const cellTop = currentCellRect.top - calendarRect.top;

        // Calculate exact position
        let topPosition = cellTop;
        if (nextCell) {
            topPosition += progressInHour * cellHeight;
        }

        // Find the left edge (skip the time labels column)
        let leftPosition = currentCellRect.width;
        const calendar = calendarRef.current;
        if (calendar) {
            // Find the first data cell (not a time label)
            const firstDataCell = calendar.querySelector('[data-time-slot]:not([data-time-slot$=""])');
            if (firstDataCell) {
                const firstCellRect = firstDataCell.getBoundingClientRect();
                leftPosition = firstCellRect.left - calendarRect.left;
            }
        }

        setPosition({
            top: topPosition,
            left: leftPosition,
            width: calendarRect.width - leftPosition
        });
    };

    // Update on mount and every minute
    useEffect(() => {
        updatePosition();

        const interval = setInterval(() => {
            updatePosition();
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [calendarRef.current, timeFormat]);

    if (!isVisible) return null;

    return (
        <div
            className="absolute pointer-events-none z-40"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${position.width}px`,
            }}
        >
            <div className="flex items-center h-0">
                {/* Left marker */}
                <div className="bg-red-500 h-3 w-3 rounded-full"></div>

                {/* Horizontal line */}
                <div className="flex-grow h-[2px] bg-red-500"></div>

                {/* Time label */}
                <div className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                    {currentTime}
                </div>
            </div>
        </div>
    );
};

export default CurrentTimeIndicator;