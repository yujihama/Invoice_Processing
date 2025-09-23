import type { User, Invoice, AccountTitle, PurchasingCategory, AuditScenario } from './types';
import { UserRole, InvoiceStatus } from './types';

export const MOCK_USERS: Record<string, User> = {
  'user-1': { id: 'user-1', name: '田中 太郎', role: UserRole.Applicant },
  'user-2': { id: 'user-2', name: '鈴木 一郎', role: UserRole.Manager, title: '部長' },
  'user-3': { id: 'user-3', name: '佐藤 花子', role: UserRole.Accounting },
  'user-4': { id: 'user-4', name: '高橋 次郎', role: UserRole.Scrutinizer },
  'user-5': { id: 'user-5', name: '伊藤 三郎', role: UserRole.PMO },
  'user-6': { id: 'user-6', name: '渡辺 四郎', role: UserRole.Admin },
  'user-7': { id: 'user-7', name: '中村 さくら', role: UserRole.Applicant },
  'user-8': { id: 'user-8', name: '小林 健太', role: UserRole.Manager, title: '課長' },
};

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

export const MOCK_INVOICES: Invoice[] = [
  // Existing Invoices
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
    auditHistory: [],
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
    auditHistory: [],
  },
  {
    id: 'inv-3',
    applicant: MOCK_USERS['user-7'],
    invoiceNumber: 'INV-2023-003',
    vendor: 'Cストア',
    amount: 8500,
    issueDate: '2023-10-08',
    accountTitle: '消耗品費',
    purchasingCategory: '事務用品',
    status: InvoiceStatus.PendingScrutiny,
    imageUrl: 'https://picsum.photos/seed/inv-3/600/800',
    history: [
      { status: InvoiceStatus.PendingManagerApproval, user: MOCK_USERS['user-7'], timestamp: '2023-10-17T09:00:00Z' },
      { status: InvoiceStatus.PendingVerification, user: MOCK_USERS['user-8'], timestamp: '2023-10-17T09:30:00Z' },
      { status: InvoiceStatus.PendingScrutiny, user: {id: 'system', name: 'LLM照合', role: UserRole.Admin}, timestamp: '2023-10-17T09:35:00Z', comment: '照合OK' },
    ],
    auditHistory: [],
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
    auditHistory: [],
  },
   {
    id: 'inv-5',
    applicant: MOCK_USERS['user-1'],
    invoiceNumber: 'INV-2023-005',
    vendor: '株式会社E',
    amount: 480000,
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
    auditHistory: [],
  },
  // New Invoices for Auditing and Variety
  {
    id: 'inv-6', // Designed to FAIL audit scenario 1 (Approval Authority)
    applicant: MOCK_USERS['user-7'],
    invoiceNumber: 'INV-2023-006',
    vendor: 'Gコンサルティング',
    amount: 600000,
    issueDate: '2023-11-01',
    accountTitle: '外注費',
    purchasingCategory: 'ITサービス',
    status: InvoiceStatus.Completed,
    imageUrl: 'https://picsum.photos/seed/inv-6/600/800',
    isCorrectedByScrutinizer: false,
    history: [
       { status: InvoiceStatus.PendingManagerApproval, user: MOCK_USERS['user-7'], timestamp: '2023-11-02T10:00:00Z' },
       { status: InvoiceStatus.PendingVerification, user: MOCK_USERS['user-8'], timestamp: '2023-11-02T15:00:00Z', comment: '課長承認' }, // Approved by Section Chief (課長)
       { status: InvoiceStatus.PendingScrutiny, user: {id: 'system', name: 'LLM照合', role: UserRole.Admin}, timestamp: '2023-11-02T15:05:00Z' },
       { status: InvoiceStatus.Completed, user: MOCK_USERS['user-4'], timestamp: '2023-11-03T11:00:00Z', comment: '確認完了。' },
    ],
    auditHistory: [],
  },
  {
    id: 'inv-7', // Designed to FAIL audit scenario 2 (Concentrated Orders)
    applicant: MOCK_USERS['user-1'],
    invoiceNumber: 'INV-2023-007',
    vendor: '株式会社F',
    amount: 80000,
    issueDate: '2023-11-05',
    accountTitle: '広告宣伝費',
    purchasingCategory: 'マーケティング',
    status: InvoiceStatus.Completed,
    imageUrl: 'https://picsum.photos/seed/inv-7/600/800',
    isCorrectedByScrutinizer: false,
    history: [
       { status: InvoiceStatus.PendingManagerApproval, user: MOCK_USERS['user-1'], timestamp: '2023-11-06T09:00:00Z' },
       { status: InvoiceStatus.PendingVerification, user: MOCK_USERS['user-2'], timestamp: '2023-11-06T11:00:00Z' },
       { status: InvoiceStatus.PendingScrutiny, user: {id: 'system', name: 'LLM照合', role: UserRole.Admin}, timestamp: '2023-11-06T11:05:00Z' },
       { status: InvoiceStatus.Completed, user: MOCK_USERS['user-4'], timestamp: '2023-11-07T14:00:00Z' },
    ],
    auditHistory: [],
  },
  {
    id: 'inv-8', // Paired with inv-7 to FAIL audit scenario 2
    applicant: MOCK_USERS['user-1'],
    invoiceNumber: 'INV-2023-008',
    vendor: '株式会社F',
    amount: 150000,
    issueDate: '2023-11-08',
    accountTitle: '広告宣伝費',
    purchasingCategory: 'マーケティング',
    status: InvoiceStatus.Completed,
    imageUrl: 'https://picsum.photos/seed/inv-8/600/800',
    isCorrectedByScrutinizer: false,
    history: [
       { status: InvoiceStatus.PendingManagerApproval, user: MOCK_USERS['user-1'], timestamp: '2023-11-09T09:00:00Z' },
       { status: InvoiceStatus.PendingVerification, user: MOCK_USERS['user-2'], timestamp: '2023-11-09T11:00:00Z' },
       { status: InvoiceStatus.PendingScrutiny, user: {id: 'system', name: 'LLM照合', role: UserRole.Admin}, timestamp: '2023-11-09T11:05:00Z' },
       { status: InvoiceStatus.Completed, user: MOCK_USERS['user-4'], timestamp: '2023-11-10T14:00:00Z' },
    ],
    auditHistory: [],
  },
  {
    id: 'inv-9',
    applicant: MOCK_USERS['user-7'],
    invoiceNumber: 'INV-2023-009',
    vendor: 'Hソリューションズ',
    amount: 250000,
    issueDate: '2023-11-10',
    accountTitle: '通信費',
    status: InvoiceStatus.PendingManagerApproval,
    imageUrl: 'https://picsum.photos/seed/inv-9/600/800',
    history: [
      { status: InvoiceStatus.PendingManagerApproval, user: MOCK_USERS['user-7'], timestamp: '2023-11-11T10:00:00Z' },
    ],
    auditHistory: [],
  },
  {
    id: 'inv-10',
    applicant: MOCK_USERS['user-1'],
    invoiceNumber: 'INV-2023-010',
    vendor: 'I電力',
    amount: 78000,
    issueDate: '2023-11-12',
    accountTitle: '水道光熱費',
    status: InvoiceStatus.ManagerRejected,
    imageUrl: 'https://picsum.photos/seed/inv-10/600/800',
    history: [
      { status: InvoiceStatus.PendingManagerApproval, user: MOCK_USERS['user-1'], timestamp: '2023-11-13T11:00:00Z' },
      { status: InvoiceStatus.ManagerRejected, user: MOCK_USERS['user-2'], timestamp: '2023-11-13T14:00:00Z', comment: '請求書の日付が正しくありません。' },
    ],
    auditHistory: [],
  },
  ...Array.from({ length: 15 }, (_, i) => {
    const id = i + 11;
    const applicant = id % 3 === 0 ? MOCK_USERS['user-7'] : MOCK_USERS['user-1'];
    const amount = (Math.floor(Math.random() * 40) + 1) * 10000;
    const issueDate = `2023-11-${String(id).padStart(2, '0')}`;
    const vendor = `株式会社 ${String.fromCharCode(74 + i)}`; // J, K, L...
    const statusCycle = [
        InvoiceStatus.Completed, 
        InvoiceStatus.PendingScrutiny, 
        InvoiceStatus.MismatchDetected, 
        InvoiceStatus.PendingManagerApproval,
        InvoiceStatus.Completed,
    ];
    const status = statusCycle[i % 5];
    
    let history;
    switch (status) {
        case InvoiceStatus.PendingManagerApproval:
            history = [{ status, user: applicant, timestamp: `${issueDate}T10:00:00Z` }];
            break;
        case InvoiceStatus.MismatchDetected:
             history = [
                { status: InvoiceStatus.PendingManagerApproval, user: applicant, timestamp: `${issueDate}T10:00:00Z` },
                { status: InvoiceStatus.PendingVerification, user: MOCK_USERS['user-2'], timestamp: `${issueDate}T11:00:00Z` },
                { status, user: {id: 'system', name: 'LLM照合', role: UserRole.Admin}, timestamp: `${issueDate}T11:05:00Z`, comment: "金額不一致の可能性" },
             ];
            break;
        case InvoiceStatus.PendingScrutiny:
            history = [
                { status: InvoiceStatus.PendingManagerApproval, user: applicant, timestamp: `${issueDate}T10:00:00Z` },
                { status: InvoiceStatus.PendingVerification, user: MOCK_USERS['user-8'], timestamp: `${issueDate}T12:00:00Z` },
                { status, user: {id: 'system', name: 'LLM照合', role: UserRole.Admin}, timestamp: `${issueDate}T12:05:00Z` },
            ];
            break;
        case InvoiceStatus.Completed:
        default:
             history = [
                { status: InvoiceStatus.PendingManagerApproval, user: applicant, timestamp: `${issueDate}T10:00:00Z` },
                { status: InvoiceStatus.PendingVerification, user: MOCK_USERS['user-2'], timestamp: `${issueDate}T13:00:00Z` },
                { status: InvoiceStatus.PendingScrutiny, user: {id: 'system', name: 'LLM照合', role: UserRole.Admin}, timestamp: `${issueDate}T13:05:00Z` },
                { status, user: MOCK_USERS['user-4'], timestamp: `${issueDate}T16:00:00Z`, comment: "完了" },
            ];
            break;
    }

    return {
      id: `inv-${id}`,
      applicant,
      invoiceNumber: `INV-2023-${String(id).padStart(3, '0')}`,
      vendor,
      amount,
      issueDate,
      accountTitle: MOCK_ACCOUNT_TITLES[i % MOCK_ACCOUNT_TITLES.length].name,
      purchasingCategory: MOCK_PURCHASING_CATEGORIES[i % MOCK_PURCHASING_CATEGORIES.length].name,
      status,
      imageUrl: `https://picsum.photos/seed/inv-${id}/600/800`,
      isCorrectedByScrutinizer: status === InvoiceStatus.Completed && i % 4 === 0,
      history,
      auditHistory: [],
    };
  }),
];

