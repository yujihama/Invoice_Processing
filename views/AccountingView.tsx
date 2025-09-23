import React, { useState } from 'react';
import { useInvoices } from '../contexts/InvoiceContext';
import InvoiceList from '../components/InvoiceList';
import type { Invoice } from '../types';
import { InvoiceStatus } from '../types';
import InvoiceDetailModal from './modals/InvoiceDetailModal';
import ViewHeader from '../components/ViewHeader';
import { exportInvoicesToCSV } from '../utils/csvExporter';

const AccountingView: React.FC = () => {
  const { invoices } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const forReviewInvoices = invoices.filter(
    inv => inv.status === InvoiceStatus.MismatchDetected
  );
  
  const allInvoices = invoices;

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
        title="経理確認"
        description="LLMによる照合で不一致が検出された申請です。内容を確認し、承認または差し戻しを行ってください。"
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
      <div>
        <InvoiceList
          invoices={forReviewInvoices}
          onSelectInvoice={handleSelectInvoice}
          title="要確認の申請"
        />
      </div>
       <div>
         <InvoiceList
          invoices={allInvoices}
          onSelectInvoice={handleSelectInvoice}
          title="すべての申請"
        />
      </div>

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

export default AccountingView;