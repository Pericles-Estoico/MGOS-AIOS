'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  users: { name: string };
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load search history from localStorage
  const [history, setHistory] = useState<string[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('search_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
        if (!open) {
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }

      // Arrow keys for navigation
      if (open && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter' && results[selectedIndex]) {
          e.preventDefault();
          handleSelectResult(results[selectedIndex]);
        }
      }

      // Escape to close
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/tasks/search?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.data || []);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectResult = (result: SearchResult) => {
    // Save to history
    const newHistory = [
      query,
      ...history.filter((h) => h !== query),
    ].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));

    // Navigate
    router.push(`/tasks/${result.id}`);
    setOpen(false);
    setQuery('');
  };

  const handleSelectHistory = (historyItem: string) => {
    setQuery(historyItem);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  return (
    <div ref={searchRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
      >
        <span className="text-lg">🔍</span>
        <span className="flex-1 text-left">Search tasks...</span>
        <kbd className="px-2 py-1 bg-white rounded text-xs border border-gray-300">
          {typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().includes('MAC')
            ? '⌘K'
            : 'Ctrl+K'}
        </kbd>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by title, description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Results or History */}
          <div className="max-h-64 overflow-y-auto">
            {query.trim() ? (
              // Search Results
              <>
                {loading && (
                  <div className="p-4 text-center text-gray-600 text-sm">
                    Searching...
                  </div>
                )}
                {!loading && results.length === 0 ? (
                  <div className="p-4 text-center text-gray-600 text-sm">
                    No results found
                  </div>
                ) : (
                  results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                        index === selectedIndex ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-semibold text-gray-900">
                        {result.title}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-1">
                        {result.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-gray-600">
                          {result.users.name}
                        </span>
                        <span className={`font-semibold ${getPriorityColor(result.priority)}`}>
                          {result.priority}
                        </span>
                        <span className="text-gray-500">{result.status}</span>
                      </div>
                    </button>
                  ))
                )}
              </>
            ) : (
              // Search History
              <>
                {history.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50">
                      Recent Searches
                    </div>
                    {history.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleSelectHistory(item)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                      >
                        🕐 {item}
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex justify-between">
            <span>
              {results.length > 0 && `${results.length} result${results.length !== 1 ? 's' : ''}`}
            </span>
            <span>↓↑ Navigate, ⏎ Select, Esc Close</span>
          </div>
        </div>
      )}
    </div>
  );
}
