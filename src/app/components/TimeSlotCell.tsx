// Update TimeSlotCell.tsx to make sessions more visible

// 1. Update the component for better session visibility
import React, { useState, useEffect, useRef } from 'react';
import { isToday, format } from 'date-fns';

interface TimeSlotCellProps {
    day: Date;
    hour: number;
    dateStr: string;
    isAvailable: boolean;
    isPast: boolean;
    availabilityColor: string;
    isSelected: boolean;
    isHovered: boolean;
    count: number;
    total: number;
    session: any | null;
    onTimeSlotClick: (day: Date, hour: number) => void;
    onDragStart: (day: Date, hour: number, e: React.MouseEvent) => void;
    onMouseEnter: (day: Date, hour: number) => void;
    onMouseLeave: () => void;
    getAvailableUsers: (date: Date, hour: number) => { availableUsers: string[], unavailableUsers: string[] };
    displayTime: (hour: number) => string;
}

const TimeSlotCell: React.FC<TimeSlotCellProps> = ({
                                                       day,
                                                       hour,
                                                       dateStr,
                                                       isAvailable,
                                                       isPast,
                                                       availabilityColor,
                                                       isSelected,
                                                       isHovered,
                                                       count,
                                                       total,
                                                       session,
                                                       onTimeSlotClick,
                                                       onDragStart,
                                                       onMouseEnter,
                                                       onMouseLeave,
                                                       getAvailableUsers,
                                                       displayTime
                                                   }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const key = `${dateStr}-${hour}`;
    const cellRef = useRef<HTMLDivElement>(null);
    const isFullAvailability = count === total && count > 0;
    const [, setTooltipPosition] = useState<'top' | 'bottom'>('top');
    const [, setTooltipStyle] = useState<React.CSSProperties>({ left: '50%', top: '-120%' });
    const truncateText = (text: string, maxLength: number): string => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength - 3) + '...';
    };

    const calculateTooltipPosition = () => {
        if (cellRef.current) {
            const cellRect = cellRef.current.getBoundingClientRect();
            const cellTop = cellRect.top;
            const windowHeight = window.innerHeight;

            // Switch to bottom tooltip 3 rows earlier than before
            // Assuming 40px per row height (adjust based on your actual cell height)
            const threeRowsHeight = 40 * 3;
            const threshold = (windowHeight / 2) - threeRowsHeight;

            console.log('Cell top:', cellTop, 'Threshold:', threshold);
            const shouldBeBelow = cellTop < threshold;

            setTooltipPosition(shouldBeBelow ? 'bottom' : 'top');

            if (shouldBeBelow) {
                setTooltipStyle({
                    left: '50%',
                    top: '100%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px'
                });
            } else {
                setTooltipStyle({
                    left: '50%',
                    top: '-110%',
                    transform: 'translateX(-50%)'
                });
            }
        }
    };
