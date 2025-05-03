// SessionDebugger.tsx
// Add this as a new component file to your project
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface ScheduledSession {
    _id: string;
    title: string;
    date: string;
    startTime: number;
    endTime: number;
    notes: string;
}

interface SessionDebuggerProps {
    scheduledSessions: ScheduledSession[];
}

const SessionDebugger: React.FC<SessionDebuggerProps> = ({ scheduledSessions }) => {
    const [testDate, setTestDate] = useState('');
    const [testHour, setTestHour] = useState<number>(12);
    const [matchResults, setMatchResults] = useState<string[]>([]);
    const [sessionDetails, setSessionDetails] = useState<string[]>([]);

    // Initialize with today's date
    useEffect(() => {
        setTestDate(format(new Date(), 'yyyy-MM-dd'));

        // Log initial session data
        if (scheduledSessions && scheduledSessions.length > 0) {
            const details = scheduledSessions.map(session => {
                return `Session: "${session.title}" on ${session.date} from ${session.startTime} to ${session.endTime}`;
            });
            setSessionDetails(details);

            console.log('DEBUG: All sessions:', scheduledSessions);
        } else {
            setSessionDetails(['No sessions available']);
            console.log('DEBUG: No sessions available');
        }
    }, [scheduledSessions]);

    // Test function that will check if a session matches the given date and hour
    const testSessionMatch = () => {
        const results: string[] = [];
        results.push(`Testing for sessions on ${testDate} at hour ${testHour}`);

        if (!scheduledSessions || scheduledSessions.length === 0) {
            results.push('No sessions available to test');
            setMatchResults(results);
            return;
        }

        scheduledSessions.forEach((session, index) => {
            // Get the values as they are stored
            const sessionDate = session.date;
            const startTime = session.startTime;
            const endTime = session.endTime;

            // Check if types are what we expect
            results.push(`Session ${index+1} "${session.title}":`);
            results.push(`- Date: "${sessionDate}" (type: ${typeof sessionDate})`);
            results.push(`- Start Time: ${startTime} (type: ${typeof startTime})`);
            results.push(`- End Time: ${endTime} (type: ${typeof endTime})`);

            // Parse to ensure numbers
            const startTimeNum = typeof startTime === 'number' ? startTime : parseFloat(startTime.toString());
            const endTimeNum = typeof endTime === 'number' ? endTime : parseFloat(endTime.toString());

            // Check matching logic
            const dateMatches = sessionDate === testDate;
            const timeInRange = testHour >= startTimeNum && testHour < endTimeNum;
            const fullMatch = dateMatches && timeInRange;

            // Log detailed results
            results.push(`- Date Match: ${dateMatches ? 'YES' : 'NO'} (${sessionDate} vs ${testDate})`);
            results.push(`- Time Range Match: ${timeInRange ? 'YES' : 'NO'} (${testHour} within ${startTimeNum}-${endTimeNum})`);
            results.push(`- OVERALL MATCH: ${fullMatch ? 'YES! This session should be displayed!' : 'No match'}`);
            results.push('---');

            console.log(`Session "${session.title}": Date match: ${dateMatches}, Time range match: ${timeInRange}, Overall: ${fullMatch}`);
        });

        setMatchResults(results);
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Session Debugger</h2>

            <div className="mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">All Sessions ({scheduledSessions.length}):</h3>
                {sessionDetails.map((detail, index) => (
                    <div key={index} className="text-sm text-gray-700 dark:text-gray-300">{detail}</div>
                ))}
            </div>

            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Test Date (yyyy-MM-dd):
                        </label>
                        <input
                            type="text"
                            value={testDate}
                            onChange={(e) => setTestDate(e.target.value)}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded w-full text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Test Hour (0-23):
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={testHour}
                            onChange={(e) => setTestHour(parseInt(e.target.value))}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded w-full text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                        />
                    </div>
                </div>
                <button
                    onClick={testSessionMatch}
                    className="mt-4 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600"
                >
                    Test Session Match
                </button>
            </div>

            {matchResults.length > 0 && (
                <div className="mt-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Match Results:</h3>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-auto max-h-96">
                        {matchResults.map((result, index) => (
                            <div
                                key={index}
                                className={`text-sm ${
                                    result.includes('YES!') ? 'text-green-600 dark:text-green-400 font-bold' :
                                        result.includes('No match') ? 'text-red-600 dark:text-red-400' :
                                            'text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {result}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionDebugger;