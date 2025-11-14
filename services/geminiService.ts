import { GoogleGenAI, Type } from "@google/genai";
import type { AccountTitle, PurchasingCategory, Invoice, AuditScenario, OperationalReadinessResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const toBase64 = (fileOrBlob: File | Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(fileOrBlob);
  reader.onload = () => {
    // result is "data:mime/type;base64,..."
    // we only need the part after the comma
    const base64String = (reader.result as string).split(',')[1];
    if (base64String) {
      resolve(base64String);
    } else {
      reject(new Error("Failed to convert file to base64."));
    }
  };
  reader.onerror = error => reject(error);
});

const fileToText = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      resolve(reader.result);
    } else {
      reject(new Error("Failed to read file as text."));
    }
  };
  reader.onerror = error => reject(error);
});


export const extractInvoiceData = async (
  file: File, 
  accountTitles: AccountTitle[]
): Promise<Partial<Invoice>> => {
  console.log("Calling AI for invoice data extraction for file:", file.name);

  try {
    const base64Image = await toBase64(file);
  
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { 
        parts: [
          { inlineData: { mimeType: file.type, data: base64Image } },
          { text: `
            この請求書から次の情報を抽出してください: 請求書番号(invoiceNumber), ベンダー名(vendor), 合計金額(amount), 発行日(issueDate).
            内容に基づき、次の勘定科目リストから最も適切なものを選択してください: ${accountTitles.map(t => t.name).join(', ')}.
          `}
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceNumber: { type: Type.STRING, description: "請求書に記載されている番号" },
            vendor: { type: Type.STRING, description: "請求書の発行元企業名" },
            amount: { type: Type.NUMBER, description: "請求書の合計金額（数値のみ）" },
            issueDate: { type: Type.STRING, description: "発行日をYYYY-MM-DD形式で" },
            accountTitle: { type: Type.STRING, description: `提供されたリストからの勘定科目: ${accountTitles.map(t => t.name).join(', ')}` }
          },
          required: ["invoiceNumber", "vendor", "amount", "issueDate", "accountTitle"]
        }
      }
    });

    const result = JSON.parse(response.text);
    // Add the local URL for the image preview
    result.imageUrl = URL.createObjectURL(file);
    return result;

  } catch (error) {
    console.error("Error during invoice data extraction:", error);
    throw new Error("AIによる請求書データの抽出に失敗しました。ファイル形式を確認するか、後でもう一度お試しください。");
  }
};

export const verifyInvoiceData = async (
  invoice: Invoice
): Promise<{ match: boolean; reason: string }> => {
    console.log("Calling AI for verification for invoice:", invoice.id);

    try {
      // Fetch the image from the local URL and convert to base64
      const imageResponse = await fetch(invoice.imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to fetch invoice image for verification.");
      }
      const imageBlob = await imageResponse.blob();
      const base64Image = await toBase64(imageBlob);

      const prompt = `
        添付された請求書の画像と、以下の申請内容を照合してください。
        
        申請内容:
        - ベンダー名: ${invoice.vendor}
        - 請求書番号: ${invoice.invoiceNumber}
        - 合計金額: ${invoice.amount}円
        - 発行日: ${invoice.issueDate}
        
        画像の内容と申請内容が完全に一致していますか？
        一致しない場合は、どの項目がどのように違うか具体的に理由を述べてください。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: imageBlob.type, data: base64Image } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              match: { type: Type.BOOLEAN, description: "画像と申請内容が一致していればtrue" },
              reason: { type: Type.STRING, description: "一致しない場合はその理由、一致していれば「照合OK」と記載" }
            },
            required: ["match", "reason"]
          }
        }
      });

      return JSON.parse(response.text);

    } catch (error) {
      console.error("Error during invoice verification:", error);
      // Fallback to a "mismatch" to force manual review if AI fails
      return { match: false, reason: "AIによる照合中にエラーが発生しました。手動で確認してください。" };
    }
};

export const extractInvoiceNumberFromFile = async (file: File): Promise<string | null> => {
  console.log("Calling AI to extract invoice number from file:", file.name);
  try {
    const base64Image = await toBase64(file);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { 
        parts: [
          { inlineData: { mimeType: file.type, data: base64Image } },
          { text: "この請求書から請求書番号(invoice number)だけを抽出し、その番号の文字列だけを返してください。" }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceNumber: { type: Type.STRING, description: "請求書に記載されている番号" },
          },
          required: ["invoiceNumber"]
        }
      }
    });
    const result = JSON.parse(response.text);
    return result.invoiceNumber;
  } catch (error) {
    console.error("Error during invoice number extraction:", error);
    return null; // Return null on failure
  }
};

export const verifyExternalData = async (
  file: File,
  record: Record<string, string>,
  fieldsToVerify: { id: string; label: string }[]
): Promise<{ match: boolean; reason: string }> => {
  console.log("Calling AI for external data verification for file:", file.name);
  try {
    const base64Image = await toBase64(file);

    const dataToVerify = fieldsToVerify
      .map(field => `- ${field.label}: ${record[field.id] || 'N/A'}`)
      .join('\n');

    const prompt = `
      添付された請求書の画像と、以下のCSVデータを照合してください。
      検証対象の項目は以下の通りです:
      
      CSVデータ:
      ${dataToVerify}
      
      画像の内容とCSVデータが指定された項目において完全に一致していますか？
      一致しない場合は、どの項目がどのように違うか具体的に理由を述べてください。
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            match: { type: Type.BOOLEAN, description: "画像とデータが指定された項目において一致していればtrue" },
            reason: { type: Type.STRING, description: "一致しない場合はその理由、一致していれば「照合OK」と記載" }
          },
          required: ["match", "reason"]
        }
      }
    });

    return JSON.parse(response.text);

  } catch (error) {
    console.error(`Error during external data verification for ${file.name}:`, error);
    return { match: false, reason: `AIによる照合中にエラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}` };
  }
};

