import {InputHTMLAttributes, forwardRef} from 'react';
import {cn} from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({className, error, ...props}, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    'w-full flex h-9 rounded-md border border-gray-300 bg-white px-3 py-1',
                    'text-sm placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-red-500 focus:ring-red-500',
                    className
                )}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';

export default Input;