import React, { useState } from 'react';
import { useInvoices } from '../contexts/InvoiceContext';
import InvoiceList from '../components/InvoiceList';
import type { Invoice } from '../types';
import Dashboard from '../components/Dashboard';
import InvoiceDetailModal from './modals/InvoiceDetailModal';
import ViewHeader from '../components/ViewHeader';

const PmoView: React.FC = () => {
  const { invoices } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleCloseModal = () => {
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-8">
      <ViewHeader
        title="PMOダッシュボード"
        description="請求書処理の全体的な状況とAIのパフォーマンスを監視します。"
      />
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
