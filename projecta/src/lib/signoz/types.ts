export interface SigNozLogRowData {
    attributes_bool?: Record<string, boolean>;
    attributes_number?: Record<string, number>;
    attributes_string?: Record<string, string>;
    resources_string?: Record<string, string>;
    scope_string?: Record<string, string>;
    scope_name?: string;
    scope_version?: string;
    severity_number?: number;
    severity_text?: string;
    trace_flags?: number;
    trace_id?: string;
    span_id?: string;
    body?: string;
    id?: string;
    timestamp?: number | string;
}

export interface SigNozLogRow {
    timestamp?: string;
    body?: string;
    severity_text?: string;
    severity_number?: number;
    trace_id?: string;
    span_id?: string;
    data?: SigNozLogRowData;
}

export interface NormalizedLog {
    timestamp?: string;
    service?: string;
    severity?: string;
    message?: string;
    error_message?: string;
    error_name?: string;
    gateway?: string;
    db_host?: string;
    trace_id?: string;
    span_id?: string;
    transaction_id?: string;
}
