import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfig } from '../useConfig';

describe('useConfig', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default config on first load', () => {
    const { result } = renderHook(() => useConfig());

    expect(result.current.config).toBeDefined();
    expect(result.current.config.winRate).toBe(0.5);
    expect(result.current.config.honorTarget).toBe(75000);
    expect(result.current.config.phase).toBe('classic');
    expect(result.current.config.bgHonor.wsg.honorPerWin).toBe(785);
  });

  it('validates config and returns validation result', () => {
    const { result } = renderHook(() => useConfig());

    expect(result.current.validation.valid).toBe(true);
    expect(result.current.validation.errors).toHaveLength(0);
  });

  it('updateConfig updates partial config', () => {
    const { result } = renderHook(() => useConfig());

    act(() => {
      result.current.updateConfig({ winRate: 0.65, honorTarget: 50000 });
    });

    expect(result.current.config.winRate).toBe(0.65);
    expect(result.current.config.honorTarget).toBe(50000);
    // Other values unchanged
    expect(result.current.config.marksThresholdPerBG).toBe(50);
  });

  it('updateBGHonor updates BG honor values', () => {
    const { result } = renderHook(() => useConfig());

    act(() => {
      result.current.updateBGHonor('wsg', { honorPerWin: 800, honorPerLoss: 300 });
    });

    expect(result.current.config.bgHonor.wsg.honorPerWin).toBe(800);
    expect(result.current.config.bgHonor.wsg.honorPerLoss).toBe(300);
    // Other BGs unchanged
    expect(result.current.config.bgHonor.ab.honorPerWin).toBe(626);
  });

  it('updateBGHonor updates partial BG honor values', () => {
    const { result } = renderHook(() => useConfig());
    const originalLoss = result.current.config.bgHonor.av.honorPerLoss;

    act(() => {
      result.current.updateBGHonor('av', { honorPerWin: 700 });
    });

    expect(result.current.config.bgHonor.av.honorPerWin).toBe(700);
    expect(result.current.config.bgHonor.av.honorPerLoss).toBe(originalLoss);
  });

  it('resetConfig resets to default', () => {
    const { result } = renderHook(() => useConfig());

    act(() => {
      result.current.updateConfig({ winRate: 0.9, honorTarget: 100000 });
    });

    expect(result.current.config.winRate).toBe(0.9);

    act(() => {
      result.current.resetConfig();
    });

    expect(result.current.config.winRate).toBe(0.5);
    expect(result.current.config.honorTarget).toBe(75000);
  });

  it('setConfig replaces entire config', () => {
    const { result } = renderHook(() => useConfig());

    const newConfig = {
      ...result.current.config,
      winRate: 0.75,
      honorTarget: 60000,
      startingHonor: 10000,
    };

    act(() => {
      result.current.setConfig(newConfig);
    });

    expect(result.current.config.winRate).toBe(0.75);
    expect(result.current.config.honorTarget).toBe(60000);
    expect(result.current.config.startingHonor).toBe(10000);
  });

  it('persists config to localStorage', () => {
    const { result } = renderHook(() => useConfig());

    act(() => {
      result.current.updateConfig({ winRate: 0.8 });
    });

    // Re-render hook to simulate page refresh
    const { result: result2 } = renderHook(() => useConfig());

    expect(result2.current.config.winRate).toBe(0.8);
  });

  it('returns invalid validation for bad config', () => {
    const { result } = renderHook(() => useConfig());

    act(() => {
      result.current.updateConfig({ winRate: 1.5 }); // Invalid: > 1
    });

    expect(result.current.validation.valid).toBe(false);
    expect(result.current.validation.errors).toContain('winRate must be between 0 and 1');
  });
});
