import React, { useState, useCallback, useRef } from 'react';
import { useInvoices } from '../contexts/InvoiceContext';
import { useSettings } from '../contexts/SettingsContext';
import type { Invoice, AuditScenario, ExternalVerificationItem } from '../types';
import { InvoiceStatus } from '../types';
import ViewHeader from '../components/ViewHeader';
import AuditResultModal from './modals/AuditResultModal';
import InvoiceList from '../components/InvoiceList';
import InvoiceDetailModal from './modals/InvoiceDetailModal';
import IntegrityCheckResultModal from './modals/IntegrityCheckResultModal';
import ExternalAuditResultModal from './modals/ExternalAuditResultModal';
import VerificationItemsModal from './modals/VerificationItemsModal';
import OperationalReadinessResultModal from './modals/OperationalReadinessResultModal';

const AuditScenarioSettings: React.FC<{ detailsRef: React.RefObject<HTMLDetailsElement> }> = ({ detailsRef }) => {
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
        <details ref={detailsRef} className="bg-white shadow-lg rounded-xl overflow-hidden">
            <summary className="px-6 py-4 text-xl font-bold text-gray-800 cursor-pointer hover:bg-gray-50">
              監査シナリオ管理
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

const FileUploadDropzone: React.FC<{
  onFilesSelected: (files: File[]) => void;
  acceptedTypes: string;
  isMultiple: boolean;
  selectedFileCount: number;
  label: string;
}> = ({ onFilesSelected, acceptedTypes, isMultiple, selectedFileCount, label }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
            }`}
        >
            <div className="space-y-1 text-center">
                 <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                    <label htmlFor={`file-upload-${label}`} className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>ファイルを選択</span>
                        <input id={`file-upload-${label}`} name={`file-upload-${label}`} type="file" className="sr-only" multiple={isMultiple} accept={acceptedTypes} onChange={handleChange} />
                    </label>
                    <p className="pl-1">またはドラッグ＆ドロップ</p>
                </div>
                {selectedFileCount > 0 ? (
                    <p className="text-sm text-green-600">{selectedFileCount} 件のファイルを選択済み</p>
                ) : (
                    <p className="text-xs text-gray-500">{acceptedTypes}</p>
                )}
            </div>
        </div>
    </div>
  );
};

const defaultVerificationItems: ExternalVerificationItem[] = [
  { id: 'invoiceNumber', label: '請求書番号' },
  { id: 'amount', label: '請求書金額' },
  { id: 'issueDate', label: '請求書日付' },
  { id: 'vendor', label: 'サプライヤ名称' },
  { id: 'supplierNumber', label: 'サプライヤ番号' },
  { id: 'paymentMethod', label: '支払方法' },
  { id: 'currency', label: '通貨' },
];

const AuditView: React.FC = () => {
  const { invoices } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isIntegrityCheckModalOpen, setIsIntegrityCheckModalOpen] = useState(false);
  const [isExternalAuditModalOpen, setIsExternalAuditModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'registered' | 'new' | 'operationalReadiness'>('registered');

  const [checkScope, setCheckScope] = useState<'all' | 'sample'>('all');
  const [sampleSize, setSampleSize] = useState(10);
  const [invoicesForIntegrityCheck, setInvoicesForIntegrityCheck] = useState<Invoice[]>([]);
  
  const [uploadedInvoiceFiles, setUploadedInvoiceFiles] = useState<File[]>([]);
  const [uploadedDataFile, setUploadedDataFile] = useState<File | null>(null);
  const [verificationItems, setVerificationItems] = useState<ExternalVerificationItem[]>(defaultVerificationItems);

  const [isOperationalReadinessModalOpen, setIsOperationalReadinessModalOpen] = useState(false);
  const [definitionDocFile, setDefinitionDocFile] = useState<File | null>(null);
  const [journalDataFile, setJournalDataFile] = useState<File | null>(null);

  const scenarioSettingsRef = useRef<HTMLDetailsElement>(null);

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

  const handleRunIntegrityCheck = () => {
    let invoicesToCheck: Invoice[] = [];
    if (checkScope === 'all') {
        invoicesToCheck = completedInvoices;
    } else {
        const cappedSampleSize = Math.min(sampleSize, completedInvoices.length);
        invoicesToCheck = [...completedInvoices].sort(() => 0.5 - Math.random()).slice(0, cappedSampleSize);
    }
    setInvoicesForIntegrityCheck(invoicesToCheck);
    setIsIntegrityCheckModalOpen(true);
  };

  const handleRunExternalAudit = () => {
      if (uploadedInvoiceFiles.length > 0 && uploadedDataFile && verificationItems.length > 0) {
          setIsExternalAuditModalOpen(true);
      }
  };

  const handleInvoiceFilesChange = (files: File[]) => {
      setUploadedInvoiceFiles(files);
  };
  
  const handleDataFileChange = (files: File[]) => {
      if (files.length > 0) {
        setUploadedDataFile(files[0]);
      }
  };
  
  const handleManageScenariosClick = () => {
    if (scenarioSettingsRef.current) {
        scenarioSettingsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        scenarioSettingsRef.current.open = true;
    }
  };

  const handleDefinitionDocChange = (files: File[]) => {
    if (files.length > 0) setDefinitionDocFile(files[0]);
  };

  const handleJournalDataChange = (files: File[]) => {
      if (files.length > 0) setJournalDataFile(files[0]);
  };

  const handleRunOperationalReadiness = () => {
      if (definitionDocFile && journalDataFile) {
          setIsOperationalReadinessModalOpen(true);
      }
  };


  return (
    <div className="space-y-8">
      <ViewHeader
        title="AI監査"
        description="登録済みデータまたは新規アップロードデータに対して、AIによる整合性チェックやシナリオベースの監査を実行します。"
      />

      <div>
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('registered')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'registered'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    登録済みデータ検証
                </button>
                <button
                    onClick={() => setActiveTab('new')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'new'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    新規データ検証
                </button>
                 <button
                    onClick={() => setActiveTab('operationalReadiness')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'operationalReadiness'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    整備状況評価
                </button>
            </nav>
        </div>

        <div className="mt-6">
            {activeTab === 'registered' && (
                <div className="bg-white shadow-lg rounded-xl flex flex-col h-full">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-xl font-bold text-gray-800">登録済みデータ検証</h2>
                        <p className="text-sm text-gray-500 mt-1">システムに登録済みの完了申請に対して各種監査を実行します。</p>
                    </div>
                    <div className="p-6 space-y-6 flex-grow flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">整合性監査</h3>
                            <p className="mt-1 text-sm text-gray-600">登録データと請求書画像の内容が一致しているかAIが再検証します。</p>
                            <fieldset className="mt-4">
                                <legend className="sr-only">チェック範囲</legend>
                                <div className="space-y-2 sm:flex sm:items-center sm:space-y-0 sm:space-x-6">
                                    <div className="flex items-center">
                                        <input id="check-all" name="check-scope" type="radio" checked={checkScope === 'all'} onChange={() => setCheckScope('all')} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                                        <label htmlFor="check-all" className="ml-2 block text-sm font-medium text-gray-700">全件チェック ({completedInvoices.length}件)</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="check-sample" name="check-scope" type="radio" checked={checkScope === 'sample'} onChange={() => setCheckScope('sample')} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                                        <label htmlFor="check-sample" className="ml-2 block text-sm font-medium text-gray-700">サンプルチェック</label>
                                        {checkScope === 'sample' && (
                                            <input type="number" value={sampleSize} onChange={(e) => setSampleSize(Math.max(1, parseInt(e.target.value, 10) || 1))} className="ml-2 block w-20 text-sm p-1 border-gray-300 rounded-md" min="1" max={completedInvoices.length} />
                                        )}
                                    </div>
                                </div>
                            </fieldset>
                            <div className="flex justify-end pt-4">
                                <button onClick={handleRunIntegrityCheck} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors disabled:bg-gray-400" disabled={completedInvoices.length === 0 || (checkScope === 'sample' && (!sampleSize || sampleSize <= 0))}>整合性チェック実行</button>
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-200"></div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900">シナリオ一括監査</h3>
                            <p className="mt-1 text-sm text-gray-600">定義された監査シナリオに基づき、違反の可能性がないか一括でチェックします。</p>
                            <div className="flex justify-end items-center pt-4 gap-4">
                                <button onClick={handleManageScenariosClick} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">シナリオを管理</button>
                                <button onClick={handleRunAudit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">一括監査を実行</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'new' && (
                <div className="bg-white shadow-lg rounded-xl">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-xl font-bold text-gray-800">新規データ検証</h2>
                        <p className="text-sm text-gray-500 mt-1">システム未登録の請求書とデータ一覧をアップロードし、整合性を検証します。</p>
                    </div>
                    <div className="p-6 space-y-8">
                        <div className="space-y-6">
                           <div>
                                <h3 className="text-lg font-medium text-gray-900">検証項目設定</h3>
                                <p className="mt-1 text-sm text-gray-600">AIに照合させる項目を管理します。現在 <span className="font-bold">{verificationItems.length}</span> 件の項目が設定されています。</p>
                                <div className="mt-4">
                                    <button 
                                        onClick={() => setIsVerificationModalOpen(true)}
                                        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-md shadow-sm transition-colors flex items-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                        </svg>
                                        検証項目を編集
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">ファイルアップロード</h3>
                                <p className="mt-1 text-sm text-gray-600">請求書ファイル群とデータ一覧（CSV）をアップロードして、内容の整合性をチェックします。</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <FileUploadDropzone label="請求書ファイル" onFilesSelected={handleInvoiceFilesChange} acceptedTypes="image/jpeg,image/png,application/pdf" isMultiple={true} selectedFileCount={uploadedInvoiceFiles.length} />
                                    <FileUploadDropzone label="データ一覧 (CSV)" onFilesSelected={handleDataFileChange} acceptedTypes=".csv" isMultiple={false} selectedFileCount={uploadedDataFile ? 1 : 0} />
                                </div>
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-md mt-4">
                                    <p className="text-xs text-blue-700">
                                    CSVには上記で設定した項目をヘッダーとして含めてください。
                                    </p>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button onClick={handleRunExternalAudit} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors disabled:bg-gray-400" disabled={uploadedInvoiceFiles.length === 0 || !uploadedDataFile || verificationItems.length === 0}>整合性チェック実行</button>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200"></div>

                        <div className="opacity-60">
                            <h3 className="text-lg font-medium text-gray-900">シナリオ一括監査</h3>
                            <p className="mt-1 text-sm text-gray-600">定義された監査シナリオに基づき、アップロードされたデータに違反の可能性がないかチェックします。</p>
                            <div className="flex justify-end items-center pt-4 gap-4">
                                <button onClick={handleManageScenariosClick} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer">シナリオを管理</button>
                                <button disabled className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed">一括監査を実行</button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-right">この機能は現在、登録済みデータでのみ利用可能です。</p>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'operationalReadiness' && (
                <div className="bg-white shadow-lg rounded-xl">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-xl font-bold text-gray-800">整備状況評価</h2>
                        <p className="text-sm text-gray-500 mt-1">後続システム連携に関する設計書の評価と、実データとの整合性検証を行います。</p>
                    </div>
                    <div className="p-6 space-y-8">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">ファイルアップロード</h3>
                            <p className="mt-1 text-sm text-gray-600">評価に必要な「仕訳定義書」と「仕訳データ」をアップロードしてください。</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <FileUploadDropzone 
                                    label="仕訳定義書" 
                                    onFilesSelected={handleDefinitionDocChange} 
                                    acceptedTypes=".txt,.md,.pdf,.docx" 
                                    isMultiple={false} 
                                    selectedFileCount={definitionDocFile ? 1 : 0} 
                                />
                                <FileUploadDropzone 
                                    label="仕訳データ (CSV)" 
                                    onFilesSelected={handleJournalDataChange} 
                                    acceptedTypes=".csv" 
                                    isMultiple={false} 
                                    selectedFileCount={journalDataFile ? 1 : 0} 
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button 
                                    onClick={handleRunOperationalReadiness} 
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors disabled:bg-gray-400" 
                                    disabled={!definitionDocFile || !journalDataFile}
                                >
                                    評価を実行
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
      
      <AuditScenarioSettings detailsRef={scenarioSettingsRef} />

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

      {isIntegrityCheckModalOpen && (
        <IntegrityCheckResultModal
            isOpen={isIntegrityCheckModalOpen}
            onClose={() => {
                setIsIntegrityCheckModalOpen(false);
                setInvoicesForIntegrityCheck([]);
            }}
            invoicesToAudit={invoicesForIntegrityCheck}
        />
      )}

       {isExternalAuditModalOpen && uploadedDataFile && (
        <ExternalAuditResultModal
            isOpen={isExternalAuditModalOpen}
            onClose={() => {
                setIsExternalAuditModalOpen(false);
                setUploadedInvoiceFiles([]);
                setUploadedDataFile(null);
            }}
            invoiceFiles={uploadedInvoiceFiles}
            dataFile={uploadedDataFile}
            verificationItems={verificationItems}
        />
      )}

      {isVerificationModalOpen && (
        <VerificationItemsModal
            isOpen={isVerificationModalOpen}
            onClose={() => setIsVerificationModalOpen(false)}
            initialItems={verificationItems}
            onSave={setVerificationItems}
        />
      )}
      
      {isOperationalReadinessModalOpen && definitionDocFile && journalDataFile && (
        <OperationalReadinessResultModal
            isOpen={isOperationalReadinessModalOpen}
            onClose={() => {
                setIsOperationalReadinessModalOpen(false);
                setDefinitionDocFile(null);
                setJournalDataFile(null);
            }}
            definitionDocFile={definitionDocFile}
            journalDataFile={journalDataFile}
        />
    )}
    </div>
  );
};

export default AuditView;