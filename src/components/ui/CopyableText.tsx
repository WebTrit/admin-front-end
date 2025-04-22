import type React from "react"
import {useState} from "react"
import {CheckCircle2, Copy} from "lucide-react"

interface CopyableTextProps {
    tooltip: string
    className?: string
}

export const CopyableText: React.FC<CopyableTextProps> = ({tooltip = "", className = ""}) => {
    const [showCopied, setShowCopied] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(tooltip)
            setShowCopied(true)
            setTimeout(() => setShowCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy text:", err)
        }
    }

    if (!tooltip) {
        return null
    }

    return (
        <div
            className={`group relative flex items-center gap-1 w-full ${showTooltip ? "cursor-pointer" : ""} ${className}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
      <span className="truncate cursor-pointer flex-grow" onClick={handleCopy}>
        {tooltip}
      </span>
            <button
                onClick={handleCopy}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Copy to clipboard"
            >
                {showCopied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500"/>
                ) : (
                    <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600"/>
                )}
            </button>
            {tooltip &&
                showTooltip &&
                (showCopied ? (
                    <div
                        className="absolute -top-8 right-0 px-2 py-1 text-xs text-white bg-green-600 rounded shadow-lg whitespace-nowrap z-10">
                        Copied!
                    </div>
                ) : (
                    <div
                        className="absolute hidden md:block -top-8 left-0 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap  z-10">
                        {tooltip}
                    </div>
                ))}
        </div>
    )
}