export const suggestPurchasingCategory = async (
  invoice: Invoice,
  categories: PurchasingCategory[]
): Promise<string> => {
    console.log("Calling AI for purchasing category suggestion for invoice:", invoice.id);
    
    try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `
            請求書の詳細（ベンダー名: ${invoice.vendor}, 勘定科目: ${invoice.accountTitle}）に基づき、
            以下の購買カテゴリリストから最も適切なものを一つだけ選んで、その名前だけを返してください:
            [${categories.map(c => c.name).join(', ')}]
          `
      });
      
      const suggestedCategory = response.text.trim();
      // Ensure the model returns a valid category
      const isValidCategory = categories.some(c => c.name === suggestedCategory);

      return isValidCategory ? suggestedCategory : categories[0].name; // Fallback to the first category if response is invalid

    } catch (error) {
        console.error("Error during category suggestion:", error);
        // Fallback to the first category on error
        return categories[0].name;
    }
};

export const analyzeInvoicesWithChat = async (
    prompt: string,
    invoices: Invoice[]
): Promise<string> => {
    console.log("Calling AI for chat analysis");

    // Create a sanitized version of the invoices without the bulky and irrelevant image URL.
    const sanitizedInvoices = invoices.map(({ imageUrl, ...rest }) => rest);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Query: ${prompt}\n\nInvoice Data:\n${JSON.stringify(sanitizedInvoices)}`,
            config: {
                systemInstruction: `あなたは会計部門の優秀なAIデータアナリストです。提供されたJSON形式の請求書データとユーザーの質問に基づき、分析して自然言語で回答してください。`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: {
                            type: Type.STRING,
                            description: "A natural language summary of the findings or answer to the question."
                        },
                    },
                    required: ["text"]
                },
                maxOutputTokens: 8192,
            }
        });
        
        const result = JSON.parse(response.text);
        return result.text;

    } catch (error) {
        console.error("Error during chat analysis:", error);
        throw new Error("AIによる分析中にエラーが発生しました。");
    }
};

export const performBulkAuditCheckForInvoice = async (
  invoice: Invoice,
  scenarios: AuditScenario[],
  allInvoices?: Invoice[],
): Promise<Array<{ scenarioId: string; result: 'pass' | 'fail'; comment: string }>> => {
  console.log(`Performing bulk audit for invoice ${invoice.id} against ${scenarios.length} scenarios.`);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { imageUrl, ...sanitizedInvoice } = invoice;

  let allInvoicesContext = '';
  if (scenarios.some(s => s.scope === 'all') && allInvoices) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const sanitizedAllInvoices = allInvoices.map(({ imageUrl, ...rest }) => rest);
      allInvoicesContext = `\n\n## Context: All Other Invoices:\n${JSON.stringify(sanitizedAllInvoices, null, 2)}`;
  }
  
  const scenariosPrompt = scenarios.map(scenario => {
    const documentsText = scenario.documents.map(d => `--- Document: ${d.name} ---\n${d.content}`).join('\n');
    return `
      ---
      Scenario ID: "${scenario.id}"
      Scenario Name: "${scenario.name}"
      Description: ${scenario.description}
      Rule to Check: ${scenario.prompt}
      Associated Documents: ${documentsText || 'None'}
    `;
  }).join('');

  const prompt = `
    You are an expert internal auditor.
    Analyze the following invoice data based on ALL the provided audit scenarios.
    Evaluate the invoice against each scenario independently and return a result for each one.

    ## Invoice Data to Audit:
    ${JSON.stringify(sanitizedInvoice, null, 2)}
    ${allInvoicesContext}

    ## Audit Scenarios to Evaluate:
    ${scenariosPrompt}
    ---

    Based on your analysis, provide a JSON array where each object represents the result for one scenario.
    Each object must contain "scenarioId", "result" ('pass' or 'fail'), and a "comment".
    If a scenario passes, the comment should be '監査OK'.
    If it fails, provide a clear and concise comment explaining the reason.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              scenarioId: { type: Type.STRING, description: "The ID of the scenario being evaluated." },
              result: { type: Type.STRING, enum: ["pass", "fail"], description: "The result of the audit check." },
              comment: { type: Type.STRING, description: "A comment explaining the reason for failure, or '監査OK' for a pass." }
            },
            required: ["scenarioId", "result", "comment"]
          }
        }
      }
    });

    return JSON.parse(response.text);

  } catch (error) {
    console.error(`Error during bulk audit check for invoice ${invoice.id}:`, error);
    return scenarios.map(scenario => ({
      scenarioId: scenario.id,
      result: 'fail',
      comment: `AIによる一括監査チェック中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown Error'}`
    }));
  }
};

