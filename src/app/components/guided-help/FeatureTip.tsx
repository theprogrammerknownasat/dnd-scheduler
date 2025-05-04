// src/app/components/FeatureTip.tsx
// These are small contextual tips that can be added near specific features
import React, { useState, useEffect } from 'react';

interface FeatureTipProps {
    id: string; // Unique ID for localStorage
    title: string;
    content: string;
    position?: 'top' | 'right' | 'bottom' | 'left';
    className?: string;
}

const FeatureTip: React.FC<FeatureTipProps> = ({
                                                   id,
                                                   title,
                                                   content,
                                                   position = 'top',
                                                   className = ''
                                               }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if this tip has been dismissed before
        const dismissed = localStorage.getItem(`tip_dismissed_${id}`);
        if (!dismissed) {
            // Show tip after a short delay
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);

            return () => clearTimeout(timer);
        } else {
            setIsDismissed(true);
        }
    }, [id]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(`tip_dismissed_${id}`, 'true');
        setIsDismissed(true);
    };

    // Don't render anything if the tip is dismissed
    if (isDismissed) return null;

    // Position classes
    const positionClasses = {
        top: 'bottom-full mb-2',
        right: 'left-full ml-2',
        bottom: 'top-full mt-2',
        left: 'right-full mr-2'
    };

    return (
        <div className={`relative ${className}`}>
            {/* Info icon that can be clicked to show the tip */}
            {!isVisible && (
                <button
                    onClick={() => setIsVisible(true)}
                    className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                </button>
            )}

            {/* Tip content */}
            {isVisible && (
                <div className={`absolute z-10 ${positionClasses[position]} w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700`}>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
                        <button
                            onClick={handleDismiss}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{content}</p>
                    <div className="mt-2 text-right">
                        <button
                            onClick={handleDismiss}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeatureTip;