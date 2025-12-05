import {useEffect, useState} from 'react';
import {CallLog, CallLogsParams, EventLog, EventLogsParams} from '@/types';
import {toast} from 'react-toastify';
import {Activity, ChevronDown, ChevronUp, Loader2, Network, Phone, RefreshCw, Search} from 'lucide-react';
import Button from '@/components/ui/Button';
import api from '@/lib/axios';
import {CallLogsTable} from './CallLogsTable';
import {CallFlowModal} from './CallFlowModal';
import {SipMessageDetails} from './SipMessageDetails';

type LogViewType = 'calls' | 'all-events';

// Helper to format date for datetime-local input
const formatForInput = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Helper to format time range as human readable string
// Returns empty string if 'to' date is not close to current time (not "last X" period)
const formatTimeRange = (fromStr: string, toStr: string): string => {
    if (!fromStr || !toStr) return '';

    const from = new Date(fromStr);
    const to = new Date(toStr);
    const now = new Date();

    // Check if 'to' date is within 5 minutes of now (considered as "current")
    const toNowDiffMs = Math.abs(now.getTime() - to.getTime());
    if (toNowDiffMs > 5 * 60 * 1000) return ''; // More than 5 minutes difference - not "last X"

    const diffMs = to.getTime() - from.getTime();
    if (diffMs <= 0) return '';

    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
};

// Helper to extract user part from SIP URI or return as-is
// e.g. "sip:12065551003@demo-sip.webtrit.com" -> "12065551003"
const extractSipUser = (input: string): string => {
    const trimmed = input.trim();
    // Match sip:user@domain pattern
    const match = trimmed.match(/^sip:([^@]+)@.+$/i);
    if (match) {
        return match[1];
    }
    // Remove sip: prefix if present
    if (trimmed.toLowerCase().startsWith('sip:')) {
        return trimmed.slice(4);
    }
    return trimmed;
};

interface SipLogsProps {
    tenantId: string;
    sipDomain: string;
}

