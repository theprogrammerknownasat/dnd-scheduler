// src/app/components/guided-help/HelpButton.tsx
import React, { useState, useEffect, useRef } from 'react';
import GuidedHelp from './GuidedHelp';

interface HelpButtonProps {
    className?: string;
    onboardingMode?: boolean; // Set true when using in setup-profile page
}

const HelpButton: React.FC<HelpButtonProps> = ({
                                                   className = '',
                                                   onboardingMode = false
                                               }) => {
    const [showGuide, setShowGuide] = useState(false);
    const [, setIsFirstVisit] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showContactConfirmation, setShowContactConfirmation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Check if this is the first visit, only if not in onboarding mode
    useEffect(() => {
        if (!onboardingMode) {
            const hasSeenGuide = localStorage.getItem('guidedHelpCompleted');
            if (!hasSeenGuide) {
                setIsFirstVisit(true);
                setShowGuide(true);
            }
        }
    }, [onboardingMode]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleContactAdmin = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/users/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (data.success) {
                setShowContactConfirmation(false);
                setShowDropdown(false);
                // Optionally show success message
            } else {
                setError(data.error || 'Failed to contact admin');
            }
        } catch {
            setError('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Only show the button if not in onboarding mode */}
            {!onboardingMode && (
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`flex items-center space-x-1 px-3 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md ${className}`}
                    aria-label="Help"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                    <span>Help</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
            )}

            {/* Dropdown Menu */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                        <button
                            onClick={() => {
                                setShowContactConfirmation(true);
                                setShowDropdown(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            Contact Admin
                        </button>
                        <button
                            onClick={() => {
                                setShowGuide(true);
                                setShowDropdown(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                            Tutorial
                        </button>
                    </div>
                </div>
            )}

            {/* Contact Admin Confirmation Modal */}
            {showContactConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Contact Admin
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            This will notify the admin that you need assistance.
                            They will contact you through your preferred method.
                        </p>
                        {error && (
                            <p className="text-red-600 mb-4">{error}</p>
                        )}
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowContactConfirmation(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400
                                    dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleContactAdmin}
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700
                                    dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
                            >
                                {isLoading ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showGuide && (
                <GuidedHelp
                    onClose={() => setShowGuide(false)}
                    showCloseButton={!onboardingMode} // Hide close button in onboarding mode
                />
            )}
        </div>
    );
};

export default HelpButton;