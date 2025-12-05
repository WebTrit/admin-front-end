import {useState, useEffect} from 'react';
import {CallLog, EventLog} from '@/types';
import {X, Loader2} from 'lucide-react';
import {SipSequenceDiagram} from './SipSequenceDiagram';
import {SipMessageDetails} from './SipMessageDetails';

interface CallFlowModalProps {
    call: CallLog;
    isOpen: boolean;
    onClose: () => void;
    eventLogs: EventLog[];
    isLoadingEvents: boolean;
}

export const CallFlowModal = ({call, isOpen, onClose, eventLogs, isLoadingEvents}: CallFlowModalProps) => {
    const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
    const [expandedEventIds, setExpandedEventIds] = useState<Set<number>>(new Set());

    const handleMessageClick = (event: EventLog) => {
        setSelectedEvent(event);
        // Also expand the event to show Complete SIP Message
        setExpandedEventIds(prev => {
            const newSet = new Set(prev);
            newSet.add(event.id);
            return newSet;
        });
    };

    const handleToggleExpand = (eventId: number) => {
        setExpandedEventIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(eventId)) {
                newSet.delete(eventId);
            } else {
                newSet.add(eventId);
            }
            return newSet;
        });
    };

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const duration = call.accepted_at && call.end_at
        ? Math.round((new Date(call.end_at).getTime() - new Date(call.accepted_at).getTime()) / 1000)
        : null;
    const wasAccepted = !!call.accepted_at;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl w-[95vw] max-w-[1600px] h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Call Flow</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                            <span className="font-mono truncate max-w-[120px] sm:max-w-none">{call.from}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-mono truncate max-w-[120px] sm:max-w-none">{call.to}</span>
                            <span className="text-gray-400 hidden sm:inline">•</span>
                            <span className={wasAccepted ? 'text-green-600' : 'text-red-600'}>
                                {wasAccepted ? 'Answered' : 'Missed'}
                            </span>
                            {duration !== null && (
                                <>
                                    <span className="text-gray-400 hidden sm:inline">•</span>
                                    <span>{duration}s</span>
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-2"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {isLoadingEvents ? (
                        <div className="flex flex-col items-center justify-center w-full py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
                            <p className="text-gray-500 text-sm">Loading SIP messages...</p>
                        </div>
                    ) : eventLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center w-full py-12 text-gray-500">
                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-lg font-medium">No SIP messages found</p>
                            <p className="text-sm text-gray-400 mt-1">This call has no associated event logs</p>
                        </div>
                    ) : (
                        <div className="flex flex-col xl:flex-row h-full w-full">
                            {/* Message List - Full width on mobile/tablet/small desktop, 1/3 width on large desktop */}
                            <div className="w-full xl:w-1/3 h-1/2 xl:h-full border-b xl:border-b-0 xl:border-r border-gray-200 overflow-hidden bg-gray-50">
                                <SipMessageDetails
                                    events={eventLogs}
                                    selectedEvent={selectedEvent}
                                    onEventClick={handleMessageClick}
                                    expandedEventIds={expandedEventIds}
                                    onToggleExpand={handleToggleExpand}
                                />
                            </div>

                            {/* Diagram - Full width on mobile/tablet/small desktop, 2/3 width on large desktop */}
                            <div className="flex-1 h-1/2 xl:h-full overflow-auto bg-white">
                                <SipSequenceDiagram
                                    events={eventLogs}
                                    selectedCallId={call.call_id}
                                    onMessageClick={handleMessageClick}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
