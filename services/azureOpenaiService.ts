

import type { AccountTitle, PurchasingCategory, Invoice, AuditScenario, OperationalReadinessResult } from '../types';

// This is a mock service for Azure OpenAI to demonstrate the multi-LLM architecture.
// In a real application, this would use the Azure OpenAI SDK.

const MOCK_DELAY = 1500; // Simulate network latency

const toBase64 = (fileOrBlob: File | Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(fileOrBlob);
  reader.onload = () => {
    const base64String = (reader.result as string).split(',')[1];
    if (base64String) {
      resolve(base64String);
    } else {
      reject(new Error("Failed to convert file to base64."));
    }
  };
  reader.onerror = error => reject(error);
});

export const extractInvoiceData = async (
  file: File, 
  accountTitles: AccountTitle[]
): Promise<Partial<Invoice>> => {
  console.log("Calling Azure OpenAI (mock) for invoice data extraction for file:", file.name);
  
  // Simulate API call and base64 conversion
  await toBase64(file);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

  // Mocked response
  const mockResult = {
    invoiceNumber: `AZ-INV-${Math.floor(Math.random() * 900) + 100}`,
    vendor: "Azureマート",
    amount: Math.floor(Math.random() * 100000) + 5000,
    issueDate: new Date().toISOString().split('T')[0],
    accountTitle: accountTitles[Math.floor(Math.random() * accountTitles.length)].name,
    imageUrl: URL.createObjectURL(file), // Keep the local URL for preview
  };

  console.log("Azure OpenAI (mock) response:", mockResult);
  return mockResult;
};

export const verifyInvoiceData = async (
  invoice: Invoice
): Promise<{ match: boolean; reason: string }> => {
    console.log("Calling Azure OpenAI (mock) for verification for invoice:", invoice.id);
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

    // Simulate a 50/50 chance of matching
    if (Math.random() > 0.5) {
        return { match: true, reason: "照合OK (Azure OpenAI Mock)" };
    } else {
        return { match: false, reason: "申請金額が異なります (Azure OpenAI Mock)" };
    }
};

export const extractInvoiceNumberFromFile = async (file: File): Promise<string | null> => {
    console.log("Calling Azure OpenAI (mock) to extract invoice number from file:", file.name);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock response: for "invoice2.pdf", we can return "INV-002" for example.
    const match = file.name.match(/(\d+)/);
    if (match) {
        return `INV-${String(match[1]).padStart(3, '0')}`;
    }
    return `AZ-INV-${Math.floor(Math.random() * 900) + 100}`;
};

export const verifyExternalData = async (
  file: File,
  record: Record<string, string>,
  fieldsToVerify: { id: string; label: string }[]
): Promise<{ match: boolean; reason: string }> => {
  console.log("Calling Azure OpenAI (mock) for external data verification for file:", file.name);
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

  // Simulate a random chance of mismatch based on a hash of the filename to be consistent
  let hash = 0;
  for (let i = 0; i < file.name.length; i++) {
      const char = file.name.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
  }

  if (fieldsToVerify.length > 0 && Math.abs(hash) % 4 === 0) { // ~25% chance of mismatch
    const failingField = fieldsToVerify[Math.abs(hash) % fieldsToVerify.length];
    return { match: false, reason: `${failingField.label}がCSVデータ (${record[failingField.id] || 'N/A'}) と一致しません (Azure OpenAI Mock)` };
  } else {
    return { match: true, reason: "照合OK (Azure OpenAI Mock)" };
  }
};

export const suggestPurchasingCategory = async (
  invoice: Invoice,
  categories: PurchasingCategory[]
): Promise<string> => {
    console.log("Calling Azure OpenAI (mock) for purchasing category suggestion for invoice:", invoice.id);
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    // Return a random category
    const suggestedCategory = categories[Math.floor(Math.random() * categories.length)].name;
    return suggestedCategory;
};

export const analyzeInvoicesWithChat = async (
    prompt: string,
    invoices: Invoice[]
): Promise<string> => {
    console.log("Calling Azure OpenAI (mock) for chat analysis with prompt:", prompt);
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    
    // Mock text response
    return `承知いたしました。「${prompt}」について分析します。現在、合計${invoices.length}件の請求書があります。(Azure OpenAI Mock)`;
};


export const performBulkAuditCheckForInvoice = async (
  invoice: Invoice,
  scenarios: AuditScenario[],
  allInvoices?: Invoice[],
): Promise<Array<{ scenarioId: string; result: 'pass' | 'fail'; comment: string }>> => {
  console.log(`Calling Azure OpenAI (mock) for bulk audit on invoice ${invoice.id}`);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Shorter delay for mock

  return scenarios.map(scenario => {
    // Simulate a 20% chance of failure for each scenario
    if (Math.random() < 0.2) {
      return {
        scenarioId: scenario.id,
        result: 'fail',
        comment: `監査シナリオ「${scenario.name}」に違反の可能性。(Azure OpenAI Mock)`,
      };
    } else {
      return {
        scenarioId: scenario.id,
        result: 'pass',
        comment: '監査OK (Azure OpenAI Mock)',
      };
    }
  });
};

export const evaluateOperationalReadiness = async (
  definitionDoc: File,
  journalData: File,
  invoices: Invoice[]
): Promise<OperationalReadinessResult> => {
  console.log("Calling Azure OpenAI (mock) for operational readiness evaluation.");
  await new Promise(resolve => setTimeout(resolve, 3000));

  return {
    designEvaluation: {
      status: 'needs_improvement',
      summary: '仕訳定義書は全体的に網羅されていますが、エラー処理に関する記述が不足しています。(Azure OpenAI Mock)',
      details: [
        '勘定科目がマスターに存在しない場合のリジェクト処理が定義されていません。',
        '消費税の計算ロジックが不明確です。'
      ]
    },
    dataCompliance: {
      status: 'fail',
      summary: `${invoices.length}件中2件の請求書で不整合が発見されました。(Azure OpenAI Mock)`,
      discrepancies: [
        'INV-2023-004: 摘要欄に記載されたプロジェクトコードが、請求書の購買カテゴリと一致しません。',
        'INV-2023-005: 貸方勘定が「未払金」であるべきところ、「買掛金」として計上されています。'
      ]
    }
  };
};