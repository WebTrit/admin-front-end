import {jwtDecode} from "jwt-decode"

interface JwtPayload {
    sub: string
    exp: number
}

export const isTokenExpired = (token: string): boolean => {
    if (!token) return true
    try {
        const decoded = jwtDecode<JwtPayload>(token)
        if (!decoded.exp) return true
        return decoded.exp < Date.now() / 1000
    } catch {
        return true
    }
}
