import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useInvoices } from '../../contexts/InvoiceContext';
import { useLlmService } from '../../hooks/useLlmService';
import { useSettings } from '../../contexts/SettingsContext';
import type { Invoice, AuditScenario, AuditResult } from '../../types';
import { InvoiceStatus } from '../../types';

interface AuditResultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuditResultModal: React.FC<AuditResultModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { invoices, addAuditResult } = useInvoices();
  const { auditScenarios } = useSettings();
  const { performBulkAuditCheckForInvoice } = useLlmService();
  
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditFindings, setAuditFindings] = useState<Array<{ invoice: Invoice; result: AuditResult }>>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [message, setMessage] = useState('');

  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const invoicesToAudit = useMemo(() => {
    if (!isOpen) return [];
    
    const allCompletedInvoices = invoices.filter(inv => inv.status === InvoiceStatus.Completed);
    const allScenarioIds = new Set(auditScenarios.map(s => s.id));
    if (allScenarioIds.size === 0) return [];
    
    return allCompletedInvoices.filter(invoice => {
        const auditedScenarioIds = new Set(invoice.auditHistory.map(h => h.scenarioId));
        return auditedScenarioIds.size < allScenarioIds.size;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, invoices, auditScenarios]);


  useEffect(() => {
    if (isOpen) {
      runAudit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, invoicesToAudit]);

  const runAudit = async () => {
    if (!currentUser) return;

    setIsAuditing(true);
    setAuditFindings([]);
    setCompletedTasks(0);
    setTotalTasks(invoicesToAudit.length);
    setMessage('');
    
    if (invoicesToAudit.length === 0) {
      setIsAuditing(false);
      setMessage('監査対象となる新しい請求書はありませんでした。');
      return;
    }

    const findings: Array<{ invoice: Invoice; result: AuditResult }> = [];
    
    for (const invoice of invoicesToAudit) {
      const auditedScenarioIds = new Set(invoice.auditHistory.map(h => h.scenarioId));
      const scenariosToRunForThisInvoice = auditScenarios.filter(s => !auditedScenarioIds.has(s.id));

      if (scenariosToRunForThisInvoice.length === 0) {
          setCompletedTasks(prev => prev + 1);
          continue;
      }
      
      const results = await performBulkAuditCheckForInvoice(
        invoice,
        scenariosToRunForThisInvoice,
        invoices,
      );
      
      const newFindingsForThisInvoice: Array<{ invoice: Invoice; result: AuditResult }> = [];

      for (const res of results) {
        const scenario = auditScenarios.find(s => s.id === res.scenarioId);
        if (!scenario) continue;

        const auditEntry: AuditResult = {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          checkedAt: new Date().toISOString(),
          checkedBy: currentUser,
          result: res.result,
          comment: res.comment,
        };
        
        addAuditResult(invoice.id, auditEntry);

        if (res.result === 'fail') {
          newFindingsForThisInvoice.push({ invoice, result: auditEntry });
        }
      }
      
      findings.push(...newFindingsForThisInvoice);
      setCompletedTasks(prev => prev + 1);
    }
    
    setAuditFindings(findings);
    setIsAuditing(false);
  };
  
  const handleClose = () => {
      if (isAuditing) return;
      onClose();
  };

  const findingsByInvoice = useMemo(() => {
    return auditFindings.reduce((acc, { invoice, result }) => {
        if (!acc[invoice.id]) {
            acc[invoice.id] = { invoice, findings: [] };
        }
        acc[invoice.id].findings.push(result);
        return acc;
    }, {} as Record<string, { invoice: Invoice; findings: AuditResult[] }>);
  }, [auditFindings]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="一括監査結果">
      {isAuditing && (
        <div className="text-center p-8">
            <p className="text-lg font-semibold text-gray-800 mb-4">
                AIによる監査を実行中... ({completedTasks} / {totalTasks})
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">請求書ごとに未監査のシナリオを一括で適用しています。</p>
        </div>
      )}

      {!isAuditing && (
        <div>
            {Object.keys(findingsByInvoice).length === 0 ? (
                <div className="text-center p-8 bg-green-50 rounded-lg">
                    <h3 className="text-xl font-bold text-green-800">
                      {message || '問題は見つかりませんでした'}
                    </h3>
                    <p className="mt-2 text-green-700">
                      {message ? '' : `対象となった${totalTasks}件の請求書はすべて監査基準を満たしていました。`}
                    </p>
                </div>
            ) : (
                <div>
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg mb-4">
                      <h3 className="text-lg font-bold text-red-800">{Object.keys(findingsByInvoice).length}件の請求書で、合計{auditFindings.length}件の指摘事項が見つかりました</h3>
                      <p className="text-red-700">以下の請求書について、監査シナリオに沿った確認が必要です。</p>
                    </div>
                    <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {Object.values(findingsByInvoice).map(({ invoice, findings }) => (
                           <li key={invoice.id} className="p-4 border rounded-lg shadow-sm bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-800">{invoice.vendor} / {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(invoice.amount)}</p>
                                        <p className="text-sm text-gray-500">請求書番号: {invoice.invoiceNumber} | 申請者: {invoice.applicant.name}</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t space-y-2">
                                    {findings.map(finding => (
                                        <div key={finding.scenarioId}>
                                            <p className="text-sm font-semibold text-red-700">
                                                指摘シナリオ: {finding.scenarioName}
                                            </p>
                                            <p className="text-sm text-gray-800 italic ml-4">"{finding.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                           </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">閉じる</button>
            </div>
        </div>
      )}
    </Modal>
  );
};

export default AuditResultModal;