import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/Modal';
import { useLlmService } from '../../hooks/useLlmService';
// FIX: The 'Invoice' type was used without being imported, causing a compilation error.
import type { InternalVerificationResult, Invoice } from '../../types';
import { exportInternalAuditResultsToCSV } from '../../utils/auditResultExporter';

interface IntegrityCheckResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoicesToAudit: Invoice[];
}

const IntegrityCheckResultModal: React.FC<IntegrityCheckResultModalProps> = ({ isOpen, onClose, invoicesToAudit }) => {
    const { verifyInvoiceData } = useLlmService();
    const [isChecking, setIsChecking] = useState(false);
    const [results, setResults] = useState<InternalVerificationResult[]>([]);
    const [completedChecks, setCompletedChecks] = useState(0);

    const totalChecks = useMemo(() => invoicesToAudit.length, [invoicesToAudit]);
    const progress = totalChecks > 0 ? (completedChecks / totalChecks) * 100 : 0;
    
    useEffect(() => {
        if (isOpen && totalChecks > 0) {
            runCheck();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, invoicesToAudit]);

    const runCheck = async () => {
        setIsChecking(true);
        setResults([]);
        setCompletedChecks(0);

        const allResults: InternalVerificationResult[] = [];
        for (const invoice of invoicesToAudit) {
            try {
                const result = await verifyInvoiceData(invoice);
                allResults.push({
                    invoice,
                    status: result.match ? 'pass' : 'fail',
                    reason: result.reason,
                });
            } catch (error) {
                console.error(`Error verifying invoice ${invoice.id}:`, error);
                const reason = error instanceof Error ? error.message : "Unknown verification error";
                allResults.push({
                    invoice,
                    status: 'fail',
                    reason: `AIによる検証中にエラー: ${reason}`,
                });
            }
            setCompletedChecks(prev => prev + 1);
        }
        
        setResults(allResults);
        setIsChecking(false);
    };

    const handleClose = () => {
        if (isChecking) return;
        onClose();
    };

    const handleDownload = () => {
        exportInternalAuditResultsToCSV(results);
    };
    
    const failedCount = results.filter(r => r.status === 'fail').length;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="データ整合性監査結果">
            {isChecking && (
                <div className="text-center p-8">
                    <p className="text-lg font-semibold text-gray-800 mb-4">
                        AIによる整合性チェックを実行中... ({completedChecks} / {totalChecks})
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">完了済みの請求書データと画像を照合しています。</p>
                </div>
            )}

            {!isChecking && results.length > 0 && (
                <div>
                    {failedCount === 0 ? (
                        <div className="text-center p-8 bg-green-50 rounded-lg">
                            <h3 className="text-xl font-bold text-green-800">問題は見つかりませんでした</h3>
                            <p className="mt-2 text-green-700">チェック対象となった{totalChecks}件の請求書はすべてデータと画像が一致していました。</p>
                        </div>
                    ) : (
                        <div>
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg mb-4">
                                <h3 className="text-lg font-bold text-red-800">{totalChecks}件中 {failedCount}件の請求書で不整合の可能性が検出されました</h3>
                                <p className="text-red-700">以下のリストで詳細を確認してください。</p>
                            </div>
                            <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {results.map(({ invoice, status, reason }) => (
                                   <li key={invoice.id} className={`p-4 border-l-4 rounded-r-lg shadow-sm ${status === 'pass' ? 'border-green-400 bg-white' : 'border-red-400 bg-red-50'}`}>
                                        <div className="flex items-center justify-between">
                                          <div>
                                              <p className="font-semibold text-gray-800">{invoice.vendor} / {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(invoice.amount)}</p>
                                              <p className="text-sm text-gray-500">請求書番号: {invoice.invoiceNumber} | 申請者: {invoice.applicant.name}</p>
                                          </div>
                                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                              {status === 'pass' ? '整合OK' : '不整合'}
                                           </span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-sm font-semibold text-gray-700">
                                                根拠:
                                            </p>
                                            <p className="text-sm text-gray-800 italic ml-4">"{reason}"</p>
                                        </div>
                                   </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="mt-6 flex justify-between items-center">
                        <button
                            onClick={handleDownload}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            結果をダウンロード
                        </button>
                        <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">閉じる</button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default IntegrityCheckResultModal;