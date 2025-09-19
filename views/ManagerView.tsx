import React, { useState } from 'react';
import { useInvoices } from '../contexts/InvoiceContext';
import InvoiceList from '../components/InvoiceList';
import type { Invoice } from '../types';
import { InvoiceStatus } from '../types';
import InvoiceDetailModal from './modals/InvoiceDetailModal';
import ViewHeader from '../components/ViewHeader';

const ManagerView: React.FC = () => {
  const { invoices } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const pendingApprovalInvoices = invoices.filter(
    inv => inv.status === InvoiceStatus.PendingManagerApproval
  );
  
  const otherInvoices = invoices.filter(
    inv => inv.status !== InvoiceStatus.PendingManagerApproval
  );

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };
  
  const handleCloseModal = () => {
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-8">
      <ViewHeader
        title="承認ワークフロー"
        description="部下から申請された請求書を確認し、承認または差し戻しを行います。"
      />
      <div>
        <InvoiceList
          invoices={pendingApprovalInvoices}
          onSelectInvoice={handleSelectInvoice}
          title="承認待ちの申請"
        />
      </div>
      <div>
         <InvoiceList
          invoices={otherInvoices}
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

export default ManagerView;
