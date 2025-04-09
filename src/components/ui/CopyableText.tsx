import React, {useState} from 'react';
import {Copy, CheckCircle2} from 'lucide-react';

interface CopyableTextProps {
    tooltip: string;
    className?: string;
    maxWidth?: string;
}

export const CopyableText: React.FC<CopyableTextProps> = (
    {
        tooltip = '',
        className = '',
        maxWidth = 'max-w-[200px]',
    }) => {
    const [showCopied, setShowCopied] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(tooltip);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    return (
        <div
            className={`group relative inline-flex items-center gap-1 ${maxWidth} ${className}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Copy to clipboard"
            >
                {showCopied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500"/>
                ) : (
                    <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600"/>
                )}
            </button>
            <span
                className="truncate cursor-pointer"
                onClick={handleCopy}
            >
        {tooltip}
      </span>
            {tooltip && showTooltip && (
                showCopied ? (
                        <div
                            className="absolute -top-8 left-0 px-2 py-1 text-xs text-white bg-green-600 rounded shadow-lg whitespace-nowrap">
                            Copied!
                        </div>
                    ) :
                    <div
                        className="absolute hidden md:block -top-8 left-0 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap">
                        {tooltip}
                    </div>
            )}

        </div>
    );
};