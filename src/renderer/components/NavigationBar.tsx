/**
 * Navigation Bar Component
 * Back/Forward/Reload buttons and URL address bar
 */

import React, { useState, useEffect } from 'react';

export function NavigationBar() {
  const [url, setUrl] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [activeTab, setActiveTab] = useState<any | null>(null);

  useEffect(() => {
    // Load initial state
    updateNavigationState();

    // Subscribe to tab events
    window.electronAPI.tab.onEvent((event: any) => {
      if (event.type === 'switched' || event.type === 'opened' || event.type === 'updated') {
        updateNavigationState();
      } else if (event.type === 'closed') {
        updateNavigationState();
      }
    });
  }, []);

  async function updateNavigationState() {
    try {
      const tab = await window.electronAPI.tab.getActive();
      setActiveTab(tab);

      if (tab && tab.type === 'web') {
        setUrl(tab.url || '');
        const back = await window.electronAPI.tab.canGoBack();
        const forward = await window.electronAPI.tab.canGoForward();
        setCanGoBack(back);
        setCanGoForward(forward);
      } else {
        setUrl('');
        setCanGoBack(false);
        setCanGoForward(false);
      }
    } catch (error) {
      console.error('Failed to update navigation state:', error);
    }
  }

  async function handleGoBack() {
    try {
      await window.electronAPI.tab.goBack();
      updateNavigationState();
    } catch (error) {
      console.error('Failed to go back:', error);
    }
  }

  async function handleGoForward() {
    try {
      await window.electronAPI.tab.goForward();
      updateNavigationState();
    } catch (error) {
      console.error('Failed to go forward:', error);
    }
  }

  async function handleReload() {
    try {
      await window.electronAPI.tab.reload();
    } catch (error) {
      console.error('Failed to reload:', error);
    }
  }

  async function handleNavigate(e: React.FormEvent) {
    e.preventDefault();

    if (!url.trim()) return;

    try {
      // Add protocol if missing
      let navigateUrl = url.trim();
      if (!navigateUrl.startsWith('http://') && !navigateUrl.startsWith('https://')) {
        navigateUrl = 'https://' + navigateUrl;
      }

      await window.electronAPI.tab.navigate(navigateUrl);
      setUrl(navigateUrl);
    } catch (error) {
      console.error('Failed to navigate:', error);
      alert('Failed to navigate to URL');
    }
  }

  // Only show navigation bar for web tabs
  if (!activeTab || activeTab.type !== 'web') {
    return null;
  }

  return (
    <div className="navigation-bar">
      <div className="nav-controls">
        <button
          className="nav-button"
          onClick={handleGoBack}
          disabled={!canGoBack}
          title="Go back"
          aria-label="Go back"
        >
          ←
        </button>

        <button
          className="nav-button"
          onClick={handleGoForward}
          disabled={!canGoForward}
          title="Go forward"
          aria-label="Go forward"
        >
          →
        </button>

        <button
          className="nav-button"
          onClick={handleReload}
          title="Reload"
          aria-label="Reload"
        >
          ⟳
        </button>
      </div>

      <form className="address-bar" onSubmit={handleNavigate}>
        <input
          type="text"
          className="address-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL or search..."
          aria-label="Address bar"
        />
      </form>
    </div>
  );
}
