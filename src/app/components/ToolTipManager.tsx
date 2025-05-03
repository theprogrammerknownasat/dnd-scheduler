// ToolTipManager.tsx
// Create this as a new utility component
import React, { useEffect, useRef } from 'react';

interface ToolTipManagerProps {
    children: React.ReactNode;
}

// Create a global state to manage tooltips
// This will be a singleton instance that all tooltips register with
const tooltipManager = {
    activeTooltip: null as string | null,
    listeners: [] as Array<(id: string | null) => void>,

    setActiveTooltip(id: string | null) {
        this.activeTooltip = id;
        this.notifyListeners();
    },

    registerListener(callback: (id: string | null) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    },

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.activeTooltip));
    }
};

export const ToolTipManager: React.FC<ToolTipManagerProps> = ({ children }) => {
    // Just a container component to provide context
    return <>{children}</>;
};

// Tooltip Hook - use this in your TimeSlotCell component
export const useTooltip = (id: string, isOpen: boolean) => {
    const prevOpenRef = useRef(isOpen);

    useEffect(() => {
        // Only register when tooltip opens
        if (isOpen && !prevOpenRef.current) {
            tooltipManager.setActiveTooltip(id);
        }

        // If this specific tooltip is closing, clear the active tooltip if it's this one
        if (!isOpen && prevOpenRef.current && tooltipManager.activeTooltip === id) {
            tooltipManager.setActiveTooltip(null);
        }

        prevOpenRef.current = isOpen;
    }, [id, isOpen]);

    // Check if this tooltip should be visible
    const isVisible = () => {
        return tooltipManager.activeTooltip === id && isOpen;
    };

    return { isVisible };
};

export default ToolTipManager;