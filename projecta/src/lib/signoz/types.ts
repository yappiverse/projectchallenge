export interface SigNozLogRow {
    timestamp?: string;
    body?: string;
    severity_text?: string;
    trace_id?: string;
    span_id?: string;
    data?: {
        attributes_string?: Record<string, string>;
    };
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
