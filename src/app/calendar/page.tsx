// src/app/calendar/page.tsx
"use client";
import React, {useState, useEffect, useCallback} from 'react';
import { useRouter } from 'next/navigation';
import {addWeeks, format} from 'date-fns';
import Header from '../components/Header';
import DateCalendar from '../components/DateCalendar';
import PollComponent from '../components/PollComponent';
import CampaignSelector from '../components/CampaignSelector';
import ScheduledSessionForm from '../components/ScheduledSessionForm';
import { formatTimestamp, getUserTimeFormat } from '@/utils/dateTimeFormatter';

interface User {
    _id: string;
    username: string;
    displayName: string;
}

interface ScheduledSession {
    _id: string;
    campaignId: string;
    title: string;
    date: string;
    startTime: number;
    endTime: number;
    notes: string;
}

interface Announcement {
    text: string;
    color: string;
    createdAt?: string;
}

export default function Calendar() {
    const [username, setUsername] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [announcement, setAnnouncement] = useState<Announcement>({ text: '', color: 'yellow' });
    const [allUsersAvailability, setAllUsersAvailability] = useState<Record<string, Record<string, boolean>>>({});
    const [allUsers, setAllUsers] = useState<Record<string, User>>({});
    const [maxWeeks, setMaxWeeks] = useState(12); // Default to 12 weeks
    const [loading, setLoading] = useState(true);
    const [currentCampaignId, setCurrentCampaignId] = useState('');
    const [, setAvailableCampaigns] = useState<any[]>([]);
    const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
    const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(getUserTimeFormat());
    const [campaignDataVersion, ] = useState(0);


    const router = useRouter();


    const [userPreferences, setUserPreferences] = useState({
        maxPreviousSessions: 3,
        maxFutureSessions: 5
    });

    // Fetch user info and campaigns
    useEffect(() => {
        const fetchUserAndCampaigns = async () => {
            try {
                const userResponse = await fetch('/api/auth/me');
                const userData = await userResponse.json();

                if (!userData.success) {
                    // If not authenticated, redirect to login
                    router.push('/login');
                    return;
                }

                setUsername(userData.username);
                setIsAdmin(userData.isAdmin);

                const profileResponse = await fetch('/api/profile');
                const profileData = await profileResponse.json();

                if (profileData.success && profileData.profile) {
                    // Set time format based on profile preference
                    setTimeFormat(profileData.profile.use24HourFormat ? '24h' : '12h');
                }

                // Fetch available campaigns
                const campaignsResponse = await fetch('/api/campaigns');
                const campaignsData = await campaignsResponse.json();

                if (campaignsData.success) {
                    const campaigns = campaignsData.campaigns;
                    setAvailableCampaigns(campaigns);

                    // Check if we have campaigns available
                    if (campaigns.length === 0) {
                        // No campaigns available
                        setLoading(false);

                        // Create a default campaign if user is admin and no campaigns exist
                        if (userData.isAdmin) {
                            // Create default campaign
                            const createResponse = await fetch('/api/campaigns', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: 'Default Campaign',
                                    isDefault: true,
                                    description: 'Automatically created default campaign'
                                }),
                            });

                            const createData = await createResponse.json();

                            if (createData.success) {
                                // Reload campaigns
                                const updatedResponse = await fetch('/api/campaigns');
                                const updatedData = await updatedResponse.json();

                                if (updatedData.success && updatedData.campaigns.length > 0) {
                                    setAvailableCampaigns(updatedData.campaigns);
                                    setCurrentCampaignId(updatedData.campaigns[0]._id);
                                    localStorage.setItem('lastCampaignId', updatedData.campaigns[0]._id);
                                } else {
                                    // If still no campaigns, redirect to no-campaign page
                                    router.push('/no-campaign');
                                }
                            } else {
                                // Failed to create default campaign
                                router.push('/no-campaign');
                            }
                        } else {
                            // Not an admin, redirect to no-campaign page
                            router.push('/no-campaign');
                        }
                        return;
                    }

                    // Get previously selected campaign from localStorage
                    const lastCampaignId = localStorage.getItem('lastCampaignId');

                    // Check if the last campaign is still available to the user
                    const isLastCampaignAvailable = lastCampaignId && campaigns.some((c: { _id: string; }) => c._id === lastCampaignId);

                    if (isLastCampaignAvailable) {
                        // Use the last selected campaign
                        setCurrentCampaignId(lastCampaignId!);
                    } else {
                        // Use the first campaign available
                        const campaignId = campaigns[0]._id;
                        setCurrentCampaignId(campaignId);
                        localStorage.setItem('lastCampaignId', campaignId);
                    }
                } else {
                    // Error fetching campaigns
                    router.push('/no-campaign');
                    return;
                }

                // Fetch settings
                const settingsResponse = await fetch('/api/settings');
                const settingsData = await settingsResponse.json();

                if (settingsData.success && settingsData.settings) {
                    // Set max weeks if available
                    if (settingsData.settings.maxFutureWeeks) {
                        setMaxWeeks(settingsData.settings.maxFutureWeeks);
                    }
                }
            } catch (err) {
                console.error('Error fetching initial data:', err);
                setLoading(false);
                router.push('/no-campaign');
            }
        };

        fetchUserAndCampaigns();
    }, [router]);

    // Fetch all users' availability for the current week
    const fetchAllUsersAvailability = useCallback( async (startDate: string, endDate: string) => {
        try {
            if (!currentCampaignId) return;

            const response = await fetch(`/api/calendar/all-availability?campaignId=${currentCampaignId}&start=${startDate}&end=${endDate}`);
            const data = await response.json();

            if (data.success) {
                setAllUsersAvailability(data.availability || {});
            } else {
                console.error("Error fetching availability:", data.error);
            }
        } catch (err) {
            console.error('Error fetching all users availability:', err);
        }
    }, [currentCampaignId]);

    const fetchScheduledSessions = useCallback( async () => {
        try {
            if (!currentCampaignId) return;

            const url = `/api/scheduled-sessions?campaignId=${currentCampaignId}`;


            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setScheduledSessions(data.sessions || []);
            } else {
                console.error("Error fetching sessions:", data.error);
            }
        } catch (err) {
            console.error('Error fetching scheduled sessions:', err);
        }
    }, [currentCampaignId]);

    // Fetch campaign-specific data when campaign changes
    useEffect(() => {
        if (!currentCampaignId) return;

        const fetchCampaignData = async () => {
            setLoading(true);
            try {
                // Fetch announcement for the campaign
                const announcementResponse = await fetch(`/api/announcements/latest?campaignId=${currentCampaignId}`);
                const announcementData = await announcementResponse.json();

                if (announcementData.success && announcementData.announcement) {
                    setAnnouncement(announcementData.announcement);
                } else {
                    // Reset announcement if none found
                    setAnnouncement({ text: '', color: 'yellow' });
                }

                // Fetch users for the campaign
                const usersResponse = await fetch(`/api/campaigns/${currentCampaignId}/users`);
                const usersData = await usersResponse.json();

                if (usersData.success) {
                    const usersMap: Record<string, User> = {};
                    usersData.users.forEach((user: User) => {
                        usersMap[user.username] = user;
                    });

                    setAllUsers(usersMap);

                    // Get current date
                    const today = new Date();
                    const startDate = format(today, 'yyyy-MM-dd');
                    const endDate = format(addWeeks(today, 1), 'yyyy-MM-dd');

                    // Fetch initial data for the current week
                    await fetchAllUsersAvailability(startDate, endDate);
                    await fetchScheduledSessions();
                }

                // Save this campaign as the last selected
                localStorage.setItem('lastCampaignId', currentCampaignId);
            } catch (err) {
                console.error('Error fetching campaign data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaignData();
    }, [currentCampaignId, fetchAllUsersAvailability, fetchScheduledSessions]);

    // Handle updating availability
    const handleAvailabilityChange = async (date: Date, hour: number, isAvailable: boolean) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        // Update the all users availability local state
        setAllUsersAvailability(prev => {
            const newState = { ...prev };
            if (!newState[username]) {
                newState[username] = {};
            }
            newState[username][`${dateStr}-${hour}`] = isAvailable;
            return newState;
        });

        // If there's no campaignId, don't try to save to the server
        if (!currentCampaignId) return;

        // Optionally send the update to the server directly if needed
        try {
            await fetch('/api/calendar/availability', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    campaignId: currentCampaignId,
                    date: dateStr,
                    hour,
                    isAvailable
                }),
            });
        } catch (err) {
            console.error('Error updating availability on server:', err);
        }
    };

    // Handle campaign change
    const handleCampaignChange = (campaignId: string) => {
        if (campaignId === currentCampaignId) return; // Don't do anything if the ID hasn't changed

        // Reset ALL campaign-specific state
        setAllUsersAvailability({});
        setScheduledSessions([]);
        setAnnouncement({ text: '', color: 'yellow' });

        // Set the new campaign ID
        setCurrentCampaignId(campaignId);

        // Save to localStorage
        localStorage.setItem('lastCampaignId', campaignId);
    };

    // Handle scheduling a session
    const handleSessionCreated = async () => {

        // Close the form first
        setShowScheduleForm(false);

        // Refresh scheduled sessions
        if (scheduleDate) {
            // Use a wider date range to capture potential multi-day sessions
            format(scheduleDate, 'yyyy-MM-dd');
            format(addWeeks(scheduleDate, 1), 'yyyy-MM-dd');
            // Fetch the updated sessions
            await fetchScheduledSessions();
        }
    };

    // 5. Add a debugging message when scheduling a session
    const handleScheduleSession = (date: Date) => {

        // Save the date for the form
        setScheduleDate(date);

        // Show the form
        setShowScheduleForm(true);
    };

    useEffect(() => {
        if (!currentCampaignId) return;

        // Load initial data for the current campaign
        const today = new Date();
        const startDate = format(today, 'yyyy-MM-dd');
        const endDate = format(addWeeks(today, 2), 'yyyy-MM-dd');

        // Fetch data for the current date range
        fetchAllUsersAvailability(startDate, endDate);
        fetchScheduledSessions();

        // This effect should run whenever the campaign changes or the data version changes
    }, [currentCampaignId, fetchAllUsersAvailability, fetchScheduledSessions]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const profileResponse = await fetch('/api/profile');
                const profileData = await profileResponse.json();

                if (profileData.success && profileData.profile) {
                    // Create a new preferences object only if there are actual changes
                    const updatedPreferences = {
                        maxPreviousSessions: profileData.profile.maxPreviousSessions !== undefined
                            ? profileData.profile.maxPreviousSessions
                            : userPreferences.maxPreviousSessions,
                        maxFutureSessions: profileData.profile.maxFutureSessions !== undefined
                            ? profileData.profile.maxFutureSessions
                            : userPreferences.maxFutureSessions
                    };

                    // Only update if the values actually changed
                    if (updatedPreferences.maxPreviousSessions !== userPreferences.maxPreviousSessions ||
                        updatedPreferences.maxFutureSessions !== userPreferences.maxFutureSessions) {
                        setUserPreferences(updatedPreferences);
                    }
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        fetchUserProfile();
    }, [userPreferences.maxPreviousSessions, userPreferences.maxFutureSessions]);

    React.useMemo(() => currentCampaignId, [currentCampaignId]);

    const getAnnouncementClasses = () => {
        const baseClasses = "border-l-4 p-4 mb-4 rounded";

        switch (announcement.color) {
            case 'red':
                return `${baseClasses} bg-red-100 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-400`;
            case 'green':
                return `${baseClasses} bg-green-100 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-500 dark:text-green-400`;
            case 'blue':
                return `${baseClasses} bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-400`;
            case 'yellow':
            default:
                return `${baseClasses} bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-500 dark:text-yellow-400`;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            </div>
        );
    }

    if (!currentCampaignId) {
        // Redirect to no-campaign page if no campaign is selected
        router.push('/no-campaign');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Header username={username} isAdmin={isAdmin} />

            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0 sm:mr-4">Calendar</h1>
                    <CampaignSelector
                        currentCampaignId={currentCampaignId}
                        onCampaignChange={handleCampaignChange}
                        isAdmin={isAdmin}
                    />
                </div>
            </div>

            {announcement.text && (
                <div className={getAnnouncementClasses()}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold">Announcement</p>
                            <p>{announcement.text}</p>
                        </div>
                        {announcement.createdAt && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                {formatTimestamp(announcement.createdAt)}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <DateCalendar
                username={username}
                campaignId={currentCampaignId}
                maxWeeks={maxWeeks}
                onAvailabilityChange={handleAvailabilityChange}
                allUsersAvailability={allUsersAvailability}
                allUsers={allUsers}
                scheduledSessions={scheduledSessions}
                isAdmin={isAdmin}
                onScheduleSession={handleScheduleSession}
                fetchAllUsersAvailability={fetchAllUsersAvailability}
                fetchScheduledSessions={fetchScheduledSessions}
                timeFormat={timeFormat}
                maxPreviousSessions={userPreferences.maxPreviousSessions}
                maxFutureSessions={userPreferences.maxFutureSessions}
                key={`${currentCampaignId}-${campaignDataVersion}`} // Add a key to force re-render when campaign changes
            />

            {/* Add Poll Component */}
            <div className="mt-8">
                <PollComponent campaignId={currentCampaignId} />
            </div>

            {/* Scheduled Session Form */}
            {showScheduleForm && scheduleDate && (
                <div className="fixed inset-0 z-50">
                    <ScheduledSessionForm
                        campaignId={currentCampaignId}
                        date={scheduleDate}
                        onClose={() => {
                            setShowScheduleForm(false);
                        }}
                        onSessionCreated={() => {
                            handleSessionCreated();
                        }}
                        timeFormat={timeFormat}
                    />
                </div>
            )}
        </div>
    );
}