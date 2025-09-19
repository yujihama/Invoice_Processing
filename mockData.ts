
import type { User, Invoice, AccountTitle, PurchasingCategory } from './types';
import { UserRole, InvoiceStatus } from './types';

export const MOCK_USERS: Record<string, User> = {
  'user-1': { id: 'user-1', name: '田中 太郎', role: UserRole.Applicant },
  'user-2': { id: 'user-2', name: '鈴木 一郎', role: UserRole.Manager },
  'user-3': { id: 'user-3', name: '佐藤 花子', role: UserRole.Accounting },
  'user-4': { id: 'user-4', name: '高橋 次郎', role: UserRole.Scrutinizer },
  'user-5': { id: 'user-5', name: '伊藤 三郎', role: UserRole.PMO },
  'user-6': { id: 'user-6', name: '渡辺 四郎', role: UserRole.Admin },
};

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    applicant: MOCK_USERS['user-1'],
    invoiceNumber: 'INV-2023-001',
    vendor: '株式会社A',
    amount: 55000,
    issueDate: '2023-10-01',
    accountTitle: '広告宣伝費',
    status: InvoiceStatus.PendingManagerApproval,
    imageUrl: 'https://picsum.photos/seed/inv-1/600/800',
    history: [
      { status: InvoiceStatus.Draft, user: MOCK_USERS['user-1'], timestamp: '2023-10-15T10:00:00Z' },
      { status: InvoiceStatus.PendingManagerApproval, user: MOCK_USERS['user-1'], timestamp: '2023-10-15T10:05:00Z' },
    ],
  },
  {
    id: 'inv-2',
    applicant: MOCK_USERS['user-1'],
    invoiceNumber: 'INV-2023-002',
    vendor: 'Bサービス有限会社',
    amount: 120000,
    issueDate: '2023-10-05',
    accountTitle: '外注費',
    status: InvoiceStatus.MismatchDetected,
    imageUrl: 'https://picsum.photos/seed/inv-2/600/800',
    history: [
      { status: InvoiceStatus.PendingManagerApproval, user: MOCK_USERS['user-1'], timestamp: '2023-10-16T11:00:00Z' },
      { status: InvoiceStatus.PendingVerification, user: MOCK_USERS['user-2'], timestamp: '2023-10-16T14:00:00Z', comment: '承認しました。' },
      { status: InvoiceStatus.MismatchDetected, user: {id: 'system', name: 'LLM照合', role: UserRole.Admin}, timestamp: '2023-10-16T14:05:00Z', comment: '請求書画像と申請金額が不一致です。' },
    ],
  },
  {
    id: 'inv-3',
    applicant: MOCK_USERS['user-1'],
    invoiceNumber: 'INV-2023-003',
    vendor: 'Cストア',
    amount: 8500,
    issueDate: '2023-10-08',
    accountTitle: '消耗品費',
    purchasingCategory: '事務用品',
    status: InvoiceStatus.PendingScrutiny,
    imageUrl: 'https://picsum.photos/seed/inv-3/600/800',
    history: [
      { status: InvoiceStatus.PendingManagerApproval, user: MOCK_USERS['user-1'], timestamp: '2023-10-17T09:00:00Z' },
      { status: InvoiceStatus.PendingVerification, user: MOCK_USERS['user-2'], timestamp: '2023-10-17T09:30:00Z' },
      { status: InvoiceStatus.PendingScrutiny, user: {id: 'system', name: 'LLM照合', role: UserRole.Admin}, timestamp: '2023-10-17T09:35:00Z', comment: '照合OK' },
    ],
  },
  {
    id: 'inv-4',
    applicant: MOCK_USERS['user-1'],
    invoiceNumber: 'INV-2023-004',
    vendor: 'D運輸',
    amount: 25000,
    issueDate: '2023-10-10',
    accountTitle: '運送費',
    purchasingCategory: '物流サービス',
    status: InvoiceStatus.Completed,
    imageUrl: 'https://picsum.photos/seed/inv-4/600/800',
    isCorrectedByScrutinizer: true,
    history: [
      { status: InvoiceStatus.PendingManagerApproval, user: MOCK_USERS['user-1'], timestamp: '2023-10-12T15:00:00Z' },
      { status: InvoiceStatus.PendingVerification, user: MOCK_USERS['user-2'], timestamp: '2023-10-12T16:00:00Z' },
      { status: InvoiceStatus.PendingScrutiny, user: {id: 'system', name: 'LLM照合', role: UserRole.Admin}, timestamp: '2023-10-12T16:05:00Z' },
      { status: InvoiceStatus.Completed, user: MOCK_USERS['user-4'], timestamp: '2023-10-13T11:00:00Z', comment: 'カテゴリを修正して完了。' },
    ],
  },
   {
    id: 'inv-5',
    applicant: MOCK_USERS['user-1'],
    invoiceNumber: 'INV-2023-005',
    vendor: '株式会社E',
    amount: 300000,
    issueDate: '2023-09-25',
    accountTitle: '地代家賃',
    purchasingCategory: '不動産',
    status: InvoiceStatus.Completed,
    imageUrl: 'https://picsum.photos/seed/inv-5/600/800',
    isCorrectedByScrutinizer: false,
    history: [
       { status: InvoiceStatus.PendingManagerApproval, user: MOCK_USERS['user-1'], timestamp: '2023-10-10T10:00:00Z' },
       { status: InvoiceStatus.PendingVerification, user: MOCK_USERS['user-2'], timestamp: '2023-10-10T11:00:00Z' },
       { status: InvoiceStatus.PendingScrutiny, user: {id: 'system', name: 'LLM照合', role: UserRole.Admin}, timestamp: '2023-10-10T11:05:00Z' },
       { status: InvoiceStatus.Completed, user: MOCK_USERS['user-4'], timestamp: '2023-10-11T14:00:00Z', comment: '確認完了。' },
    ],
  },
];

export const MOCK_ACCOUNT_TITLES: AccountTitle[] = [
    { id: 'acc-1', name: '広告宣伝費' },
    { id: 'acc-2', name: '外注費' },
    { id: 'acc-3', name: '消耗品費' },
    { id: 'acc-4', name: '運送費' },
    { id: 'acc-5', name: '地代家賃' },
    { id: 'acc-6', name: '通信費' },
    { id: 'acc-7', name: '水道光熱費' },
];

export const MOCK_PURCHASING_CATEGORIES: PurchasingCategory[] = [
    { id: 'cat-1', name: 'マーケティング' },
    { id: 'cat-2', name: 'ITサービス' },
    { id: 'cat-3', name: '事務用品' },
    { id: 'cat-4', name: '物流サービス' },
    { id: 'cat-5', name: '不動産' },
    { id: 'cat-6', name: 'インフラ' },
];
