import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useForecast } from '../useForecast';
import type { AppConfig, DayEntry } from '../../types';

const validConfig: AppConfig = {
  startDate: '2024-01-18',
  tbcStartDate: '2024-01-25',
  endDate: '2024-01-27',
  classicConfig: {
    name: 'classic',
    numBGs: 3,
    marksPerTurnIn: 3,
    honorPerWin: 200,
    honorPerLoss: 100,
    dailyQuestHonorBase: 419,
    turnInHonorBase: 314,
  },
  tbcConfig: {
    name: 'tbc',
    numBGs: 4,
    marksPerTurnIn: 4,
    honorPerWin: 300,
    honorPerLoss: 150,
    dailyQuestHonorBase: 600,
    turnInHonorBase: 400,
  },
  winRate: 0.5,
  marksThresholdPerBG: 50,
  enableTurnIns: true,
  bgHonorMult: 1.0,
  questHonorMult: 1.0,
  honorTarget: 20000,
  startingHonor: 0,
  startingMarks: 0,
};

describe('useForecast', () => {
  it('computes forecast results', () => {
    const { result } = renderHook(() => useForecast(validConfig, []));

    expect(result.current.isValid).toBe(true);
    expect(result.current.results.length).toBe(10); // 10 days
    expect(result.current.dailyGamesRequired).toBeGreaterThan(0);
  });

  it('returns valid validation for valid config', () => {
    const { result } = renderHook(() => useForecast(validConfig, []));

    expect(result.current.validation.valid).toBe(true);
    expect(result.current.validation.errors).toHaveLength(0);
  });

  it('returns invalid validation for invalid config', () => {
    const invalidConfig: AppConfig = {
      ...validConfig,
      winRate: 1.5, // Invalid
    };

    const { result } = renderHook(() => useForecast(invalidConfig, []));

    expect(result.current.isValid).toBe(false);
    expect(result.current.validation.errors).toContain('winRate must be between 0 and 1');
    expect(result.current.results).toHaveLength(0);
    expect(result.current.dailyGamesRequired).toBe(0);
  });

  it('finds goal day when target is reachable', () => {
    const { result } = renderHook(() => useForecast(validConfig, []));

    expect(result.current.goalDay).not.toBeNull();
    expect(result.current.goalDay?.honorEndOfDay).toBeGreaterThanOrEqual(
      validConfig.honorTarget
    );
  });

  it('returns null goalDay when target is unreachable', () => {
    const config: AppConfig = {
      ...validConfig,
      honorTarget: 999999999,
    };

    const { result } = renderHook(() => useForecast(config, []));

    expect(result.current.goalDay).toBeNull();
  });

  it('applies overrides from entries', () => {
    const entries: DayEntry[] = [
      {
        dayIndex: 1,
        date: '2024-01-18',
        overrides: { actualHonorEndOfDay: 10000 },
      },
    ];

    const { result } = renderHook(() => useForecast(validConfig, entries));

    expect(result.current.results[0].honorEndOfDay).toBe(10000);
    expect(result.current.results[0].overrideApplied).toBe(true);
    // Day 2 should start from the overridden value
    expect(result.current.results[1].honorStart).toBe(10000);
  });

  it('calculates dailyGamesRequired', () => {
    const { result } = renderHook(() => useForecast(validConfig, []));

    expect(result.current.dailyGamesRequired).toBeGreaterThan(0);
    // Verify the last day reaches the target
    const lastDay = result.current.results[result.current.results.length - 1];
    expect(lastDay.honorEndOfDay).toBeGreaterThanOrEqual(validConfig.honorTarget);
  });

  it('returns 0 dailyGamesRequired when starting honor exceeds target', () => {
    const config: AppConfig = {
      ...validConfig,
      startingHonor: 25000,
      honorTarget: 20000,
    };

    const { result } = renderHook(() => useForecast(config, []));

    expect(result.current.dailyGamesRequired).toBe(0);
    expect(result.current.goalDay?.dayIndex).toBe(1);
  });

  it('handles phase transitions correctly', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-24',
      tbcStartDate: '2024-01-25',
      endDate: '2024-01-26',
    };

    const { result } = renderHook(() => useForecast(config, []));

    expect(result.current.results[0].phase).toBe('classic');
    expect(result.current.results[1].phase).toBe('tbc');
    expect(result.current.results[2].phase).toBe('tbc');
  });

  it('recomputes results when config changes', () => {
    const { result, rerender } = renderHook(
      ({ config, entries }) => useForecast(config, entries),
      { initialProps: { config: validConfig, entries: [] as DayEntry[] } }
    );

    const firstDailyGames = result.current.dailyGamesRequired;

    // Change config to require more games
    const newConfig = { ...validConfig, honorTarget: 40000 };
    rerender({ config: newConfig, entries: [] });

    // Should have different required games
    expect(result.current.dailyGamesRequired).toBeGreaterThan(firstDailyGames);
  });
});
