import { GoogleGenAI, Type } from "@google/genai";
import type { AccountTitle, PurchasingCategory, Invoice } from '../types';

// This service now uses the actual Gemini API.
// Make sure to replace the placeholder API_KEY in index.html

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