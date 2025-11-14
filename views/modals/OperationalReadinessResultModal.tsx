import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { useLlmService } from '../../hooks/useLlmService';
import { useInvoices } from '../../contexts/InvoiceContext';
import type { OperationalReadinessResult } from '../../types';
import { InvoiceStatus } from '../../types';

interface OperationalReadinessResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  definitionDocFile: File;
  journalDataFile: File;
}

const ResultCard: React.FC<{
  title: string;
  status: 'pass' | 'fail' | 'needs_improvement' | 'needs_investigation';
  summary: string;
  details: string[];
  detailTitle: string;
}> = ({ title, status, summary, details, detailTitle }) => {
  const statusConfig = {
    pass: { text: '問題なし', borderColor: 'border-green-500', bgColor: 'bg-green-50', badgeBg: 'bg-green-100', badgeText: 'text-green-800' },
    fail: { text: '問題あり', borderColor: 'border-red-500', bgColor: 'bg-red-50', badgeBg: 'bg-red-100', badgeText: 'text-red-800' },
    needs_improvement: { text: '要改善', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-50', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-800' },
    needs_investigation: { text: '要調査', borderColor: 'border-orange-500', bgColor: 'bg-orange-50', badgeBg: 'bg-orange-100', badgeText: 'text-orange-800' },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className={`border-l-4 ${currentStatus.borderColor} ${currentStatus.bgColor} p-4 rounded-r-lg`}>
      <div className="flex justify-between items-start">
        <h4 className="text-lg font-bold text-gray-800">{title}</h4>
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${currentStatus.badgeBg} ${currentStatus.badgeText}`}>
          {currentStatus.text}
        </span>
      </div>
      <p className="mt-2 text-gray-700">{summary}</p>
      {details.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h5 className="text-sm font-semibold text-gray-600 mb-2">{detailTitle}</h5>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
            {details.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


const OperationalReadinessResultModal: React.FC<OperationalReadinessResultModalProps> = ({ isOpen, onClose, definitionDocFile, journalDataFile }) => {
    const { invoices } = useInvoices();
    const { evaluateOperationalReadiness } = useLlmService();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<OperationalReadinessResult | null>(null);
    const [loadingStep, setLoadingStep] = useState(0);

    const loadingSteps = [
        "仕訳定義書を分析しています...",
        "申請データとアップロードされた仕訳データを突合しています...",
        "評価レポートを生成しています..."
    ];

    useEffect(() => {
        if (isOpen) {
            runEvaluation();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const runEvaluation = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setLoadingStep(0);

        try {
            const completedInvoices = invoices.filter(inv => inv.status === InvoiceStatus.Completed);
            if (completedInvoices.length === 0) {
              throw new Error("評価対象となる完了済みの請求書がシステムにありません。");
            }
            
            // Step 1
            setLoadingStep(1);
            await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

            // Step 2
            setLoadingStep(2);
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

            // Step 3
            setLoadingStep(3);

            const evaluationResult = await evaluateOperationalReadiness(definitionDocFile, journalDataFile, completedInvoices);
            setResult(evaluationResult);
        } catch (e) {
            setError(e instanceof Error ? e.message : "不明なエラーが発生しました。");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        if (isLoading) return;
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="整備状況評価 結果">
            {isLoading && (
                <div className="p-8 space-y-6">
                    <h3 className="text-xl font-bold text-center text-gray-800">AIが評価を実行中...</h3>
                    <div className="space-y-4">
                        {loadingSteps.map((step, index) => {
                            const stepNumber = index + 1;
                            const isCompleted = loadingStep > stepNumber;
                            const isActive = loadingStep === stepNumber;

                            return (
                                <div key={index} className="flex items-center gap-4 transition-opacity duration-500" style={{ opacity: loadingStep >= stepNumber ? 1 : 0.4 }}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${isCompleted ? 'bg-green-500' : isActive ? 'bg-indigo-500 animate-pulse' : 'bg-gray-400'}`}>
                                        {isCompleted ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <span>{stepNumber}</span>
                                        )}
                                    </div>
                                    <p className={`text-gray-700 ${isActive ? 'font-semibold' : ''}`}>{step}</p>
                                    {isActive && (
                                         <svg className="animate-spin h-5 w-5 text-indigo-500 ml-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                     <p className="text-sm text-gray-500 text-center pt-4">ドキュメントとデータを分析しています。少々お待ちください。</p>
                </div>
            )}
            
            {error && (
                <div className="text-center p-8 bg-red-50 rounded-lg">
                    <h3 className="text-xl font-bold text-red-800">エラーが発生しました</h3>
                    <p className="mt-2 text-red-700">{error}</p>
                </div>
            )}
            
            {result && (
                <div className="space-y-6">
                    <ResultCard
                        title="仕訳定義書 評価"
                        status={result.designEvaluation.status}
                        summary={result.designEvaluation.summary}
                        details={result.designEvaluation.details}
                        detailTitle="主な所見"
                    />
                    <ResultCard
                        title="データ整合性 評価"
                        status={result.dataCompliance.status}
                        summary={result.dataCompliance.summary}
                        details={result.dataCompliance.discrepancies}
                        detailTitle="主な不一致点"
                    />
                </div>
            )}

            <div className="mt-6 flex justify-end">
                <button onClick={handleClose} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400" disabled={isLoading}>閉じる</button>
            </div>
        </Modal>
    );
};

export default OperationalReadinessResultModal;
