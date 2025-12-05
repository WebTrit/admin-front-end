import {useMemo} from 'react';
import {EventLog} from '@/types';

interface SipSequenceDiagramProps {
    events: EventLog[];
    selectedCallId?: string;
    onMessageClick?: (event: EventLog) => void;
}

interface ParsedSipMessage {
    id: number;
    timestamp: string;
    direction: 'in' | 'out';
    method?: string;
    status?: number;
    statusText?: string;
    from: string;
    to: string;
    callId: string;
    rawMessage: string;
    originalEvent: EventLog;
}

// Parse SIP message from raw text
function parseSipMessage(event: EventLog): ParsedSipMessage | null {
    const rawSip = event.sip?.sip;
    if (!rawSip) return null;

    const lines = rawSip.split('\n').map(l => l.trim());
    const firstLine = lines[0];

    let method: string | undefined;
    let status: number | undefined;
    let statusText: string | undefined;

    // Parse first line - either request or response
    if (firstLine.startsWith('SIP/2.0')) {
        // Response: SIP/2.0 200 OK
        const parts = firstLine.split(' ');
        status = parseInt(parts[1]);
        statusText = parts.slice(2).join(' ');
    } else {
        // Request: REGISTER sip:... SIP/2.0
        method = firstLine.split(' ')[0];
    }

    // Extract From and To headers
    let from = '';
    let to = '';
    let callId = event.sip?.call_id || '';

    for (const line of lines) {
        if (line.startsWith('From:')) {
            // Extract address from "From: <sip:user@domain>;..."
            const match = line.match(/<([^>]+)>|sip:([^\s;]+)/);
            from = match ? (match[1] || match[2]) : '';
        } else if (line.startsWith('To:')) {
            const match = line.match(/<([^>]+)>|sip:([^\s;]+)/);
            to = match ? (match[1] || match[2]) : '';
        } else if (line.startsWith('Call-ID:') && !callId) {
            callId = line.split(':')[1].trim();
        }
    }

    // Determine direction based on event type
    const direction = event.event === 'sip-in' ? 'in' : 'out';

    return {
        id: event.id,
        timestamp: event.event_datetime,
        direction,
        method,
        status,
        statusText,
        from: from || 'Unknown',
        to: to || 'Unknown',
        callId,
        rawMessage: rawSip,
        originalEvent: event,
    };
}

// Extract participant addresses
function getParticipants(messages: ParsedSipMessage[]): string[] {
    const participants = new Set<string>();
    messages.forEach(msg => {
        if (msg.from) participants.add(msg.from);
        if (msg.to) participants.add(msg.to);
    });
    return Array.from(participants);
}

// Get color for message type
function getMessageColor(msg: ParsedSipMessage): string {
    if (msg.status) {
        if (msg.status >= 200 && msg.status < 300) return '#10b981'; // green - success
        if (msg.status >= 400) return '#ef4444'; // red - error
        if (msg.status >= 100 && msg.status < 200) return '#3b82f6'; // blue - provisional
    }
    if (msg.method === 'INVITE') return '#8b5cf6'; // purple
    if (msg.method === 'ACK') return '#06b6d4'; // cyan
    if (msg.method === 'BYE') return '#f59e0b'; // orange
    return '#6b7280'; // gray - default
}

// Get message label
function getMessageLabel(msg: ParsedSipMessage): string {
    if (msg.status) {
        return `${msg.status} ${msg.statusText || ''}`;
    }
    return msg.method || 'Unknown';
}

