/**
 * Web View Component
 * Displays web content (simplified POC version using iframe)
 */

import React from 'react';
import type { WebItem } from '../../types/entities';

interface WebViewProps {
  item: WebItem;
}

export function WebView({ item }: WebViewProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '8px 16px',
        backgroundColor: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
        fontSize: '12px',
        color: 'var(--color-text-secondary)',
        zIndex: 1
      }}>
        {item.url}
      </div>
      <iframe
        src={item.url}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          marginTop: '32px'
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        title={item.title}
      />
    </div>
  );
}
