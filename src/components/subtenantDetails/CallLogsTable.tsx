import {useState} from 'react';
import {CallLog} from '@/types';
import {PhoneIncoming, PhoneMissed, GitBranch, Clock, ChevronDown, ChevronRight, Hash, Activity} from 'lucide-react';

interface CallLogsTableProps {
    calls: CallLog[];
    onViewCallFlow: (call: CallLog) => void;
}

export const CallLogsTable = ({calls, onViewCallFlow}: CallLogsTableProps) => {
    const [expandedCallIds, setExpandedCallIds] = useState<Set<string>>(new Set());

    const formatDuration = (call: CallLog) => {
        if (!call.accepted_at || !call.end_at) return null;
        const duration = Math.round((new Date(call.end_at).getTime() - new Date(call.accepted_at).getTime()) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    };

    const formatFullDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const tz = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop();
        return `${year}-${month}-${day}, ${hours}:${minutes}:${seconds}.${ms} ${tz}`;
    };

    const handleToggleExpand = (callId: string) => {
        setExpandedCallIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(callId)) {
                newSet.delete(callId);
            } else {
                newSet.add(callId);
            }
            return newSet;
        });
    };

    return (
        <div className="h-full overflow-auto bg-gray-50">
            <div className="p-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase flex items-center gap-2 sticky top-0 bg-gray-50 py-2">
                    <Activity className="w-4 h-4" />
                    Call Logs ({calls.length})
                </h4>
                {calls.map((call) => {
                    const wasAccepted = !!call.accepted_at;
                    const isExpanded = expandedCallIds.has(call.call_id);
                    const duration = formatDuration(call);

                    const colorClasses = wasAccepted
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50';
                    const textColorClass = wasAccepted ? 'text-green-700' : 'text-red-700';

                    return (
                        <div
                            key={call.call_id}
                            className={`border-l-4 p-4 mb-2 transition-all ${colorClasses} hover:shadow-md`}
                        >
                            {/* Compact Summary */}
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex items-center gap-3">
                                    {/* Chevron for expand/collapse */}
                                    <button
                                        onClick={() => handleToggleExpand(call.call_id)}
                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        aria-label={isExpanded ? "Collapse" : "Expand"}
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-gray-600" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-600" />
                                        )}
                                    </button>

                                    <div className={`p-1.5 rounded ${wasAccepted ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {wasAccepted ? (
                                            <PhoneIncoming className="w-4 h-4 text-green-700" />
                                        ) : (
                                            <PhoneMissed className="w-4 h-4 text-red-700" />
                                        )}
                                    </div>

                                    <span className={`text-sm font-semibold ${textColorClass}`}>
                                        {wasAccepted ? 'Answered' : 'Missed'}
                                        {duration && <span className="ml-2">• {duration}</span>}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatFullDateTime(call.start_at)}
                                </div>
                            </div>

                            {/* From/To - Compact */}
                            <div className="space-y-1 text-xs mb-2 ml-9">
                                <div>
                                    <span className="font-medium text-gray-600">From:</span>
                                    <span className="ml-2 text-gray-700 font-mono">{call.from || 'Unknown'}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">To:</span>
                                    <span className="ml-2 text-gray-700 font-mono">{call.to || 'Unknown'}</span>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-gray-300 ml-9">
                                    {/* Call Details Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-xs">
                                        {call.call_id && (
                                            <div className="flex items-start gap-2">
                                                <Hash className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="text-gray-500 font-medium">Call-ID</div>
                                                    <div className="font-mono text-gray-900 break-all text-xs">
                                                        {call.call_id}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {call.start_at && (
                                            <div className="flex items-start gap-2">
                                                <Clock className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <div className="text-gray-500 font-medium">Start Time</div>
                                                    <div className="text-gray-900">{formatFullDateTime(call.start_at)}</div>
                                                </div>
                                            </div>
                                        )}

                                        {call.end_at && (
                                            <div className="flex items-start gap-2">
                                                <Clock className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <div className="text-gray-500 font-medium">End Time</div>
                                                    <div className="text-gray-900">{formatFullDateTime(call.end_at)}</div>
                                                </div>
                                            </div>
                                        )}

                                    </div>

                                    {/* App Information */}
                                    {(call.app_type || call.bundle_id || call.app_identifier) && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-xs bg-gray-50 p-3 rounded border border-gray-200">
                                            <div className="col-span-full">
                                                <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Application Information</div>
                                            </div>

                                            {call.app_type && (
                                                <div>
                                                    <div className="text-gray-500 font-medium mb-1">App Type</div>
                                                    <div className="text-gray-900 font-semibold">{call.app_type}</div>
                                                </div>
                                            )}

                                            {call.bundle_id && (
                                                <div>
                                                    <div className="text-gray-500 font-medium mb-1">Bundle ID</div>
                                                    <div className="text-gray-900 font-mono text-xs break-all">{call.bundle_id}</div>
                                                </div>
                                            )}

                                            {call.app_identifier && (
                                                <div>
                                                    <div className="text-gray-500 font-medium mb-1">App Identifier</div>
                                                    <div className="text-gray-900 font-mono text-xs break-all">{call.app_identifier}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onViewCallFlow(call);
                                            }}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                            title="View SIP flow diagram for this call"
                                        >
                                            <GitBranch className="w-4 h-4" />
                                            View Call Flow
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
