import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

interface ChatAnalysisProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => void;
  isAnalyzing: boolean;
  error: string | null;
}

const ChatAnalysis: React.FC<ChatAnalysisProps> = ({ messages, onSendMessage, isAnalyzing, error }) => {
  const [prompt, setPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
    } else {
        scrollToBottom();
    }
  }, [messages, isAnalyzing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(prompt);
    setPrompt('');
  };

  return (
    <div className="bg-white shadow-lg rounded-xl flex flex-col h-[60vh] max-h-[700px]">
        <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">AI分析チャット</h2>
        </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {message.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>
            )}
            <div className={`max-w-xl p-4 rounded-xl whitespace-pre-wrap ${message.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
              <p>{message.content}</p>
            </div>
             {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0">経</div>
            )}
          </div>
        ))}
        {isAnalyzing && (
            <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>
                <div className="max-w-xl p-4 rounded-xl bg-gray-100 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <p className="text-gray-600">分析中...</p>
                </div>
            </div>
        )}
        {error && (
           <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold flex-shrink-0">!</div>
                <div className="max-w-xl p-4 rounded-xl bg-red-100 text-red-700">
                    <p>エラーが発生しました: {error}</p>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-gray-50 rounded-b-xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="質問を入力してください..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isAnalyzing}
            aria-label="Chat input"
          />
          <button
            type="submit"
            disabled={isAnalyzing || !prompt}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAnalysis;