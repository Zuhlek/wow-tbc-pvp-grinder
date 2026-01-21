import { describe, it, expect } from 'vitest';
import type { AppConfig, DayResult, DayEntry, BGHonorConfig } from '../../types';
import {
  expectedMarksPerGame,
  expectedHonorForBG,
  expectedHonorPerGame,
  computeTurnInSets,
  computeDayResult,
  computeForecast,
  findGoalReachedDay,
  computeRequiredDailyGames,
} from '../calculations';
import { validateConfig } from '../validation';

// Default BG honor values based on observed data
const defaultBGHonor: BGHonorConfig = {
  wsg: { honorPerWin: 785, honorPerLoss: 271 },
  ab: { honorPerWin: 626, honorPerLoss: 318 },
  av: { honorPerWin: 687, honorPerLoss: 374 },
  eots: { honorPerWin: 700, honorPerLoss: 350 }, // Estimated for TBC
};

// Simple BG honor for easier test calculations
const simpleBGHonor: BGHonorConfig = {
  wsg: { honorPerWin: 200, honorPerLoss: 100 },
  ab: { honorPerWin: 200, honorPerLoss: 100 },
  av: { honorPerWin: 200, honorPerLoss: 100 },
  eots: { honorPerWin: 200, honorPerLoss: 100 },
};

const validConfig: AppConfig = {
  startDate: '2024-01-18',
  endDate: '2024-02-15',
  phase: 'classic',
  bgHonor: simpleBGHonor,
  dailyQuestHonor: 419,
  turnInHonor: 314,
  winRate: 0.5,
  marksThresholdPerBG: 50,
  enableTurnIns: true,
  bgHonorMult: 1.0,
  questHonorMult: 1.0,
  honorTarget: 75000,
  startingHonor: 0,
  startingMarks: 0,
};

// =============================================================================
// T1: expectedMarksPerGame(winRate)
// =============================================================================
describe('expectedMarksPerGame', () => {
  it('T1.1: returns 1 for 0% winrate', () => {
    expect(expectedMarksPerGame(0)).toBe(1);
  });

  it('T1.2: returns 3 for 100% winrate', () => {
    expect(expectedMarksPerGame(1)).toBe(3);
  });

  it('T1.3: returns 2 for 50% winrate', () => {
    expect(expectedMarksPerGame(0.5)).toBe(2);
  });

  it('T1.4: returns 2.3 for 65% winrate', () => {
    expect(expectedMarksPerGame(0.65)).toBeCloseTo(2.3);
  });
});

// =============================================================================
// T2: expectedHonorForBG and expectedHonorPerGame
// =============================================================================
describe('expectedHonorForBG', () => {
  const bgHonor = { honorPerWin: 200, honorPerLoss: 100 };

  it('T2.1: 50% WR averages win/loss honor', () => {
    expect(expectedHonorForBG(bgHonor, 0.5)).toBe(150);
  });

  it('T2.2: 100% WR returns win honor', () => {
    expect(expectedHonorForBG(bgHonor, 1.0)).toBe(200);
  });

  it('T2.3: 0% WR returns loss honor', () => {
    expect(expectedHonorForBG(bgHonor, 0.0)).toBe(100);
  });

  it('T2.4: 65% WR with higher honor BG', () => {
    const highHonorBG = { honorPerWin: 400, honorPerLoss: 200 };
    // 0.65 * 400 + 0.35 * 200 = 260 + 70 = 330
    expect(expectedHonorForBG(highHonorBG, 0.65)).toBe(330);
  });
});

describe('expectedHonorPerGame', () => {
  it('calculates mean honor across Classic BGs (3 BGs)', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'classic',
      bgHonor: {
        wsg: { honorPerWin: 300, honorPerLoss: 100 },
        ab: { honorPerWin: 200, honorPerLoss: 100 },
        av: { honorPerWin: 200, honorPerLoss: 100 },
        eots: { honorPerWin: 200, honorPerLoss: 100 },
      },
    };
    // 50% WR: WSG=200, AB=150, AV=150 -> mean = (200+150+150)/3 = 166.67
    expect(expectedHonorPerGame(config, 0.5)).toBeCloseTo(166.67, 1);
  });

  it('calculates mean honor across TBC BGs (4 BGs)', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'tbc',
      bgHonor: {
        wsg: { honorPerWin: 200, honorPerLoss: 100 },
        ab: { honorPerWin: 200, honorPerLoss: 100 },
        av: { honorPerWin: 200, honorPerLoss: 100 },
        eots: { honorPerWin: 400, honorPerLoss: 200 },
      },
    };
    // 50% WR: WSG=150, AB=150, AV=150, EotS=300 -> mean = (150+150+150+300)/4 = 187.5
    expect(expectedHonorPerGame(config, 0.5)).toBe(187.5);
  });

  it('uses uniform values correctly', () => {
    const config: AppConfig = { ...validConfig, phase: 'classic' };
    // All BGs have 200 win, 100 loss. 50% WR = 150 for each
    expect(expectedHonorPerGame(config, 0.5)).toBe(150);
  });
});

