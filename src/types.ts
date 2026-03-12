export interface SIPServerInfo {
    host: string;
    port: number;
    use_tcp: boolean;
}

export interface VoIPSystemInfo {
    type: string | null;
    vendor: string | null;
    name: string | null;
    url: string | null;
}

export interface Tenant {
    tenant_id: string;
    created_at: string | null;
    created_by: string | null;
    last_updated: string | null;
    updated_by: string | null;
    basic_demo: boolean;
    special_user: boolean;
    custom_attributes: Record<string, unknown>;
    company_name: string | null;
    website: string | null;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    comment: string | null;
    email: string | null;
    email_validated: boolean;
    login: string | null;
    password: string | null;
    password_reset_requested: boolean;
    first_time_login: string | null;
    api_token: string | null;
    token_expires: string | null;
    role: string | null;
    otp_sent: string | null;
    otp_id: string | null;
    otp_expires: string | null;
    validation_url: string | null;
    is_super_tenant: boolean | null;
    super_tenant_id: string | null;
    adapter_url: string | null;
    voip_system: VoIPSystemInfo | null;
    instance_id: string | null;
    transport_protocol: string;
    sip: SIPServerInfo | null;
    registrar_server: SIPServerInfo | null;
    outbound_proxy_server: SIPServerInfo | null;
    max_users: number | null;
    users: User[];
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
    sip_registered: boolean | null
    sip_registered_updated_at: string | null
    api_token: string | null
    token_expires: string | null
    role: string | null
    otp_sent: string | null
    otp_id: string | null
    otp_expires: string | null
    validation_url: string | null
}

// Subtenant list item (lighter than full Tenant)
export interface Subtenant {
    tenant_id: string
    email: string | null
    login: string
    company_name: string | null
    basic_demo: boolean
    sip: { host: string; port: number } | null
    registrar_server: string | null
    transport_protocol: string
    voip_system?: { type: string }
}

export interface FilterParams {
    [key: string]: string | undefined
    tenant_id?: string
    email?: string
    except_tenant_id?: string
    super_tenant_id?: string
}

// Logs API types based on actual API endpoints
export interface CallLogsParams {
    date_time_gte?: string // ISO date-time (Greater or Equal)
    date_time_lte?: string // ISO date-time (Less or Equal)
    order?: 'asc' | 'desc'
    limit?: number
    filters_from?: string
    filters_to?: string
    filters_tenant_id?: string
    filters_app_type?: string
    filters_app_identifier?: string
    filters_bundle_id?: string
}

export interface EventLogsParams {
    date_time_gte?: string // ISO date-time (Greater or Equal)
    date_time_lte?: string // ISO date-time (Less or Equal)
    order?: 'asc' | 'desc'
    limit?: number
    filters_event_type?: string
    filters_session_id?: number
    filters_handle_id?: number
    filters_call_id?: string
    filters_app_type?: string
    filters_tenant?: string
    filters_app_identifier?: string
    filters_bundle_id?: string
}

// Call log entry structure from backend
export interface CallLog {
    call_id: string
    from: string
    to: string
    tenant_id: string
    app_type: string
    app_identifier: string
    bundle_id: string
    start_at: string // ISO date-time
    accepted_at?: string // ISO date-time, optional
    end_at?: string // ISO date-time, optional
}

// Event log entry structure from backend
export interface EventLog {
    id: number
    event: string // Event name (e.g., 'sip-in', 'sip-out')
    event_type: string // 'sip_event', 'webrtc_event', 'jsep_event', etc.
    event_datetime: string // ISO date-time
    session_id: number
    handle_id: number
    call_id: string
    app_type: string
    tenant: string
    app_identifier: string
    bundle_id: string
    timestamp: string // ISO date-time

    // WebRTC event fields
    peer_connection?: {
        connection_state?: string
    }
    subtype?: string // WebRTC event subtype

    // JSEP event fields (SDP offer/answer)
    type?: string // 'offer', 'answer', etc.
    owner?: string // identifies the source
    sdp?: string // Session Description Protocol data

    // ICE related fields
    local_candidate?: Record<string, unknown>
    remote_candidate?: Record<string, unknown>
    selected_pair?: Record<string, unknown>

    // DTLS info
    dtls?: Record<string, unknown>

    sip?: {
        sip?: string // Raw SIP message text
        call_id?: string
        code?: number
        reason?: string
        identity?: string
    }
    emitter?: {
        id: number
        name: string
        active: boolean
    }
    plugin?: {
        id: number
        name: string
        active: boolean
    }
    app_identification?: {
        id: number
        bundle_id: string
        app_type: string
        app_identifier: string
        target_identification?: {
            id: number
            name: string | null
            tenant_id: string
            active: boolean
        }
    }
    data?: {
        app_identification?: {
            id?: number
            bundle_id?: string
            app_type?: string
            app_identifier?: string
        }
        target_identification?: {
            id?: number
            name?: string | null
            tenant_id?: string
            active?: boolean
        }
        emitter?: {
            id?: number
            name?: string
            active?: boolean
        }
        plugin?: {
            id?: number
            name?: string
            active?: boolean
        }
        [key: string]: unknown // Allow other unknown properties
    }
}