import {z} from "zod"

export interface Tenant {
    created_at: string;
    created_by: string;
    last_updated: string;
    updated_by: string;
    basic_demo: boolean;
    special_user: boolean;
    custom_attributes: {
        signedup_via: string;
    };
    company_name: string;
    website: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    comment: string;
    email: string;
    email_validated: boolean;
    login: string;
    password: string;
    password_reset_requested: boolean;
    first_time_login: string | null;
    api_token: string;
    token_expires: string;
    role: string | null;
    otp_sent: string | null;
    otp_id: string | null;
    otp_expires: string | null;
    validation_url: string | null;
    tenant_id: string;
    is_super_tenant: boolean;
    super_tenant_id: string | null;
    adapter_url: string | null;
    voip_system: {
        type: string;
        vendor: string | null;
        name: string | null;
        url: string | null;
    };
    instance_id: string | null;
    transport_protocol: string;
    sip: {
        host: string;
        port: number;
        use_tcp: boolean;
    };
    registrar_server: string | null;
    outbound_proxy_server: string | null;
    max_users: number;
    users: [];
}

export interface User {
    user_id: string
    tenant_id: string
    first_name: string
    last_name: string
    email: string | null
    login: string | null
    password: string
    sip_username: string
    sip_password: string
    ext_number: string
    main_number: string
    outgoing_cli: string | null
    phone_number: string | null
    comment: string | null
    dids: string[]
    sms_numbers: string[]
    config_token: string
    config_token_expires: string
    created_at: string
    created_by: string
    last_updated: string
    updated_by: string | null
    basic_demo: boolean
    special_user: boolean
    custom_attributes: Record<string, any>
    email_validated: boolean
    password_reset_requested: boolean
    first_time_login: string | null
    sip_registered: boolean
    sip_registered_updated_at: string | null
    api_token: string | null
    token_expires: string | null
    role: string | null
    otp_sent: string | null
    otp_id: string | null
    otp_expires: string | null
    validation_url: string | null
}

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
});

export const otpSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
})

export type SignupFormData = z.infer<typeof signupSchema>
export type OTPFormData = z.infer<typeof otpSchema>