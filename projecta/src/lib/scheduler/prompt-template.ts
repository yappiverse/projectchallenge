const WIB_TIME_ZONE = "Asia/Jakarta";

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

export interface ScheduleReportTemplateOptions {
    start: number;
    end: number;
    generatedAt?: number;
    scheduleName?: string;
    scheduleId?: string;
    labels?: Record<string, string | undefined>;
    serviceName?: string;
}

export function buildScheduleReportTemplate(options: ScheduleReportTemplateOptions): string {
    const { start, end } = options;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
        throw new Error("Invalid schedule range for prompt template");
    }

    const generatedAt = options.generatedAt ?? Date.now();
    const periodLabel = formatPeriodLabel(start, end);
    const generatedAtLabel = formatWibDate(generatedAt);
    const startLabel = formatWibDate(start);
    const endLabel = formatWibDate(end);
    const durationMinutes = Math.max(1, Math.round((end - start) / 60000));
    const explicitService = typeof options.serviceName === "string" ? options.serviceName.trim() : undefined;
    const scheduleName = options.scheduleName ?? options.labels?.alertname ?? "Penjadwalan Otomatis";
    const serviceName = explicitService && explicitService.length > 0 ? explicitService : deriveServiceName(options.labels) ?? "N/A";
    const scheduleIdLine = options.scheduleId ? `- Schedule ID: ${options.scheduleId}` : "";

    const contextBlock = [
        "Konteks eksekusi jadwal:",
        `- Nama Jadwal: ${scheduleName}`,
        scheduleIdLine,
        `- Periode Deskriptif: ${periodLabel}`,
        `- Rentang Waktu (WIB): ${startLabel} — ${endLabel}`,
        `- Durasi (menit): ${durationMinutes}`,
        `- Dijalankan Pada: ${generatedAtLabel}`,
        `- Service Utama: ${serviceName}`,
    ]
        .filter(Boolean)
        .join("\n");

    return `
${contextBlock}

Gunakan data di atas dan log terlampir untuk membuat laporan monitoring terjadwal dalam bahasa Indonesia formal. Gunakan angka aktual bila tersedia dan tulis "N/A" apabila informasi tidak ditemukan. Ikuti format berikut dan isi setiap bagian setelah label-nya:

🚨 Scheduling Report 🚨

🕒 Periode: ${periodLabel}
🗓 Generated At: ${generatedAtLabel}
🔧 Service Name: ${serviceName}

📊 Ringkasan Log:
{Ringkas jumlah log, distribusi error/warning/info, serta catat lonjakan atau pola berulang dalam maksimal dua kalimat.}

🧠 Hasil Analisis:
{Jelaskan kondisi layanan, penyebab error atau warning, dan apakah ada dampak ke pengguna.}

🔥 Impact Level:
{Gunakan emoji indikator (🟢/🟡/🟠/🔴), tulis level (Informational/Warning/Major/Critical), lalu jelaskan dampaknya.}

✅ Action Items:
1. {Aksi lanjutan 1}
2. {Aksi lanjutan 2}
3. {Aksi lanjutan 3}
...
n. {Aksi lanjutan n}

🔍 Trace ID: {Trace ID paling relevan dari log atau tulis N/A}

Kembalikan hanya teks laporan dengan placeholder yang sudah diganti.`.trim();
}

function formatPeriodLabel(start: number, end: number): string {
    const diffMs = end - start;
    const minuteMs = 60 * 1000;
    const hourMs = minuteMs * 60;
    const dayMs = hourMs * 24;
    const monthMs = dayMs * 30;

    if (diffMs < hourMs) {
        const minutes = Math.max(1, Math.round(diffMs / minuteMs));
        return `${minutes} Menit Terakhir`;
    }
    if (diffMs < dayMs) {
        const hours = Math.max(1, Math.round(diffMs / hourMs));
        return `${hours} Jam Terakhir`;
    }
    if (diffMs < monthMs) {
        const days = Math.max(1, Math.round(diffMs / dayMs));
        return `${days} Hari Terakhir`;
    }
    const months = Math.max(1, Math.round(diffMs / monthMs));
    return `${months} Bulan Terakhir`;
}

function formatWibDate(timestamp: number): string {
    const parts = dateTimeFormatter.formatToParts(new Date(timestamp));
    const getValue = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
    const day = getValue("day");
    const month = getValue("month");
    const year = getValue("year");
    const hour = getValue("hour");
    const minute = getValue("minute");
    return `${day} ${month} ${year}, ${hour}:${minute} WIB`;
}

function deriveServiceName(labels?: Record<string, string | undefined>): string | undefined {
    if (!labels) return undefined;
    return (
        labels["service.name"] ||
        labels["service"] ||
        labels["serviceName"] ||
        labels["k8s.service.name"] ||
        labels["deployment"] ||
        labels["app"]
    );
}
