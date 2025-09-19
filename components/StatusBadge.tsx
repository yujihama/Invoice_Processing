
import React from 'react';
import { InvoiceStatus } from '../types';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

const statusColors: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Draft]: 'bg-gray-100 text-gray-800',
  [InvoiceStatus.PendingManagerApproval]: 'bg-blue-100 text-blue-800',
  [InvoiceStatus.ManagerRejected]: 'bg-red-100 text-red-800',
  [InvoiceStatus.PendingVerification]: 'bg-yellow-100 text-yellow-800',
  [InvoiceStatus.MismatchDetected]: 'bg-orange-100 text-orange-800',
  [InvoiceStatus.AccountingRejected]: 'bg-red-100 text-red-800',
  [InvoiceStatus.PendingScrutiny]: 'bg-purple-100 text-purple-800',
  [InvoiceStatus.Completed]: 'bg-green-100 text-green-800',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[status]}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
