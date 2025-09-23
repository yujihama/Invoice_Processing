
import React, { createContext, useState, useContext, useMemo } from 'react';
import { LlmProvider, AuditScenario } from '../types';
import { MOCK_AUDIT_SCENARIOS } from '../mockData';

interface SettingsContextType {
  llmProvider: LlmProvider;
  setLlmProvider: (provider: LlmProvider) => void;
  auditScenarios: AuditScenario[];
  addAuditScenario: (scenario: AuditScenario) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [llmProvider, setLlmProvider] = useState<LlmProvider>(LlmProvider.Gemini);
  const [auditScenarios, setAuditScenarios] = useState<AuditScenario[]>(MOCK_AUDIT_SCENARIOS);

  const addAuditScenario = (scenario: AuditScenario) => {
    setAuditScenarios(prev => [...prev, scenario]);
  };

  const value = useMemo(() => ({
    llmProvider,
    setLlmProvider,
    auditScenarios,
    addAuditScenario,
  }), [llmProvider, auditScenarios]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};