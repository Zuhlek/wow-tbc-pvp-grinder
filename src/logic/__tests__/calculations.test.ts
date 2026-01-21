import { describe, it, expect } from 'vitest';
import type { AppConfig, PhaseConfig, DayResult, DayEntry } from '../../types';
import {
  expectedMarksPerGame,
  expectedHonorPerGame,
  computeTurnInSets,
  getPhaseForDate,
  computeDayResult,
  computeForecast,
  findGoalReachedDay,
  computeRequiredDailyGames,
} from '../calculations';
import { validateConfig } from '../validation';

// Test fixtures
const classicConfig: PhaseConfig = {
  name: 'classic',
  numBGs: 3,
  marksPerTurnIn: 3,
  honorPerWin: 200,
  honorPerLoss: 100,
  dailyQuestHonorBase: 419,
  turnInHonorBase: 314,
};

const tbcConfig: PhaseConfig = {
  name: 'tbc',
  numBGs: 4,
  marksPerTurnIn: 4,
  honorPerWin: 300,
  honorPerLoss: 150,
  dailyQuestHonorBase: 600,
  turnInHonorBase: 400,
};

const validConfig: AppConfig = {
  startDate: '2024-01-18',
  tbcStartDate: '2024-01-20',
  endDate: '2024-02-15',
  classicConfig,
  tbcConfig,
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
// T2: expectedHonorPerGame(phase, winRate)
// =============================================================================
describe('expectedHonorPerGame', () => {
  const phase: PhaseConfig = {
    name: 'classic',
    numBGs: 3,
    marksPerTurnIn: 3,
    honorPerWin: 200,
    honorPerLoss: 100,
    dailyQuestHonorBase: 419,
    turnInHonorBase: 314,
  };

  it('T2.1: 50% WR averages win/loss honor', () => {
    expect(expectedHonorPerGame(phase, 0.5)).toBe(150);
  });

  it('T2.2: 100% WR returns win honor', () => {
    expect(expectedHonorPerGame(phase, 1.0)).toBe(200);
  });

  it('T2.3: 0% WR returns loss honor', () => {
    expect(expectedHonorPerGame(phase, 0.0)).toBe(100);
  });

  it('T2.4: 65% WR with higher honor BG', () => {
    const highHonorPhase: PhaseConfig = {
      ...phase,
      honorPerWin: 400,
      honorPerLoss: 200,
    };
    // 0.65 * 400 + 0.35 * 200 = 260 + 70 = 330
    expect(expectedHonorPerGame(highHonorPhase, 0.65)).toBe(330);
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
// T4: getPhaseForDate(date, config)
// =============================================================================
describe('getPhaseForDate', () => {
  const config: AppConfig = {
    ...validConfig,
    tbcStartDate: '2024-01-20',
  };

  it('T4.1: returns classic before TBC date', () => {
    expect(getPhaseForDate('2024-01-15', config).name).toBe('classic');
  });

  it('T4.2: returns tbc on TBC start date', () => {
    expect(getPhaseForDate('2024-01-20', config).name).toBe('tbc');
  });

  it('T4.3: returns tbc after TBC date', () => {
    expect(getPhaseForDate('2024-01-25', config).name).toBe('tbc');
  });
});

// =============================================================================
// T4b: computeRequiredDailyGames(config)
// =============================================================================
describe('computeRequiredDailyGames', () => {
  const baseConfig: AppConfig = {
    startDate: '2024-01-01',
    tbcStartDate: '2024-01-15', // all classic for simplicity
    endDate: '2024-01-10',
    classicConfig,
    tbcConfig,
    startingHonor: 0,
    startingMarks: 0,
    honorTarget: 20000,
    winRate: 0.5,
    marksThresholdPerBG: 50,
    enableTurnIns: true,
    bgHonorMult: 1.0,
    questHonorMult: 1.0,
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
    // This tests the upper bound expansion logic (lines 227-229)
    const config: AppConfig = {
      ...baseConfig,
      honorTarget: 500000, // Very high target
      endDate: '2024-01-05', // Short time frame
    };
    const games = computeRequiredDailyGames(config);
    // Should require many games per day
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
      tbcStartDate: '2024-02-01', // ensure classic
      winRate: 0.5,
      marksThresholdPerBG: 50, // reserve = 150
      bgHonorMult: 1.0,
      questHonorMult: 1.0,
    };

    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10);

    expect(result.phase).toBe('classic');
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
      tbcStartDate: '2024-02-01',
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

  it('T5.3: TBC day uses TBC config', () => {
    const config: AppConfig = {
      ...validConfig,
      tbcStartDate: '2024-01-20',
      winRate: 0.5,
      marksThresholdPerBG: 50, // reserve = 200 (4 BGs)
    };

    const result = computeDayResult(1, '2024-01-25', 0, 220, config, 10);

    expect(result.phase).toBe('tbc');
    expect(result.marksReserve).toBe(200); // 50 × 4
    // marks before: 220 + 20 = 240, excess = 40, sets = 40/4 = 10
    expect(result.turnInSets).toBe(10);
    expect(result.honorFromDailyQuest).toBe(600);
  });

  it('T5.4: Multipliers apply to correct honor sources', () => {
    const config: AppConfig = {
      ...validConfig,
      tbcStartDate: '2024-02-01',
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
    const config: AppConfig = {
      ...validConfig,
      tbcStartDate: '2024-02-01',
    };

    const overrides = { actualHonorEndOfDay: 5000 };
    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10, overrides);

    expect(result.honorEndOfDay).toBe(5000);
    expect(result.overrideApplied).toBe(true);
  });

  it('T5.6: Override applies to marks', () => {
    const config: AppConfig = {
      ...validConfig,
      tbcStartDate: '2024-02-01',
    };

    const overrides = { actualMarksEndOfDay: 100 };
    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10, overrides);

    expect(result.marksAfterTurnIn).toBe(100);
    expect(result.overrideApplied).toBe(true);
  });
});

// =============================================================================
// T6: computeForecast() - Phase Transition
// =============================================================================
describe('computeForecast - phase transition', () => {
  it('T6.1: forecast transitions from Classic to TBC', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      tbcStartDate: '2024-01-20',
      endDate: '2024-01-22',
    };

    const { results } = computeForecast(config, [], 10);

    expect(results[0].phase).toBe('classic'); // Jan 18
    expect(results[1].phase).toBe('classic'); // Jan 19
    expect(results[2].phase).toBe('tbc'); // Jan 20
    expect(results[3].phase).toBe('tbc'); // Jan 21
    expect(results[4].phase).toBe('tbc'); // Jan 22
  });

  it('T6.2: marks reserve increases at TBC transition', () => {
    const config: AppConfig = {
      ...validConfig,
      startDate: '2024-01-18',
      tbcStartDate: '2024-01-20',
      endDate: '2024-01-22',
      marksThresholdPerBG: 50,
    };

    const { results } = computeForecast(config, [], 10);

    // Find last classic day and first TBC day
    const lastClassic = results.find(
      (r, i) => r.phase === 'classic' && results[i + 1]?.phase === 'tbc'
    );
    const firstTbc = results.find((r) => r.phase === 'tbc');

    expect(lastClassic?.marksReserve).toBe(150); // 50 × 3
    expect(firstTbc?.marksReserve).toBe(200); // 50 × 4
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
    const config: AppConfig = {
      ...validConfig,
      tbcStartDate: '2024-02-01',
    };

    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 0);

    expect(result.expectedMarksGained).toBe(0);
    expect(result.honorFromBGs).toBe(0);
    expect(result.honorFromDailyQuest).toBe(419);
    expect(result.totalHonorGained).toBe(419);
  });

  it('T9.2: 0% winrate gives 1 mark/game and loss honor only', () => {
    const config: AppConfig = {
      ...validConfig,
      tbcStartDate: '2024-02-01',
      winRate: 0,
    };

    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10);

    expect(result.expectedMarksGained).toBe(10); // 10 × 1
    expect(result.honorFromBGs).toBe(1000); // 10 × 100 (loss honor)
  });

  it('T9.3: 100% winrate gives 3 marks/game and win honor only', () => {
    const config: AppConfig = {
      ...validConfig,
      tbcStartDate: '2024-02-01',
      winRate: 1,
    };

    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 10);

    expect(result.expectedMarksGained).toBe(30); // 10 × 3
    expect(result.honorFromBGs).toBe(2000); // 10 × 200 (win honor)
  });

  it('T9.4: threshold 0 allows full turn-in', () => {
    const config: AppConfig = {
      ...validConfig,
      tbcStartDate: '2024-02-01',
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
      tbcStartDate: '2024-02-01',
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
      tbcStartDate: '2024-02-01',
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
      tbcStartDate: '2024-02-01',
    };

    const { results } = computeForecast(config, [], 10);

    expect(results.length).toBe(1);
    expect(results[0].dayIndex).toBe(1);
  });

  it('T9.11: enableTurnIns=false prevents all turn-ins', () => {
    const config: AppConfig = {
      ...validConfig,
      tbcStartDate: '2024-02-01',
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

  it('rejects negative honor values', () => {
    const result = validateConfig({
      ...validConfig,
      classicConfig: { ...validConfig.classicConfig, honorPerWin: -100 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('honorPerWin must be >= 0');
  });

  it('rejects negative honorPerLoss', () => {
    const result = validateConfig({
      ...validConfig,
      classicConfig: { ...validConfig.classicConfig, honorPerLoss: -100 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('honorPerLoss must be >= 0');
  });

  it('rejects negative dailyQuestHonorBase', () => {
    const result = validateConfig({
      ...validConfig,
      classicConfig: { ...validConfig.classicConfig, dailyQuestHonorBase: -100 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('dailyQuestHonorBase must be >= 0');
  });

  it('rejects negative turnInHonorBase', () => {
    const result = validateConfig({
      ...validConfig,
      classicConfig: { ...validConfig.classicConfig, turnInHonorBase: -100 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('turnInHonorBase must be >= 0');
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

  it('rejects tbcStartDate before startDate', () => {
    const result = validateConfig({
      ...validConfig,
      startDate: '2024-01-20',
      tbcStartDate: '2024-01-15',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('tbcStartDate must be after or equal to startDate');
  });

  it('rejects tbcStartDate after endDate', () => {
    const result = validateConfig({
      ...validConfig,
      tbcStartDate: '2024-02-20',
      endDate: '2024-02-15',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('tbcStartDate must be before or equal to endDate');
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
      tbcStartDate: '2024-01-18',
      endDate: '2024-01-18',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects numBGs <= 0', () => {
    const result = validateConfig({
      ...validConfig,
      classicConfig: { ...validConfig.classicConfig, numBGs: 0 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('classicConfig.numBGs must be > 0');
  });

  it('rejects marksPerTurnIn <= 0', () => {
    const result = validateConfig({
      ...validConfig,
      tbcConfig: { ...validConfig.tbcConfig, marksPerTurnIn: 0 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('tbcConfig.marksPerTurnIn must be > 0');
  });
});