export const SipSequenceDiagram = ({events, selectedCallId, onMessageClick}: SipSequenceDiagramProps) => {
    const messages = useMemo(() => {
        const parsed = events
            .map(parseSipMessage)
            .filter((m): m is ParsedSipMessage => m !== null)
            .filter(m => !selectedCallId || m.callId === selectedCallId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return parsed;
    }, [events, selectedCallId]);

    const participants = useMemo(() => getParticipants(messages), [messages]);

    if (messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">No SIP messages to display</p>
                <p className="text-sm mt-1">Try adjusting your filters or select a specific Call-ID</p>
            </div>
        );
    }

    // Layout constants
    const PARTICIPANT_WIDTH = 200;
    const PARTICIPANT_SPACING = 250;
    const MESSAGE_HEIGHT = 50;
    const TOP_MARGIN = 60;
    const LEFT_MARGIN = 100;
    const TIME_COLUMN_WIDTH = 120;

    const diagramWidth = LEFT_MARGIN + TIME_COLUMN_WIDTH + (participants.length * PARTICIPANT_SPACING) + 100;
    const diagramHeight = TOP_MARGIN + (messages.length * MESSAGE_HEIGHT) + 100;

    return (
        <div className="bg-white">
            {/* Legend */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Message Types</h4>
                <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-green-500"></div>
                        <span className="text-gray-600">2xx Success</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-red-500"></div>
                        <span className="text-gray-600">4xx+ Error</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-500"></div>
                        <span className="text-gray-600">1xx Provisional</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-purple-500"></div>
                        <span className="text-gray-600">INVITE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-cyan-500"></div>
                        <span className="text-gray-600">ACK</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-orange-500"></div>
                        <span className="text-gray-600">BYE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-gray-500"></div>
                        <span className="text-gray-600">Other</span>
                    </div>
                </div>
            </div>

            {/* Diagram */}
            <div className="overflow-auto">
                <svg width={diagramWidth} height={diagramHeight} className="font-sans">
                {/* Participant headers */}
                {participants.map((participant, idx) => {
                    const x = LEFT_MARGIN + TIME_COLUMN_WIDTH + (idx * PARTICIPANT_SPACING) + (PARTICIPANT_SPACING / 2);

                    return (
                        <g key={participant}>
                            {/* Participant box */}
                            <rect
                                x={x - PARTICIPANT_WIDTH / 2}
                                y={20}
                                width={PARTICIPANT_WIDTH}
                                height={30}
                                fill="#e5e7eb"
                                stroke="#9ca3af"
                                strokeWidth="1"
                                rx="4"
                            />
                            <text
                                x={x}
                                y={40}
                                textAnchor="middle"
                                className="text-xs font-medium fill-gray-800"
                            >
                                {participant.replace('sip:', '').substring(0, 25)}
                            </text>

                            {/* Lifeline */}
                            <line
                                x1={x}
                                y1={50}
                                x2={x}
                                y2={diagramHeight - 50}
                                stroke="#d1d5db"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                        </g>
                    );
                })}

                {/* Messages */}
                {messages.map((msg, idx) => {
                    const y = TOP_MARGIN + (idx * MESSAGE_HEIGHT);
                    const fromIdx = participants.indexOf(msg.from);
                    const toIdx = participants.indexOf(msg.to);

                    if (fromIdx === -1 || toIdx === -1) return null;

                    const x1 = LEFT_MARGIN + TIME_COLUMN_WIDTH + (fromIdx * PARTICIPANT_SPACING) + (PARTICIPANT_SPACING / 2);
                    const x2 = LEFT_MARGIN + TIME_COLUMN_WIDTH + (toIdx * PARTICIPANT_SPACING) + (PARTICIPANT_SPACING / 2);

                    const color = getMessageColor(msg);
                    const label = getMessageLabel(msg);
                    const isOutgoing = msg.direction === 'out';

                    // Arrow direction
                    const arrowStart = isOutgoing ? x1 : x2;
                    const arrowEnd = isOutgoing ? x2 : x1;
                    const direction = arrowEnd > arrowStart ? 1 : -1;

                    return (
                        <g
                            key={msg.id}
                            onClick={() => onMessageClick?.(msg.originalEvent)}
                            className="cursor-pointer hover:opacity-75 transition-opacity"
                            style={{cursor: onMessageClick ? 'pointer' : 'default'}}
                        >
                            {/* Timestamp */}
                            <text
                                x={LEFT_MARGIN + 5}
                                y={y + 5}
                                className="text-xs fill-gray-500"
                            >
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </text>

                            {/* Arrow line */}
                            <line
                                x1={arrowStart}
                                y1={y}
                                x2={arrowEnd}
                                y2={y}
                                stroke={color}
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                            />

                            {/* Arrow head */}
                            <polygon
                                points={`${arrowEnd},${y} ${arrowEnd - (10 * direction)},${y - 5} ${arrowEnd - (10 * direction)},${y + 5}`}
                                fill={color}
                            />

                            {/* Message label */}
                            <rect
                                x={(arrowStart + arrowEnd) / 2 - 60}
                                y={y - 15}
                                width={120}
                                height={20}
                                fill="white"
                                stroke={color}
                                strokeWidth="1"
                                rx="3"
                            />
                            <text
                                x={(arrowStart + arrowEnd) / 2}
                                y={y}
                                textAnchor="middle"
                                className="text-xs font-medium"
                                fill={color}
                            >
                                {label}
                            </text>
                        </g>
                    );
                })}
                </svg>
            </div>

            {/* Summary */}
            {selectedCallId && (
                <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
                    <span>Call-ID: <code className="bg-gray-200 px-2 py-0.5 rounded">{selectedCallId}</code></span>
                </div>
            )}
        </div>
    );
};
