import React, { useState } from 'react';
import { useInvoices } from '../contexts/InvoiceContext';
import { useSettings } from '../contexts/SettingsContext';
import type { Invoice, AuditScenario } from '../types';
import { InvoiceStatus } from '../types';
import ViewHeader from '../components/ViewHeader';
import AuditResultModal from './modals/AuditResultModal';
import InvoiceList from '../components/InvoiceList';
import InvoiceDetailModal from './modals/InvoiceDetailModal';

const AuditScenarioSettings: React.FC = () => {
    const { auditScenarios, addAuditScenario } = useSettings();
    const [newScenario, setNewScenario] = useState<Omit<AuditScenario, 'id'>>({
        name: '', description: '', prompt: '', documents: [], scope: 'single'
    });
    const [newDocName, setNewDocName] = useState('');
    const [newDocContent, setNewDocContent] = useState('');

    const handleAddDocument = () => {
        if (newDocName && newDocContent) {
            setNewScenario(prev => ({
                ...prev,
                documents: [...prev.documents, { name: newDocName, content: newDocContent }]
            }));
            setNewDocName('');
            setNewDocContent('');
        }
    };
    
    const resetForm = () => {
        setNewScenario({ name: '', description: '', prompt: '', documents: [], scope: 'single' });
        setNewDocName('');
        setNewDocContent('');
    };

    const handleAddScenario = (e: React.FormEvent) => {
        e.preventDefault();
        if (newScenario.name && newScenario.description && newScenario.prompt) {
            addAuditScenario({ ...newScenario, id: `audit-${Date.now()}` });
            resetForm();
        }
    };

    return (
        <details className="bg-white shadow-lg rounded-xl overflow-hidden">
            <summary className="px-6 py-4 text-xl font-bold text-gray-800 cursor-pointer hover:bg-gray-50">
              監査シナリオ設定
            </summary>
            <div className="p-6 border-t space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">登録済みシナリオ</h3>
                    <ul className="divide-y divide-gray-200 border rounded-md">
                        {auditScenarios.map(scenario => (
                            <li key={scenario.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-800">{scenario.name}</p>
                                        <p className="text-sm text-gray-600">{scenario.description}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${scenario.scope === 'all' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                      {scenario.scope === 'all' ? '全体監査' : '単一監査'}
                                    </span>
                                </div>
                                {scenario.documents.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        関連ドキュメント: {scenario.documents.map(d => d.name).join(', ')}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">新規シナリオ追加</h3>
                    <form onSubmit={handleAddScenario} className="space-y-4">
                        <input type="text" placeholder="シナリオ名" value={newScenario.name} onChange={e => setNewScenario(p => ({...p, name: e.target.value}))} className="w-full p-2 border rounded" required />
                        <textarea placeholder="シナリオの説明" value={newScenario.description} onChange={e => setNewScenario(p => ({...p, description: e.target.value}))} className="w-full p-2 border rounded" rows={2} required />
                        <textarea placeholder="AIへの指示プロンプト" value={newScenario.prompt} onChange={e => setNewScenario(p => ({...p, prompt: e.target.value}))} className="w-full p-2 border rounded" rows={4} required />
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">監査スコープ</label>
                            <select 
                                value={newScenario.scope} 
                                onChange={e => setNewScenario(p => ({...p, scope: e.target.value as 'single' | 'all'}))} 
                                className="w-full p-2 border rounded bg-white"
                            >
                                <option value="single">単一監査 (この申請のみで完結)</option>
                                <option value="all">全体監査 (他の申請との比較が必要)</option>
                            </select>
                        </div>

                        <div className="p-4 border rounded-md space-y-2 bg-gray-50">
                            <h4 className="font-semibold">関連ドキュメント追加 (任意)</h4>
                            <input type="text" placeholder="ドキュメント名 (例: 規定.txt)" value={newDocName} onChange={e => setNewDocName(e.target.value)} className="w-full p-2 border rounded" />
                            <textarea placeholder="ドキュメント内容" value={newDocContent} onChange={e => setNewDocContent(e.target.value)} className="w-full p-2 border rounded" rows={3} />
                            <button type="button" onClick={handleAddDocument} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded-md text-sm">ドキュメントを追加</button>
                            <ul className="text-sm">
                                {newScenario.documents.map((doc, i) => <li key={i}>✓ {doc.name}</li>)}
                            </ul>
                        </div>

                        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors w-full">シナリオを保存</button>
                    </form>
                </div>
            </div>
        </details>
    );
};


const AuditView: React.FC = () => {
  const { invoices } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const completedInvoices = invoices.filter(inv => inv.status === InvoiceStatus.Completed);
  
  const handleRunAudit = () => {
    setIsAuditModalOpen(true);
  };
  
  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };
  
  const handleCloseModal = () => {
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-8">
      <ViewHeader
        title="AI監査"
        description="完了済みの申請に対して監査シナリオを実行し、コンプライアンス違反の可能性を検出します。"
      />

      <div className="bg-white shadow-lg rounded-xl">
        <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">一括監査実行</h2>
        </div>
        <div className="p-6 space-y-4">
            <p className="text-gray-600">登録されている全ての監査シナリオを、まだ監査されていない完了済み申請に対して一括で実行します。</p>
            <div className="flex justify-end">
              <button
                onClick={handleRunAudit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-200"
              >
                一括監査を実行
              </button>
            </div>
        </div>
      </div>
      
      <AuditScenarioSettings />

      <InvoiceList
        invoices={completedInvoices}
        onSelectInvoice={handleSelectInvoice}
        title="完了済み申請一覧"
        showAuditStatus={true}
      />
      
      {selectedInvoice && (
        <InvoiceDetailModal 
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={handleCloseModal}
        />
      )}
      
      {isAuditModalOpen && (
        <AuditResultModal
            isOpen={isAuditModalOpen}
            onClose={() => setIsAuditModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AuditView;