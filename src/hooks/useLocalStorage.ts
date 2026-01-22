import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for persisting state to localStorage.
 * Handles JSON serialization/deserialization and storage errors gracefully.
 *
 * @param key - The localStorage key to use
 * @param initialValue - The initial value if nothing is stored
 * @returns A tuple of [value, setValue, clearValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize state with stored value merged with initial value (objects only, not arrays)
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const stored = JSON.parse(item) as T;
        // Merge stored with initial to fill in any missing fields (only for plain objects)
        if (
          typeof stored === 'object' &&
          stored !== null &&
          !Array.isArray(stored) &&
          typeof initialValue === 'object' &&
          !Array.isArray(initialValue)
        ) {
          return { ...initialValue, ...stored } as T;
        }
        return stored;
      }
      return initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Wrapped setter that handles function updates
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  // Clear the stored value and reset to initial
  const clearValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error clearing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, clearValue];
}
