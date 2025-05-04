// src/app/components/ActivityTracker.tsx
"use client";
import { useEffect, useState } from 'react';

const ActivityTracker = ({ username }: { username: string }) => {
    const [lastActivity, setLastActivity] = useState<number>(Date.now());
    const [status, setStatus] = useState<'active' | 'away' | 'inactive'>('active');
    const [windowVisible, setWindowVisible] = useState<boolean>(true);

    // Constants for timing
    const AWAY_TIMEOUT = 3 * 60 * 1000; // 3 minutes
    const INACTIVE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
    const UPDATE_INTERVAL = 30 * 1000; // Update server every 30 seconds

    // Function to update the activity timestamp
    const updateActivityTimestamp = () => {
        setLastActivity(Date.now());
        setStatus('active');
    };

    // Function to send activity update to server
    const sendActivityUpdate = async () => {
        if (!username) return;

        try {
            const response = await fetch(`/api/admin/active-users/update?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
            });

            if (!response.ok) {
                console.error('Failed to update activity status');
            }
        } catch (error) {
            console.error('Error updating activity status:', error);
        }
    };

    // Check activity status
    useEffect(() => {
        // Send initial update
        if (username) {
            sendActivityUpdate();
        }

        const handleActivity = () => {
            updateActivityTimestamp();
        };

        // Set up event listeners for user activity
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        // Handle tab visibility
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWindowVisible(false);
            } else {
                setWindowVisible(true);
                updateActivityTimestamp();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Set up interval to check status and update server
        const interval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivity;

            // Update status based on time since last activity
            if (!windowVisible || timeSinceLastActivity > INACTIVE_TIMEOUT) {
                setStatus('inactive');
            } else if (timeSinceLastActivity > AWAY_TIMEOUT) {
                setStatus('away');
            }

            // Only send updates to server if we're active or away (not if inactive)
            if (username && (status === 'active' || status === 'away')) {
                sendActivityUpdate();
            }
        }, UPDATE_INTERVAL);

        // Clean up
        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(interval);
        };
    }, [username, lastActivity, status, windowVisible]);

    // Don't render anything visible
    return null;
};

export default ActivityTracker;