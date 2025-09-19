
import React, { createContext, useState, useContext, useMemo } from 'react';
import { LlmProvider } from '../types';

interface SettingsContextType {
  llmProvider: LlmProvider;
  setLlmProvider: (provider: LlmProvider) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [llmProvider, setLlmProvider] = useState<LlmProvider>(LlmProvider.Gemini);

  const value = useMemo(() => ({
    llmProvider,
    setLlmProvider,
  }), [llmProvider]);

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