// =============================================================================
// T3: computeTurnInSets(marksBeforeTurnIn, marksReserve, marksPerTurnIn, enableTurnIns)
// =============================================================================
describe('computeTurnInSets', () => {
  it('T3.1: no turn-in when exactly at reserve', () => {
    expect(computeTurnInSets(150, 150, 3, true)).toBe(0);
  });

  it('T3.2: 1 set when 3 marks excess (Classic)', () => {
    expect(computeTurnInSets(153, 150, 3, true)).toBe(1);
  });

  it('T3.3: floors partial sets', () => {
    // 10 excess / 3 = 3.33 → 3 sets
    expect(computeTurnInSets(160, 150, 3, true)).toBe(3);
  });

  it('T3.4: 50 excess in Classic', () => {
    // 50 / 3 = 16.67 → 16 sets
    expect(computeTurnInSets(200, 150, 3, true)).toBe(16);
  });

  it('T3.5: no turn-in when below reserve', () => {
    expect(computeTurnInSets(100, 150, 3, true)).toBe(0);
  });

  it('T3.6: TBC uses 4 marks per set', () => {
    expect(computeTurnInSets(204, 200, 4, true)).toBe(1);
  });

  it('T3.7: TBC 20 excess', () => {
    // 20 / 4 = 5 sets
    expect(computeTurnInSets(220, 200, 4, true)).toBe(5);
  });

  it('T3.8: returns 0 when enableTurnIns is false', () => {
    expect(computeTurnInSets(200, 150, 3, false)).toBe(0);
  });
});

// =============================================================================
// T4b: computeRequiredDailyGames(config)
// =============================================================================
describe('computeRequiredDailyGames', () => {
  const baseConfig: AppConfig = {
    ...validConfig,
    startDate: '2024-01-01',
    endDate: '2024-01-10',
    phase: 'classic',
    startingHonor: 0,
    startingMarks: 0,
    honorTarget: 20000,
    winRate: 0.5,
    marksThresholdPerBG: 50,
    enableTurnIns: true,
  };

  it('T4b.1: calculates games needed for target', () => {
    const games = computeRequiredDailyGames(baseConfig);
    // Verify by running forecast with this games count
    const { results } = computeForecast(baseConfig, [], games);
    const lastDay = results[results.length - 1];
    expect(lastDay.honorEndOfDay).toBeGreaterThanOrEqual(20000);
  });

  it('T4b.2: accounts for starting honor', () => {
    const games = computeRequiredDailyGames({ ...baseConfig, startingHonor: 10000 });
    const gamesFromZero = computeRequiredDailyGames(baseConfig);
    expect(games).toBeLessThan(gamesFromZero);
  });

  it('T4b.3: no turn-ins requires more games', () => {
    const gamesWithTurnIns = computeRequiredDailyGames(baseConfig);
    const gamesWithoutTurnIns = computeRequiredDailyGames({ ...baseConfig, enableTurnIns: false });
    expect(gamesWithoutTurnIns).toBeGreaterThan(gamesWithTurnIns);
  });

  it('T4b.4: returns 0 when daily quest alone is sufficient', () => {
    // 10 days × 419 = 4190
    const config = { ...baseConfig, honorTarget: 4000 };
    const games = computeRequiredDailyGames(config);
    expect(games).toBe(0);
  });

  it('T4b.5: returns 0 when starting honor already meets target', () => {
    const config = { ...baseConfig, startingHonor: 25000, honorTarget: 20000 };
    const games = computeRequiredDailyGames(config);
    expect(games).toBe(0);
  });

  it('T4b.6: handles very high honor targets requiring many games', () => {
    const config: AppConfig = {
      ...baseConfig,
      honorTarget: 500000,
      endDate: '2024-01-05',
    };
    const games = computeRequiredDailyGames(config);
    expect(games).toBeGreaterThan(100);
    // Verify it actually reaches the target
    const { results } = computeForecast(config, [], games);
    const lastDay = results[results.length - 1];
    expect(lastDay.honorEndOfDay).toBeGreaterThanOrEqual(500000);
  });
});

