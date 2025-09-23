import React, { useState } from 'react';
import { MOCK_ACCOUNT_TITLES, MOCK_PURCHASING_CATEGORIES } from '../mockData';
import type { AccountTitle, PurchasingCategory } from '../types';
import { LlmProvider } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import ViewHeader from '../components/ViewHeader';

const MasterDataTable: React.FC<{ title: string, data: {id: string, name: string}[], setData: React.Dispatch<React.SetStateAction<any[]>> }> = ({ title, data, setData }) => {
    const handleAddItem = () => {
        const name = prompt(`新しい${title}名を入力してください:`);
        if (name) {
            setData(prev => [...prev, { id: `new-${Date.now()}`, name }]);
        }
    };

    const handleDeleteItem = (id: string) => {
        if (window.confirm("この項目を削除しますか？")) {
            setData(prev => prev.filter(item => item.id !== id));
        }
    }

    return (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{title}マスター</h2>
                <button onClick={handleAddItem} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors">
                    追加
                </button>
            </div>
            <ul className="divide-y divide-gray-200">
                {data.map(item => (
                    <li key={item.id} className="px-6 py-3 flex justify-between items-center hover:bg-gray-50">
                        <span className="text-gray-800">{item.name}</span>
                        <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">
                            削除
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const LlmSettings: React.FC = () => {
    const { llmProvider, setLlmProvider } = useSettings();

    return (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">LLM Provider設定</h2>
            </div>
            <div className="p-6 space-y-4">
                <p className="text-gray-600">請求書の読み取りや照合に使用するAIモデルを選択します。</p>
                <fieldset>
                    <legend className="sr-only">LLM Provider</legend>
                    <div className="space-y-2">
                        {Object.values(LlmProvider).map((provider) => (
                            <div key={provider} className="flex items-center">
                                <input
                                    id={provider}
                                    name="llm-provider"
                                    type="radio"
                                    checked={llmProvider === provider}
                                    onChange={() => setLlmProvider(provider)}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                />
                                <label htmlFor={provider} className="ml-3 block text-sm font-medium text-gray-700">
                                    {provider}
                                </label>
                            </div>
                        ))}
                    </div>
                </fieldset>
                 {llmProvider === LlmProvider.Azure && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700">Azure OpenAIを使用するには、環境変数にエンドポイントとAPIキーが設定されている必要があります。</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const AdminView: React.FC = () => {
    const [accountTitles, setAccountTitles] = useState<AccountTitle[]>(MOCK_ACCOUNT_TITLES);
    const [purchasingCategories, setPurchasingCategories] = useState<PurchasingCategory[]>(MOCK_PURCHASING_CATEGORIES);

    return (
        <div className="space-y-8">
            <ViewHeader
                title="管理者画面"
                description="マスターデータやLLMプロバイダーなど、システム全体の設定を管理します。"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <MasterDataTable title="勘定科目" data={accountTitles} setData={setAccountTitles} />
                <MasterDataTable title="購買カテゴリ" data={purchasingCategories} setData={setPurchasingCategories} />
            </div>
            <div>
                <LlmSettings />
            </div>
        </div>
    );
};

export default AdminView;