export const SipLogs = ({tenantId, sipDomain}: SipLogsProps) => {
    const [viewType, setViewType] = useState<LogViewType>('calls');
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
    const [allEvents, setAllEvents] = useState<EventLog[]>([]);
    const [loadingCalls, setLoadingCalls] = useState(false);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [loadingAllEvents, setLoadingAllEvents] = useState(false);
    const [hasCallsError, setHasCallsError] = useState(false);
    const [hasEventsError, setHasEventsError] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

    // Call Flow Modal state
    const [isCallFlowModalOpen, setIsCallFlowModalOpen] = useState(false);
    const [callFlowCall, setCallFlowCall] = useState<CallLog | null>(null);

    // Selected event for all events view
    const [selectedAllEvent, setSelectedAllEvent] = useState<EventLog | null>(null);
    const [expandedAllEventIds, setExpandedAllEventIds] = useState<Set<number>>(new Set());

    // Common filter states
    const [limit, setLimit] = useState(100);
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    // Default to last hour
    const [dateTimeGte, setDateTimeGte] = useState(() => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return formatForInput(oneHourAgo);
    });
    const [dateTimeLte, setDateTimeLte] = useState(() => formatForInput(new Date()));

    // Filters for Calls tab (filters_from, filters_to)
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'answered' | 'missed'>('all');

    // Filters for All SIP Events tab
    const [filterAppType, setFilterAppType] = useState('');

    // Handler for opening Call Flow modal
    const handleViewCallFlow = async (call: CallLog) => {
        setCallFlowCall(call);
        setIsCallFlowModalOpen(true);
        // Fetch event logs for this call
        if (call.call_id) {
            await fetchEventLogsForCall(call.call_id);
        }
    };

    // Helper to convert datetime-local to ISO string
    const toISOString = (dateTimeLocal: string) => {
        if (!dateTimeLocal) return '';
        return new Date(dateTimeLocal).toISOString();
    };

    const handleDateTimeGteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateTimeGte(e.target.value);
    };

    const handleDateTimeLteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateTimeLte(e.target.value);
    };

    const fetchCallLogs = async () => {
        if (!tenantId) return;

        setLoadingCalls(true);
        setHasCallsError(false);
        try {
            // Build full SIP URI from user input
            const buildSipUri = (user: string) => {
                if (!user.trim()) return '';
                return `sip:${user.trim()}@${sipDomain}`;
            };

            const params: CallLogsParams = {
                filters_tenant_id: tenantId,
                limit,
                order,
                ...(dateTimeGte && {date_time_gte: toISOString(dateTimeGte)}),
                ...(dateTimeLte && {date_time_lte: toISOString(dateTimeLte)}),
                ...(filterFrom && {filters_from: buildSipUri(filterFrom)}),
                ...(filterTo && {filters_to: buildSipUri(filterTo)}),
            };

            const response = await api.get('/logs/calls', {params});
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            let callLogsData = Array.isArray(data) ? data : (data.calls || []);

            // Apply status filter locally
            if (filterStatus !== 'all') {
                callLogsData = callLogsData.filter((call: CallLog) => {
                    const wasAccepted = !!call.accepted_at;
                    return filterStatus === 'answered' ? wasAccepted : !wasAccepted;
                });
            }

            setCallLogs(callLogsData);
        } catch (error: any) {
            console.error('Failed to fetch call logs:', error);
            setHasCallsError(true);
            toast.error('Failed to fetch call logs', {
                toastId: 'sip-logs-error',
            });
        } finally {
            setLoadingCalls(false);
        }
    };

    const fetchEventLogsForCall = async (callId: string) => {
        if (!tenantId || !callId) return;

        setLoadingEvents(true);
        try {
            const params: EventLogsParams = {
                filters_tenant: tenantId,
                filters_call_id: callId,
                limit: 1000,
                order: 'asc',
            };

            const response = await api.get('/logs/events', {params});
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            const eventLogsData = Array.isArray(data) ? data : (data.events || []);
            setEventLogs(eventLogsData);
        } catch (error: any) {
            console.error('Failed to fetch event logs:', error);
            toast.error('Failed to fetch SIP messages for this call');
            setEventLogs([]);
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleToggleExpandAllEvent = (eventId: number) => {
        setExpandedAllEventIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(eventId)) {
                newSet.delete(eventId);
            } else {
                newSet.add(eventId);
            }
            return newSet;
        });
    };

    const fetchAllEvents = async () => {
        if (!tenantId) return;

        setLoadingAllEvents(true);
        setHasEventsError(false);
        try {
            const params: EventLogsParams = {
                filters_tenant: tenantId,
                limit,
                order,
                ...(dateTimeGte && {date_time_gte: toISOString(dateTimeGte)}),
                ...(dateTimeLte && {date_time_lte: toISOString(dateTimeLte)}),
                ...(filterAppType && {filters_app_type: filterAppType}),
            };

            const response = await api.get('/logs/events', {params});
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            const eventLogsData = Array.isArray(data) ? data : (data.events || []);
            setAllEvents(eventLogsData);
        } catch (error: any) {
            console.error('Failed to fetch all events:', error);
            setHasEventsError(true);
            toast.error('Failed to fetch SIP events', {
                toastId: 'sip-events-error',
            });
        } finally {
            setLoadingAllEvents(false);
        }
    };

    // Auto-fetch data when accordion is expanded (only calls on initial open)
    useEffect(() => {
        if (!isExpanded) return;
        setHasCallsError(false);
        // Only fetch calls when accordion first opens
        fetchCallLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantId, isExpanded]);

    // Auto-fetch when filters or view type change with debounce
    useEffect(() => {
        if (!isExpanded) return;

        const timeoutId = setTimeout(() => {
            if (viewType === 'calls') {
                if (!hasCallsError) fetchCallLogs();
            } else {
                if (!hasEventsError) fetchAllEvents();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        viewType,
        limit,
        order,
        dateTimeGte,
        dateTimeLte,
        filterFrom,
        filterTo,
        filterStatus,
        filterAppType,
    ]);

    const clearFilters = () => {
        setDateTimeGte('');
        setDateTimeLte('');
        setFilterFrom('');
        setFilterTo('');
        setFilterStatus('all');
        setFilterAppType('');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Header */}
            <div
                className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between ${
                    !isExpanded ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
                }`}
                onClick={() => !isExpanded && setIsExpanded(true)}
            >
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-gray-600"/>
                    <h3 className="text-lg font-semibold text-gray-900">SIP Logs</h3>
                    {!isExpanded && (
                        <span className="text-sm text-gray-500">
                            (Click to view logs)
                        </span>
                    )}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600"/>
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600"/>
                    )}
                </button>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="flex flex-col h-[600px] sm:h-[800px]">
                    {/* View Type Tabs */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
                            <button
                                onClick={() => setViewType('calls')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                                    viewType === 'calls'
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Phone className="w-4 h-4"/>
                                Call Logs
                            </button>
                            <button
                                onClick={() => setViewType('all-events')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                                    viewType === 'all-events'
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Network className="w-4 h-4"/>
                                All SIP Events
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                                className="sm:hidden flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase"
                            >
                                <Search className="w-4 h-4"/>
                                Filters
                                {isFiltersExpanded ? (
                                    <ChevronUp className="w-4 h-4"/>
                                ) : (
                                    <ChevronDown className="w-4 h-4"/>
                                )}
                            </button>
                            <div className="hidden sm:flex items-center gap-3">
                                <h4 className="text-sm font-semibold text-gray-700 uppercase flex items-center gap-2">
                                    <Search className="w-4 h-4"/>
                                    Filters
                                </h4>
                                {formatTimeRange(dateTimeGte, dateTimeLte) && (
                                    <span className="text-xs text-gray-500">
                                        Showing logs for last {formatTimeRange(dateTimeGte, dateTimeLte)}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                                <Button
                                    onClick={viewType === 'calls' ? fetchCallLogs : fetchAllEvents}
                                    disabled={viewType === 'calls' ? loadingCalls : loadingAllEvents}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs sm:text-sm px-2 sm:px-3"
                                >
                                    {(viewType === 'calls' ? loadingCalls : loadingAllEvents) ? (
                                        <Loader2 className="w-4 h-4 animate-spin"/>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4 sm:mr-1"/>
                                            <span className="hidden sm:inline">Refresh</span>
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
                                    variant="outline"
                                    size="sm"
                                    title="Toggle sort order"
                                    className="text-xs sm:text-sm px-2 sm:px-3"
                                >
                                    <span className="sm:hidden">{order === 'desc' ? 'Newest' : 'Oldest'}</span>
                                    <span className="hidden sm:inline">{order === 'desc' ? 'Newest first' : 'Oldest first'}</span>
                                </Button>
                                <Button
                                    onClick={() => {
                                        const limits = [50, 100, 200, 500];
                                        const currentIndex = limits.indexOf(limit);
                                        const nextIndex = (currentIndex + 1) % limits.length;
                                        setLimit(limits[nextIndex]);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    title="Change limit"
                                    className="text-xs sm:text-sm px-2 sm:px-3"
                                >
                                    {limit}{' '}<span className="hidden sm:inline">{viewType === 'calls' ? 'calls' : 'events'}</span>
                                </Button>
                            </div>
                        </div>

                        {/* Collapsible filters on mobile, always visible on desktop */}
                        <div className={`${isFiltersExpanded ? 'block' : 'hidden'} sm:block mt-3 sm:mt-4`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Common filters for both tabs */}
                            <div lang="en-GB">
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Date From
                                </label>
                                <input
                                    type="datetime-local"
                                    value={dateTimeGte}
                                    onChange={handleDateTimeGteChange}
                                    lang="en-GB"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div lang="en-GB">
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Date To
                                </label>
                                <input
                                    type="datetime-local"
                                    value={dateTimeLte}
                                    onChange={handleDateTimeLteChange}
                                    lang="en-GB"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            {/* Filters specific to Call Logs tab */}
                            {viewType === 'calls' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            From
                                        </label>
                                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                                            <span className="px-2 py-2 bg-gray-100 text-gray-500 text-sm border-r border-gray-300">sip:</span>
                                            <input
                                                type="text"
                                                value={filterFrom}
                                                onChange={(e) => setFilterFrom(extractSipUser(e.target.value))}
                                                placeholder="user"
                                                className="flex-1 px-2 py-2 text-sm focus:outline-none min-w-0"
                                            />
                                            <span className="px-2 py-2 bg-gray-100 text-gray-500 text-sm border-l border-gray-300 truncate max-w-[120px]" title={`@${sipDomain}`}>@{sipDomain}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            To
                                        </label>
                                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                                            <span className="px-2 py-2 bg-gray-100 text-gray-500 text-sm border-r border-gray-300">sip:</span>
                                            <input
                                                type="text"
                                                value={filterTo}
                                                onChange={(e) => setFilterTo(extractSipUser(e.target.value))}
                                                placeholder="user"
                                                className="flex-1 px-2 py-2 text-sm focus:outline-none min-w-0"
                                            />
                                            <span className="px-2 py-2 bg-gray-100 text-gray-500 text-sm border-l border-gray-300 truncate max-w-[120px]" title={`@${sipDomain}`}>@{sipDomain}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'answered' | 'missed')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="all">All</option>
                                            <option value="answered">Answered</option>
                                            <option value="missed">Missed</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Filters specific to All SIP Events tab */}
                            {viewType === 'all-events' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        App Type
                                    </label>
                                    <select
                                        value={filterAppType}
                                        onChange={(e) => setFilterAppType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="">All App Types</option>
                                        <option value="android">Android</option>
                                        <option value="ios">iOS</option>
                                        <option value="web">Web</option>
                                    </select>
                                </div>
                            )}

                            {/* Clear Filters Button */}
                            <div className="flex items-end">
                                <Button
                                    onClick={clearFilters}
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                            </div>
                        </div>
                    </div>

                    {/* Master-Detail Layout */}
                    <div className="flex-1 flex overflow-hidden">
                        {viewType === 'calls' ? (
                            // Call Logs View - Only show list of calls
                            <div className="w-full overflow-auto bg-white">
                                {loadingCalls ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4"/>
                                        <p className="text-sm">Loading calls...</p>
                                    </div>
                                ) : hasCallsError ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <div className="text-red-500 mb-4">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                        </div>
                                        <p className="text-gray-900 font-medium mb-2">Failed to fetch calls</p>
                                        <p className="text-gray-500 text-sm mb-4">The logs endpoint is not available</p>
                                        <Button onClick={fetchCallLogs} variant="outline" size="sm">
                                            <RefreshCw className="w-4 h-4 mr-2"/>
                                            Retry
                                        </Button>
                                    </div>
                                ) : callLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                        </svg>
                                        <p className="text-lg font-medium">No calls found</p>
                                        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                                    </div>
                                ) : (
                                    <CallLogsTable
                                        calls={callLogs}
                                        onViewCallFlow={handleViewCallFlow}
                                    />
                                )}
                            </div>
                        ) : (
                            // All SIP Events View - Only show list of events (no diagram)
                            <div className="w-full overflow-auto bg-white">
                                {loadingAllEvents ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4"/>
                                        <p className="text-sm">Loading SIP events...</p>
                                    </div>
                                ) : hasEventsError ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <div className="text-red-500 mb-4">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                        </div>
                                        <p className="text-gray-900 font-medium mb-2">Failed to fetch SIP events</p>
                                        <p className="text-gray-500 text-sm mb-4">The logs endpoint is not available</p>
                                        <Button onClick={fetchAllEvents} variant="outline" size="sm">
                                            <RefreshCw className="w-4 h-4 mr-2"/>
                                            Retry
                                        </Button>
                                    </div>
                                ) : allEvents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                        </svg>
                                        <p className="text-lg font-medium">No SIP events found</p>
                                        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                                    </div>
                                ) : (
                                    <SipMessageDetails
                                        events={allEvents}
                                        selectedEvent={selectedAllEvent}
                                        onEventClick={(event) => setSelectedAllEvent(event)}
                                        expandedEventIds={expandedAllEventIds}
                                        onToggleExpand={handleToggleExpandAllEvent}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
                        <span>
                            {viewType === 'calls' ? (
                                <>Showing {callLogs.length} call{callLogs.length !== 1 ? 's' : ''} for
                                    tenant: {tenantId}</>
                            ) : (
                                <>Showing {allEvents.length} SIP event{allEvents.length !== 1 ? 's' : ''} for
                                    tenant: {tenantId}</>
                            )}
                        </span>
                    </div>
                </div>
            )}

            {/* Call Flow Modal */}
            {callFlowCall && (
                <CallFlowModal
                    call={callFlowCall}
                    isOpen={isCallFlowModalOpen}
                    onClose={() => setIsCallFlowModalOpen(false)}
                    eventLogs={eventLogs}
                    isLoadingEvents={loadingEvents}
                />
            )}
        </div>
    );
};
