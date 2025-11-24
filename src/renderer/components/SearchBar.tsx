/**
 * SearchBar Component - T046
 * Provides debounced search across workspace items (web items and notes)
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Item } from '../../types/entities';

interface SearchBarProps {
  workspaceId: string | null;
  onItemSelect: (itemId: string) => void;
}

export function SearchBar({ workspaceId, onItemSelect }: SearchBarProps) {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const searchBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search (300ms)
  useEffect(() => {
    if (!workspaceId) {
      setResults([]);
      return;
    }

    if (query.trim().length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const searchResults = await window.electronAPI.workspace.search(workspaceId, query);
        setResults(searchResults);
        setShowResults(true);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, workspaceId]);

  // Close results dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showResults || results.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        event.preventDefault();
        if (results[selectedIndex]) {
          handleItemClick(results[selectedIndex].id);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setShowResults(false);
        inputRef.current?.blur();
        break;
    }
  }

  function handleItemClick(itemId: string) {
    onItemSelect(itemId);
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.blur();
  }

  function getItemIcon(item: Item): string {
    return item.itemType === 'web' ? '🌐' : '📝';
  }

  return (
    <div className="search-bar-container" ref={searchBarRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search workspace..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!workspaceId}
        />
        {isSearching && <span className="search-spinner">⏳</span>}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results-dropdown">
          {results.map((item, index) => (
            <div
              key={item.id}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleItemClick(item.id)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="search-result-icon">{getItemIcon(item)}</span>
              <div className="search-result-content">
                <div className="search-result-title">{item.title}</div>
                {item.itemType === 'web' && (
                  <div className="search-result-url">{(item as any).url}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && query.trim().length > 0 && results.length === 0 && !isSearching && (
        <div className="search-results-dropdown">
          <div className="search-no-results">No items found for "{query}"</div>
        </div>
      )}
    </div>
  );
}