// =============================================================================
// T5: computeDayResult() - Full Day Calculation
// =============================================================================
describe('computeDayResult', () => {
  it('T5.1: Classic day with no turn-in', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'classic',
      winRate: 0.5,
      marksThresholdPerBG: 50, // reserve = 150
      bgHonorMult: 1.0,
      questHonorMult: 1.0,
    };

    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10);

    expect(result.expectedMarksGained).toBe(20); // 10 games × 2 marks
    expect(result.marksBeforeTurnIn).toBe(20); // 0 + 20
    expect(result.marksReserve).toBe(150); // 50 × 3
    expect(result.turnInSets).toBe(0); // 20 < 150
    expect(result.honorFromBGs).toBe(1500); // 10 × 150 × 1.0
    expect(result.honorFromDailyQuest).toBe(419); // 419 × 1.0
    expect(result.honorFromTurnIns).toBe(0);
    expect(result.totalHonorGained).toBe(1919);
    expect(result.honorEndOfDay).toBe(1919);
  });

  it('T5.2: Classic day with turn-ins', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'classic',
      winRate: 0.5,
      marksThresholdPerBG: 50,
      bgHonorMult: 1.0,
      questHonorMult: 1.0,
    };

    // Start with 160 marks (10 excess over 150 reserve)
    const result = computeDayResult(1, '2024-01-15', 0, 160, config, 10);

    expect(result.marksStart).toBe(160);
    expect(result.expectedMarksGained).toBe(20);
    expect(result.marksBeforeTurnIn).toBe(180); // 160 + 20
    // (180-150)/3 = 10 sets
    expect(result.turnInSets).toBe(10);
    expect(result.marksAfterTurnIn).toBe(150); // 180 - 30
    expect(result.honorFromTurnIns).toBe(3140); // 10 × 314 × 1.0
  });

  it('T5.3: TBC uses 4 BGs for reserve', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'tbc',
      winRate: 0.5,
      marksThresholdPerBG: 50, // reserve = 200 (4 BGs)
    };

    const result = computeDayResult(1, '2024-01-25', 0, 220, config, 10);

    expect(result.marksReserve).toBe(200); // 50 × 4
    // marks before: 220 + 20 = 240, excess = 40, sets = 40/4 = 10
    expect(result.turnInSets).toBe(10);
  });

  it('T5.4: Multipliers apply to correct honor sources', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'classic',
      bgHonorMult: 1.0,
      questHonorMult: 2.5, // Prepatch bonus
      winRate: 0.5,
      marksThresholdPerBG: 50,
    };

    const result = computeDayResult(1, '2024-01-15', 0, 200, config, 10);

    expect(result.honorFromBGs).toBe(1500); // Unscaled: 10 × 150 × 1.0
    expect(result.honorFromDailyQuest).toBe(1047.5); // 419 × 2.5
    // marks before: 200 + 20 = 220, excess = 70, sets = 70/3 = 23
    expect(result.turnInSets).toBe(23);
    expect(result.honorFromTurnIns).toBe(23 * 314 * 2.5); // 23 × 314 × 2.5
  });

  it('T5.5: Override applies to honor', () => {
    const config: AppConfig = { ...validConfig };

    const overrides = { actualHonorEndOfDay: 5000 };
    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10, overrides);

    expect(result.honorEndOfDay).toBe(5000);
    expect(result.overrideApplied).toBe(true);
  });

  it('T5.6: Override applies to marks', () => {
    const config: AppConfig = { ...validConfig };

    const overrides = { actualMarksEndOfDay: 100 };
    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10, overrides);

    expect(result.marksAfterTurnIn).toBe(100);
    expect(result.overrideApplied).toBe(true);
  });
});

