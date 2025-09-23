import React, { createContext, useState, useContext, useCallback } from 'react';
// FIX: 'InvoiceStatus' cannot be used as a value because it was imported using 'import type'.
import type { Invoice, User, AuditResult } from '../types';
import { UserRole, InvoiceStatus } from '../types';
import { MOCK_INVOICES, MOCK_USERS } from '../mockData';

interface InvoiceContextType {
  invoices: Invoice[];
  getInvoice: (id: string) => Invoice | undefined;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'history' | 'auditHistory'>) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>, user: User, comment?: string) => void;
  getCorrectionsData: () => { date: string, corrections: number }[];
  addAuditResult: (invoiceId: string, result: AuditResult) => void;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);

  const getInvoice = useCallback((id: string) => invoices.find(inv => inv.id === id), [invoices]);

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'history' | 'auditHistory'>) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      history: [{
        status: invoiceData.status,
        user: invoiceData.applicant,
        timestamp: new Date().toISOString(),
      }],
      auditHistory: [],
    };
    setInvoices(prev => [newInvoice, ...prev]);
  };
  
  const updateInvoice = (id: string, updates: Partial<Invoice>, user: User, comment?: string) => {
    setInvoices(prev => 
      prev.map(inv => {
        if (inv.id === id) {
          const newHistoryEntry = {
            status: updates.status || inv.status,
            user: user,
            timestamp: new Date().toISOString(),
            comment: comment
          };
          return { ...inv, ...updates, history: [...inv.history, newHistoryEntry] };
        }
        return inv;
      })
    );
  };

  const getCorrectionsData = () => {
    const correctionsByDate: Record<string, number> = {};
    invoices
      .filter(inv => inv.status === InvoiceStatus.Completed && inv.isCorrectedByScrutinizer)
      .forEach(inv => {
        const completedEntry = inv.history.find(h => h.status === InvoiceStatus.Completed);
        if (completedEntry) {
          const date = new Date(completedEntry.timestamp).toISOString().split('T')[0];
          correctionsByDate[date] = (correctionsByDate[date] || 0) + 1;
        }
      });
    return Object.entries(correctionsByDate).map(([date, corrections]) => ({ date, corrections }));
  };

  const addAuditResult = (invoiceId: string, result: AuditResult) => {
    setInvoices(prev => 
      prev.map(inv => {
        if (inv.id === invoiceId) {
          // Avoid adding duplicate results for the same scenario
          const alreadyExists = inv.auditHistory.some(h => h.scenarioId === result.scenarioId);
          if (alreadyExists) {
            // If it exists, update it
            return {
              ...inv,
              auditHistory: inv.auditHistory.map(h => h.scenarioId === result.scenarioId ? result : h)
            };
          }
          return { ...inv, auditHistory: [...inv.auditHistory, result] };
        }
        return inv;
      })
    );
  };

  return (
    <InvoiceContext.Provider value={{ invoices, getInvoice, addInvoice, updateInvoice, getCorrectionsData, addAuditResult }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
};