// Tooltip functions with delays adjusted for better usability
    const handleMouseEnterWithTooltip = () => {
        if (isPast) return;

        // Call the parent component's onMouseEnter
        onMouseEnter(day, hour);

        // Set timer for tooltip - shorter delay for better responsiveness
        const timer = setTimeout(() => {
            setShowTooltip(true);
        }, 500); // Reduced from 1000ms to 500ms for better responsiveness

        setLongPressTimer(timer);
    };

    const handleMouseLeaveWithTooltip = () => {
        // Call the parent component's onMouseLeave
        onMouseLeave();

        // Clear tooltip timer
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }

        // Hide tooltip
        setShowTooltip(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isPast) return;

        // Set timer for long press with shorter delay
        const timer = setTimeout(() => {
            e.preventDefault(); // Prevent default to avoid toggling availability
            setShowTooltip(true);
        }, 400); // Responsive touch delay

        setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
            }
        };
    }, [longPressTimer]);

    useEffect(() => {
        if (showTooltip) {
            calculateTooltipPosition();
        }
    }, [showTooltip]);


    // Get available/unavailable users for tooltip
    const {availableUsers, unavailableUsers} = getAvailableUsers(day, hour);

    // Strongly highlight sessions with distinct visual cues
    const sessionHighlight = session ?
        'border-l-4 border-blue-500 bg-blue-100 dark:bg-blue-900/40' : '';

    return (
        <div
            ref={cellRef}
            data-time-slot={key}
            data-has-session={session ? 'true' : 'false'} // Add data attribute to help debugging
            data-full-availability={isFullAvailability ? 'true' : 'false'}
            className={`p-3 border-b border-r border-gray-200 dark:border-gray-600 text-center relative
                ${!isPast ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                ${isToday(day) && !availabilityColor ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
                ${availabilityColor}
                ${sessionHighlight}
                ${isFullAvailability ? '!bg-green-700 dark:!bg-green-800' : ''}
                ${isSelected ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
                ${isHovered ? 'ring-2 ring-gray-400 dark:ring-gray-500' : ''}
            `}
            onClick={() => !isPast && onTimeSlotClick(day, hour)}
            onMouseDown={(e) => !isPast && onDragStart(day, hour, e)}
            onMouseEnter={handleMouseEnterWithTooltip}
            onMouseLeave={handleMouseLeaveWithTooltip}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Session indicator overlay */}
            {session && (
                <div className="absolute inset-0 bg-blue-200/40 dark:bg-blue-700/30 z-0 pointer-events-none"></div>
            )}

            <div className="flex flex-col items-center relative z-10">
                {isAvailable ?
                    <span className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center">✓</span>
                    :
                    <span className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600"></span>
                }
                <span className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                    {count}/{total}
                </span>
                {/* Make session title more visible */}
                {session && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1 truncate max-w-full">
                        {truncateText(session.title, 20)}
                    </span>
                )}
            </div>

            {/* Enhanced session tooltip */}
            {showTooltip && (
                <div
                    className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 w-64"
                    style={{
                        // Use getBoundingClientRect() for precise positioning
                        left: (() => {
                            if (!cellRef.current) return '50%';
                            const rect = cellRef.current.getBoundingClientRect();
                            const tooltipWidth = 256; // 16rem = 256px
                            const centerX = rect.left + rect.width / 2;
                            const leftPosition = centerX - tooltipWidth / 2;
                            // Prevent overflow
                            const maxLeft = window.innerWidth - tooltipWidth - 10;
                            return `${Math.max(10, Math.min(leftPosition, maxLeft))}px`;
                        })(),
                        top: (() => {
                            if (!cellRef.current) return 'auto';
                            const rect = cellRef.current.getBoundingClientRect();
                            const tooltipHeight = 200; // Approximate height
                            const gapSize = 8; // Gap between cell and tooltip

                            // Check if tooltip would overflow bottom
                            if (rect.bottom + tooltipHeight + gapSize > window.innerHeight) {
                                // Place above the cell
                                return `${rect.top - tooltipHeight - gapSize}px`;
                            } else {
                                // Place below the cell
                                return `${rect.bottom + gapSize}px`;
                            }
                        })(),
                        pointerEvents: 'none'
                    }}
                >
                    {/* Simple arrow that's always centered on the cell */}
                    <div
                        className="absolute w-3 h-3 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700"
                        style={{
                            left: '50%',
                            transform: `translateX(-50%) rotate(45deg)`,
                            top: (() => {
                                if (!cellRef.current) return '-6px';
                                const rect = cellRef.current.getBoundingClientRect();

                                // Check if tooltip is above or below the cell
                                if (rect.top > window.innerHeight / 2) {
                                    // Tooltip is above cell
                                    return 'auto';
                                } else {
                                    // Tooltip is below cell
                                    return '-6px';
                                }
                            })(),
                            bottom: (() => {
                                if (!cellRef.current) return 'auto';
                                const rect = cellRef.current.getBoundingClientRect();

                                // Check if tooltip is above or below the cell
                                if (rect.top <= window.innerHeight / 2) {
                                    // Tooltip is below cell
                                    return 'auto';
                                } else {
                                    // Tooltip is above cell
                                    return '-6px';
                                }
                            })()
                        }}
                    />

                    {/* Tooltip content */}
                    <div className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {format(day, 'EEE, MMM d')} at {displayTime(hour)}
                    </div>

                    {session && (
                        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500 rounded">
                            <div className="font-medium text-blue-700 dark:text-blue-300">
                                Scheduled Session: {truncateText(session.title, 20)}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                                {displayTime(session.startTime)} - {displayTime(session.endTime)}
                            </div>
                            {session.notes && (
                                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {truncateText(session.notes, 50)}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <h4 className="font-medium text-green-600 dark:text-green-400">Available ({count})</h4>
                            {count > 0 ? (
                                <ul className="text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                                    {availableUsers.map(name => (
                                        <li key={name} className="flex items-center">
                                            <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1"></span>
                                            {name}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 mt-1">No one available</p>
                            )}
                        </div>

                        <div>
                            <h4 className="font-medium text-red-600 dark:text-red-400">Unavailable ({total - count})</h4>
                            {total - count > 0 ? (
                                <ul className="text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                                    {unavailableUsers.map(name => (
                                        <li key={name} className="flex items-center">
                                            <span className="h-1.5 w-1.5 bg-red-500 rounded-full mr-1"></span>
                                            {name}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 mt-1">Everyone available!</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlotCell;
