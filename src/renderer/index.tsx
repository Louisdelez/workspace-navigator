/**
 * Renderer Process Entry Point
 * T053: Optimized for fast startup
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

console.log('Renderer process started');
console.log('electronAPI available?', typeof window.electronAPI !== 'undefined');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
} else {
  const root = ReactDOM.createRoot(rootElement);

  // T053: Remove StrictMode in production for better performance
  // StrictMode causes double rendering which slows down development
  const isDev = import.meta.env.DEV;

  root.render(
    isDev ? (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    ) : (
      <App />
    )
  );

  console.log('React app rendered');
}
