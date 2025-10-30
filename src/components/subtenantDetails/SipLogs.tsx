import {useEffect, useState} from 'react';
import {CallLog, CallLogsParams, EventLog, EventLogsParams} from '@/types';
import {toast} from 'react-toastify';
import {Activity, ChevronDown, ChevronUp, Loader2, Phone, RefreshCw} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from '@/lib/axios';

type LogType = 'calls' | 'events';

interface SipLogsProps {
    tenantId: string;
}

export const SipLogs = ({tenantId}: SipLogsProps) => {
    const [logType, setLogType] = useState<LogType>('calls');
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Common filter states
    const [limit, setLimit] = useState(100);
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [dateTimeGte, setDateTimeGte] = useState('');
    const [dateTimeLte, setDateTimeLte] = useState('');
    const [appType, setAppType] = useState('');
    const [appIdentifier, setAppIdentifier] = useState('');
    const [bundleId, setBundleId] = useState('');

    // Call-specific filters
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');

    // Event-specific filters
    const [filterEventType, setFilterEventType] = useState('');
    const [filterSessionId, setFilterSessionId] = useState('');
    const [filterHandleId, setFilterHandleId] = useState('');
    const [filterCallId, setFilterCallId] = useState('');

    // Helper to convert datetime-local to ISO string
    const toISOString = (dateTimeLocal: string) => {
        if (!dateTimeLocal) return '';
        return new Date(dateTimeLocal).toISOString();
    };

    // Helper to set time to start of day (00:00:00)
    const handleDateTimeGteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!value) {
            setDateTimeGte('');
            return;
        }

        // Extract date part and check if date changed
        const datePart = value.split('T')[0];
        const currentDatePart = dateTimeGte.split('T')[0];

        // If date changed or was empty, set time to 00:00
        if (datePart !== currentDatePart) {
            setDateTimeGte(`${datePart}T00:00`);
        } else {
            setDateTimeGte(value);
        }
    };

    // Helper to set time to end of day (23:59:59)
    const handleDateTimeLteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!value) {
            setDateTimeLte('');
            return;
        }

        // Extract date part and check if date changed
        const datePart = value.split('T')[0];
        const currentDatePart = dateTimeLte.split('T')[0];

        // If date changed or was empty, set time to 23:59
        if (datePart !== currentDatePart) {
            setDateTimeLte(`${datePart}T23:59`);
        } else {
            setDateTimeLte(value);
        }
    };

    const fetchLogs = async () => {
        if (!tenantId) return;

        setLoading(true);
        setHasError(false);
        try {
            if (logType === 'calls') {
                const params: CallLogsParams = {
                    filters_tenant_id: tenantId,
                    limit,
                    order,
                    ...(dateTimeGte && {date_time_gte: toISOString(dateTimeGte)}),
                    ...(dateTimeLte && {date_time_lte: toISOString(dateTimeLte)}),
                    ...(filterFrom && {filters_from: filterFrom}),
                    ...(filterTo && {filters_to: filterTo}),
                    ...(appType && {filters_app_type: appType}),
                    ...(appIdentifier && {filters_app_identifier: appIdentifier}),
                    ...(bundleId && {filters_bundle_id: bundleId}),
                };

                const response = await api.get('/logs/calls', {params});
                const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
                // Backend returns {calls: [...]} so we need to extract the array
                const callLogsData = Array.isArray(data) ? data : (data.calls || []);
                setCallLogs(callLogsData);
            } else {
                const params: EventLogsParams = {
                    filters_tenant: tenantId,
                    limit,
                    order,
                    ...(dateTimeGte && {date_time_gte: toISOString(dateTimeGte)}),
                    ...(dateTimeLte && {date_time_lte: toISOString(dateTimeLte)}),
                    ...(filterEventType && {filters_event_type: filterEventType}),
                    ...(filterSessionId && {filters_session_id: Number(filterSessionId)}),
                    ...(filterHandleId && {filters_handle_id: Number(filterHandleId)}),
                    ...(filterCallId && {filters_call_id: filterCallId}),
                    ...(appType && {filters_app_type: appType}),
                    ...(appIdentifier && {filters_app_identifier: appIdentifier}),
                    ...(bundleId && {filters_bundle_id: bundleId}),
                };

                const response = await api.get('/logs/events', {params});
                const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
                // Backend returns {events: [...]} so we need to extract the array
                const eventLogsData = Array.isArray(data) ? data : (data.events || []);
                setEventLogs(eventLogsData);
            }
        } catch (error: any) {
            console.error('Failed to fetch logs:', error);
            setHasError(true);
            // Show toast only once, not on every retry
            if (!hasError) {
                toast.error('Failed to fetch SIP logs', {
                    toastId: 'sip-logs-error', // Prevent duplicate toasts
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch logs when accordion is expanded or logType changes
    useEffect(() => {
        if (!isExpanded) return; // Only fetch when expanded

        setHasError(false); // Reset error state when changing log type
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantId, logType, isExpanded]);

    // Auto-fetch when filters change with debounce (only if no error and expanded)
    useEffect(() => {
        if (!isExpanded) return; // Only fetch when expanded
        if (hasError) return; // Don't auto-retry if there was an error

        const timeoutId = setTimeout(() => {
            fetchLogs();
        }, 500);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        limit,
        order,
        dateTimeGte,
        dateTimeLte,
        filterFrom,
        filterTo,
        filterEventType,
        filterSessionId,
        filterHandleId,
        filterCallId,
        appType,
        appIdentifier,
        bundleId,
    ]);

    const renderCallLogs = () => {
        if (!callLogs.length) {
            return (
                <div className="text-center py-8 text-gray-500">
                    No call logs found for this tenant
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Started
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Duration
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            From
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            To
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            App Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Details
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {callLogs.map((log, index) => {
                        const duration = log.accepted_at && log.end_at
                            ? Math.round((new Date(log.end_at).getTime() - new Date(log.accepted_at).getTime()) / 1000)
                            : null;
                        const wasAccepted = !!log.accepted_at;

                        return (
                            <tr key={log.call_id || index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {log.start_at ? new Date(log.start_at).toLocaleString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {duration !== null ? `${duration}s` : 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {log.from || 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {log.to || 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            wasAccepted
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {wasAccepted ? 'Answered' : 'Missed'}
                                        </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {log.app_type || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                    <details className="cursor-pointer">
                                        <summary className="text-primary-600 hover:text-primary-700">
                                            View JSON
                                        </summary>
                                        <pre className="mt-2 text-xs overflow-auto max-w-md p-2 bg-gray-50 rounded">
                                                {JSON.stringify(log, null, 2)}
                                            </pre>
                                    </details>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderEventLogs = () => {
        if (!eventLogs.length) {
            return (
                <div className="text-center py-8 text-gray-500">
                    No event logs found for this tenant
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Event Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Call ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Session/Handle
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Details
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {eventLogs.map((log, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {log.event_type || 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                                {log.call_id || 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {log.session_id || 'N/A'} / {log.handle_id || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                                <details className="cursor-pointer">
                                    <summary className="text-primary-600 hover:text-primary-700">
                                        View JSON
                                    </summary>
                                    <pre className="mt-2 text-xs overflow-auto max-w-md p-2 bg-gray-50 rounded">
                                            {JSON.stringify(log, null, 2)}
                                        </pre>
                                </details>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
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
                <div className="flex items-center gap-2">
                    {isExpanded && (
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                fetchLogs();
                            }}
                            disabled={loading}
                            variant="outline"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2"/>
                                    Refresh
                                </>
                            )}
                        </Button>
                    )}
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
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-6">
                    {/* Filters */}
                    <div className="mb-6 space-y-4">
                        {/* Top Row: Tabs and Basic Filters */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            {/* Log Type Tabs */}
                            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
                                <button
                                    onClick={() => setLogType('calls')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                                        logType === 'calls'
                                            ? 'bg-white text-primary-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Phone className="w-4 h-4"/>
                                    Call Logs
                                </button>
                                <button
                                    onClick={() => setLogType('events')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                                        logType === 'events'
                                            ? 'bg-white text-primary-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Activity className="w-4 h-4"/>
                                    Event Logs
                                </button>
                            </div>

                            {/* Basic Filters */}
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700">Limit:</label>
                                    <select
                                        value={limit}
                                        onChange={(e) => setLimit(Number(e.target.value))}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                        <option value={200}>200</option>
                                        <option value={500}>500</option>
                                        <option value={1000}>1000</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700">Order:</label>
                                    <select
                                        value={order}
                                        onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="desc">Newest First</option>
                                        <option value="asc">Oldest First</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* All Filters */}
                        {logType === 'calls' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Date From
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={dateTimeGte}
                                        onChange={handleDateTimeGteChange}
                                        className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Date To
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={dateTimeLte}
                                        onChange={handleDateTimeLteChange}
                                        className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        From (SIP)
                                    </label>
                                    <Input
                                        type="text"
                                        value={filterFrom}
                                        onChange={(e) => setFilterFrom(e.target.value)}
                                        placeholder="sip:user@domain.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        To (SIP)
                                    </label>
                                    <Input
                                        type="text"
                                        value={filterTo}
                                        onChange={(e) => setFilterTo(e.target.value)}
                                        placeholder="sip:user@domain.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        App Type
                                    </label>
                                    <Input
                                        type="text"
                                        value={appType}
                                        onChange={(e) => setAppType(e.target.value)}
                                        placeholder="android, ios, web"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        App Identifier
                                    </label>
                                    <Input
                                        type="text"
                                        value={appIdentifier}
                                        onChange={(e) => setAppIdentifier(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Bundle ID
                                    </label>
                                    <Input
                                        type="text"
                                        value={bundleId}
                                        onChange={(e) => setBundleId(e.target.value)}
                                        placeholder="com.example.app"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Date From
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={dateTimeGte}
                                        onChange={handleDateTimeGteChange}
                                        className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Date To
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={dateTimeLte}
                                        onChange={handleDateTimeLteChange}
                                        className="[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Event Type
                                    </label>
                                    <Input
                                        type="text"
                                        value={filterEventType}
                                        onChange={(e) => setFilterEventType(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Session ID
                                    </label>
                                    <Input
                                        type="number"
                                        value={filterSessionId}
                                        onChange={(e) => setFilterSessionId(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Handle ID
                                    </label>
                                    <Input
                                        type="number"
                                        value={filterHandleId}
                                        onChange={(e) => setFilterHandleId(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Call ID
                                    </label>
                                    <Input
                                        type="text"
                                        value={filterCallId}
                                        onChange={(e) => setFilterCallId(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        App Type
                                    </label>
                                    <Input
                                        type="text"
                                        value={appType}
                                        onChange={(e) => setAppType(e.target.value)}
                                        placeholder="android, ios, web"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        App Identifier
                                    </label>
                                    <Input
                                        type="text"
                                        value={appIdentifier}
                                        onChange={(e) => setAppIdentifier(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Bundle ID
                                    </label>
                                    <Input
                                        type="text"
                                        value={bundleId}
                                        onChange={(e) => setBundleId(e.target.value)}
                                        placeholder="com.example.app"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Clear Filters Button */}
                        <div className="flex justify-end">
                            <Button
                                onClick={() => {
                                    setDateTimeGte('');
                                    setDateTimeLte('');
                                    setFilterFrom('');
                                    setFilterTo('');
                                    setFilterEventType('');
                                    setFilterSessionId('');
                                    setFilterHandleId('');
                                    setFilterCallId('');
                                    setAppType('');
                                    setAppIdentifier('');
                                    setBundleId('');
                                }}
                                variant="outline"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>

                    {/* Logs Content */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-600"/>
                            </div>
                        ) : hasError ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <div className="text-red-500 mb-4">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <p className="text-gray-900 font-medium mb-2">Failed to fetch SIP logs</p>
                                <p className="text-gray-500 text-sm mb-4">The logs endpoint is not available</p>
                                <Button onClick={fetchLogs} variant="outline">
                                    <RefreshCw className="w-4 h-4 mr-2"/>
                                    Retry
                                </Button>
                            </div>
                        ) : logType === 'calls' ? (
                            renderCallLogs()
                        ) : (
                            renderEventLogs()
                        )}
                    </div>

                    {/* Info Text */}
                    <p className="mt-4 text-sm text-gray-500">
                        Showing {logType === 'calls' ? 'call' : 'event'} logs for tenant ID: {tenantId}
                    </p>
                </div>
            )}
        </div>
    );
};