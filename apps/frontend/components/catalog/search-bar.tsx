'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { debounce } from '@/lib/utils/responsive';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  value?: string;
  onChange?: (query: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function SearchBar({
  onSearch,
  value: controlledValue,
  onChange,
  placeholder = 'Search listings...',
  className,
  debounceMs = 300,
}: SearchBarProps) {
  const [internalQuery, setInternalQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Use controlled value if provided, otherwise use internal state
  const query = controlledValue !== undefined ? controlledValue : internalQuery;
  const isControlled = controlledValue !== undefined;

  // Use onSearch if provided, otherwise use onChange
  const handleSearch = onSearch || onChange;

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (handleSearch && typeof handleSearch === 'function') {
        handleSearch(searchQuery);
      }
      setIsSearching(false);
    }, debounceMs),
    [handleSearch, debounceMs]
  );

  useEffect(() => {
    if (!handleSearch || typeof handleSearch !== 'function') {
      return; // Don't do anything if no handler is provided
    }

    if (query.trim()) {
      setIsSearching(true);
      debouncedSearch(query);
    } else {
      setIsSearching(false);
      handleSearch('');
    }
  }, [query, debouncedSearch, handleSearch]);

  const handleChange = (newQuery: string) => {
    if (!isControlled) {
      setInternalQuery(newQuery);
    }
    if (onChange) {
      onChange(newQuery);
    }
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalQuery('');
    }
    if (handleSearch && typeof handleSearch === 'function') {
      handleSearch('');
    }
    setIsSearching(false);
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