// =============================================================================
// T6: computeForecast() - Phase Selection
// =============================================================================
describe('computeForecast - phase selection', () => {
  it('T6.1: Classic phase uses 3 BGs for reserve', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'classic',
      marksThresholdPerBG: 50,
    };

    const { results } = computeForecast(config, [], 10);

    expect(results[0].marksReserve).toBe(150); // 50 × 3
  });

  it('T6.2: TBC phase uses 4 BGs for reserve', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'tbc',
      marksThresholdPerBG: 50,
    };

    const { results } = computeForecast(config, [], 10);

    expect(results[0].marksReserve).toBe(200); // 50 × 4
  });
});

// =============================================================================
// T7: computeForecast() - Override Propagation
// =============================================================================
describe('computeForecast - override propagation', () => {
  it('T7.1: honor override affects subsequent days', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-22',
    };

    const entries: DayEntry[] = [
      { dayIndex: 3, date: '2024-01-20', overrides: { actualHonorEndOfDay: 10000 } },
    ];

    const { results } = computeForecast(config, entries, 10);

    expect(results[2].honorEndOfDay).toBe(10000); // Day 3: overridden
    expect(results[2].overrideApplied).toBe(true);
    expect(results[3].honorStart).toBe(10000); // Day 4: starts from override
  });

  it('T7.2: marks override affects subsequent days', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-22',
    };

    const entries: DayEntry[] = [
      { dayIndex: 2, date: '2024-01-19', overrides: { actualMarksEndOfDay: 50 } },
    ];

    const { results } = computeForecast(config, entries, 10);

    expect(results[1].marksAfterTurnIn).toBe(50); // Day 2: overridden
    expect(results[2].marksStart).toBe(50); // Day 3: starts from 50
  });

  it('T7.3: partial override only affects specified field', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-22',
    };

    const entries: DayEntry[] = [
      { dayIndex: 2, date: '2024-01-19', overrides: { actualHonorEndOfDay: 5000 } },
      // marks NOT overridden
    ];

    const { results } = computeForecast(config, entries, 10);

    expect(results[1].honorEndOfDay).toBe(5000);
    // marks should be calculated normally
    expect(results[1].marksAfterTurnIn).not.toBe(5000);
  });
});

// =============================================================================
// T8: findGoalReachedDay()
// =============================================================================
describe('findGoalReachedDay', () => {
  it('T8.1: finds first day honor target is reached', () => {
    const results = [
      { dayIndex: 1, honorEndOfDay: 5000 },
      { dayIndex: 2, honorEndOfDay: 10000 },
      { dayIndex: 3, honorEndOfDay: 15000 },
      { dayIndex: 4, honorEndOfDay: 20000 },
    ] as DayResult[];

    const goalDay = findGoalReachedDay(results, 12000);

    expect(goalDay?.dayIndex).toBe(3); // First day >= 12000
  });

  it('T8.2: returns null if goal not reached', () => {
    const results = [
      { dayIndex: 1, honorEndOfDay: 5000 },
      { dayIndex: 2, honorEndOfDay: 10000 },
    ] as DayResult[];

    const goalDay = findGoalReachedDay(results, 75000);

    expect(goalDay).toBeNull();
  });

  it('T8.3: finds goal on first day if already reached', () => {
    const results = [
      { dayIndex: 1, honorEndOfDay: 80000 },
      { dayIndex: 2, honorEndOfDay: 85000 },
    ] as DayResult[];

    const goalDay = findGoalReachedDay(results, 75000);

    expect(goalDay?.dayIndex).toBe(1);
  });
});

