import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useForecast } from '../useForecast';
import type { AppConfig, DayEntry, BGHonorConfig } from '../../types';

const simpleBGHonor: BGHonorConfig = {
  wsg: { honorPerWin: 200, honorPerLoss: 100 },
  ab: { honorPerWin: 200, honorPerLoss: 100 },
  av: { honorPerWin: 200, honorPerLoss: 100 },
  eots: { honorPerWin: 200, honorPerLoss: 100 },
};

const validConfig: AppConfig = {
  startDate: '2024-01-18',
  endDate: '2024-01-27',
  phase: 'classic',
  bgHonor: simpleBGHonor,
  dailyQuestHonor: 419,
  turnInHonor: 314,
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

  it('handles phase selection correctly', () => {
    const classicConfig: AppConfig = {
      ...validConfig,
      phase: 'classic',
      marksThresholdPerBG: 50,
    };

    const tbcConfig: AppConfig = {
      ...validConfig,
      phase: 'tbc',
      marksThresholdPerBG: 50,
    };

    const { result: classicResult } = renderHook(() => useForecast(classicConfig, []));
    const { result: tbcResult } = renderHook(() => useForecast(tbcConfig, []));

    // Classic uses 3 BGs, TBC uses 4 BGs for marks reserve
    expect(classicResult.current.results[0].marksReserve).toBe(150); // 50 * 3
    expect(tbcResult.current.results[0].marksReserve).toBe(200); // 50 * 4
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
