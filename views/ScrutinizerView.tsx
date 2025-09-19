import React, { useState } from 'react';
import { useInvoices } from '../contexts/InvoiceContext';
import InvoiceList from '../components/InvoiceList';
import type { Invoice } from '../types';
import { InvoiceStatus } from '../types';
import InvoiceDetailModal from './modals/InvoiceDetailModal';
import ViewHeader from '../components/ViewHeader';

const ScrutinizerView: React.FC = () => {
  const { invoices } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const forScrutinyInvoices = invoices.filter(
    inv => inv.status === InvoiceStatus.PendingScrutiny
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
        title="購買カテゴリ精査"
        description="AIが自動導出した購買カテゴリを確認し、必要に応じて修正してください。"
      />
      <div>
        <InvoiceList
          invoices={forScrutinyInvoices}
          onSelectInvoice={handleSelectInvoice}
          title="精査待ちの申請"
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

export default ScrutinizerView;
