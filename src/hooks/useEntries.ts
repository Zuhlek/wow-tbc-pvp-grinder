import { useCallback } from 'react';
import type { DayEntry, DayOverrides } from '../types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'wow-pvp-grinder-entries';

interface UseEntriesReturn {
  entries: DayEntry[];
  setOverride: (dayIndex: number, date: string, overrides: DayOverrides) => void;
  clearOverride: (dayIndex: number) => void;
  clearAllOverrides: () => void;
  setEntries: (entries: DayEntry[]) => void;
}

/**
 * Hook for managing day entries (overrides) with localStorage persistence.
 */
export function useEntries(): UseEntriesReturn {
  const [entries, setEntriesInternal, clearEntries] = useLocalStorage<DayEntry[]>(
    STORAGE_KEY,
    []
  );

  // Set or update an override for a specific day
  const setOverride = useCallback(
    (dayIndex: number, date: string, overrides: DayOverrides) => {
      setEntriesInternal((prev) => {
        // Remove existing entry for this day if present
        const filtered = prev.filter((e) => e.dayIndex !== dayIndex);
        // Add new entry
        return [...filtered, { dayIndex, date, overrides }].sort(
          (a, b) => a.dayIndex - b.dayIndex
        );
      });
    },
    [setEntriesInternal]
  );

  // Clear override for a specific day
  const clearOverride = useCallback(
    (dayIndex: number) => {
      setEntriesInternal((prev) => prev.filter((e) => e.dayIndex !== dayIndex));
    },
    [setEntriesInternal]
  );

  // Clear all overrides
  const clearAllOverrides = useCallback(() => {
    clearEntries();
  }, [clearEntries]);

  // Set all entries (for import)
  const setEntries = useCallback(
    (newEntries: DayEntry[]) => {
      setEntriesInternal(newEntries);
    },
    [setEntriesInternal]
  );

  return {
    entries,
    setOverride,
    clearOverride,
    clearAllOverrides,
    setEntries,
  };
}
