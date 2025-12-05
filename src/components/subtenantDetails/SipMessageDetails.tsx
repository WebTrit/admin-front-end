import React, {useEffect, useRef} from 'react';
import {EventLog} from '@/types';
import {ArrowDown, ArrowUp, Clock, Hash, Activity, ChevronDown, ChevronRight, Code} from 'lucide-react';

interface SipMessageDetailsProps {
    events: EventLog[];
    selectedEvent: EventLog | null;
    onEventClick?: (event: EventLog) => void;
    expandedEventIds?: Set<number>;
    onToggleExpand?: (eventId: number) => void;
}

export const SipMessageDetails = ({events, selectedEvent, onEventClick, expandedEventIds, onToggleExpand}: SipMessageDetailsProps) => {
    const [expandedRawJsonIds, setExpandedRawJsonIds] = React.useState<Set<number>>(new Set());
    const sipMessageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const prevSelectedEventId = useRef<number | null>(null);

    // Scroll to SIP message only when selectedEvent changes (not when other events are expanded)
    useEffect(() => {
        if (selectedEvent && selectedEvent.id !== prevSelectedEventId.current) {
            prevSelectedEventId.current = selectedEvent.id;

            // Wait for expansion to render
            setTimeout(() => {
                const sipMessageRef = sipMessageRefs.current.get(selectedEvent.id);
                if (sipMessageRef) {
                    sipMessageRef.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                }
            }, 100);
        }
    }, [selectedEvent]);

    const toggleRawJson = (eventId: number) => {
        setExpandedRawJsonIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(eventId)) {
                newSet.delete(eventId);
            } else {
                newSet.add(eventId);
            }
            return newSet;
        });
    };

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-white">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">No SIP messages</p>
                <p className="text-sm text-gray-400 mt-1">No event logs available for this call</p>
            </div>
        );
    }

    const getSipMessageSummary = (event: EventLog) => {
        const rawSip = event.sip?.sip;
        if (!rawSip) return {type: 'Unknown', status: '', color: 'gray'};

        const firstLine = rawSip.split('\n')[0]?.trim() || '';

        if (firstLine.startsWith('SIP/2.0')) {
            const parts = firstLine.split(' ');
            const statusCode = parseInt(parts[1]);
            const statusText = parts.slice(2).join(' ');

            let color = 'gray';
            if (statusCode >= 200 && statusCode < 300) color = 'green';
            else if (statusCode >= 400) color = 'red';
            else if (statusCode >= 100 && statusCode < 200) color = 'blue';

            return {type: 'Response', status: `${statusCode} ${statusText}`, color};
        } else {
            const method = firstLine.split(' ')[0] || 'Unknown';
            let color = 'gray';

            if (method === 'INVITE') color = 'purple';
            else if (method === 'BYE') color = 'orange';
            else if (method === 'ACK') color = 'cyan';

            return {type: 'Request', status: method, color};
        }
    };

    const renderMessageItem = (event: EventLog) => {
        const isSelected = selectedEvent?.id === event.id;
        const isExpanded = expandedEventIds?.has(event.id) ?? false;
        const rawSip = event.sip?.sip;

        // For non-SIP events, create a summary from event type
        let summary = rawSip
            ? getSipMessageSummary(event)
            : {type: 'Event', status: event.event || 'Unknown', color: 'gray'};

        // Improve summary for WebRTC events
        if (!rawSip && event.event_type === 'webrtc_event') {
            if (event.peer_connection?.connection_state) {
                const state = event.peer_connection.connection_state;
                summary = {
                    type: 'WebRTC',
                    status: `Peer Connection: ${state}`,
                    color: state === 'connected' ? 'green' : state === 'hangup' ? 'red' : 'blue'
                };
            } else if (event.subtype) {
                summary = {
                    type: 'WebRTC',
                    status: event.subtype.replace('_', ' '),
                    color: 'blue'
                };
            }
        }

        // Improve summary for JSEP events (SDP offer/answer)
        if (!rawSip && event.event_type === 'jsep_event') {
            const jsepType = event.type || 'SDP';
            const owner = event.owner || '';
            summary = {
                type: 'JSEP',
                status: `${jsepType.toUpperCase()}${owner ? ` (${owner})` : ''}`,
                color: jsepType === 'offer' ? 'purple' : jsepType === 'answer' ? 'green' : 'blue'
            };
        }
        const colorClasses = {
            green: 'border-green-500 bg-green-50',
            red: 'border-red-500 bg-red-50',
            blue: 'border-blue-500 bg-blue-50',
            purple: 'border-purple-500 bg-purple-50',
            orange: 'border-orange-500 bg-orange-50',
            cyan: 'border-cyan-500 bg-cyan-50',
            gray: 'border-gray-500 bg-gray-50',
        };

        const textColorClasses = {
            green: 'text-green-700',
            red: 'text-red-700',
            blue: 'text-blue-700',
            purple: 'text-purple-700',
            orange: 'text-orange-700',
            cyan: 'text-cyan-700',
            gray: 'text-gray-700',
        };

        const bgClass = colorClasses[summary.color as keyof typeof colorClasses] || colorClasses.gray;
        const textClass = textColorClasses[summary.color as keyof typeof textColorClasses] || textColorClasses.gray;

        // Parse SIP message for details (only if exists)
        const headers: Record<string, string> = {};
        if (rawSip) {
            const lines = rawSip.split('\n');
            // Parse headers for compact view
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) break;
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim();
                    headers[key] = value;
                }
            }
        }

        const handleCardClick = () => {
            onEventClick?.(event);
        };

        const handleToggleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            onToggleExpand?.(event.id);
        };

        return (
            <div
                key={event.id}
                onClick={handleCardClick}
                className={`border-l-4 p-2 sm:p-4 mb-2 cursor-pointer transition-all scroll-mt-16 ${bgClass} ${
                    isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : 'hover:shadow-md'
                }`}
            >
                {/* Compact Summary */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 mb-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Chevron for expand/collapse */}
                        <button
                            onClick={handleToggleClick}
                            className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                        </button>

                        <div className={`flex items-center gap-1 text-xs font-medium ${
                            event.event === 'sip-in' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                            {event.event === 'sip-in' ? (
                                <>
                                    <ArrowDown className="w-3 h-3" />
                                    IN
                                </>
                            ) : (
                                <>
                                    <ArrowUp className="w-3 h-3" />
                                    OUT
                                </>
                            )}
                        </div>
                        <span className={`text-sm font-semibold ${textClass}`}>
                            {summary.status}
                        </span>
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1 ml-8 sm:ml-0">
                        <Clock className="w-3 h-3 hidden sm:block" />
                        {(() => {
                            const date = new Date(event.event_datetime);
                            const ms = date.getMilliseconds().toString().padStart(3, '0');
                            const day = date.getDate().toString().padStart(2, '0');
                            const month = (date.getMonth() + 1).toString().padStart(2, '0');
                            const year = date.getFullYear();
                            const hours = date.getHours().toString().padStart(2, '0');
                            const minutes = date.getMinutes().toString().padStart(2, '0');
                            const seconds = date.getSeconds().toString().padStart(2, '0');
                            const tz = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop();
                            return `${year}-${month}-${day}, ${hours}:${minutes}:${seconds}.${ms} ${tz}`;
                        })()}
                    </div>
                </div>

                {/* Compact Headers */}
                <div className="space-y-1 text-xs ml-8 sm:ml-0">
                    {headers['From'] && (
                        <div className="break-all">
                            <span className="font-medium text-gray-600">From:</span>
                            <span className="ml-1 sm:ml-2 text-gray-700 font-mono text-[10px] sm:text-xs">{headers['From']}</span>
                        </div>
                    )}
                    {headers['To'] && (
                        <div className="break-all">
                            <span className="font-medium text-gray-600">To:</span>
                            <span className="ml-1 sm:ml-2 text-gray-700 font-mono text-[10px] sm:text-xs">{headers['To']}</span>
                        </div>
                    )}
                </div>

                {/* Expanded Details (only if expanded) */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                        {/* Primary Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-xs">
                            {event.sip?.call_id && (
                                <div className="flex items-start gap-2">
                                    <Hash className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="text-gray-500 font-medium">Call-ID</div>
                                        <div className="font-mono text-gray-900 break-all text-xs">
                                            {event.sip.call_id}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-2">
                                <Activity className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="text-gray-500 font-medium">Session/Handle</div>
                                    <div className="text-gray-900">{event.session_id} / {event.handle_id}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <svg className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <div>
                                    <div className="text-gray-500 font-medium">Event Type</div>
                                    <div className="text-gray-900">{event.event_type || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info Grid */}
                        {(event.app_identification || event.emitter || event.plugin || event.data?.app_identification || event.data?.target_identification || event.data?.emitter || event.data?.plugin || event.tenant || event.app_type || event.bundle_id || event.app_identifier || event.timestamp) && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-xs bg-gray-50 p-3 rounded border border-gray-200">
                                <div className="col-span-full">
                                    <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Additional Information</div>
                                </div>

                                {/* Janus Emitter (Instance) */}
                                {(event.emitter?.name || event.data?.emitter?.name) && (
                                    <div>
                                        <div className="text-gray-500 font-medium mb-1">Janus Instance</div>
                                        <div className="text-gray-900 font-semibold">{event.emitter?.name || event.data?.emitter?.name}</div>
                                        <div className="text-gray-400 text-[10px]">ID: {event.emitter?.id || event.data?.emitter?.id}</div>
                                    </div>
                                )}

                                {/* Plugin */}
                                {(event.plugin?.name || event.data?.plugin?.name) && (
                                    <div>
                                        <div className="text-gray-500 font-medium mb-1">Plugin</div>
                                        <div className="text-gray-900 font-mono text-xs">{event.plugin?.name || event.data?.plugin?.name}</div>
                                        <div className="text-gray-400 text-[10px]">ID: {event.plugin?.id || event.data?.plugin?.id}</div>
                                    </div>
                                )}

                                {/* App Identification */}
                                {(event.app_identification || event.data?.app_identification) && (
                                    <>
                                        {(event.app_identification?.app_type || event.data?.app_identification?.app_type) && (
                                            <div>
                                                <div className="text-gray-500 font-medium mb-1">App Type</div>
                                                <div className="text-gray-900 font-semibold">{event.app_identification?.app_type || event.data?.app_identification?.app_type}</div>
                                            </div>
                                        )}
                                        {(event.app_identification?.bundle_id || event.data?.app_identification?.bundle_id) && (
                                            <div>
                                                <div className="text-gray-500 font-medium mb-1">Bundle ID</div>
                                                <div className="text-gray-900 font-mono text-xs break-all">{event.app_identification?.bundle_id || event.data?.app_identification?.bundle_id}</div>
                                            </div>
                                        )}
                                        {(event.app_identification?.app_identifier || event.data?.app_identification?.app_identifier) && (
                                            <div>
                                                <div className="text-gray-500 font-medium mb-1">App Identifier</div>
                                                <div className="text-gray-900 font-mono text-xs break-all">{event.app_identification?.app_identifier || event.data?.app_identification?.app_identifier}</div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {!event.app_identification && !event.data?.app_identification && event.app_type && (
                                    <div>
                                        <div className="text-gray-500 font-medium mb-1">App Type</div>
                                        <div className="text-gray-900">{event.app_type}</div>
                                    </div>
                                )}
                                {!event.app_identification && !event.data?.app_identification && event.bundle_id && (
                                    <div>
                                        <div className="text-gray-500 font-medium mb-1">Bundle ID</div>
                                        <div className="text-gray-900 font-mono text-xs break-all">{event.bundle_id}</div>
                                    </div>
                                )}
                                {!event.app_identification && !event.data?.app_identification && event.app_identifier && (
                                    <div>
                                        <div className="text-gray-500 font-medium mb-1">App Identifier</div>
                                        <div className="text-gray-900 font-mono text-xs break-all">{event.app_identifier}</div>
                                    </div>
                                )}

                                {event.timestamp && (
                                    <div>
                                        <div className="text-gray-500 font-medium mb-1">Timestamp</div>
                                        <div className="text-gray-900 text-xs">{new Date(event.timestamp).toLocaleString()}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* WebRTC Peer Connection Info */}
                        {event.peer_connection && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-xs bg-blue-50 p-3 rounded border border-blue-200">
                                <div className="col-span-full">
                                    <div className="text-xs font-semibold text-blue-700 uppercase mb-2">WebRTC Peer Connection</div>
                                </div>
                                {event.peer_connection.connection_state && (
                                    <div>
                                        <div className="text-gray-600 font-medium mb-1">Connection State</div>
                                        <div className={`font-semibold ${
                                            event.peer_connection.connection_state === 'connected' ? 'text-green-700' :
                                            event.peer_connection.connection_state === 'hangup' ? 'text-red-700' :
                                            'text-blue-700'
                                        }`}>
                                            {event.peer_connection.connection_state}
                                        </div>
                                    </div>
                                )}
                                {event.subtype && (
                                    <div>
                                        <div className="text-gray-600 font-medium mb-1">Subtype</div>
                                        <div className="text-gray-900">{event.subtype}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ICE Candidate Info */}
                        {(event.local_candidate || event.remote_candidate || event.selected_pair) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs bg-cyan-50 p-3 rounded border border-cyan-200">
                                <div className="col-span-full">
                                    <div className="text-xs font-semibold text-cyan-700 uppercase mb-2">ICE Information</div>
                                </div>
                                {event.local_candidate && (
                                    <div>
                                        <div className="text-gray-600 font-medium mb-1">Local Candidate</div>
                                        <div className="text-gray-900 font-mono text-xs break-all">{JSON.stringify(event.local_candidate)}</div>
                                    </div>
                                )}
                                {event.remote_candidate && (
                                    <div>
                                        <div className="text-gray-600 font-medium mb-1">Remote Candidate</div>
                                        <div className="text-gray-900 font-mono text-xs break-all">{JSON.stringify(event.remote_candidate)}</div>
                                    </div>
                                )}
                                {event.selected_pair && (
                                    <div className="col-span-full">
                                        <div className="text-gray-600 font-medium mb-1">Selected Pair</div>
                                        <div className="text-gray-900 font-mono text-xs break-all">{JSON.stringify(event.selected_pair)}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* DTLS Info */}
                        {event.dtls && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-xs bg-purple-50 p-3 rounded border border-purple-200">
                                <div className="col-span-full">
                                    <div className="text-xs font-semibold text-purple-700 uppercase mb-2">DTLS Information</div>
                                </div>
                                <div className="col-span-full">
                                    <div className="text-gray-900 font-mono text-xs">{JSON.stringify(event.dtls, null, 2)}</div>
                                </div>
                            </div>
                        )}

                        {/* SDP (Session Description Protocol) for JSEP events */}
                        {event.sdp && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-semibold text-indigo-700 uppercase">
                                        SDP ({event.type || 'Session Description'} - {event.owner || 'unknown'})
                                    </div>
                                </div>
                                <div className="bg-indigo-900 text-indigo-100 p-3 rounded font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-96 overflow-y-auto border border-indigo-300">
                                    {event.sdp.replace(/\\r\\n/g, '\n')}
                                </div>
                            </div>
                        )}

                        {/* SIP Message - only if exists */}
                        {rawSip && (
                            <div
                                className="mb-3"
                                ref={(el) => {
                                    if (el) {
                                        sipMessageRefs.current.set(event.id, el);
                                    }
                                }}
                            >
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Complete SIP Message</div>
                                <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-96 overflow-y-auto">
                                    {rawSip}
                                </div>
                            </div>
                        )}

                        {/* Additional Event Data - if exists and not SIP event */}
                        {event.data && Object.keys(event.data).length > 0 && (
                            <div className="mb-3">
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Event Data</div>
                                <div className="bg-gray-900 text-yellow-300 p-3 rounded font-mono text-xs overflow-x-auto max-h-60 overflow-y-auto">
                                    <pre>{JSON.stringify(event.data, null, 2)}</pre>
                                </div>
                            </div>
                        )}

                        {/* Raw JSON Toggle */}
                        <div className="mb-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRawJson(event.id);
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors w-full"
                            >
                                {expandedRawJsonIds.has(event.id) ? (
                                    <>
                                        <ChevronDown className="w-3 h-3" />
                                        Hide Raw JSON
                                    </>
                                ) : (
                                    <>
                                        <ChevronRight className="w-3 h-3" />
                                        Show Raw JSON
                                    </>
                                )}
                                <Code className="w-3 h-3 ml-auto" />
                            </button>

                            {expandedRawJsonIds.has(event.id) && (
                                <div className="mt-2 bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(event, (key, value) => {
                                        // Replace \r\n with actual line breaks in SIP messages for better readability
                                        if (key === 'sip' && typeof value === 'string' && value.includes('\\r\\n')) {
                                            return value.replace(/\\r\\n/g, '\n');
                                        }
                                        return value;
                                    }, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full overflow-auto bg-gray-50">
            {/* SIP Messages List */}
            <div className="p-2 sm:p-4">
                <h4 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 uppercase flex items-center gap-2 sticky top-0 bg-gray-50 py-2 z-10 -mx-2 sm:-mx-4 px-2 sm:px-4">
                    <Activity className="w-4 h-4" />
                    SIP Messages ({events.length})
                </h4>
                <div className="mt-2">
                    {events.map(event => renderMessageItem(event))}
                </div>
            </div>
        </div>
    );
};
