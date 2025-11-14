import type { InternalVerificationResult, ExternalVerificationResult, ExternalVerificationItem } from '../types';

const escapeCSV = (field: any): string => {
    if (field === null || field === undefined) {
        return '';
    }
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

const triggerDownload = (blob: Blob, fileName: string) => {
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const exportInternalAuditResultsToCSV = (results: InternalVerificationResult[]) => {
    const headers = [
        '請求書番号',
        'ベンダー',
        '金額',
        '申請者',
        '検証結果',
        '根拠・コメント',
    ];

    const csvRows = results.map(result => {
        const { invoice, status, reason } = result;
        const row = [
            invoice.invoiceNumber,
            invoice.vendor,
            invoice.amount,
            invoice.applicant.name,
            status === 'pass' ? '整合OK' : '不整合あり',
            reason,
        ];
        return row.map(escapeCSV).join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const today = new Date();
    const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    triggerDownload(blob, `internal-audit-results-${dateStr}.csv`);
};


export const exportExternalAuditResultsToCSV = (results: ExternalVerificationResult[], verificationItems: ExternalVerificationItem[]) => {
    const baseHeaders = ['ファイル名', '検証結果', '根拠・コメント'];
    const dynamicHeaders = verificationItems.map(item => `${item.label} (CSV)`);
    const headers = [...baseHeaders, ...dynamicHeaders];

    const csvRows = results.map(result => {
        const baseRow = [
            result.fileName,
            result.status === 'pass' ? '整合OK' : '不整合あり',
            result.reason,
        ];
        const dynamicRow = verificationItems.map(item => result.csvData?.[item.id] || '');
        const row = [...baseRow, ...dynamicRow];
        return row.map(escapeCSV).join(',');
    });
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

    const today = new Date();
    const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    triggerDownload(blob, `external-audit-results-${dateStr}.csv`);
};