// =============================================================================
// T9: Edge Cases
// =============================================================================
describe('Edge Cases', () => {
  it('T9.1: 0 games still earns daily quest honor', () => {
    const config: AppConfig = { ...validConfig };

    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 0);

    expect(result.expectedMarksGained).toBe(0);
    expect(result.honorFromBGs).toBe(0);
    expect(result.honorFromDailyQuest).toBe(419);
    expect(result.totalHonorGained).toBe(419);
  });

  it('T9.2: 0% winrate gives 1 mark/game and loss honor only', () => {
    const config: AppConfig = { ...validConfig, winRate: 0 };

    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10);

    expect(result.expectedMarksGained).toBe(10); // 10 × 1
    expect(result.honorFromBGs).toBe(1000); // 10 × 100 (loss honor)
  });

  it('T9.3: 100% winrate gives 3 marks/game and win honor only', () => {
    const config: AppConfig = { ...validConfig, winRate: 1 };

    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10);

    expect(result.expectedMarksGained).toBe(30); // 10 × 3
    expect(result.honorFromBGs).toBe(2000); // 10 × 200 (win honor)
  });

  it('T9.4: threshold 0 allows full turn-in', () => {
    const config: AppConfig = {
      ...validConfig,
      marksThresholdPerBG: 0, // reserve = 0
    };

    const result = computeDayResult(1, '2024-01-15', 0, 30, config, 10);

    expect(result.marksReserve).toBe(0);
    // 30 + 20 = 50 marks, 50/3 = 16 sets, remainder = 50 - 48 = 2
    expect(result.turnInSets).toBe(16);
    expect(result.marksAfterTurnIn).toBe(2);
  });

  it('T9.5: start with marks > reserve allows immediate turn-ins', () => {
    const config: AppConfig = {
      ...validConfig,
      startingMarks: 200, // > 150 reserve
      marksThresholdPerBG: 50,
    };

    const { results } = computeForecast(config, [], 10);

    // Day 1 should have turn-ins
    expect(results[0].turnInSets).toBeGreaterThan(0);
  });

  it('T9.6: override below reserve blocks turn-ins', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-22',
      startingMarks: 200,
      marksThresholdPerBG: 50, // reserve = 150
    };

    const entries: DayEntry[] = [
      { dayIndex: 1, date: '2024-01-18', overrides: { actualMarksEndOfDay: 50 } },
    ];

    const { results } = computeForecast(config, entries, 10);

    expect(results[1].marksStart).toBe(50);
    // 50 + 20 = 70 < 150, no turn-ins
    expect(results[1].turnInSets).toBe(0);
  });

  it('T9.10: single day forecast works correctly', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-18',
    };

    const { results } = computeForecast(config, [], 10);

    expect(results.length).toBe(1);
    expect(results[0].dayIndex).toBe(1);
  });

  it('T9.11: enableTurnIns=false prevents all turn-ins', () => {
    const config: AppConfig = {
      ...validConfig,
      enableTurnIns: false,
      startingMarks: 200,
    };

    const result = computeDayResult(1, '2024-01-15', 0, 200, config, 10);

    expect(result.turnInSets).toBe(0);
    expect(result.honorFromTurnIns).toBe(0);
    expect(result.marksAfterTurnIn).toBe(220); // marks only grow
  });

  it('T9.12: goal already reached shows on day 1', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-22',
      startingHonor: 80000,
      honorTarget: 75000,
    };

    const { results } = computeForecast(config, [], 10);

    expect(results[0].isGoalReachedDay).toBe(true);
  });
});

// =============================================================================
// T9b: isGoalReachedDay flag
// =============================================================================
describe('isGoalReachedDay flag', () => {
  it('marks exactly one day as goal reached', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-30',
      honorTarget: 20000,
    };

    const { results } = computeForecast(config, [], 10);
    const goalDays = results.filter((r) => r.isGoalReachedDay);

    expect(goalDays.length).toBe(1);
  });

  it('goal day is first day >= honorTarget', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-30',
      honorTarget: 20000,
    };

    const { results } = computeForecast(config, [], 10);
    const goalDay = results.find((r) => r.isGoalReachedDay);
    const dayBefore = goalDay ? results[goalDay.dayIndex - 2] : undefined; // dayIndex is 1-based

    expect(goalDay?.honorEndOfDay).toBeGreaterThanOrEqual(config.honorTarget);
    if (dayBefore) {
      expect(dayBefore.honorEndOfDay).toBeLessThan(config.honorTarget);
    }
  });

  it('no goal day if target not reached', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-22',
      honorTarget: 999999999,
    };

    const { results } = computeForecast(config, [], 10);
    const goalDays = results.filter((r) => r.isGoalReachedDay);

    expect(goalDays.length).toBe(0);
  });
});

