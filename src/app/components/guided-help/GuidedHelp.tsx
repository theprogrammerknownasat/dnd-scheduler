// src/app/components/guided-help/GuidedHelp.tsx
import React, {useState, useEffect, useCallback} from 'react';
import Image from 'next/image';

interface GuideStep {
    id: string;
    title: string;
    content: string[] | string;
    image?: string;
    mobileImage?: string; // Add this property
    desktopImage?: string;
    mobileFocus?: boolean;
    desktopFocus?: boolean;
}

interface GuidedHelpProps {
    onClose: () => void;
    showCloseButton?: boolean;
}

const GuidedHelp: React.FC<GuidedHelpProps> = ({ onClose, showCloseButton = true }) => {
    const [isDesktop, setIsDesktop] = useState(true);
    const [filteredSteps, setFilteredSteps] = useState<GuideStep[]>([]);
    const [filteredStepIndex, setFilteredStepIndex] = useState(0);

    // Check device type on mount and resize
    useEffect(() => {
        const checkDeviceType = () => {
            const isDesktopView = window.innerWidth >= 768;
            setIsDesktop(isDesktopView);
        };

        checkDeviceType();
        window.addEventListener('resize', checkDeviceType);
        return () => window.removeEventListener('resize', checkDeviceType);
    }, []);

    // Define the guide steps, focusing on mobile experience
    const guideSteps: GuideStep[] = [
        {
            id: 'welcome',
            title: "Welcome to DnD Scheduler!",
            content: [
                "This app helps your D&D group coordinate game sessions by finding times when everyone is available.",
                "This guide will show you how to use the key features of the app."
            ],
            // Both mobile and desktop see this
        },
        {
            id: 'calendar-basics',
            title: "Calendar Overview",
            content: [
                "The calendar shows days and time slots.",
                "On mobile, tap a day to expand it and see the time slots.",
                "Tap the date at the top to see a dropdown to change the week."
            ],
            image: "/public/images/help/mobile/calendar-overview.jpg",
            mobileFocus: true
        },
        {
            id: 'calendar-basics-desktop',
            title: "Calendar Navigation",
            content: [
                "Use the arrow buttons to navigate between weeks.",
                "Click on the date range to open a calendar picker for quick navigation.",
                "Click 'Today' to return to the current week.",
                "Use the zoom controls to view 2 weeks or 1 week at a time."
            ],
            image: "/public/images/help/desktop/calendar-navigation-desktop.jpg",
            desktopFocus: true
        },
        {
            id: 'mark-availability',
            title: "Marking Your Availability",
            content: [
                "Tap on a time slot to mark yourself as available (green checkmark).",
                "Tap again to mark yourself as unavailable (empty circle).",
                "This helps your DM know when you can play."
            ],
            image: "/public/images/help/mobile/mark-availability.jpg",
            mobileFocus: true
        },
        {
            id: 'mark-availability-desktop',
            title: "Quick Availability Selection",
            content: [
                "Click a time slot to mark yourself as available (green checkmark).",
                "Click again to toggle back to unavailable.",
                "Drag to quickly mark multiple time slots at once.",
                "Drag from available to unavailable or vice versa to quickly change multiple slots."
            ],
            image: "/public/images/help/desktop/mark-availability-desktop.jpg",
            desktopFocus: true,
        },
        {
            id: 'availability-counts',
            title: "Understanding Availability",
            content: [
                "Each time slot shows how many players are available.",
                "The format is 'Available Players / Total Players' (e.g., 3/5).",
                "Greener colors indicate more player availability.",
                "Blue indicates a scheduled session."
            ],
            image: "/public/images/help/availability-counts.jpg",
            // Works for both mobile and desktop
        },
        {
            id: 'time-slot-details',
            title: "Time Slot Details",
            content: [
                "Tap and hold on a time slot to see exactly who is available.",
                "This shows which players can make that time and which can't.",
                "It's helpful when planning specific sessions."
            ],
            image: "/public/images/help/time-slot-details.jpg",
            mobileFocus: true
        },
        {
            id: 'time-slot-details-desktop',
            title: "Time Slot Information",
            content: [
                "Hover over a time slot to see a tooltip with availability details.",
                "The tooltip shows who is available and who isn't.",
                "Click a time slot to see detailed availability information in the right panel."
            ],
            image: "/public/images/help/time-slot-details-desktop.jpg",
            desktopFocus: true
        },
        {
            id: 'scheduled-sessions',
            title: "Scheduled Sessions",
            content: [
                "Scheduled game sessions appear below the calendar.",
                "Sessions are sorted by date with upcoming sessions at the top.",
                "Tap a session to see its full details."
            ],
            image: "/public/images/help/scheduled-sessions.jpg",
            // Works for both mobile and desktop
        },
        {
            id: 'sessions-in-calendar',
            title: "Sessions in Calendar",
            content: [
                "Scheduled sessions also appear in the calendar with a blue border.",
                "These time slots show the session title.",
                "You can tap them to see session details."
            ],
            image: "/public/images/help/sessions-in-calendar.jpg",
            mobileFocus: true
        },
        {
            id: 'sessions-in-calendar-desktop',
            title: "Session Indicators",
            content: [
                "Scheduled sessions appear with a blue border and background in the calendar.",
                "Sessions in progress are highlighted in green with an 'In Progress' tag.",
                "Hover over a session to see quick details in the tooltip."
            ],
            image: "/public/images/help/sessions-in-calendar-desktop.jpg",
            desktopFocus: true
        },
        {
            id: 'current-time-indicator',
            title: "Current Time Marker",
            content: [
                "A red line shows the current time in today's column.",
                "This helps you quickly see if a session is currently in progress.",
                "The indicator updates automatically to show the current time."
            ],
            image: "/public/images/help/current-time-indicator.jpg",
            desktopFocus: true
        },
        {
            id: 'polls',
            title: "Voting on Polls",
            content: [
                "Polls appear at the bottom of the page.",
                "You can vote on group decisions like adventure choices or house rules.",
                "Some polls show results immediately, others hide results until voting ends."
            ],
            image: "/public/images/help/polls.jpg",
            // Works for both mobile and desktop
        },
        {
            id: 'announcements',
            title: "Campaign Announcements",
            content: [
                "Announcements appear at the top of the calendar page.",
                "Different colors indicate different types of announcements.",
                "These are used for important campaign updates from your DM."
            ],
            image: "/public/images/help/announcements.jpg",
            // Works for both mobile and desktop
        },
        {
            id: 'campaign-switcher',
            title: "Switching Campaigns",
            content: [
                "If you play in multiple campaigns, use the dropdown to switch between them.",
                "Your availability is tracked separately for each campaign.",
                "This appears at the top of the calendar page."
            ],
            image: "/public/images/help/campaign-switcher.jpg",
            // Works for both mobile and desktop
        },
        {
            id: 'profile',
            title: "Your Profile",
            content: [
                "Tap your username in the top right to access your profile.",
                "Here you can change your display name and preferences.",
                "You can also set your time format (12h or 24h)."
            ],
            image: "/public/images/help/profile.jpg",
            mobileFocus: true
        },
        {
            id: 'profile-desktop',
            title: "Profile Settings",
            content: [
                "Click your username in the top right corner to open your profile.",
                "Update your display name, time format preferences, and other settings.",
                "Changes are saved automatically when you leave the profile page."
            ],
            image: "/public/images/help/profile-desktop.jpg",
            desktopFocus: true
        },
        {
            id: 'get-help',
            title: "Need More Help?",
            content: [
                "Click/tap the Help button in the header anytime to see this guide again.",
                "Use the dropdown in the help menu to contact admin or restart the tutorial.",
                "If you have specific issues, contact your campaign's DM.",
                "Thanks for using DnD Scheduler!"
            ],
            // Works for both mobile and desktop
        }
    ];

    // Filter steps based on device type
    const getFilteredSteps = useCallback(() => {
        if (!guideSteps || guideSteps.length === 0) return [];

        return guideSteps.filter(step => {
            // Always show steps that have no specific focus
            if (!step.mobileFocus && !step.desktopFocus) return true;

            // On desktop, show steps with desktopFocus or no specific focus
            if (isDesktop) {
                return step.desktopFocus || (!step.mobileFocus && !step.desktopFocus);
            }

            // On mobile, show steps with mobileFocus or no specific focus
            return step.mobileFocus || (!step.mobileFocus && !step.desktopFocus);
        });
    }, [isDesktop]);

    // Update filtered steps when device type changes
    useEffect(() => {
        const newFilteredSteps = getFilteredSteps();
        setFilteredSteps(newFilteredSteps);

        // Ensure the current index is valid
        if (filteredStepIndex >= newFilteredSteps.length) {
            setFilteredStepIndex(Math.max(0, newFilteredSteps.length - 1));
        }
    }, [getFilteredSteps, filteredStepIndex]);

    // Get the current filtered step
    const currentFilteredStep = filteredSteps[filteredStepIndex];

    // Get the image path based on device type
    const getImagePath = () => {
        if (!currentFilteredStep) return '';

        if (isDesktop && currentFilteredStep.desktopImage) {
            return currentFilteredStep.desktopImage;
        } else if (!isDesktop && currentFilteredStep.mobileImage) {
            return currentFilteredStep.mobileImage;
        } else {
            return currentFilteredStep.image || '';
        }
    };

    // Save completion to localStorage
    const saveCompletionToLocalStorage = () => {
        localStorage.setItem('guidedHelpCompleted', 'true');
    };

    // Handle navigation
    const nextStep = () => {
        if (filteredStepIndex < filteredSteps.length - 1) {
            setFilteredStepIndex(prevIndex => prevIndex + 1);
        } else {
            saveCompletionToLocalStorage();
            onClose();
        }
    };

    const prevStep = () => {
        if (filteredStepIndex > 0) {
            setFilteredStepIndex(prevIndex => prevIndex - 1);
        }
    };

    // Handle skip
    const handleSkip = () => {
        saveCompletionToLocalStorage();
        onClose();
    };

    // If there are no filtered steps yet, show a loading state
    if (!currentFilteredStep) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 backdrop-blur-md bg-black/30"></div>
                <div className="relative p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="text-center mt-4 text-gray-700 dark:text-gray-300">Loading guide...</p>
                </div>
            </div>
        );
    }

    // Main render
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 backdrop-blur-md bg-black/30"
                onClick={showCloseButton ? handleSkip : undefined}
            ></div>

            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Progress indicator */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 pt-4 px-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all"
                            style={{ width: `${((filteredStepIndex + 1) / filteredSteps.length) * 100}%` }}
                        />
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {filteredStepIndex + 1} of {filteredSteps.length}
                        </div>

                        {/* Close button */}
                        {showCloseButton && (
                            <button
                                onClick={handleSkip}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {/* Focus indicators */}
                    {!isDesktop && currentFilteredStep.mobileFocus && (
                        <div className="mb-2 inline-flex items-center text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span>Mobile Focus</span>
                        </div>
                    )}

                    {isDesktop && currentFilteredStep.desktopFocus && (
                        <div className="mb-2 inline-flex items-center text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>Desktop Focus</span>
                        </div>
                    )}

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        {currentFilteredStep.title}
                    </h2>

                    {/* Content */}
                    <div className="mb-6">
                        {Array.isArray(currentFilteredStep.content) ? (
                            currentFilteredStep.content.map((paragraph, index) => (
                                <p key={index} className="text-gray-700 dark:text-gray-300 text-base mb-2">
                                    {paragraph}
                                </p>
                            ))
                        ) : (
                            <p className="text-gray-700 dark:text-gray-300 text-base mb-2">
                                {currentFilteredStep.content}
                            </p>
                        )}
                    </div>

                    {/* Image (if available) */}
                    {currentFilteredStep.image && (
                        <div className="mt-4 mb-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex justify-center p-2">
                            <div className="relative w-full h-[300px]">
                                <Image
                                    src={getImagePath()}
                                    alt={currentFilteredStep.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 600px"
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex justify-between mt-6">
                        <div className="space-x-2">
                            <button
                                onClick={prevStep}
                                disabled={filteredStepIndex === 0}
                                className={`px-4 py-2 rounded-md ${
                                    filteredStepIndex === 0
                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                            >
                                Back
                            </button>

                            {showCloseButton && (
                                <button
                                    onClick={handleSkip}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:underline"
                                >
                                    Skip All
                                </button>
                            )}
                        </div>

                        <button
                            onClick={nextStep}
                            className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                        >
                            {filteredStepIndex === filteredSteps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuidedHelp;