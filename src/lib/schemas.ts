import {z} from "zod"

// === VoIP / Tenant schemas (moved from SubtenantDetails.tsx) ===

export const voipConfigSchema = z.object({
    voip_system_type: z.string().min(1, "VoIP system type is required"),
    host: z.string(),
    port: z.string().refine((val) => {
        const port = Number.parseInt(val)
        return !isNaN(port) && port >= 1 && port <= 65535
    }, "Port must be between 1 and 65535"),
    transport_protocol: z.string().min(1, "Transport protocol is required"),
    skip_hostname_validation: z.boolean().default(false),
    outbound_proxy_enabled: z.boolean().default(false),
    outbound_proxy_host: z.string().optional(),
    outbound_proxy_port: z.string().optional().refine((val) => {
        if (!val || val === "") return true
        const port = Number.parseInt(val)
        return !isNaN(port) && port >= 1 && port <= 65535
    }, "Port must be between 1 and 65535"),
}).superRefine((data, ctx) => {
    if (!data.skip_hostname_validation && !data.outbound_proxy_enabled) {
        if (!data.host || data.host.trim().length === 0) {
            ctx.addIssue({code: z.ZodIssueCode.custom, message: "SIP Server Hostname / IP is required", path: ["host"]})
            return
        }
        const hostnameRegex = /^(?:\d{1,3}\.){3}\d{1,3}$|^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*\.[a-zA-Z]{2,}$/
        if (!hostnameRegex.test(data.host)) {
            ctx.addIssue({code: z.ZodIssueCode.custom, message: "Invalid SIP Server Hostname / IP", path: ["host"]})
        }
    }
    if (data.outbound_proxy_enabled && (!data.outbound_proxy_host || data.outbound_proxy_host.trim() === "")) {
        ctx.addIssue({code: z.ZodIssueCode.custom, message: "Outbound proxy host is required when outbound proxy is enabled", path: ["outbound_proxy_host"]})
    }
})

export type VoipFormData = z.infer<typeof voipConfigSchema>

export const tenantSchema = z.object({
    company_name: z.string().optional(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().optional(),
    basic_demo: z.boolean().optional(),
})

export type TenantFormData = z.infer<typeof tenantSchema>

// === Signup schemas (moved from types.ts) ===

export const signupSchema = z.object({
    company_name: z.string().optional(),
    website: z.string().url("Please enter a valid website URL").optional(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    phone_number: z.string().min(1, "Phone number is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, {
        message: "You must accept the Terms and Conditions"
    })
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
})

export const otpSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
})

export type SignupFormData = z.infer<typeof signupSchema>
export type OTPFormData = z.infer<typeof otpSchema>

// === AddTenant schema ===

export const addTenantSchema = z.object({
    company_name: z.string().min(1, "This field is required"),
    first_name: z.string().min(1, "This field is required"),
    last_name: z.string().min(1, "This field is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    is_super_tenant: z.boolean().default(false),
})

export type AddTenantFormData = z.infer<typeof addTenantSchema>
