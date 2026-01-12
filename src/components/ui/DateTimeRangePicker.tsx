import {useState, useRef, useEffect} from 'react';
import {Calendar, ChevronLeft, ChevronRight, ChevronDown, Check} from 'lucide-react';

interface DateTimeRangePickerProps {
    dateTimeGte: string;
    dateTimeLte: string;
    onDateTimeGteChange: (value: string) => void;
    onDateTimeLteChange: (value: string) => void;
}

type PresetKey = '5m' | '10m' | '30m' | '60m' | '24h' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year';

interface Preset {
    label: string;
    getValue: () => {from: Date; to: Date};
}

const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getStartOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
};

const getStartOfYear = (date: Date): Date => {
    return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
};

const PRESETS: Record<PresetKey, Preset> = {
    '5m': {
        label: 'Last 5 minutes',
        getValue: () => {
            const now = new Date();
            return {from: new Date(now.getTime() - 5 * 60 * 1000), to: now};
        }
    },
    '10m': {
        label: 'Last 10 minutes',
        getValue: () => {
            const now = new Date();
            return {from: new Date(now.getTime() - 10 * 60 * 1000), to: now};
        }
    },
    '30m': {
        label: 'Last 30 minutes',
        getValue: () => {
            const now = new Date();
            return {from: new Date(now.getTime() - 30 * 60 * 1000), to: now};
        }
    },
    '60m': {
        label: 'Last 60 minutes',
        getValue: () => {
            const now = new Date();
            return {from: new Date(now.getTime() - 60 * 60 * 1000), to: now};
        }
    },
    '24h': {
        label: 'Last 24 hours',
        getValue: () => {
            const now = new Date();
            return {from: new Date(now.getTime() - 24 * 60 * 60 * 1000), to: now};
        }
    },
    'this_week': {
        label: 'This week',
        getValue: () => {
            const now = new Date();
            return {from: getStartOfWeek(now), to: now};
        }
    },
    'this_month': {
        label: 'This month',
        getValue: () => {
            const now = new Date();
            return {from: getStartOfMonth(now), to: now};
        }
    },
    'last_month': {
        label: 'Last month',
        getValue: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            return {from: start, to: end};
        }
    },
    'this_year': {
        label: 'This year',
        getValue: () => {
            const now = new Date();
            return {from: getStartOfYear(now), to: now};
        }
    },
    'last_year': {
        label: 'Last year',
        getValue: () => {
            const now = new Date();
            const start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
            const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
            return {from: start, to: end};
        }
    },
};

const PRESET_ORDER: PresetKey[] = ['5m', '10m', '30m', '60m', '24h', 'this_week', 'this_month', 'last_month', 'this_year', 'last_year'];

// Helper to format date for internal state (ISO format without timezone)
const formatForInput = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// Helper to format date (DD.MM.YYYY HH:MM:SS)
const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// Helper to format display date for trigger button (DD.MM.YYYY HH:MM)
const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select date & time';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Select date & time';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Parse input field value to Date (DD.MM.YYYY HH:MM:SS)
// Accepts both single and double digit values (e.g., "9.12.2025 9:30:00" or "09.12.2025 09:30:00")
const parseInputField = (value: string): Date | null => {
    const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
    if (!match) return null;
    const [, day, month, year, hours, minutes, seconds] = match;
    const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
    );
    if (isNaN(date.getTime())) return null;
    return date;
};

// Detect active preset from current date range
const detectActivePreset = (dateTimeGte: string, dateTimeLte: string): PresetKey | null => {
    if (!dateTimeGte || !dateTimeLte) return null;

    const from = new Date(dateTimeGte);
    const to = new Date(dateTimeLte);

    for (const key of PRESET_ORDER) {
        const preset = PRESETS[key];
        const values = preset.getValue();

        const fromDiff = Math.abs(from.getTime() - values.from.getTime());
        const toDiff = Math.abs(to.getTime() - values.to.getTime());

        // Allow 2 minute tolerance
        if (fromDiff < 2 * 60 * 1000 && toDiff < 2 * 60 * 1000) {
            return key;
        }
    }

    return null;
};

