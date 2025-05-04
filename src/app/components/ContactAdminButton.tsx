// src/app/components/ContactAdminButton.tsx
"use client";
import React, { useState } from 'react';

const ContactAdminButton = () => {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleContact = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/users/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (data.success) {
                setShowConfirmation(false);
                // Optionally show success message
            } else {
                setError(data.error || 'Failed to contact admin');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirmation(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700
                    dark:bg-blue-500 dark:hover:bg-blue-600"
            >
                Contact Admin
            </button>

            {showConfirmation && (
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
                                onClick={() => setShowConfirmation(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400
                                    dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleContact}
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
        </>
    );
};

export default ContactAdminButton;