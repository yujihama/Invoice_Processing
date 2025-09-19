
import React from 'react';
import type { Invoice } from '../types';
import StatusBadge from './StatusBadge';

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  title: string;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onSelectInvoice, title }) => {
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請者</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ベンダー</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">発行日</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">詳細</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.length > 0 ? invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.applicant.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.vendor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(invoice.amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.issueDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => onSelectInvoice(invoice)} className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200">
                    詳細
                  </button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                        対象の請求書はありません。
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceList;
