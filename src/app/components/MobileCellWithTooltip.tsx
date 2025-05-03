// src/app/components/MobileCellWithTooltip.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

interface MobileCellWithTooltipProps {
    day: Date;
    hour: number;
    dateStr: string;
    isAvailable: boolean;
    isPast: boolean;
    availabilityColor: string;
    isSelected: boolean;
    count: number;
    total: number;
    session: any | null;
    onCellClick: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    availableUsers: string[];
    unavailableUsers: string[];
    displayTime: (hour: number) => string;
}

const MobileCellWithTooltip: React.FC<MobileCellWithTooltipProps> = ({
                                                                         day,
                                                                         hour,
                                                                         dateStr,
                                                                         isAvailable,
                                                                         isPast,
                                                                         availabilityColor,
                                                                         isSelected,
                                                                         count,
                                                                         total,
                                                                         session,
                                                                         onCellClick,
                                                                         onTouchStart,
                                                                         onTouchMove,
                                                                         availableUsers,
                                                                         unavailableUsers,
                                                                         displayTime
                                                                     }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const key = `${dateStr}-${hour}`;
    const isTooltipShowingRef = useRef<boolean>(false);

    const handleTouchStartWithTooltip = (e: React.TouchEvent) => {
        if (isPast) return;

        // Set timer for long press with shorter delay
        const timer = setTimeout(() => {
            e.preventDefault(); // Prevent default to avoid toggling availability
            e.stopPropagation(); // Stop propagation to prevent other handlers

            // Create and show mobile tooltip with frosted background
            showMobileTooltip();
        }, 400); // Reduced from 700ms to 400ms

        setLongPressTimer(timer);

        // Only call onTouchStart if we're not showing the tooltip
        if (!showTooltip) {
            onTouchStart(e);
        }
    };

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const showMobileTooltip = () => {
        // Create a frosted background overlay
        const overlay = document.createElement('div');
        overlay.id = 'mobile-tooltip-overlay';
        overlay.className = 'fixed inset-0 z-50 backdrop-blur-sm bg-gray-900/50 flex items-center justify-center p-4';
        overlay.style.backdropFilter = 'blur(5px)';

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'bg-white dark:bg-gray-800 rounded-lg p-5 max-w-sm w-full max-h-[80vh] overflow-auto';

        // Add header
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700';
        header.innerHTML = `
        <h3 class="font-bold text-gray-900 dark:text-white">${format(day, 'EEE, MMM d')} at ${displayTime(hour)}</h3>
        <button id="close-tooltip-btn" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    `;

        // Add session info if available - with blue styling
        if (session) {
            const sessionInfo = document.createElement('div');
            sessionInfo.className = 'p-3 mb-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded';
            sessionInfo.innerHTML = `
            <div class="font-medium text-blue-700 dark:text-blue-300">
                Scheduled Session: ${session.title}
            </div>
            <div class="text-sm text-blue-600 dark:text-blue-400">
                ${displayTime(session.startTime)} - ${displayTime(session.endTime)}
            </div>
            ${session.notes ? `<div class="mt-1 text-gray-700 dark:text-gray-300">${session.notes}</div>` : ''}
        `;
            modal.appendChild(sessionInfo);
        }

        // Add availability info
        const content = document.createElement('div');
        content.className = 'grid grid-cols-1 gap-6';

        // Available users section
        const availableSection = document.createElement('div');
        availableSection.innerHTML = `
        <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Available (${availableUsers.length}/${availableUsers.length + unavailableUsers.length})</h4>
        <ul class="text-gray-700 dark:text-gray-300 space-y-2">
            ${availableUsers.length > 0
            ? availableUsers.map(name => `
                    <li class="flex items-center">
                        <span class="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                        ${name}
                    </li>
                `).join('')
            : '<p class="text-gray-500 dark:text-gray-400">No one available</p>'
        }
        </ul>
    `;

        // Unavailable users section
        const unavailableSection = document.createElement('div');
        unavailableSection.innerHTML = `
        <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Unavailable (${unavailableUsers.length}/${availableUsers.length + unavailableUsers.length})</h4>
        <ul class="text-gray-700 dark:text-gray-300 space-y-2">
            ${unavailableUsers.length > 0
            ? unavailableUsers.map(name => `
                    <li class="flex items-center">
                        <span class="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                        ${name}
                    </li>
                `).join('')
            : '<p class="text-gray-500 dark:text-gray-400">Everyone available!</p>'
        }
        </ul>
    `;

        // Append all elements
        content.appendChild(availableSection);
        content.appendChild(unavailableSection);
        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Add event listener to close button
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || (e.target as HTMLElement).closest('#close-tooltip-btn')) {
                document.body.removeChild(overlay);
                isTooltipShowingRef.current = false;
            }
        });
    };

    return (
        <div
            data-time-slot={key}
            className={`p-3 flex justify-between items-center relative
        ${!isPast ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
        ${availabilityColor}
        ${session ? 'border-l-4 border-blue-500' : ''}
        ${isSelected ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
    `}
            onTouchStart={handleTouchStartWithTooltip}
            onTouchMove={onTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
                // For desktop clicks
                if (!isPast) {
                    onCellClick();
                }
            }}
        >
            {session && (
                <div className="absolute inset-0 bg-blue-200/40 dark:bg-blue-800/30 z-0 pointer-events-none"></div>
            )}

            <div className="flex items-center relative z-10">
                <span className="text-gray-700 dark:text-gray-300">{displayTime(hour)}</span>
                {session && (
                    <span className="ml-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {session.title}
                </span>
                )}
            </div>
            <div className="flex items-center relative z-10">
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
};

export default MobileCellWithTooltip;