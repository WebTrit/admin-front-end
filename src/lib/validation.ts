import type {ZodError} from 'zod'

export function formatZodErrors(error: ZodError): Record<string, string> {
    const result: Record<string, string> = {}
    error.errors.forEach((err) => {
        if (err.path.length > 0) {
            result[err.path[0].toString()] = err.message
        }
    })
    return result
}
