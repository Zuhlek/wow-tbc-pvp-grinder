import { useMemo } from 'react';
import type { AppConfig, DayEntry, DayResult, ValidationResult } from '../types';
import {
  computeForecast,
  computeForecastManual,
  computeRequiredDailyGames,
  findGoalReachedDay,
} from '../logic/calculations';
import { validateConfig, validateConfigManual } from '../logic/validation';

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
  const isManualMode = config.calculationMode === 'manual';

  // Validate config first (different validation for manual mode)
  const validation = useMemo(
    () => (isManualMode ? validateConfigManual(config) : validateConfig(config)),
    [config, isManualMode]
  );

  // Compute required daily games (only in auto mode)
  const dailyGamesRequired = useMemo(() => {
    if (!validation.valid) {
      return 0;
    }
    if (isManualMode) {
      return config.manualGamesPerDay;
    }
    return computeRequiredDailyGames(config);
  }, [config, validation.valid, isManualMode]);

  // Compute full forecast (memoized)
  const forecastResult = useMemo(() => {
    if (!validation.valid) {
      return { results: [], dailyGamesRequired: 0 };
    }
    if (isManualMode) {
      return computeForecastManual(config, entries, config.manualGamesPerDay);
    }
    return computeForecast(config, entries, dailyGamesRequired);
  }, [config, entries, dailyGamesRequired, validation.valid, isManualMode]);

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
