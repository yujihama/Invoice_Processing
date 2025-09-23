
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useInvoices } from '../../contexts/InvoiceContext';
import { InvoiceStatus } from '../../types';
import type { Invoice } from '../../types';
import Modal from '../../components/Modal';
import { useLlmService } from '../../hooks/useLlmService';
import { MOCK_ACCOUNT_TITLES } from '../../mockData';

const NewInvoiceModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const { addInvoice } = useInvoices();
    const { extractInvoiceData } = useLlmService();
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [extractedData, setExtractedData] = useState<Partial<Invoice> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setFile(null);
        setIsLoading(false);
        setExtractedData(null);
        setError(null);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (['image/jpeg', 'image/png', 'application/pdf'].includes(selectedFile.type)) {
                setFile(selectedFile);
                setError(null);
                handleExtract(selectedFile);
            } else {
                setError("対応していないファイル形式です。(JPG, PNG, PDFのみ)");
            }
        }
    };

    const handleExtract = async (selectedFile: File) => {
        setIsLoading(true);
        setExtractedData(null);
        try {
            const data = await extractInvoiceData(selectedFile, MOCK_ACCOUNT_TITLES);
            setExtractedData(data);
        } catch (e) {
            setError("データの抽出に失敗しました。");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof Invoice, value: string | number) => {
        if (extractedData) {
            setExtractedData({ ...extractedData, [field]: value });
        }
    };
    
    const handleSubmit = () => {
        if (!extractedData || !currentUser) return;
        
        const newInvoice: Omit<Invoice, 'id' | 'history'> = {
            applicant: currentUser,
            invoiceNumber: extractedData.invoiceNumber || '',
            vendor: extractedData.vendor || '',
            amount: Number(extractedData.amount) || 0,
            issueDate: extractedData.issueDate || '',
            accountTitle: extractedData.accountTitle || '',
            status: InvoiceStatus.PendingManagerApproval,
            imageUrl: extractedData.imageUrl || '',
        };

        addInvoice(newInvoice);
        handleClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="新規請求書申請">
            {!extractedData && (
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-4 text-lg text-gray-700">AIが請求書を読み取っています...</p>
                                <p className="text-sm text-gray-500">しばらくお待ちください</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                </svg>
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">クリックしてアップロード</span>またはドラッグ＆ドロップ</p>
                                <p className="text-xs text-gray-500">PDF, PNG, JPG</p>
                            </div>
                        )}
                        <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/jpeg,image/png,application/pdf" />
                    </label>
                </div> 
            )}

            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            
            {extractedData && (
                 <div className="space-y-4">
                     <p className="text-sm text-green-700 bg-green-100 p-3 rounded-md">AIによる読み取りが完了しました。内容を確認・修正して申請してください。</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        {/* Left side: Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ベンダー名</label>
                                <input type="text" value={extractedData.vendor || ''} onChange={e => handleInputChange('vendor', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">請求書番号</label>
                                <input type="text" value={extractedData.invoiceNumber || ''} onChange={e => handleInputChange('invoiceNumber', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">金額</label>
                                <input type="number" value={extractedData.amount || ''} onChange={e => handleInputChange('amount', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">発行日</label>
                                <input type="date" value={extractedData.issueDate || ''} onChange={e => handleInputChange('issueDate', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">勘定科目 (AI推奨)</label>
                                <select value={extractedData.accountTitle || ''} onChange={e => handleInputChange('accountTitle', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
                                    {MOCK_ACCOUNT_TITLES.map(title => <option key={title.id} value={title.name}>{title.name}</option>)}
                                </select>
                            </div>
                        </div>
                         {/* Right side: Image Preview */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">アップロード画像</label>
                            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border">
                                {extractedData.imageUrl ? (
                                    <img src={extractedData.imageUrl} alt="Invoice Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        プレビューなし
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>
                     <div className="flex justify-end pt-4 mt-4 border-t">
                        <button type="button" onClick={handleClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            キャンセル
                        </button>
                        <button onClick={handleSubmit} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            申請する
                        </button>
                    </div>
                 </div>
            )}
        </Modal>
    );
};

export default NewInvoiceModal;
