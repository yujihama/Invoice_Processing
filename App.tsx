import React, { useState, useMemo } from 'react';
import { UserRole } from './types';
import type { User } from './types';
import { AuthContext } from './contexts/AuthContext';
import { InvoiceProvider } from './contexts/InvoiceContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Header from './components/Header';
import ApplicantView from './views/ApplicantView';
import ManagerView from './views/ManagerView';
import AccountingView from './views/AccountingView';
import ScrutinizerView from './views/ScrutinizerView';
import PmoView from './views/PmoView';
import AdminView from './views/AdminView';
import AuditView from './views/AuditView';

const users: Record<UserRole, User> = {
  [UserRole.Applicant]: { id: 'user-1', name: '田中 太郎', role: UserRole.Applicant },
  [UserRole.Manager]: { id: 'user-2', name: '鈴木 一郎', role: UserRole.Manager },
  [UserRole.Accounting]: { id: 'user-3', name: '佐藤 花子', role: UserRole.Accounting },
  [UserRole.Scrutinizer]: { id: 'user-4', name: '高橋 次郎', role: UserRole.Scrutinizer },
  [UserRole.PMO]: { id: 'user-5', name: '伊藤 三郎', role: UserRole.PMO },
  [UserRole.Auditor]: { id: 'user-9', name: '監査 正', role: UserRole.Auditor },
  [UserRole.Admin]: { id: 'user-6', name: '渡辺 四郎', role: UserRole.Admin },
};

const App: React.FC = () => {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.Applicant);

  const currentUser = useMemo(() => users[currentUserRole], [currentUserRole]);

  const renderView = () => {
    switch (currentUserRole) {
      case UserRole.Applicant:
        return <ApplicantView />;
      case UserRole.Manager:
        return <ManagerView />;
      case UserRole.Accounting:
        return <AccountingView />;
      case UserRole.Scrutinizer:
        return <ScrutinizerView />;
      case UserRole.PMO:
        return <PmoView />;
      case UserRole.Auditor:
        return <AuditView />;
      case UserRole.Admin:
        return <AdminView />;
      default:
        return <ApplicantView />;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUserRole }}>
      <SettingsProvider>
        <InvoiceProvider>
          <div className="min-h-screen bg-gray-100 font-sans">
            <Header />
            <main className="p-4 sm:p-6 lg:p-8">
              {renderView()}
            </main>
          </div>
        </InvoiceProvider>
      </SettingsProvider>
    </AuthContext.Provider>
  );
};

export default App;