export const MOCK_AUDIT_SCENARIOS: AuditScenario[] = [
  {
    id: 'audit-1',
    name: '承認権限の妥当性チェック',
    description: '部長職以上が承認すべき50万円以上の申請が、適切に処理されているかを確認します。',
    prompt: `請求書の承認履歴（history）を確認してください。請求金額（amount）が50万円以上の場合、承認者（PendingVerificationステータスを付与したユーザー）の役職（title）が「部長」であることを確認してください。添付の規定も参考にしてください。もし違反している場合は、その理由を具体的に指摘してください。承認者がシステムの場合は無視してください。`,
    documents: [
      {
        name: '社内規定_承認権限一覧.txt',
        content: '## 承認権限規定 v1.2\n- 50万円未満の申請: 課長以上の承認が必要\n- 50万円以上500万円未満の申請: 部長以上の承認が必要\n- 500万円以上の申請: 役員承認が必要'
      }
    ],
    scope: 'single',
  },
  {
    id: 'audit-2',
    name: '短期集中発注のチェック',
    description: '特定のベンダーに対し、1週間以内に複数回の発注が行われていないか確認します。',
    prompt: `現在監査中の請求書（Current Invoice to Audit）について、全請求書リスト（All Other Invoices）の中に、同じベンダーから7日以内に発行された他の請求書がないか確認してください。もし存在する場合、分割発注の可能性があるとして指摘してください。`,
    documents: [],
    scope: 'all',
  }
];
