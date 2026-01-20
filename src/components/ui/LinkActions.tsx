import {useState} from "react"
import {CheckCircle2, Copy, ExternalLink} from "lucide-react"

interface LinkActionsProps {
    url: string
    label?: string
}

export function LinkActions({url, label}: LinkActionsProps) {
    const [showCopied, setShowCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setShowCopied(true)
            setTimeout(() => setShowCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }

    const handleOpen = () => {
        window.open(url, "_blank", "noopener,noreferrer")
    }

    if (!url) return null

    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-sm text-gray-600">{label}</span>}
            <button
                onClick={handleOpen}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Open in new tab"
            >
                <ExternalLink className="w-4 h-4 text-gray-500 hover:text-blue-500"/>
            </button>
            <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title={showCopied ? "Copied!" : "Copy to clipboard"}
            >
                {showCopied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500"/>
                ) : (
                    <Copy className="w-4 h-4 text-gray-500 hover:text-blue-500"/>
                )}
            </button>
        </div>
    )
}
