import React, { useState } from 'react';
import { useInvoices } from '../contexts/InvoiceContext';
import InvoiceList from '../components/InvoiceList';
import type { Invoice } from '../types';
import { InvoiceStatus } from '../types';
import InvoiceDetailModal from './modals/InvoiceDetailModal';
import ViewHeader from '../components/ViewHeader';

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

  return (
    <div className="space-y-8">
      <ViewHeader
        title="経理確認"
        description="LLMによる照合で不一致が検出された申請です。内容を確認し、承認または差し戻しを行ってください。"
      />
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