export const DateTimeRangePicker = ({
    dateTimeGte,
    dateTimeLte,
    onDateTimeGteChange,
    onDateTimeLteChange,
}: DateTimeRangePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(null);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [activeField, setActiveField] = useState<'start' | 'end'>('start');
    const containerRef = useRef<HTMLDivElement>(null);
    const yearDropdownRef = useRef<HTMLDivElement>(null);
    const monthDropdownRef = useRef<HTMLDivElement>(null);

    // Local state for input fields
    const [startInputValue, setStartInputValue] = useState('');
    const [endInputValue, setEndInputValue] = useState('');

    // Sync input values with props
    useEffect(() => {
        setStartInputValue(formatDateTime(dateTimeGte));
    }, [dateTimeGte]);

    useEffect(() => {
        setEndInputValue(formatDateTime(dateTimeLte));
    }, [dateTimeLte]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // Close main dropdown
            if (containerRef.current && !containerRef.current.contains(target)) {
                setIsOpen(false);
                setShowYearDropdown(false);
                setShowMonthDropdown(false);
                return;
            }
            // Close year/month dropdowns when clicking outside them (but inside main container)
            if (yearDropdownRef.current && !yearDropdownRef.current.contains(target)) {
                setShowYearDropdown(false);
            }
            if (monthDropdownRef.current && !monthDropdownRef.current.contains(target)) {
                setShowMonthDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Detect preset when opening
    useEffect(() => {
        if (isOpen) {
            const detected = detectActivePreset(dateTimeGte, dateTimeLte);
            setSelectedPreset(detected);
            setActiveField('start');
        }
    }, [isOpen, dateTimeGte, dateTimeLte]);

    const handlePresetClick = (key: PresetKey) => {
        setSelectedPreset(key);
        const preset = PRESETS[key];
        const values = preset.getValue();
        const fromFormatted = formatForInput(values.from);
        const toFormatted = formatForInput(values.to);
        setStartInputValue(formatDateTime(fromFormatted));
        setEndInputValue(formatDateTime(toFormatted));
        // Apply immediately and close
        onDateTimeGteChange(fromFormatted);
        onDateTimeLteChange(toFormatted);
        setIsOpen(false);
    };

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const handleDayClick = (day: number) => {
        const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const currentEndDate = endInputValue ? parseInputField(endInputValue) : null;
        const currentStartDate = startInputValue ? parseInputField(startInputValue) : null;

        if (activeField === 'start') {
            // Update start date preserving time
            const currentStart = currentStartDate || new Date();
            selectedDate.setHours(currentStart.getHours(), currentStart.getMinutes(), currentStart.getSeconds());

            const newStartFormatted = formatDateTime(formatForInput(selectedDate));
            setStartInputValue(newStartFormatted);

            // If start date is after end date, clear end date
            if (currentEndDate && selectedDate > currentEndDate) {
                setEndInputValue('');
            }

            // Auto-switch to end field after selecting start
            setActiveField('end');
        } else {
            // Update end date preserving time
            const currentEnd = currentEndDate || new Date();
            selectedDate.setHours(currentEnd.getHours(), currentEnd.getMinutes(), currentEnd.getSeconds());

            // If end date is before start date, swap them
            if (currentStartDate && selectedDate < currentStartDate) {
                // Set the selected date as start, and move old start to end
                const newStartDate = new Date(selectedDate);
                newStartDate.setHours(currentStartDate.getHours(), currentStartDate.getMinutes(), currentStartDate.getSeconds());
                setStartInputValue(formatDateTime(formatForInput(newStartDate)));
                setEndInputValue(formatDateTime(formatForInput(currentStartDate)));
            } else {
                setEndInputValue(formatDateTime(formatForInput(selectedDate)));
            }
        }
        setSelectedPreset(null);
    };

    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const prevYear = () => {
        setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
    };

    const nextYear = () => {
        setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
    };

    const isSelectedDay = (day: number) => {
        const startDate = startInputValue ? parseInputField(startInputValue) : null;
        if (!startDate) return false;
        return startDate.getDate() === day &&
               startDate.getMonth() === viewDate.getMonth() &&
               startDate.getFullYear() === viewDate.getFullYear();
    };

    const isInRange = (day: number) => {
        const startDate = startInputValue ? parseInputField(startInputValue) : null;
        const endDate = endInputValue ? parseInputField(endInputValue) : null;
        if (!startDate || !endDate) return false;

        const current = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const from = new Date(startDate);
        const to = new Date(endDate);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        return current > from && current < to;
    };

    const isEndDay = (day: number) => {
        const endDate = endInputValue ? parseInputField(endInputValue) : null;
        if (!endDate) return false;
        return endDate.getDate() === day &&
               endDate.getMonth() === viewDate.getMonth() &&
               endDate.getFullYear() === viewDate.getFullYear();
    };

    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day &&
               today.getMonth() === viewDate.getMonth() &&
               today.getFullYear() === viewDate.getFullYear();
    };

    const isFutureDay = (day: number) => {
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date > today;
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const daysInMonth = getDaysInMonth(viewDate);
    const firstDay = getFirstDayOfMonth(viewDate);
    const prevMonthDays = getDaysInMonth(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));

    // Generate year options (10 years back, 1 year forward)
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 12}, (_, i) => currentYear - 10 + i);

    const handleApply = () => {
        let startDate = parseInputField(startInputValue);
        let endDate = parseInputField(endInputValue);

        // Swap if start is after end
        if (startDate && endDate && startDate > endDate) {
            [startDate, endDate] = [endDate, startDate];
            setStartInputValue(formatDateTime(formatForInput(startDate)));
            setEndInputValue(formatDateTime(formatForInput(endDate)));
        }

        if (startDate) {
            onDateTimeGteChange(formatForInput(startDate));
        }
        if (endDate) {
            onDateTimeLteChange(formatForInput(endDate));
        }
        setIsOpen(false);
    };

    const handleReset = () => {
        setStartInputValue('');
        setEndInputValue('');
        setSelectedPreset(null);
        // Clear the filter in parent component
        onDateTimeGteChange('');
        onDateTimeLteChange('');
        setIsOpen(false);
    };

    const handleStartInputChange = (value: string) => {
        setStartInputValue(value);
        setSelectedPreset(null);
    };

    const handleEndInputChange = (value: string) => {
        setEndInputValue(value);
        setSelectedPreset(null);
    };

    // Build calendar days
    const days = [];

    // Days from previous month
    for (let i = 0; i < firstDay; i++) {
        const day = prevMonthDays - firstDay + 1 + i;
        days.push(
            <div key={`prev-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-300">
                {day}
            </div>
        );
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const selected = isSelectedDay(day);
        const end = isEndDay(day);
        const inRange = isInRange(day);
        const today = isToday(day);
        const future = isFutureDay(day);

        days.push(
            <button
                key={day}
                onClick={() => !future && handleDayClick(day)}
                disabled={future}
                className={`w-8 h-8 text-xs flex items-center justify-center transition-colors ${
                    selected || end
                        ? 'bg-blue-500 text-white rounded-full'
                        : inRange
                            ? 'bg-blue-50 text-blue-800'
                            : today
                                ? 'text-blue-500 font-semibold'
                                : future
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-gray-100 rounded-full'
                }`}
            >
                {day}
            </button>
        );
    }

    // Days from next month
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
        days.push(
            <div key={`next-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-300">
                {i}
            </div>
        );
    }

    const activePreset = detectActivePreset(dateTimeGte, dateTimeLte);

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="flex-1 text-left truncate text-gray-700">
                    {dateTimeGte && dateTimeLte ? (
                        `${formatDisplayDate(dateTimeGte)} - ${formatDisplayDate(dateTimeLte)}`
                    ) : dateTimeGte ? (
                        `From ${formatDisplayDate(dateTimeGte)}`
                    ) : dateTimeLte ? (
                        `Until ${formatDisplayDate(dateTimeLte)}`
                    ) : (
                        'Select date range'
                    )}
                </span>
                {activePreset && (
                    <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">
                        {PRESETS[activePreset].label}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 left-0 right-0 sm:left-auto sm:right-auto sm:min-w-[620px] bg-white border border-gray-200 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                    {/* Mobile: Presets as horizontal scroll */}
                    <div className="sm:hidden flex overflow-x-auto gap-1 p-2 border-b border-gray-200 bg-gray-50">
                        {PRESET_ORDER.map((key) => (
                            <button
                                key={key}
                                onClick={() => handlePresetClick(key)}
                                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap border transition-colors ${
                                    selectedPreset === key
                                        ? 'bg-blue-500 text-white border-blue-500'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                                }`}
                            >
                                {PRESETS[key].label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row">
                        {/* Desktop: Left sidebar - Presets */}
                        <div className="hidden sm:block w-40 shrink-0 border-r border-gray-200 py-1">
                            {PRESET_ORDER.map((key) => (
                                <button
                                    key={key}
                                    onClick={() => handlePresetClick(key)}
                                    className={`w-full px-3 py-1.5 text-sm text-left flex items-center justify-between hover:bg-gray-50 whitespace-nowrap ${
                                        selectedPreset === key ? 'text-blue-500' : 'text-gray-700'
                                    }`}
                                >
                                    <span>{PRESETS[key].label}</span>
                                    {selectedPreset === key && (
                                        <Check className="w-3 h-3 text-blue-500 shrink-0 ml-2" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Center - Calendar */}
                        <div className="flex-1 p-3 sm:border-r border-gray-200 min-w-[250px]">
                            <div className="text-xs text-gray-500 mb-2">
                                Select {activeField === 'start' ? 'start' : 'end'} date
                            </div>

                            {/* Year and Month navigation */}
                            <div className="flex items-center justify-center gap-1 mb-3">
                                {/* Year selector */}
                                <div className="flex items-center">
                                    <button
                                        onClick={prevYear}
                                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        <ChevronLeft className="w-3 h-3 text-gray-400" />
                                    </button>
                                    <div className="relative" ref={yearDropdownRef}>
                                        <button
                                            onClick={() => {
                                                setShowYearDropdown(!showYearDropdown);
                                                setShowMonthDropdown(false);
                                            }}
                                            className="flex items-center gap-0.5 px-1 py-0.5 text-xs text-blue-500 hover:bg-gray-50 rounded"
                                        >
                                            <span>{viewDate.getFullYear()}</span>
                                            <ChevronDown className="w-2.5 h-2.5" />
                                        </button>
                                        {showYearDropdown && (
                                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10">
                                                {years.map(year => (
                                                    <button
                                                        key={year}
                                                        onClick={() => {
                                                            setViewDate(new Date(year, viewDate.getMonth(), 1));
                                                            setShowYearDropdown(false);
                                                        }}
                                                        className={`w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 ${
                                                            year === viewDate.getFullYear() ? 'bg-blue-50 text-blue-500' : 'text-gray-700'
                                                        }`}
                                                    >
                                                        {year}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={nextYear}
                                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        <ChevronRight className="w-3 h-3 text-gray-400" />
                                    </button>
                                </div>

                                {/* Month selector */}
                                <div className="flex items-center">
                                    <button
                                        onClick={prevMonth}
                                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        <ChevronLeft className="w-3 h-3 text-gray-400" />
                                    </button>
                                    <div className="relative" ref={monthDropdownRef}>
                                        <button
                                            onClick={() => {
                                                setShowMonthDropdown(!showMonthDropdown);
                                                setShowYearDropdown(false);
                                            }}
                                            className="flex items-center gap-0.5 px-1 py-0.5 text-xs text-blue-500 hover:bg-gray-50 rounded"
                                        >
                                            <span>{monthNames[viewDate.getMonth()]}</span>
                                            <ChevronDown className="w-2.5 h-2.5" />
                                        </button>
                                        {showMonthDropdown && (
                                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10">
                                                {monthNamesFull.map((month, index) => (
                                                    <button
                                                        key={month}
                                                        onClick={() => {
                                                            setViewDate(new Date(viewDate.getFullYear(), index, 1));
                                                            setShowMonthDropdown(false);
                                                        }}
                                                        className={`w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 ${
                                                            index === viewDate.getMonth() ? 'bg-blue-50 text-blue-500' : 'text-gray-700'
                                                        }`}
                                                    >
                                                        {month}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={nextMonth}
                                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        <ChevronRight className="w-3 h-3 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Day Names */}
                            <div className="grid grid-cols-7 gap-0.5 mb-1 w-fit mx-auto">
                                {dayNames.map(day => (
                                    <div key={day} className="w-8 h-5 text-xs text-gray-400 flex items-center justify-center font-medium">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-0.5 w-fit mx-auto">
                                {days}
                            </div>
                        </div>

                        {/* Right side - Date/Time inputs */}
                        <div className="p-3 min-w-[180px] border-t sm:border-t-0 border-gray-200">
                            <div className="flex flex-row sm:flex-col gap-2 sm:gap-0">
                                {/* Start date and time */}
                                <div
                                    className={`flex-1 sm:mb-3 p-2 rounded cursor-pointer transition-colors ${
                                        activeField === 'start' ? 'bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'
                                    }`}
                                    onClick={() => setActiveField('start')}
                                >
                                    <div className="text-xs text-gray-600 mb-1">Start</div>
                                    <input
                                        type="text"
                                        value={startInputValue}
                                        onChange={(e) => handleStartInputChange(e.target.value)}
                                        onFocus={() => setActiveField('start')}
                                        placeholder="DD.MM.YYYY HH:MM:SS"
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    />
                                </div>

                                {/* End date and time */}
                                <div
                                    className={`flex-1 p-2 rounded cursor-pointer transition-colors ${
                                        activeField === 'end' ? 'bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'
                                    }`}
                                    onClick={() => setActiveField('end')}
                                >
                                    <div className="text-xs text-gray-600 mb-1">End</div>
                                    <input
                                        type="text"
                                        value={endInputValue}
                                        onChange={(e) => handleEndInputChange(e.target.value)}
                                        onFocus={() => setActiveField('end')}
                                        placeholder="DD.MM.YYYY HH:MM:SS"
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom buttons */}
                    <div className="flex justify-end gap-2 px-3 py-2 border-t border-gray-200">
                        <button
                            onClick={handleReset}
                            className="px-3 py-1.5 text-xs text-blue-500 hover:bg-gray-50 rounded transition-colors"
                        >
                            RESET
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            APPLY
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