// =============================================================================
// T10: Input Validation
// =============================================================================
describe('validateConfig', () => {
  it('rejects winRate > 1', () => {
    const result = validateConfig({ ...validConfig, winRate: 1.5 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('winRate must be between 0 and 1');
  });

  it('rejects winRate < 0', () => {
    const result = validateConfig({ ...validConfig, winRate: -0.1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('winRate must be between 0 and 1');
  });

  it('rejects negative BG honor values', () => {
    const result = validateConfig({
      ...validConfig,
      bgHonor: {
        ...validConfig.bgHonor,
        wsg: { honorPerWin: -100, honorPerLoss: 100 },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('wsg.honorPerWin must be >= 0');
  });

  it('rejects negative honorPerLoss', () => {
    const result = validateConfig({
      ...validConfig,
      bgHonor: {
        ...validConfig.bgHonor,
        ab: { honorPerWin: 200, honorPerLoss: -100 },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ab.honorPerLoss must be >= 0');
  });

  it('rejects negative dailyQuestHonor', () => {
    const result = validateConfig({ ...validConfig, dailyQuestHonor: -100 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('dailyQuestHonor must be >= 0');
  });

  it('rejects negative turnInHonor', () => {
    const result = validateConfig({ ...validConfig, turnInHonor: -100 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('turnInHonor must be >= 0');
  });

  it('rejects bgHonorMult <= 0', () => {
    const result = validateConfig({ ...validConfig, bgHonorMult: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('bgHonorMult must be > 0');
  });

  it('rejects negative bgHonorMult', () => {
    const result = validateConfig({ ...validConfig, bgHonorMult: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('bgHonorMult must be > 0');
  });

  it('rejects questHonorMult <= 0', () => {
    const result = validateConfig({ ...validConfig, questHonorMult: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('questHonorMult must be > 0');
  });

  it('rejects endDate before startDate', () => {
    const result = validateConfig({
      ...validConfig,
      startDate: '2024-01-20',
      endDate: '2024-01-15',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('endDate must be after or equal to startDate');
  });

  it('rejects negative startingHonor', () => {
    const result = validateConfig({ ...validConfig, startingHonor: -1000 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('startingHonor must be >= 0');
  });

  it('rejects negative startingMarks', () => {
    const result = validateConfig({ ...validConfig, startingMarks: -10 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('startingMarks must be >= 0');
  });

  it('rejects honorTarget <= 0', () => {
    const result = validateConfig({ ...validConfig, honorTarget: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('honorTarget must be > 0');
  });

  it('rejects negative honorTarget', () => {
    const result = validateConfig({ ...validConfig, honorTarget: -1000 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('honorTarget must be > 0');
  });

  it('rejects negative marksThresholdPerBG', () => {
    const result = validateConfig({ ...validConfig, marksThresholdPerBG: -10 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('marksThresholdPerBG must be >= 0');
  });

  it('rejects invalid phase', () => {
    const result = validateConfig({ ...validConfig, phase: 'invalid' as unknown as 'classic' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('phase must be "classic" or "tbc"');
  });

  it('accepts enableTurnIns = false', () => {
    const result = validateConfig({ ...validConfig, enableTurnIns: false });
    expect(result.valid).toBe(true);
  });

  it('accepts valid complete config', () => {
    const result = validateConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('allows startDate equal to endDate (single day)', () => {
    const result = validateConfig({
      ...validConfig,
      startDate: '2024-01-18',
      endDate: '2024-01-18',
    });
    expect(result.valid).toBe(true);
  });
});

// =============================================================================
// T11: Per-BG Honor with real values
// =============================================================================
describe('Per-BG Honor with realistic values', () => {
  it('calculates mean honor with real WSG/AB/AV values (Classic)', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'classic',
      bgHonor: defaultBGHonor,
      winRate: 0.5,
    };

    // WSG: 0.5*785 + 0.5*271 = 528
    // AB: 0.5*626 + 0.5*318 = 472
    // AV: 0.5*687 + 0.5*374 = 530.5
    // Mean: (528 + 472 + 530.5) / 3 = 510.17
    const honor = expectedHonorPerGame(config, 0.5);
    expect(honor).toBeCloseTo(510.17, 0);
  });

  it('calculates mean honor with real values at 65% winrate', () => {
    const config: AppConfig = {
      ...validConfig,
      phase: 'classic',
      bgHonor: defaultBGHonor,
      winRate: 0.65,
    };

    // WSG: 0.65*785 + 0.35*271 = 510.25 + 94.85 = 605.1
    // AB: 0.65*626 + 0.35*318 = 406.9 + 111.3 = 518.2
    // AV: 0.65*687 + 0.35*374 = 446.55 + 130.9 = 577.45
    // Mean: (605.1 + 518.2 + 577.45) / 3 = 566.92
    const honor = expectedHonorPerGame(config, 0.65);
    expect(honor).toBeCloseTo(566.92, 0);
  });
});
