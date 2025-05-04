// src/app/components/CellWithTooltip.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';

interface CellWithTooltipProps {
    day: Date;
    hour: number;
    dateStr: string;
    isAvailable: boolean;
    isPast: boolean;
    availabilityColor: string;
    isSelected: boolean;
    isHovered: boolean;
    isToday: boolean;
    count: number;
    total: number;
    session: any | null;
    onCellClick: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    availableUsers: string[];
    unavailableUsers: string[];
    displayTime: (hour: number) => string;
}

const CellWithTooltip: React.FC<CellWithTooltipProps> = ({
                                                             day,
                                                             hour,
                                                             dateStr,
                                                             isAvailable,
                                                             isPast,
                                                             availabilityColor,
                                                             isSelected,
                                                             isHovered,
                                                             isToday,
                                                             count,
                                                             total,
                                                             session,
                                                             onCellClick,
                                                             onMouseDown,
                                                             onMouseEnter,
                                                             onMouseLeave,
                                                             availableUsers,
                                                             unavailableUsers,
                                                             displayTime
                                                         }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [tooltipPosition] = useState({ x: '50%', y: '-120%' });
    const [arrowOffset, setArrowOffset] = useState('50%');
    const cellRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const key = `${dateStr}-${hour}`;

    // Utility function to truncate text
    const truncateText = (text: string, maxLength: number): string => {
        if (text.length <= maxLength) return text;
        console.log("truncating...: ", text);
        return text.slice(0, maxLength - 3) + '...';
    };

    useEffect(() => {
        if (showTooltip && cellRef.current && tooltipRef.current) {
            const cellRect = cellRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            // Calculate the center of the cell
            const cellCenter = cellRect.left + cellRect.width / 2;

            // Calculate tooltip position
            let tooltipX = cellCenter - tooltipRect.width / 2;

            // Check if tooltip would overflow the viewport
            if (tooltipX < 0) {
                tooltipX = 0;
            } else if (tooltipX + tooltipRect.width > viewportWidth) {
                tooltipX = viewportWidth - tooltipRect.width;
            }

            // Calculate arrow position to always point to cell center
            const arrowPos = cellCenter - tooltipX;

            setArrowOffset(`${arrowPos}px`);
        }
    }, [showTooltip]);

    // Tooltip functions
    const handleMouseEnterWithTooltip = () => {
        if (isPast) return;

        // Set normal hover state for drag operations
        onMouseEnter();

        // Set timer for tooltip
        const timer = setTimeout(() => {
            setShowTooltip(true);
        }, 1000); // 1 second delay

        setLongPressTimer(timer);
    };

    const handleMouseLeaveWithTooltip = () => {
        // Clear hover states
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
            setShowTooltip(true);
            // Prevent the default behavior which would toggle the availability
            e.preventDefault();
        }, 400); // Reduced from 700ms to 400ms

        setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    return (
        <div
            ref={cellRef}
            data-time-slot={key}
            className={`p-3 border-b border-r border-gray-200 dark:border-gray-600 text-center relative
                ${!isPast ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                ${isAvailable ? 'bg-green-50 dark:bg-green-900/20' : ''}
                ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
                ${session ? 'bg-indigo-100 dark:bg-indigo-900/30 border-l-4 border-indigo-500' : ''}
                ${availabilityColor}
                ${isSelected ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
                ${isHovered ? 'ring-2 ring-gray-400 dark:ring-gray-500' : ''}
            `}
            onClick={onCellClick}
            onMouseDown={onMouseDown}
            onMouseEnter={handleMouseEnterWithTooltip}
            onMouseLeave={handleMouseLeaveWithTooltip}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="flex flex-col items-center">
                {isAvailable ?
                    <span className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center">✓</span>
                    :
                    <span className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600"></span>
                }
                <span className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                    {count}/{total} {session && `• ${truncateText(session.title, 20)}`}
                </span>
            </div>

            {/* Availability tooltip */}
            {showTooltip && (
                <div
                    ref={tooltipRef}
                    className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 w-64 transition-opacity"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                        transform: 'translateX(-50%)'
                    }}
                >
                    {/* Arrow pointing to the cell - this stays in the middle */}
                    <div
                        className="absolute w-3 h-3 bg-white dark:bg-gray-800 transform rotate-45"
                        style={{
                            bottom: '-6px',
                            left: arrowOffset,
                            transform: 'translateX(-50%) rotate(45deg)'
                        }}
                    />

                    <div className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {format(day, 'EEE, MMM d')} at {displayTime(hour)}
                    </div>

                    {session && (
                        <div className="mb-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 dark:border-indigo-800">
                            <div className="font-medium text-indigo-700 dark:text-indigo-300">
                                Session: {truncateText(session.title, 20)}
                            </div>
                            {session.notes && (
                                <div className="text-sm text-indigo-600 dark:text-indigo-400">
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

export default CellWithTooltip;