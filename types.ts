
export enum UserRole {
  Applicant = '申請者',
  Manager = '上長',
  Accounting = '経理部',
  Scrutinizer = '精査担当',
  PMO = 'PMO',
  Admin = '管理者',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export enum InvoiceStatus {
  Draft = '下書き',
  PendingManagerApproval = '上長承認待ち',
  ManagerRejected = '上長差戻し',
  PendingVerification = 'LLM照合待ち',
  MismatchDetected = '経理確認中',
  AccountingRejected = '経理差戻し',
  PendingScrutiny = '精査担当確認待ち',
  Completed = '完了',
}

export interface Invoice {
  id: string;
  applicant: User;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  issueDate: string;
  accountTitle: string;
  purchasingCategory?: string;
  status: InvoiceStatus;
  imageUrl: string;
  history: { status: InvoiceStatus; user: User; timestamp: string, comment?: string }[];
  isCorrectedByScrutinizer?: boolean;
}

export interface AccountTitle {
  id: string;
  name: string;
}

export interface PurchasingCategory {
  id: string;
  name: string;
}

export interface DailyCorrection {
  date: string;
  corrections: number;
  total: number;
}

export enum LlmProvider {
  Gemini = 'Gemini',
  Azure = 'Azure OpenAI',
}
