import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntries } from '../useEntries';

describe('useEntries', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty entries on first load', () => {
    const { result } = renderHook(() => useEntries());
    expect(result.current.entries).toEqual([]);
  });

  it('setOverride adds a new entry', () => {
    const { result } = renderHook(() => useEntries());

    act(() => {
      result.current.setOverride(1, '2024-01-18', { actualHonorEndOfDay: 5000 });
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toEqual({
      dayIndex: 1,
      date: '2024-01-18',
      overrides: { actualHonorEndOfDay: 5000 },
    });
  });

  it('setOverride updates existing entry', () => {
    const { result } = renderHook(() => useEntries());

    act(() => {
      result.current.setOverride(1, '2024-01-18', { actualHonorEndOfDay: 5000 });
    });

    act(() => {
      result.current.setOverride(1, '2024-01-18', { actualHonorEndOfDay: 6000 });
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].overrides?.actualHonorEndOfDay).toBe(6000);
  });

  it('setOverride maintains sorted order by dayIndex', () => {
    const { result } = renderHook(() => useEntries());

    act(() => {
      result.current.setOverride(3, '2024-01-20', { actualHonorEndOfDay: 3000 });
      result.current.setOverride(1, '2024-01-18', { actualHonorEndOfDay: 1000 });
      result.current.setOverride(2, '2024-01-19', { actualHonorEndOfDay: 2000 });
    });

    expect(result.current.entries[0].dayIndex).toBe(1);
    expect(result.current.entries[1].dayIndex).toBe(2);
    expect(result.current.entries[2].dayIndex).toBe(3);
  });

  it('clearOverride removes specific entry', () => {
    const { result } = renderHook(() => useEntries());

    act(() => {
      result.current.setOverride(1, '2024-01-18', { actualHonorEndOfDay: 1000 });
      result.current.setOverride(2, '2024-01-19', { actualHonorEndOfDay: 2000 });
    });

    act(() => {
      result.current.clearOverride(1);
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].dayIndex).toBe(2);
  });

  it('clearAllOverrides removes all entries', () => {
    const { result } = renderHook(() => useEntries());

    act(() => {
      result.current.setOverride(1, '2024-01-18', { actualHonorEndOfDay: 1000 });
      result.current.setOverride(2, '2024-01-19', { actualHonorEndOfDay: 2000 });
      result.current.setOverride(3, '2024-01-20', { actualHonorEndOfDay: 3000 });
    });

    expect(result.current.entries).toHaveLength(3);

    act(() => {
      result.current.clearAllOverrides();
    });

    expect(result.current.entries).toHaveLength(0);
  });

  it('setEntries replaces all entries', () => {
    const { result } = renderHook(() => useEntries());

    act(() => {
      result.current.setOverride(1, '2024-01-18', { actualHonorEndOfDay: 1000 });
    });

    const newEntries = [
      { dayIndex: 5, date: '2024-01-22', overrides: { actualHonorEndOfDay: 5000 } },
      { dayIndex: 6, date: '2024-01-23', overrides: { actualMarksPerBG: 100 } },
    ];

    act(() => {
      result.current.setEntries(newEntries);
    });

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0].dayIndex).toBe(5);
    expect(result.current.entries[1].dayIndex).toBe(6);
  });

  it('persists entries to localStorage', () => {
    const { result } = renderHook(() => useEntries());

    act(() => {
      result.current.setOverride(1, '2024-01-18', { actualHonorEndOfDay: 5000 });
    });

    const { result: result2 } = renderHook(() => useEntries());

    expect(result2.current.entries).toHaveLength(1);
    expect(result2.current.entries[0].overrides?.actualHonorEndOfDay).toBe(5000);
  });

  it('supports partial overrides (honor only)', () => {
    const { result } = renderHook(() => useEntries());

    act(() => {
      result.current.setOverride(1, '2024-01-18', { actualHonorEndOfDay: 5000 });
    });

    expect(result.current.entries[0].overrides?.actualHonorEndOfDay).toBe(5000);
    expect(result.current.entries[0].overrides?.actualMarksPerBG).toBeUndefined();
  });

  it('supports partial overrides (marks only)', () => {
    const { result } = renderHook(() => useEntries());

    act(() => {
      result.current.setOverride(1, '2024-01-18', { actualMarksPerBG: 100 });
    });

    expect(result.current.entries[0].overrides?.actualMarksPerBG).toBe(100);
    expect(result.current.entries[0].overrides?.actualHonorEndOfDay).toBeUndefined();
  });
});
