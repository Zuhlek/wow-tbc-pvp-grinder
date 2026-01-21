import { useMemo } from 'react';
import type { AppConfig, DayEntry, DayResult, ValidationResult } from '../types';
import {
  computeForecast,
  computeRequiredDailyGames,
  findGoalReachedDay,
} from '../logic/calculations';
import { validateConfig } from '../logic/validation';

interface UseForecastReturn {
  results: DayResult[];
  dailyGamesRequired: number;
  goalDay: DayResult | null;
  validation: ValidationResult;
  isValid: boolean;
}

/**
 * Hook for computing the forecast based on config and entries.
 * Memoizes the computation for performance.
 */
export function useForecast(config: AppConfig, entries: DayEntry[]): UseForecastReturn {
  // Validate config first
  const validation = useMemo(() => validateConfig(config), [config]);

  // Compute required daily games (memoized)
  const dailyGamesRequired = useMemo(() => {
    if (!validation.valid) {
      return 0;
    }
    return computeRequiredDailyGames(config);
  }, [config, validation.valid]);

  // Compute full forecast (memoized)
  const forecastResult = useMemo(() => {
    if (!validation.valid) {
      return { results: [], dailyGamesRequired: 0 };
    }
    return computeForecast(config, entries, dailyGamesRequired);
  }, [config, entries, dailyGamesRequired, validation.valid]);

  // Find goal day (memoized)
  const goalDay = useMemo(() => {
    if (!validation.valid || forecastResult.results.length === 0) {
      return null;
    }
    return findGoalReachedDay(forecastResult.results, config.honorTarget);
  }, [forecastResult.results, config.honorTarget, validation.valid]);

  return {
    results: forecastResult.results,
    dailyGamesRequired,
    goalDay,
    validation,
    isValid: validation.valid,
  };
}
