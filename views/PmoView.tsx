import React, { useState } from 'react';
import { useInvoices } from '../contexts/InvoiceContext';
import InvoiceList from '../components/InvoiceList';
import type { Invoice } from '../types';
import Dashboard from '../components/Dashboard';
import InvoiceDetailModal from './modals/InvoiceDetailModal';
import ViewHeader from '../components/ViewHeader';
import { exportInvoicesToCSV } from '../utils/csvExporter';

const PmoView: React.FC = () => {
  const { invoices } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleCloseModal = () => {
    setSelectedInvoice(null);
  };
  
  const handleExport = () => {
    exportInvoicesToCSV(invoices);
  };

  return (
    <div className="space-y-8">
      <ViewHeader
        title="PMOダッシュボード"
        description="請求書処理の全体的な状況とAIのパフォーマンスを監視します。"
      >
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSVエクスポート
        </button>
      </ViewHeader>
      <Dashboard />
      <InvoiceList
        invoices={invoices}
        onSelectInvoice={handleSelectInvoice}
        title="全申請履歴"
      />

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default PmoView;