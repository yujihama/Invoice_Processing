import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useInvoices } from '../contexts/InvoiceContext';
import InvoiceList from '../components/InvoiceList';
import type { Invoice } from '../types';
import { InvoiceStatus } from '../types';
import InvoiceDetailModal from './modals/InvoiceDetailModal';
import NewInvoiceModal from './modals/NewInvoiceModal';
import ViewHeader from '../components/ViewHeader';

const ApplicantView: React.FC = () => {
  const { currentUser } = useAuth();
  const { invoices } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  
  const applicantInvoices = invoices.filter(inv => inv.applicant.id === currentUser?.id);

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleCloseModal = () => {
    setSelectedInvoice(null);
  };

  const handleOpenNewInvoiceModal = () => {
    setIsNewInvoiceModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="マイ申請一覧"
        description="自分の申請履歴の確認や、新しい請求書の申請を行います。"
      >
        <button
          onClick={handleOpenNewInvoiceModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          新規申請
        </button>
      </ViewHeader>
      <InvoiceList invoices={applicantInvoices} onSelectInvoice={handleSelectInvoice} title="自分の申請" />
      
      {selectedInvoice && (
        <InvoiceDetailModal 
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={handleCloseModal}
        />
      )}

      <NewInvoiceModal 
        isOpen={isNewInvoiceModalOpen}
        onClose={() => setIsNewInvoiceModalOpen(false)}
      />
    </div>
  );
};

export default ApplicantView;
