export function formatFullDateTime(dateString: string): string {
    const date = new Date(dateString)
    const ms = date.getMilliseconds().toString().padStart(3, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    const tz = date.toLocaleString('en-US', {timeZoneName: 'short'}).split(' ').pop()
    return `${year}-${month}-${day}, ${hours}:${minutes}:${seconds}.${ms} ${tz}`
}
