
import React, { useState, useEffect } from 'react';
import type { Invoice } from '../../types';
import { InvoiceStatus, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useInvoices } from '../../contexts/InvoiceContext';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { MOCK_PURCHASING_CATEGORIES } from '../../mockData';
import { useLlmService } from '../../hooks/useLlmService';


const InvoiceField: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-base text-gray-900">{value}</dd>
    </div>
);

interface InvoiceDetailModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ invoice, isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const { updateInvoice } = useInvoices();
    const { verifyInvoiceData, suggestPurchasingCategory } = useLlmService();
    const [rejectionComment, setRejectionComment] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [editableCategory, setEditableCategory] = useState(invoice.purchasingCategory || '');

    useEffect(() => {
        setEditableCategory(invoice.purchasingCategory || '');
    }, [invoice.purchasingCategory]);


    const handleManagerApprove = async () => {
        if (!currentUser) return;
        setIsProcessing(true);
        
        updateInvoice(invoice.id, { status: InvoiceStatus.PendingVerification }, currentUser, '承認');

        const verificationResult = await verifyInvoiceData(invoice);
        if (verificationResult.match) {
            
            // Suggest category
            const suggestedCategory = await suggestPurchasingCategory(invoice, MOCK_PURCHASING_CATEGORIES);
            updateInvoice(invoice.id, { 
                status: InvoiceStatus.PendingScrutiny,
                purchasingCategory: suggestedCategory,
             }, { id: 'system', name: 'LLM照合', role: UserRole.Admin }, verificationResult.reason);
        } else {
            updateInvoice(invoice.id, { status: InvoiceStatus.MismatchDetected }, { id: 'system', name: 'LLM照合', role: UserRole.Admin }, verificationResult.reason);
        }
        setIsProcessing(false);
        onClose();
    };

    const handleManagerReject = () => {
        if (!currentUser || !rejectionComment) return;
        updateInvoice(invoice.id, { status: InvoiceStatus.ManagerRejected }, currentUser, rejectionComment);
        onClose();
    };

    const handleAccountingApprove = async () => {
        if (!currentUser) return;
        setIsProcessing(true);
        const suggestedCategory = await suggestPurchasingCategory(invoice, MOCK_PURCHASING_CATEGORIES);
        updateInvoice(invoice.id, { 
            status: InvoiceStatus.PendingScrutiny,
            purchasingCategory: suggestedCategory
        }, currentUser, '経理確認完了');
        setIsProcessing(false);
        onClose();
    };

    const handleAccountingReject = () => {
        if (!currentUser || !rejectionComment) return;
        updateInvoice(invoice.id, { status: InvoiceStatus.AccountingRejected }, currentUser, rejectionComment);
        onClose();
    };
    
    const handleScrutinizerFinalize = () => {
        if (!currentUser) return;
        const isCorrected = invoice.purchasingCategory !== editableCategory;
        updateInvoice(invoice.id, { 
            status: InvoiceStatus.Completed,
            purchasingCategory: editableCategory,
            isCorrectedByScrutinizer: isCorrected
        }, currentUser, isCorrected ? 'カテゴリを修正して完了' : '確認完了');
        onClose();
    };
    

    const renderActions = () => {
        if (!currentUser) return null;

        switch (currentUser.role) {
            case UserRole.Manager:
                if (invoice.status === InvoiceStatus.PendingManagerApproval) {
                    return (
                        <div className="mt-6">
                            <textarea
                                value={rejectionComment}
                                onChange={(e) => setRejectionComment(e.target.value)}
                                placeholder="差し戻し理由（任意）"
                                className="w-full p-2 border rounded-md mb-2"
                                rows={2}
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={handleManagerReject} disabled={isProcessing} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400">差し戻し</button>
                                <button onClick={handleManagerApprove} disabled={isProcessing} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400">
                                    {isProcessing ? '処理中...' : '承認'}
                                </button>
                            </div>
                        </div>
                    );
                }
                break;
            case UserRole.Accounting:
                 if (invoice.status === InvoiceStatus.MismatchDetected) {
                     return (
                        <div className="mt-6">
                            <textarea
                                value={rejectionComment}
                                onChange={(e) => setRejectionComment(e.target.value)}
                                placeholder="差し戻し理由（必須）"
                                className="w-full p-2 border rounded-md mb-2"
                                rows={2}
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={handleAccountingReject} disabled={!rejectionComment || isProcessing} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400">申請者へ差し戻し</button>
                                <button onClick={handleAccountingApprove} disabled={isProcessing} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400">
                                     {isProcessing ? '処理中...' : '承認して精査へ'}
                                </button>
                            </div>
                        </div>
                     );
                 }
                 break;
            case UserRole.Scrutinizer:
                if (invoice.status === InvoiceStatus.PendingScrutiny) {
                    return (
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleScrutinizerFinalize} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">最終承認</button>
                        </div>
                    );
                }
                break;
            default:
                return null;
        }
    };
    
    const isScrutinizerEditing = currentUser?.role === UserRole.Scrutinizer && invoice.status === InvoiceStatus.PendingScrutiny;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`請求書詳細: ${invoice.invoiceNumber}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">申請内容</h4>
                    <dl className="space-y-4">
                        <InvoiceField label="ステータス" value={<StatusBadge status={invoice.status} />} />
                        <InvoiceField label="申請者" value={invoice.applicant.name} />
                        <InvoiceField label="ベンダー名" value={invoice.vendor} />
                        <InvoiceField label="発行日" value={invoice.issueDate} />
                        <InvoiceField label="金額" value={new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(invoice.amount)} />
                        <InvoiceField label="勘定科目" value={invoice.accountTitle} />
                        <InvoiceField 
                            label="購買カテゴリ" 
                            value={
                                isScrutinizerEditing ? (
                                    <select value={editableCategory} onChange={e => setEditableCategory(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500">
                                        {MOCK_PURCHASING_CATEGORIES.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                    </select>
                                ) : (
                                    invoice.purchasingCategory || '未設定'
                                )
                            } 
                        />
                    </dl>
                    {renderActions()}
                </div>
                <div>
                     <h4 className="text-lg font-semibold text-gray-800 mb-4">請求書画像</h4>
                     <div className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden">
                        <img src={invoice.imageUrl} alt="Invoice" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
            <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">処理履歴</h4>
                <ul className="space-y-3">
                    {invoice.history.slice().reverse().map((h, i) => (
                        <li key={i} className="p-3 bg-gray-50 rounded-md border">
                            <div className="flex justify-between items-center">
                                <div>
                                    <StatusBadge status={h.status} />
                                    <p className="text-sm text-gray-700 mt-1">担当者: {h.user.name} ({h.user.role})</p>
                                </div>
                                <p className="text-xs text-gray-500">{new Date(h.timestamp).toLocaleString('ja-JP')}</p>
                            </div>
                            {h.comment && <p className="text-sm mt-2 pt-2 border-t text-gray-600 italic">コメント: {h.comment}</p>}
                        </li>
                    ))}
                </ul>
            </div>
        </Modal>
    );
};

export default InvoiceDetailModal;
