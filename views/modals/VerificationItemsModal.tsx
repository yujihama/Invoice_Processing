import React, { useState } from 'react';
import Modal from '../../components/Modal';
import type { ExternalVerificationItem } from '../../types';

interface VerificationItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems: ExternalVerificationItem[];
  onSave: (items: ExternalVerificationItem[]) => void;
}

const VerificationItemsModal: React.FC<VerificationItemsModalProps> = ({ isOpen, onClose, initialItems, onSave }) => {
    const [items, setItems] = useState<ExternalVerificationItem[]>(initialItems);
    const [newItemId, setNewItemId] = useState('');
    const [newItemLabel, setNewItemLabel] = useState('');

    const handleAddItem = () => {
        if (newItemId && newItemLabel && !items.some(item => item.id === newItemId)) {
            setItems(prev => [...prev, { id: newItemId, label: newItemLabel }]);
            setNewItemId('');
            setNewItemLabel('');
        }
    };

    const handleRemoveItem = (idToRemove: string) => {
        setItems(prev => prev.filter(item => item.id !== idToRemove));
    };

    const handleSave = () => {
        onSave(items);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="検証項目の設定">
            <div className="space-y-4">
                <p className="text-sm text-gray-600">AIに照合させる項目を管理します。項目IDはCSVファイルのヘッダー名と一致させる必要があります。</p>
                <div className="border rounded-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                        {items.length > 0 ? items.map(item => (
                            <li key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                                    <p className="text-xs text-gray-500 font-mono">{item.id}</p>
                                </div>
                                <button
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="text-gray-400 hover:text-red-600 p-1 rounded-full transition-colors"
                                    aria-label={`Remove ${item.label}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </li>
                        )) : (
                            <li className="px-4 py-10 text-center text-sm text-gray-500">
                                検証項目がありません。
                            </li>
                        )}
                    </ul>
                    <form onSubmit={e => { e.preventDefault(); handleAddItem(); }} className="bg-gray-50 p-4 flex items-end gap-3 border-t">
                        <div className="flex-grow">
                            <label htmlFor="modalNewItemId" className="block text-xs font-medium text-gray-700">項目ID (CSVヘッダー)</label>
                            <input id="modalNewItemId" type="text" value={newItemId} onChange={e => setNewItemId(e.target.value)} placeholder="例: productCode" className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div className="flex-grow">
                            <label htmlFor="modalNewItemLabel" className="block text-xs font-medium text-gray-700">表示名</label>
                            <input id="modalNewItemLabel" type="text" value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)} placeholder="例: 商品コード" className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors" disabled={!newItemId || !newItemLabel || items.some(i => i.id === newItemId)}>追加</button>
                    </form>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        キャンセル
                    </button>
                    <button onClick={handleSave} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        保存して閉じる
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default VerificationItemsModal;