export const evaluateOperationalReadiness = async (
  definitionDoc: File,
  journalData: File,
  invoices: Invoice[]
): Promise<OperationalReadinessResult> => {
  console.log("Calling AI for operational readiness evaluation.");

  try {
    const definitionDocContent = await fileToText(definitionDoc);
    const journalDataContent = await fileToText(journalData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sanitizedInvoices = invoices.map(({ imageUrl, history, auditHistory, ...rest }) => rest);

    const prompt = `
      あなたは財務・会計システムを専門とする熟練のITシステム監査人です。
      あなたのタスクは、請求書処理システムと後続の会計システム間のデータ連携プロセスの整備状況を評価することです。
      以下の2つの個別の評価を実施してください。

      **評価1：仕訳定義書の評価**
      提供された「仕訳定義書」を確認してください。この文書は、完了した請求書データがどのように会計システムの仕訳データに変換されるかを記述している必要があります。
      設計が明確かつ適切に文書化されているかを評価してください。特に、請求書データ（例：請求金額、ベンダー、勘定科目、発行日）が、仕訳の項目（例：借方/貸方勘定、金額、摘要、日付）にどのようにマッピングされるかが網羅されているかを確認してください。

      **評価2：データコンプライアンスと整合性チェック**
      「仕訳定義書」に記述されたルールとロジックに基づき、「完了済み請求書データ」と提供された「仕訳データ」を比較してください。
      仕訳が設計通りに正しく作成されているかを検証してください。金額の不一致、勘定マッピングの間違い、対応する仕訳の欠落など、具体的な不一致点を指摘してください。もし仕訳データが設計通りであれば、その旨を述べてください。

      **提供データ:**

      --- 仕訳定義書 ---
      ${definitionDocContent}
      --- 仕訳定義書 終了 ---

      --- 仕訳データ ---
      ${journalDataContent}
      --- 仕訳データ 終了 ---

      --- 完了済み請求書データ (JSON) ---
      ${JSON.stringify(sanitizedInvoices, null, 2)}
      --- 完了済み請求書データ 終了 ---

      **出力フォーマット:**
      評価結果を以下のJSON形式で提供してください。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            designEvaluation: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING, enum: ["pass", "fail", "needs_improvement"], description: "評価結果（pass: 問題なし, fail: 重大な問題あり, needs_improvement: 改善の余地あり）" },
                summary: { type: Type.STRING, description: "仕訳定義書評価の要約" },
                details: { type: Type.ARRAY, items: { type: Type.STRING }, description: "具体的な所見や推奨事項" }
              },
              required: ["status", "summary", "details"]
            },
            dataCompliance: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING, enum: ["pass", "fail", "needs_investigation"], description: "評価結果（pass: 整合OK, fail: 不整合あり, needs_investigation: 要調査）" },
                summary: { type: Type.STRING, description: "データコンプライアンスチェックの要約" },
                discrepancies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "発見された具体的な不一致点のリスト" }
              },
              required: ["status", "summary", "discrepancies"]
            }
          }
        }
      }
    });

    return JSON.parse(response.text);

  } catch (error) {
    console.error("Error during operational readiness evaluation:", error);
    throw new Error("AIによる整備状況評価に失敗しました。");
  }
};