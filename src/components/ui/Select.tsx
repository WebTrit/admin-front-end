import {forwardRef, type SelectHTMLAttributes} from "react"
import {ChevronDown} from "lucide-react"
import {cn} from "@/lib/utils"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    error?: boolean
    options?: Array<{ value: string; label: string }>
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({className, error, options, children, ...props}, ref) => {
    return (
        <div className="relative w-full">
            <select
                ref={ref}
                className={cn(
                    "w-full flex h-9 rounded-md border border-gray-300 bg-white px-3 py-1",
                    "text-sm text-gray-900 placeholder:text-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "appearance-none pr-8",
                    error && "border-red-500 focus:ring-red-500",
                    className,
                )}
                {...props}
            >
                {options
                    ? options.map((option) => (
                        <option key={option.value} value={option.value} className="bg-white text-gray-900">
                            {option.label}
                        </option>
                    ))
                    : children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true"/>
            </div>
        </div>
    )
})

Select.displayName = "Select"

export default Select
