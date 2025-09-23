import type { Invoice } from '../types';

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

export const exportInvoicesToCSV = (invoices: Invoice[]) => {
    const headers = [
        'ID',
        '申請者',
        '申請者ロール',
        '請求書番号',
        'ベンダー',
        '金額',
        '発行日',
        '勘定科目',
        '購買カテゴリ',
        'ステータス',
        '最終更新日時',
        '精査担当による修正'
    ];

    const csvRows = invoices.map(invoice => {
        const lastHistory = invoice.history.length > 0 ? invoice.history[invoice.history.length - 1] : null;
        const row = [
            invoice.id,
            invoice.applicant.name,
            invoice.applicant.role,
            invoice.invoiceNumber,
            invoice.vendor,
            invoice.amount,
            invoice.issueDate,
            invoice.accountTitle,
            invoice.purchasingCategory || '',
            invoice.status,
            lastHistory ? new Date(lastHistory.timestamp).toLocaleString('ja-JP') : '',
            invoice.isCorrectedByScrutinizer ? 'はい' : 'いいえ'
        ];
        return row.map(escapeCSV).join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        const today = new Date();
        const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
        link.setAttribute('href', url);
        link.setAttribute('download', `invoice-history-${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
