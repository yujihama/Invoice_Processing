

import { useSettings } from '../contexts/SettingsContext';
import * as geminiService from '../services/geminiService';
import * as azureOpenaiService from '../services/azureOpenaiService';
import { LlmProvider } from '../types';

// A mapping from provider enum to the actual service module
const serviceMap = {
    [LlmProvider.Gemini]: geminiService,
    [LlmProvider.Azure]: azureOpenaiService,
};

/**
 * Custom hook to get the correct LLM service implementation based on user settings.
 * This acts as an abstraction layer, so components don't need to be aware of
 * which LLM provider is currently active.
 * @returns The set of service functions (extractInvoiceData, etc.) for the active LLM provider.
 */
export const useLlmService = () => {
  const { llmProvider } = useSettings();
  
  // Return the service module corresponding to the current provider
  return serviceMap[llmProvider];
};