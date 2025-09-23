
import React from 'react';
import type { Invoice } from '../types';
import StatusBadge from './StatusBadge';

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  title: string;
  showAuditStatus?: boolean;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onSelectInvoice, title, showAuditStatus = false }) => {
  const colSpan = showAuditStatus ? 7 : 6;
  
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
              {showAuditStatus && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  監査ステータス
                </th>
              )}
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
                {showAuditStatus && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(() => {
                      const failedAudits = invoice.auditHistory.filter(h => h.result === 'fail');
                      if (failedAudits.length > 0) {
                        return (
                          <div className="relative group flex items-center cursor-pointer">
                            <span className="flex items-center px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                              指摘あり ({failedAudits.length})
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 shadow-lg">
                              <ul className="list-disc list-inside space-y-1">
                                {failedAudits.map(audit => (
                                  <li key={audit.scenarioId}>{audit.scenarioName}</li>
                                ))}
                              </ul>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                            </div>
                          </div>
                        );
                      }
                      
                      const passedAudits = invoice.auditHistory.length > 0;
                      if (passedAudits) {
                        return (
                          <span className="flex items-center px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            監査OK
                          </span>
                        );
                      }
                      
                      return <span className="text-gray-500 text-xs">未監査</span>;
                    })()}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.issueDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => onSelectInvoice(invoice)} className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200">
                    詳細
                  </button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={colSpan} className="text-center py-10 text-gray-500">
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