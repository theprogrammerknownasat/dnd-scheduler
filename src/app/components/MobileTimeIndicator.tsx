// Enhanced Mobile Time Indicator with better mobile handling
import React, { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';

interface MobileTimeIndicatorProps {
    containerRef: React.RefObject<HTMLDivElement>;
    expandedDay: string | null;
    timeFormat: '12h' | '24h';
}

const MobileTimeIndicator: React.FC<MobileTimeIndicatorProps> = ({
                                                                     containerRef,
                                                                     expandedDay,
                                                                     timeFormat
                                                                 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [position, setPosition] = useState(0);

    // Use a ref to keep track of elements to avoid dom queries on each render
    const elementCacheRef = useRef<{
        expandedContainer: HTMLElement | null;
        timeSlots: HTMLElement[];
    }>({ expandedContainer: null, timeSlots: [] });

    // Function to find the expanded day container
    const findExpandedContainer = () => {
        if (!expandedDay || !containerRef.current) return null;

        // Look for expanded day container
        const container = containerRef.current;

        // First try class-based approach (if your expanded day has a special class)
        const dayContainer = container.querySelector('.md\\:hidden');
        if (!dayContainer) return null;

        return dayContainer as HTMLElement;
    };

    // Find time slots for today within the expanded container
    const findTimeSlots = (expandedContainer: HTMLElement, date: string) => {
        // Find all time slots within expanded container
        const allSlots = Array.from(expandedContainer.querySelectorAll('[data-hour]'));

        // Filter to only get slots for the expanded day
        return allSlots
            .filter(el => (el as HTMLElement).getAttribute('data-date') === date)
            .map(el => el as HTMLElement)
            .sort((a, b) => {
                const hourA = parseFloat(a.getAttribute('data-hour') || '0');
                const hourB = parseFloat(b.getAttribute('data-hour') || '0');
                return hourA - hourB;
            });
    };

    // Calculate the exact position of the time indicator
    const calculatePosition = () => {
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');

        // Update time display
        if (timeFormat === '12h') {
            setCurrentTime(format(now, 'h:mm a'));
        } else {
            setCurrentTime(format(now, 'HH:mm'));
        }

        // Only show if today is the expanded day
        if (expandedDay !== today) {
            setIsVisible(false);
            return;
        }

        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentHour = hours + (minutes / 60);

        // Get or find expanded container
        let expandedContainer = elementCacheRef.current.expandedContainer;
        if (!expandedContainer) {
            expandedContainer = findExpandedContainer();
            if (!expandedContainer) {
                console.log('Mobile: Cannot find expanded container');
                setIsVisible(false);
                return;
            }
            elementCacheRef.current.expandedContainer = expandedContainer;
        }

        // Get or find time slots
        let timeSlots = elementCacheRef.current.timeSlots;
        if (timeSlots.length === 0) {
            timeSlots = findTimeSlots(expandedContainer, today);
            if (timeSlots.length === 0) {
                console.log('Mobile: No time slots found for today');
                setIsVisible(false);
                return;
            }
            elementCacheRef.current.timeSlots = timeSlots;
        }

        // Now we know today is expanded and we have time slots
        setIsVisible(true);

        // Find the slot for the current hour
        let currentSlot: HTMLElement | null = null;
        let nextSlot: HTMLElement | null = null;

        for (let i = 0; i < timeSlots.length; i++) {
            const slotHour = parseFloat(timeSlots[i].getAttribute('data-hour') || '0');

            if (slotHour <= currentHour) {
                currentSlot = timeSlots[i];
                if (i < timeSlots.length - 1) {
                    nextSlot = timeSlots[i + 1];
                }
            } else {
                // Found a slot after current hour
                if (!currentSlot) {
                    currentSlot = timeSlots[i];
                }
                break;
            }
        }

        if (!currentSlot) {
            console.log('Mobile: Could not find appropriate slot');
            setIsVisible(false);
            return;
        }

        // Get the position within the current slot
        const currentSlotHour = parseFloat(currentSlot.getAttribute('data-hour') || '0');
        const currentSlotRect = currentSlot.getBoundingClientRect();

        // Calculate top position
        let topPosition = 0;

        if (nextSlot) {
            // Calculate position between current and next slot
            const nextSlotHour = parseFloat(nextSlot.getAttribute('data-hour') || '0');
            const nextSlotRect = nextSlot.getBoundingClientRect();

            // How far through current hour are we?
            const hourFraction = (currentHour - currentSlotHour) / (nextSlotHour - currentSlotHour);

            // Calculate based on actual DOM position
            const slotHeight = nextSlotRect.top - currentSlotRect.top;
            topPosition = currentSlotRect.top + (slotHeight * hourFraction);

            // Adjust for scroll position (important for mobile!)
            if (typeof window !== 'undefined') {
                topPosition -= window.scrollY;
            }

            // Make position relative to container
            const containerRect = expandedContainer.getBoundingClientRect();
            topPosition -= containerRect.top;
        } else {
            // Use percentage of the current slot
            const hourFraction = (currentHour - currentSlotHour);
            topPosition = currentSlotRect.top + (currentSlotRect.height * hourFraction);

            // Adjust for scroll
            if (typeof window !== 'undefined') {
                topPosition -= window.scrollY;
            }

            // Make position relative to container
            const containerRect = expandedContainer.getBoundingClientRect();
            topPosition -= containerRect.top;
        }

        console.log(`Mobile time indicator position: ${topPosition}px`);
        setPosition(topPosition);
    };

    // Clear cache when expanded day changes
    useEffect(() => {
        elementCacheRef.current = { expandedContainer: null, timeSlots: [] };
    }, [expandedDay]);

    // Update position on mount and when dependencies change
    useEffect(() => {
        calculatePosition();

        const interval = setInterval(calculatePosition, 60000);

        return () => clearInterval(interval);
    }, [expandedDay, containerRef.current, timeFormat]);

    if (!isVisible) return null;

    return (
        <div
            className="absolute left-0 right-0 pointer-events-none z-50"
            style={{ top: `${position}px` }}
        >
            <div className="flex items-center h-0">
                {/* Red dot */}
                <div className="bg-red-600 h-2 w-2 rounded-full ml-1"></div>

                {/* Line */}
                <div className="flex-grow h-[2px] bg-red-600"></div>

                {/* Time */}
                <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-sm">
                    {currentTime}
                </div>
            </div>
        </div>
    );
};

export default MobileTimeIndicator;