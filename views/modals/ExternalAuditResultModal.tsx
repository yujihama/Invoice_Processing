import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/Modal';
import { useLlmService } from '../../hooks/useLlmService';
import type { ExternalVerificationResult, ExternalVerificationItem } from '../../types';
import { exportExternalAuditResultsToCSV } from '../../utils/auditResultExporter';

interface ExternalAuditResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceFiles: File[];
  dataFile: File;
  verificationItems: ExternalVerificationItem[];
}

const ExternalAuditResultModal: React.FC<ExternalAuditResultModalProps> = ({ isOpen, onClose, invoiceFiles, dataFile, verificationItems }) => {
    const { verifyExternalData, extractInvoiceNumberFromFile } = useLlmService();
    const [isAuditing, setIsAuditing] = useState(false);
    const [results, setResults] = useState<ExternalVerificationResult[]>([]);
    const [completedTasks, setCompletedTasks] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const totalTasks = useMemo(() => invoiceFiles.length, [invoiceFiles]);
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    useEffect(() => {
        if (isOpen && totalTasks > 0) {
            runAudit();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, invoiceFiles, dataFile]);

    const runAudit = async () => {
        if (!dataFile || invoiceFiles.length === 0) return;
        
        setIsAuditing(true);
        setResults([]);
        setCompletedTasks(0);
        setErrorMessage(null);

        let dataMap: Record<string, Record<string, string>>;
        try {
            const csvText = await dataFile.text();
            const rows = csvText.split('\n').map(r => r.trim()).filter(r => r);
            if (rows.length < 2) throw new Error("CSVファイルにヘッダーとデータ行が必要です。");
            
            const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const invoiceNumberIndex = headers.indexOf('invoiceNumber');
            if (invoiceNumberIndex === -1) throw new Error("CSVに 'invoiceNumber' ヘッダーが見つかりません。");

            dataMap = rows.slice(1).reduce((acc, row) => {
                const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
                const invoiceNumber = values[invoiceNumberIndex];
                if (invoiceNumber) {
                    acc[invoiceNumber] = headers.reduce((obj, header, i) => {
                        obj[header] = values[i];
                        return obj;
                    }, {} as Record<string, string>);
                }
                return acc;
            }, {} as Record<string, Record<string, string>>);
        } catch (e) {
            const error = e instanceof Error ? e.message : "不明なエラー";
            setErrorMessage(`CSVファイルのパースに失敗しました: ${error}`);
            setIsAuditing(false);
            return;
        }

        const allResults: ExternalVerificationResult[] = [];
        for (const file of invoiceFiles) {
            const extractedInvoiceNumber = await extractInvoiceNumberFromFile(file);

            if (!extractedInvoiceNumber) {
                allResults.push({
                    fileName: file.name,
                    status: 'fail',
                    reason: "AIが請求書から請求書番号を読み取れませんでした。"
                });
                setCompletedTasks(prev => prev + 1);
                continue;
            }

            const record = dataMap[extractedInvoiceNumber];

            if (!record) {
                allResults.push({ 
                    fileName: file.name,
                    status: 'fail',
                    reason: `CSV内に請求書番号「${extractedInvoiceNumber}」が見つかりませんでした。`,
                    csvData: { invoiceNumber: extractedInvoiceNumber }
                });
                setCompletedTasks(prev => prev + 1);
                continue;
            }

            try {
                const result = await verifyExternalData(file, record, verificationItems);
                allResults.push({
                    fileName: file.name,
                    status: result.match ? 'pass' : 'fail',
                    reason: result.reason,
                    csvData: record,
                });
            } catch (error) {
                const reason = error instanceof Error ? error.message : "Unknown verification error";
                allResults.push({ fileName: file.name, status: 'fail', reason: `AIによる検証中にエラー: ${reason}`, csvData: record });
            }
            setCompletedTasks(prev => prev + 1);
        }
        
        setResults(allResults);
        setIsAuditing(false);
    };

    const handleClose = () => {
        if (isAuditing) return;
        onClose();
    };
    
    const handleDownload = () => {
        exportExternalAuditResultsToCSV(results, verificationItems);
    };

    const renderContent = () => {
        if (isAuditing) {
            return (
                <div className="text-center p-8">
                    <p className="text-lg font-semibold text-gray-800 mb-4">
                        AIによる整合性チェックを実行中... ({completedTasks} / {totalTasks})
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-cyan-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">アップロードされた請求書ファイルとCSVデータを照合しています。</p>
                </div>
            );
        }
        
        if (errorMessage) {
             return (
                 <div className="text-center p-8 bg-red-50 rounded-lg">
                    <h3 className="text-xl font-bold text-red-800">エラーが発生しました</h3>
                    <p className="mt-2 text-red-700">{errorMessage}</p>
                </div>
            );
        }
        
        const failedCount = results.filter(r => r.status === 'fail').length;

        if (results.length === 0 && !isAuditing) {
             return (
                 <div className="text-center p-8">
                    <p className="text-gray-600">監査対象のファイルがありません。</p>
                </div>
            );
        }

        return (
            <div>
                {failedCount === 0 ? (
                    <div className="text-center p-8 bg-green-50 rounded-lg">
                        <h3 className="text-xl font-bold text-green-800">問題は見つかりませんでした</h3>
                        <p className="mt-2 text-green-700">チェック対象となった{totalTasks}件の請求書はすべてデータと画像が一致していました。</p>
                    </div>
                ) : (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg mb-4">
                        <h3 className="text-lg font-bold text-red-800">{totalTasks}件中 {failedCount}件のファイルで不整合の可能性が検出されました</h3>
                        <p className="text-red-700">以下のリストで詳細を確認してください。</p>
                    </div>
                )}
                <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {results.map((result, index) => (
                       <li key={`${result.fileName}-${index}`} className={`p-4 border-l-4 rounded-r-lg shadow-sm ${result.status === 'pass' ? 'border-green-400 bg-white' : 'border-red-400 bg-red-50'}`}>
                            <div className="flex items-center justify-between">
                               <div>
                                   <p className="font-semibold text-gray-800">{result.fileName}</p>
                                   {result.csvData && (
                                       <p className="text-sm text-gray-500">
                                           CSVデータ: {result.csvData.vendor || 'N/A'} / {result.csvData.amount ? `${Number(result.csvData.amount).toLocaleString()}円` : 'N/A'}
                                       </p>
                                   )}
                               </div>
                               <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${result.status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {result.status === 'pass' ? '整合OK' : '不整合'}
                               </span>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                                <p className="text-sm font-semibold text-gray-700">根拠:</p>
                                <p className="text-sm text-gray-800 italic ml-4">"{result.reason}"</p>
                            </div>
                       </li>
                    ))}
                </ul>
            </div>
        );
    }


    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="外部データ監査結果">
            {renderContent()}
             {!isAuditing && (
                <div className="mt-6 flex justify-between items-center">
                    <button
                        onClick={handleDownload}
                        disabled={results.length === 0}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center disabled:bg-gray-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        結果をダウンロード
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">閉じる</button>
                </div>
            )}
        </Modal>
    );
};

export default ExternalAuditResultModal;