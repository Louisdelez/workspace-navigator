/**
 * AI Panel Component
 * Right sidebar for AI assistant integration
 */

import React from 'react';

interface AIPanelProps {
  provider: 'chatgpt' | 'claude' | 'gemini' | 'none';
  onProviderChange: (provider: 'chatgpt' | 'claude' | 'gemini' | 'none') => void;
}

const AI_URLS = {
  chatgpt: 'https://chat.openai.com',
  claude: 'https://claude.ai',
  gemini: 'https://gemini.google.com',
  none: ''
};

export function AIPanel({ provider, onProviderChange }: AIPanelProps) {
  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <h2>AI Assistant</h2>
        <select
          className="ai-provider-selector"
          value={provider}
          onChange={(e) => onProviderChange(e.target.value as any)}
        >
          <option value="none">None</option>
          <option value="chatgpt">ChatGPT</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
        </select>
      </div>

      <div className="ai-panel-content">
        {provider !== 'none' ? (
          <iframe
            src={AI_URLS[provider]}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            title={`${provider} AI Assistant`}
          />
        ) : (
          <div className="empty-state">
            <p>Select an AI provider to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
