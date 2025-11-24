/**
 * AI Panel Component (T041)
 * Right sidebar for AI assistant integration
 * Uses BrowserView (not iframe) for better isolation and session management
 */

import React, { useState, useEffect } from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';

interface AIPanelProps {
  provider: 'chatgpt' | 'claude' | 'gemini' | 'custom' | 'none';
  onProviderChange: (provider: 'chatgpt' | 'claude' | 'gemini' | 'custom' | 'none') => void;
}

interface AIProvider {
  id: 'chatgpt' | 'claude' | 'gemini' | 'custom' | 'none';
  name: string;
  url: string;
}

const AI_PROVIDERS: AIProvider[] = [
  { id: 'none', name: 'None', url: '' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' },
  { id: 'custom', name: 'Custom URL', url: '' }
];

const STORAGE_KEY_CUSTOM_URL = 'ai-panel-custom-url';

export function AIPanel({ provider, onProviderChange }: AIPanelProps) {
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Load custom URL from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEY_CUSTOM_URL);
    if (savedUrl) {
      setCustomUrl(savedUrl);
    }
  }, []);

  // Switch AI provider via IPC when provider changes
  useEffect(() => {
    if (provider === 'none') {
      // Don't create AI view for 'none'
      return;
    }

    const selectedProvider = AI_PROVIDERS.find(p => p.id === provider);
    if (!selectedProvider) return;

    // For custom provider, use customUrl
    const url = provider === 'custom' ? customUrl : selectedProvider.url;

    // Skip if custom selected but no URL provided
    if (provider === 'custom' && !url) {
      return;
    }

    handleSwitchProvider(provider, url);
  }, [provider, customUrl]);

  async function handleSwitchProvider(providerId: string, url: string) {
    try {
      setIsLoading(true);
      setError('');

      // Call IPC to switch AI provider (T042 will implement this handler)
      await window.electronAPI.ai.switchProvider(providerId, url);

      setIsLoading(false);
    } catch (err) {
      setError(`Failed to load ${providerId}: ${(err as Error).message}`);
      setIsLoading(false);
    }
  }

  function handleProviderChange(newProvider: string) {
    onProviderChange(newProvider as any);
  }

  function handleCustomUrlChange(url: string) {
    setCustomUrl(url);
    localStorage.setItem(STORAGE_KEY_CUSTOM_URL, url);
  }

  function handleCustomUrlSubmit() {
    if (!customUrl) {
      setError('Please enter a valid URL');
      return;
    }

    // Validate URL format
    try {
      new URL(customUrl);
      handleSwitchProvider('custom', customUrl);
    } catch {
      setError('Invalid URL format. Please enter a valid URL (e.g., https://example.com)');
    }
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <h3 className="ai-panel-title">AI Assistant</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="ai-provider-selector"
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            {AI_PROVIDERS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ThemeSwitcher />
        </div>

        {/* Custom URL input (shown when custom provider selected) */}
        {provider === 'custom' && (
          <div className="custom-url-input-container">
            <input
              type="url"
              className="custom-url-input"
              placeholder="https://your-ai-provider.com"
              value={customUrl}
              onChange={(e) => handleCustomUrlChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomUrlSubmit();
                }
              }}
            />
            <button
              className="custom-url-submit"
              onClick={handleCustomUrlSubmit}
              disabled={!customUrl}
            >
              Load
            </button>
          </div>
        )}
      </div>

      <div className="ai-panel-content">
        {/* Loading state */}
        {isLoading && (
          <div className="ai-loading-state">
            <div className="spinner"></div>
            <p>Loading {provider}...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="ai-error-state">
            <p className="error-message">{error}</p>
            <button
              className="retry-button"
              onClick={() => {
                const selectedProvider = AI_PROVIDERS.find(p => p.id === provider);
                if (selectedProvider) {
                  const url = provider === 'custom' ? customUrl : selectedProvider.url;
                  handleSwitchProvider(provider, url);
                }
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state (no provider selected) */}
        {provider === 'none' && !isLoading && !error && (
          <div className="ai-empty-state">
            <p>Select an AI provider to get started.</p>
            <p className="ai-empty-hint">Choose ChatGPT, Claude, Gemini, or enter a custom URL.</p>
          </div>
        )}

        {/* BrowserView container (AI provider will be rendered here by main process) */}
        {provider !== 'none' && !error && (
          <div className="ai-browser-view-container" id="ai-browser-view">
            {/* BrowserView will be positioned here by main process */}
          </div>
        )}
      </div>
    </div>
  );
}
