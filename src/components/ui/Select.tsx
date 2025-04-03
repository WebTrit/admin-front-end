import {forwardRef, SelectHTMLAttributes} from "react";
import {cn} from "@/lib/utils.ts";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    error?: boolean;
    options?: Array<{ value: string; label: string }>;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({className, error, options, children, ...props}, ref) => {
        return (
            <select
                ref={ref}
                className={cn(
                    'w-full flex h-9 rounded-md border border-gray-300 bg-white px-3 py-1',
                    'text-sm text-gray-900 placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'appearance-none bg-no-repeat bg-[right_0.5rem_center] pr-8',
                    'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' strokeLinecap=\'round\' strokeLinejoin=\'round\' strokeWidth=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")]',
                    error && 'border-red-500 focus:ring-red-500',
                    className
                )}
                {...props}
            >
                {options
                    ? options.map(option => (
                        <option key={option.value} value={option.value} className="bg-white text-gray-900">
                            {option.label}
                        </option>
                    ))
                    : children
                }
            </select>
        );
    }
);

Select.displayName = 'Select';

export default Select;
