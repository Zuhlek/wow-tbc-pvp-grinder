# WoW PvP Grind Planner – Classic & TBC

## Project Overview

A client-side TypeScript web tool (GitHub Pages) providing daily forecasts and actual/plan comparison for Honor and Battleground Marks, including automated turn-in calculations.

**Repository:** https://github.com/Zuhlek/wow-tbc-pvp-grinder
**Hosting:** GitHub Pages (static)
**Tech Stack:** TypeScript, Vite, React (or Vanilla TS)

---

## Key Design Decisions (Clarified)

1. **Simplified Marks Model:** Marks are treated as ONE unified pool (no WSG/AB/AV/EotS distinction)
2. **Turn-in Cost:** 3 marks per set (Classic) or 4 marks per set (TBC)
3. **Threshold:** "Keep X marks per BG type" → total reserve = `threshold × numBGs`
4. **Daily Quest:** ONE global daily quest (not per-BG), assume player wins once in the rotating assigned BG
5. **TBC Transition:** Single switch date - before = Classic rules, after = TBC rules
6. **Starting State:** Configurable (user can input current honor/marks)
7. **Overrides:** Partial allowed - override only honor OR marks independently
8. **Planning Mode:** User sets `endDate` + `honorTarget` → system calculates required `gamesPerDay`
9. **Turn-in Toggle:** User can disable automatic turn-ins entirely ("never turn in" mode)
10. **Goal Highlighting:** The day when honor target is reached is visually highlighted

---

## Phase 1: Project Setup

- [ ] Initialize Vite project with TypeScript
- [ ] Configure GitHub Pages deployment (GitHub Actions workflow)
- [ ] Setup ESLint + Prettier
- [ ] Create basic project structure
- [ ] Add base CSS/styling (minimal, functional)

## Phase 2: Domain Model & Core Logic

### 2.1 Types & Interfaces

```typescript
// src/types/index.ts

interface PhaseConfig {
  name: 'classic' | 'tbc';
  numBGs: number;                    // 3 for classic, 4 for tbc
  marksPerTurnIn: number;            // same as numBGs
  honorPerWin: number;               // BG honor on win
  honorPerLoss: number;              // BG honor on loss
  dailyQuestHonorBase: number;       // e.g., 419 classic, 600 tbc
  turnInHonorBase: number;           // honor per turn-in set
}

interface AppConfig {
  // Phase transition
  startDate: string;                 // ISO date, calculation begins
  tbcStartDate: string;              // ISO date, switch to TBC rules
  endDate: string;                   // ISO date, goal should be reached by this date

  // Phase-specific settings
  classicConfig: PhaseConfig;
  tbcConfig: PhaseConfig;

  // Shared settings
  winRate: number;                   // 0..1, applies to all BGs
  marksThresholdPerBG: number;       // keep X marks per BG type

  // Turn-in control
  enableTurnIns: boolean;            // false = "never turn in" mode

  // Multipliers (can change, e.g., prepatch)
  bgHonorMult: number;               // scales BG honor
  questHonorMult: number;            // scales daily quest + turn-in honor

  // Targets
  honorTarget: number;               // e.g., 75000

  // Starting state (Day 0)
  startingHonor: number;
  startingMarks: number;             // unified pool
}

// Computed value (not stored, derived from config)
interface ComputedPlan {
  totalDays: number;                 // endDate - startDate + 1
  honorNeeded: number;               // honorTarget - startingHonor
  dailyGamesRequired: number;        // calculated to reach goal by endDate
}

interface DayOverrides {
  actualHonorEndOfDay?: number;
  actualMarksEndOfDay?: number;      // unified pool
}

interface DayEntry {
  dayIndex: number;
  date: string;
  overrides?: DayOverrides;
}

interface DayResult {
  dayIndex: number;
  date: string;
  phase: 'classic' | 'tbc';

  // Inputs for this day
  gamesPlanned: number;
  honorStart: number;
  marksStart: number;

  // Marks calculation
  expectedMarksGained: number;
  marksBeforeTurnIn: number;
  marksReserve: number;              // threshold × numBGs
  turnInSets: number;                // 0 if enableTurnIns = false
  marksAfterTurnIn: number;

  // Honor calculation
  honorFromBGs: number;
  honorFromDailyQuest: number;
  honorFromTurnIns: number;          // 0 if enableTurnIns = false
  totalHonorGained: number;
  honorEndOfDay: number;

  // Metadata
  overrideApplied: boolean;
  isGoalReachedDay: boolean;         // true if this is the first day >= honorTarget
}
```

### 2.2 Core Calculation Functions

```typescript
// src/logic/calculations.ts

function getPhaseForDate(date: string, config: AppConfig): PhaseConfig;
function expectedHonorPerGame(phase: PhaseConfig, winRate: number): number;
function expectedMarksPerGame(winRate: number): number;  // 1 + 2 * winRate
function computeTurnInSets(marksBeforeTurnIn: number, marksReserve: number, marksPerTurnIn: number, enableTurnIns: boolean): number;

// NEW: Calculate required daily games to reach honor target by end date
function computeRequiredDailyGames(config: AppConfig): number;

function computeDayResult(
  dayIndex: number,
  date: string,
  honorStart: number,
  marksStart: number,
  config: AppConfig,
  dailyGames: number,
  overrides?: DayOverrides
): DayResult;

function computeForecast(config: AppConfig, entries: DayEntry[]): { results: DayResult[]; dailyGamesRequired: number };
function findGoalReachedDay(results: DayResult[], honorTarget: number): DayResult | null;
```

### 2.4 Daily Games Calculation (NEW)

The system calculates the required games per day to reach the honor target by the end date.

```typescript
function computeRequiredDailyGames(config: AppConfig): number {
  // Iterative approach (binary search or Newton's method) because:
  // - More games → more marks → more turn-ins → more honor (non-linear)
  // - Phase transition changes honor/marks rates mid-forecast

  // Simplified estimation (ignoring turn-ins for initial guess):
  // honorNeeded = honorTarget - startingHonor
  // honorPerDay ≈ games × avgHonorPerGame + dailyQuestHonor
  // games ≈ (honorNeeded / totalDays - dailyQuestHonor) / avgHonorPerGame

  // Then refine with full forecast simulation
}

### 2.3 Business Logic Rules (Simplified)

1. **Marks as Unified Pool:**
   - No per-BG tracking - just total marks count
   - Win: 3 marks, Lose: 1 mark (per game)
   - `expectedMarksPerGame = 1 + 2 * winRate`

2. **Turn-in Logic:**
   - `marksReserve = threshold × numBGs` (e.g., 50 × 3 = 150 in Classic)
   - If `enableTurnIns = false`: `turnInSets = 0` (skip turn-in calculation)
   - If `enableTurnIns = true`:
     - `excessMarks = max(0, marksBeforeTurnIn - marksReserve)`
     - `turnInSets = floor(excessMarks / marksPerTurnIn)`
     - `marksAfterTurnIn = marksBeforeTurnIn - (turnInSets × marksPerTurnIn)`

3. **Honor Calculation per Day:**
   ```
   honorFromBGs = gamesPlanned × expectedHonorPerGame × bgHonorMult
   honorFromDailyQuest = dailyQuestHonorBase × questHonorMult
   honorFromTurnIns = turnInSets × turnInHonorBase × questHonorMult
   totalHonorGained = honorFromBGs + honorFromDailyQuest + honorFromTurnIns
   ```

4. **Phase Transition:**
   - If `date < tbcStartDate`: use `classicConfig`
   - If `date >= tbcStartDate`: use `tbcConfig`
   - Transition is automatic based on date

5. **Override Behavior:**
   - Overrides replace end-of-day values
   - Can override honor only, marks only, or both
   - Forecast for following days uses overridden values as starting point

## Phase 3: UI Components

### 3.1 Component Structure

```
src/
├── components/
│   ├── ConfigPanel/
│   │   ├── DateRangeInput.tsx      # Start date, TBC date, End date
│   │   ├── TargetsInput.tsx        # Honor target
│   │   ├── MultiplierInput.tsx     # BG mult, Quest mult
│   │   └── GameSettingsInput.tsx   # Win rate, daily games, threshold
│   ├── PhaseSettingsPanel/
│   │   └── PhaseSettingsPanel.tsx  # Classic vs TBC honor values
│   ├── StartingStateInput/
│   │   └── StartingStateInput.tsx  # Initial honor + marks
│   ├── ForecastTable/
│   │   ├── ForecastTable.tsx
│   │   ├── DayRow.tsx
│   │   └── OverrideInputs.tsx
│   ├── Summary/
│   │   ├── HonorProgress.tsx
│   │   ├── MarksProgress.tsx
│   │   └── GoalProjection.tsx
│   └── ImportExport/
│       └── ImportExport.tsx
├── hooks/
│   ├── useConfig.ts
│   ├── useForecast.ts
│   └── useLocalStorage.ts
├── logic/
│   ├── calculations.ts
│   └── validation.ts
└── types/
    └── index.ts
```

### 3.2 UI Layout (Updated for Simplified Model)

```
┌──────────────────────────────────────────────────────────────────┐
│  WoW PvP Grind Planner                       [Import] [Export]   │
├──────────────────────────────────────────────────────────────────┤
│  ┌─ Timeline ─────────────────────────────────────────────────┐  │
│  │ Start Date:    [2024-01-18]                                │  │
│  │ TBC Start:     [2024-01-20]  (switch to 4 BGs)             │  │
│  │ End Date:      [2024-02-15]  ← goal must be reached by     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ Game Settings ─────────────┐  ┌─ Multipliers ────────────┐  │
│  │ Win Rate:        [50  ] %   │  │ BG Honor Mult:   [1.0 ]  │  │
│  │ Marks Threshold: [50  ]/BG  │  │ Quest Mult:      [2.5 ]  │  │
│  │ Enable Turn-ins: [✓]        │  └──────────────────────────┘  │
│  └─────────────────────────────┘                                 │
│                                                                  │
│  ┌─ Phase Settings ──────────────────────────────────────────┐   │
│  │           │ Classic (3 BGs)  │ TBC (4 BGs)                │   │
│  │ ──────────┼─────────────────┼─────────────────            │   │
│  │ Honor/Win │ [200]           │ [300]                       │   │
│  │ Honor/Loss│ [100]           │ [150]                       │   │
│  │ Daily Q   │ [419]           │ [600]                       │   │
│  │ Turn-in   │ [314]           │ [400]                       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ Starting State ───────────┐  ┌─ Target ──────────────────┐  │
│  │ Honor:  [15000]            │  │ Honor Target: [75000]     │  │
│  │ Marks:  [45   ]            │  └───────────────────────────┘  │
│  └────────────────────────────┘                                  │
├──────────────────────────────────────────────────────────────────┤
│  ┌─ Summary ─────────────────────────────────────────────────┐   │
│  │ Honor: 15,000 / 75,000 (60,000 remaining)                 │   │
│  │ Marks: 45 (reserve: 150 Classic / 200 TBC)                │   │
│  │ ──────────────────────────────────────────────────────────│   │
│  │ Days until deadline: 28                                   │   │
│  │ Required games/day: 18.5  ← CALCULATED                    │   │
│  │ Goal reached: Day 24 (Feb 10) ✓                           │   │
│  └───────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│  Forecast Table                                                  │
│  ┌─────┬────────┬───────┬───────┬────────┬───────┬────────┬─────┐
│  │ Day │ Date   │ Phase │ Games │ +Marks │ Marks │ TurnIn │Honor│
│  ├─────┼────────┼───────┼───────┼────────┼───────┼────────┼─────┤
│  │ 1   │ Jan 18 │ CLA   │ 18.5  │ +37    │ 82    │ 0      │17419│
│  │ 2   │ Jan 19 │ CLA   │ 18.5  │ +37    │ 119   │ 0      │19838│
│  │ 3   │ Jan 20 │ TBC   │ 18.5  │ +37    │ 156   │ 0      │22688│
│  │ ... │ ...    │ ...   │ ...   │ ...    │ ...   │ ...    │ ... │
│  │ 24  │ Feb 10 │ TBC   │ 18.5  │ +37    │ 200   │ 2      │75120│  ← HIGHLIGHTED (goal reached)
│  │ ... │ ...    │ ...   │ ...   │ ...    │ ...   │ ...    │ ... │
│  └─────┴────────┴───────┴───────┴────────┴───────┴────────┴─────┘
│  (* = has override)                                              │
│                                                                  │
│  [Click row to expand override inputs]                           │
│  ┌─ Override Day 4 ──────────────────────────────────────────┐   │
│  │ Actual Honor: [25000]    Actual Marks: [180]    [Clear]   │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**UI Behavior Notes:**
- `Games/day` is **calculated** from `honorTarget`, `endDate`, and other settings
- Goal reached row is visually highlighted (green background / bold / icon)
- If goal is reached **after** end date: show warning (red text)
- If turn-ins disabled: "TurnIn" column shows "-" or is hidden

## Phase 4: State Management & Persistence

### 4.1 LocalStorage Schema

```typescript
interface StoredState {
  version: number;              // Schema version for migrations
  config: AppConfig;
  entries: DayEntry[];          // User overrides
  lastUpdated: string;          // ISO timestamp
}
```

### 4.2 Import/Export Format

- JSON file download/upload
- Same schema as LocalStorage
- Versioned for future compatibility
- Filename: `wow-pvp-grind-{date}.json`

## Phase 5: Validation Rules

```typescript
// src/logic/validation.ts

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateConfig(config: AppConfig): ValidationResult;

// Validation Rules:
// - winRate: 0 <= x <= 1
// - honorPerWin, honorPerLoss: >= 0
// - dailyQuestHonorBase: >= 0
// - turnInHonorBase: >= 0
// - marksThresholdPerBG: >= 0
// - bgHonorMult: > 0
// - questHonorMult: > 0
// - dailyGamesPlanned: >= 0
// - honorTarget: > 0
// - startingHonor: >= 0
// - startingMarks: >= 0
// - startDate <= tbcStartDate <= endDate
// - All dates valid ISO format
```

## Phase 6: GitHub Pages Deployment

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 6.2 Vite Config for GitHub Pages

```typescript
// vite.config.ts
export default defineConfig({
  base: '/wow-tbc-pvp-grinder/',
  // ...
});
```

---

## Implementation Checklist

### MVP (v1.0)

- [ ] Project setup (Vite + TypeScript + React)
- [ ] Domain types defined
- [ ] Core calculation logic implemented:
  - [ ] `expectedMarksPerGame()`
  - [ ] `expectedHonorPerGame()`
  - [ ] `computeTurnInSets()` (with enableTurnIns flag)
  - [ ] `getPhaseForDate()`
  - [ ] `computeRequiredDailyGames()` ← NEW: derives games from target + end date
  - [ ] `computeDayResult()`
  - [ ] `computeForecast()` (returns results + dailyGamesRequired)
  - [ ] `findGoalReachedDay()` + `isGoalReachedDay` flag
  - [ ] `validateConfig()`
- [ ] Unit tests for all calculation functions (Vitest, 100% coverage)
- [ ] Timeline config panel (start/tbc/end dates)
- [ ] Game settings panel (winrate, threshold, **enable turn-ins toggle**)
- [ ] Phase settings panel (Classic vs TBC honor values)
- [ ] Starting state inputs (honor + marks)
- [ ] Multiplier inputs
- [ ] Summary panel:
  - [ ] Honor progress bar
  - [ ] Calculated games/day display
  - [ ] Goal reached date projection
- [ ] Forecast table UI:
  - [ ] Phase column
  - [ ] Games/day column (calculated)
  - [ ] **Goal reached row highlighting**
  - [ ] Override indicator
- [ ] Override inputs per day
- [ ] LocalStorage persistence
- [ ] JSON import/export
- [ ] GitHub Pages deployment
- [ ] Basic responsive design

### Future (v1.1+)

- [ ] Visual charts (honor over time, marks over time)
- [ ] Dark mode toggle
- [ ] Per-BG games distribution (weighted)
- [ ] Item cost tracking / shopping list
- [ ] Multi-character support
- [ ] Undo/redo for overrides
- [ ] Prepatch date with separate multiplier config
- [ ] "What if" mode: manually override games/day to see different scenarios

---

## Test Plan: Business Logic Verification

### Test Framework
- **Tool:** Vitest (fast, Vite-native)
- **Location:** `src/logic/__tests__/`
- **Coverage Target:** 100% for calculation functions

---

### Unit Tests: Core Calculations

#### T1: `expectedMarksPerGame(winRate)`

| Test ID | Input | Expected Output | Description |
|---------|-------|-----------------|-------------|
| T1.1 | winRate = 0.0 | 1.0 | All losses → 1 mark/game |
| T1.2 | winRate = 1.0 | 3.0 | All wins → 3 marks/game |
| T1.3 | winRate = 0.5 | 2.0 | 50% WR → 2 marks/game |
| T1.4 | winRate = 0.65 | 2.3 | 65% WR → 2.3 marks/game |

```typescript
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
```

---

#### T2: `expectedHonorPerGame(phase, winRate)`

| Test ID | Phase Honor (W/L) | WinRate | Expected | Description |
|---------|-------------------|---------|----------|-------------|
| T2.1 | 200 / 100 | 0.5 | 150 | 50% WR, avg honor |
| T2.2 | 200 / 100 | 1.0 | 200 | All wins |
| T2.3 | 200 / 100 | 0.0 | 100 | All losses |
| T2.4 | 400 / 200 | 0.65 | 330 | Higher honor BG |

```typescript
describe('expectedHonorPerGame', () => {
  const phase = { honorPerWin: 200, honorPerLoss: 100 } as PhaseConfig;

  it('T2.1: 50% WR averages win/loss honor', () => {
    expect(expectedHonorPerGame(phase, 0.5)).toBe(150);
  });
  it('T2.2: 100% WR returns win honor', () => {
    expect(expectedHonorPerGame(phase, 1.0)).toBe(200);
  });
  it('T2.3: 0% WR returns loss honor', () => {
    expect(expectedHonorPerGame(phase, 0.0)).toBe(100);
  });
});
```

---

#### T3: `computeTurnInSets(marksBeforeTurnIn, marksReserve, marksPerTurnIn)`

| Test ID | Marks Before | Reserve | Per Turn-in | Expected Sets | Marks After | Description |
|---------|--------------|---------|-------------|---------------|-------------|-------------|
| T3.1 | 150 | 150 | 3 | 0 | 150 | Exactly at reserve, no turn-in |
| T3.2 | 153 | 150 | 3 | 1 | 150 | 1 set excess |
| T3.3 | 160 | 150 | 3 | 3 | 151 | 10 excess → 3 sets (9 used) |
| T3.4 | 200 | 150 | 3 | 16 | 152 | 50 excess → 16 sets (48 used) |
| T3.5 | 100 | 150 | 3 | 0 | 100 | Below reserve, no turn-in |
| T3.6 | 204 | 200 | 4 | 1 | 200 | TBC: 4 marks per set |
| T3.7 | 220 | 200 | 4 | 5 | 200 | TBC: 20 excess → 5 sets |

```typescript
describe('computeTurnInSets', () => {
  it('T3.1: no turn-in when exactly at reserve', () => {
    expect(computeTurnInSets(150, 150, 3)).toBe(0);
  });
  it('T3.2: 1 set when 3 marks excess (Classic)', () => {
    expect(computeTurnInSets(153, 150, 3)).toBe(1);
  });
  it('T3.3: floors partial sets', () => {
    expect(computeTurnInSets(160, 150, 3)).toBe(3); // 10/3 = 3.33 → 3
  });
  it('T3.5: no turn-in when below reserve', () => {
    expect(computeTurnInSets(100, 150, 3)).toBe(0);
  });
  it('T3.6: TBC uses 4 marks per set', () => {
    expect(computeTurnInSets(204, 200, 4)).toBe(1);
  });
});
```

---

#### T4: `getPhaseForDate(date, config)`

| Test ID | Date | TBC Start | Expected Phase | Description |
|---------|------|-----------|----------------|-------------|
| T4.1 | 2024-01-15 | 2024-01-20 | classic | Before TBC |
| T4.2 | 2024-01-20 | 2024-01-20 | tbc | Exactly TBC start |
| T4.3 | 2024-01-25 | 2024-01-20 | tbc | After TBC |

```typescript
describe('getPhaseForDate', () => {
  const config = { tbcStartDate: '2024-01-20' } as AppConfig;

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
```

---

#### T4b: `computeRequiredDailyGames(config)` - NEW

| Test ID | Honor Target | Starting | Days | Turn-ins | Expected Games/Day | Description |
|---------|--------------|----------|------|----------|-------------------|-------------|
| T4b.1 | 20000 | 0 | 10 | on | ~10-12 | Basic calculation |
| T4b.2 | 20000 | 10000 | 10 | on | ~5-6 | Partial progress |
| T4b.3 | 20000 | 0 | 10 | off | higher | No turn-in bonus |
| T4b.4 | 5000 | 0 | 10 | on | ~0 | Daily quest alone sufficient |

```typescript
describe('computeRequiredDailyGames', () => {
  const baseConfig = {
    startDate: '2024-01-01',
    tbcStartDate: '2024-01-15',  // all classic for simplicity
    endDate: '2024-01-10',
    startingHonor: 0,
    startingMarks: 0,
    honorTarget: 20000,
    winRate: 0.5,
    marksThresholdPerBG: 50,
    enableTurnIns: true,
    bgHonorMult: 1.0,
    questHonorMult: 1.0,
    classicConfig: { numBGs: 3, marksPerTurnIn: 3, honorPerWin: 200, honorPerLoss: 100, dailyQuestHonorBase: 419, turnInHonorBase: 314 },
  };

  it('T4b.1: calculates games needed for target', () => {
    const games = computeRequiredDailyGames(baseConfig);
    // Verify by running forecast with this games count
    const { results } = computeForecast({ ...baseConfig }, [], games);
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
    const config = { ...baseConfig, honorTarget: 4000 };  // 10 days × 419 = 4190
    const games = computeRequiredDailyGames(config);
    expect(games).toBeCloseTo(0, 0);
  });
});
```

---

### Integration Tests: Daily Calculation

#### T5: `computeDayResult()` - Full Day Calculation

**Test T5.1: Classic Day, No Turn-in**
```typescript
it('T5.1: Classic day with no turn-in', () => {
  const config = {
    classicConfig: { numBGs: 3, marksPerTurnIn: 3, honorPerWin: 200, honorPerLoss: 100, dailyQuestHonorBase: 419, turnInHonorBase: 314 },
    winRate: 0.5,
    dailyGamesPlanned: 10,
    marksThresholdPerBG: 50,  // reserve = 150
    bgHonorMult: 1.0,
    questHonorMult: 1.0,
  };

  const result = computeDayResult(1, '2024-01-15', 0, 0, config);

  expect(result.phase).toBe('classic');
  expect(result.expectedMarksGained).toBe(20);      // 10 games × 2 marks
  expect(result.marksBeforeTurnIn).toBe(20);        // 0 + 20
  expect(result.marksReserve).toBe(150);            // 50 × 3
  expect(result.turnInSets).toBe(0);                // 20 < 150
  expect(result.honorFromBGs).toBe(1500);           // 10 × 150 × 1.0
  expect(result.honorFromDailyQuest).toBe(419);     // 419 × 1.0
  expect(result.honorFromTurnIns).toBe(0);
  expect(result.totalHonorGained).toBe(1919);
});
```

**Test T5.2: Classic Day, With Turn-ins**
```typescript
it('T5.2: Classic day with turn-ins', () => {
  const config = { /* same as above */ };

  // Start with 160 marks (10 excess over 150 reserve)
  const result = computeDayResult(1, '2024-01-15', 0, 160, config);

  expect(result.marksStart).toBe(160);
  expect(result.expectedMarksGained).toBe(20);
  expect(result.marksBeforeTurnIn).toBe(180);       // 160 + 20
  expect(result.turnInSets).toBe(10);               // (180-150)/3 = 10
  expect(result.marksAfterTurnIn).toBe(150);        // 180 - 30
  expect(result.honorFromTurnIns).toBe(3140);       // 10 × 314 × 1.0
});
```

**Test T5.3: TBC Day, Different Honor Values**
```typescript
it('T5.3: TBC day uses TBC config', () => {
  const config = {
    tbcStartDate: '2024-01-20',
    tbcConfig: { numBGs: 4, marksPerTurnIn: 4, honorPerWin: 300, honorPerLoss: 150, dailyQuestHonorBase: 600, turnInHonorBase: 400 },
    winRate: 0.5,
    dailyGamesPlanned: 10,
    marksThresholdPerBG: 50,  // reserve = 200 (4 BGs)
  };

  const result = computeDayResult(1, '2024-01-25', 0, 220, config);

  expect(result.phase).toBe('tbc');
  expect(result.marksReserve).toBe(200);            // 50 × 4
  expect(result.turnInSets).toBe(5);                // (220+20-200)/4 = 10
  expect(result.honorFromDailyQuest).toBe(600);
});
```

**Test T5.4: Multipliers Applied Correctly**
```typescript
it('T5.4: Multipliers apply to correct honor sources', () => {
  const config = {
    bgHonorMult: 1.0,
    questHonorMult: 2.5,  // Prepatch bonus
    // ... rest
  };

  const result = computeDayResult(1, '2024-01-15', 0, 200, config);

  expect(result.honorFromBGs).toBe(1500);           // Unscaled
  expect(result.honorFromDailyQuest).toBe(1047.5);  // 419 × 2.5
  expect(result.honorFromTurnIns).toBe(/* turnInSets × 314 × 2.5 */);
});
```

---

### Integration Tests: Multi-Day Forecast

#### T6: `computeForecast()` - Phase Transition

**Test T6.1: Forecast Crosses Phase Boundary**
```typescript
it('T6.1: forecast transitions from Classic to TBC', () => {
  const config = {
    startDate: '2024-01-18',
    tbcStartDate: '2024-01-20',
    endDate: '2024-01-22',
    // ...
  };

  const results = computeForecast(config, []);

  expect(results[0].phase).toBe('classic');  // Jan 18
  expect(results[1].phase).toBe('classic');  // Jan 19
  expect(results[2].phase).toBe('tbc');      // Jan 20
  expect(results[3].phase).toBe('tbc');      // Jan 21
  expect(results[4].phase).toBe('tbc');      // Jan 22
});
```

**Test T6.2: Marks Reserve Changes at Transition**
```typescript
it('T6.2: marks reserve increases at TBC transition', () => {
  const config = {
    marksThresholdPerBG: 50,
    // ...
  };

  const results = computeForecast(config, []);

  const lastClassic = results.find(r => r.phase === 'classic' && results[results.indexOf(r) + 1]?.phase === 'tbc');
  const firstTbc = results.find(r => r.phase === 'tbc');

  expect(lastClassic.marksReserve).toBe(150);  // 50 × 3
  expect(firstTbc.marksReserve).toBe(200);     // 50 × 4
});
```

---

#### T7: `computeForecast()` - Override Propagation

**Test T7.1: Honor Override Propagates**
```typescript
it('T7.1: honor override affects subsequent days', () => {
  const entries = [
    { dayIndex: 3, date: '2024-01-20', overrides: { actualHonorEndOfDay: 10000 } }
  ];

  const results = computeForecast(config, entries);

  expect(results[2].honorEndOfDay).toBe(10000);         // Day 3: overridden
  expect(results[2].overrideApplied).toBe(true);
  expect(results[3].honorStart).toBe(10000);            // Day 4: starts from override
});
```

**Test T7.2: Marks Override Propagates**
```typescript
it('T7.2: marks override affects subsequent days', () => {
  const entries = [
    { dayIndex: 2, date: '2024-01-19', overrides: { actualMarksEndOfDay: 50 } }
  ];

  const results = computeForecast(config, entries);

  expect(results[1].marksAfterTurnIn).toBe(50);         // Day 2: overridden
  expect(results[2].marksStart).toBe(50);              // Day 3: starts from 50
});
```

**Test T7.3: Partial Override (Honor Only)**
```typescript
it('T7.3: partial override only affects specified field', () => {
  const entries = [
    { dayIndex: 2, date: '2024-01-19', overrides: { actualHonorEndOfDay: 5000 } }
    // marks NOT overridden
  ];

  const results = computeForecast(config, entries);

  expect(results[1].honorEndOfDay).toBe(5000);
  expect(results[1].marksAfterTurnIn).toBe(/* calculated value, not overridden */);
});
```

---

#### T8: `findGoalReachedDay()` - Goal Projection

**Test T8.1: Goal Reached Mid-Forecast**
```typescript
it('T8.1: finds first day honor target is reached', () => {
  const results = [
    { dayIndex: 1, honorEndOfDay: 5000 },
    { dayIndex: 2, honorEndOfDay: 10000 },
    { dayIndex: 3, honorEndOfDay: 15000 },
    { dayIndex: 4, honorEndOfDay: 20000 },
  ] as DayResult[];

  const goalDay = findGoalReachedDay(results, 12000);

  expect(goalDay?.dayIndex).toBe(3);  // First day >= 12000
});
```

**Test T8.2: Goal Not Reached**
```typescript
it('T8.2: returns null if goal not reached', () => {
  const results = [
    { dayIndex: 1, honorEndOfDay: 5000 },
    { dayIndex: 2, honorEndOfDay: 10000 },
  ] as DayResult[];

  const goalDay = findGoalReachedDay(results, 75000);

  expect(goalDay).toBeNull();
});
```

---

### Edge Case Tests

#### T9: Edge Cases

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| T9.1 | 0 games calculated | Only daily quest honor, no marks gained |
| T9.2 | 0% winrate | 1 mark/game, honorPerLoss only |
| T9.3 | 100% winrate | 3 marks/game, honorPerWin only |
| T9.4 | Threshold = 0 | All marks can be turned in (reserve = 0) |
| T9.5 | Start with marks > reserve | Immediate turn-ins on day 1 |
| T9.6 | Override below reserve | No turn-ins until marks rebuild |
| T9.7 | Multiplier = 0 | Validation should reject |
| T9.8 | Negative starting honor | Validation should reject |
| T9.9 | endDate before startDate | Validation should reject |
| T9.10 | Single day forecast | Should work correctly |
| T9.11 | enableTurnIns = false | turnInSets always 0, marks accumulate |
| T9.12 | Goal already reached | games/day = 0, isGoalReachedDay on day 1 |
| T9.13 | Goal unreachable | Warning: games/day extremely high or infinite |

```typescript
describe('Edge Cases', () => {
  it('T9.1: 0 games still earns daily quest honor', () => {
    const result = computeDayResult(1, '2024-01-15', 0, 0, config, 0);  // 0 games

    expect(result.expectedMarksGained).toBe(0);
    expect(result.honorFromBGs).toBe(0);
    expect(result.honorFromDailyQuest).toBe(419);
    expect(result.totalHonorGained).toBe(419);
  });

  it('T9.4: threshold 0 allows full turn-in', () => {
    const config = { ...baseConfig, marksThresholdPerBG: 0 };  // reserve = 0
    const result = computeDayResult(1, '2024-01-15', 0, 30, config, 10);

    expect(result.marksReserve).toBe(0);
    expect(result.turnInSets).toBe(/* (30 + gained) / 3 */);
    expect(result.marksAfterTurnIn).toBeLessThanOrEqual(2);  // remainder only
  });

  it('T9.6: override below reserve blocks turn-ins', () => {
    const entries = [
      { dayIndex: 1, date: '2024-01-18', overrides: { actualMarksEndOfDay: 50 } }
    ];
    const { results } = computeForecast(config, entries);  // reserve = 150

    expect(results[1].marksStart).toBe(50);
    expect(results[1].turnInSets).toBe(0);  // 50 + gained < 150
  });

  it('T9.11: enableTurnIns=false prevents all turn-ins', () => {
    const config = { ...baseConfig, enableTurnIns: false, startingMarks: 200 };
    const result = computeDayResult(1, '2024-01-15', 0, 200, config, 10);

    expect(result.turnInSets).toBe(0);
    expect(result.honorFromTurnIns).toBe(0);
    expect(result.marksAfterTurnIn).toBeGreaterThan(200);  // marks only grow
  });

  it('T9.12: goal already reached shows on day 1', () => {
    const config = { ...baseConfig, startingHonor: 80000, honorTarget: 75000 };
    const { results } = computeForecast(config, []);

    expect(results[0].isGoalReachedDay).toBe(true);
  });
});
```

---

#### T9b: Goal Reached Day Flag (NEW)

```typescript
describe('isGoalReachedDay flag', () => {
  it('marks exactly one day as goal reached', () => {
    const { results } = computeForecast(config, []);
    const goalDays = results.filter(r => r.isGoalReachedDay);

    expect(goalDays.length).toBe(1);
  });

  it('goal day is first day >= honorTarget', () => {
    const { results } = computeForecast(config, []);
    const goalDay = results.find(r => r.isGoalReachedDay);
    const dayBefore = results[goalDay.dayIndex - 2];  // dayIndex is 1-based

    expect(goalDay.honorEndOfDay).toBeGreaterThanOrEqual(config.honorTarget);
    if (dayBefore) {
      expect(dayBefore.honorEndOfDay).toBeLessThan(config.honorTarget);
    }
  });

  it('no goal day if target not reached', () => {
    const config = { ...baseConfig, honorTarget: 999999999 };
    const { results } = computeForecast(config, []);
    const goalDays = results.filter(r => r.isGoalReachedDay);

    expect(goalDays.length).toBe(0);
  });
});
```

---

### Validation Tests

#### T10: Input Validation

```typescript
describe('validateConfig', () => {
  it('rejects winRate > 1', () => {
    const result = validateConfig({ ...validConfig, winRate: 1.5 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('winRate must be between 0 and 1');
  });

  it('rejects winRate < 0', () => {
    const result = validateConfig({ ...validConfig, winRate: -0.1 });
    expect(result.valid).toBe(false);
  });

  it('rejects negative honor values', () => {
    const result = validateConfig({
      ...validConfig,
      classicConfig: { ...validConfig.classicConfig, honorPerWin: -100 }
    });
    expect(result.valid).toBe(false);
  });

  it('rejects multiplier <= 0', () => {
    const result = validateConfig({ ...validConfig, bgHonorMult: 0 });
    expect(result.valid).toBe(false);
  });

  it('rejects endDate before startDate', () => {
    const result = validateConfig({ ...validConfig, startDate: '2024-01-20', endDate: '2024-01-15' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('endDate must be after startDate');
  });

  it('rejects tbcStartDate before startDate', () => {
    const result = validateConfig({ ...validConfig, startDate: '2024-01-20', tbcStartDate: '2024-01-15' });
    expect(result.valid).toBe(false);
  });

  it('rejects tbcStartDate after endDate', () => {
    const result = validateConfig({ ...validConfig, tbcStartDate: '2024-02-20', endDate: '2024-02-15' });
    expect(result.valid).toBe(false);
  });

  it('rejects negative startingHonor', () => {
    const result = validateConfig({ ...validConfig, startingHonor: -1000 });
    expect(result.valid).toBe(false);
  });

  it('rejects negative startingMarks', () => {
    const result = validateConfig({ ...validConfig, startingMarks: -10 });
    expect(result.valid).toBe(false);
  });

  it('rejects honorTarget <= 0', () => {
    const result = validateConfig({ ...validConfig, honorTarget: 0 });
    expect(result.valid).toBe(false);
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
});

// Test fixture
const validConfig: AppConfig = {
  startDate: '2024-01-18',
  tbcStartDate: '2024-01-20',
  endDate: '2024-02-15',
  classicConfig: { name: 'classic', numBGs: 3, marksPerTurnIn: 3, honorPerWin: 200, honorPerLoss: 100, dailyQuestHonorBase: 419, turnInHonorBase: 314 },
  tbcConfig: { name: 'tbc', numBGs: 4, marksPerTurnIn: 4, honorPerWin: 300, honorPerLoss: 150, dailyQuestHonorBase: 600, turnInHonorBase: 400 },
  winRate: 0.5,
  marksThresholdPerBG: 50,
  enableTurnIns: true,
  bgHonorMult: 1.0,
  questHonorMult: 1.0,
  honorTarget: 75000,
  startingHonor: 0,
  startingMarks: 0,
};
```

---

## Test Execution Plan

### Pre-Implementation
1. Define all test cases in `src/logic/__tests__/calculations.test.ts`
2. Tests should fail initially (TDD approach)

### During Implementation
3. Implement each function, run tests incrementally
4. Each function must pass all its unit tests before moving on

### Post-Implementation
5. Run full test suite: `npm test`
6. Check coverage: `npm run test:coverage`
7. Target: 100% coverage on `src/logic/`

### CI/CD
8. Add test step to GitHub Actions workflow before deploy
9. Block deployment if tests fail

---

## File Structure (Target)

```
wow-tbc-pvp-grinder/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── components/
│   ├── hooks/
│   ├── logic/
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── PLANNING.md
└── README.md
```

---

## Notes

- All calculations are deterministic (no RNG simulation)
- Performance target: 60 days forecast without lag
- Mobile-friendly but desktop-first design
- UI language: English
- Marks model: Simplified to single unified pool (no per-BG tracking)
- Phase transition: Automatic based on TBC start date

---

## Detailed Implementation Step Plan

### Overview

This plan is organized into **7 sprints**. Each sprint has clear deliverables and a "done" definition.

---

### Sprint 1: Project Scaffolding & CI/CD

**Goal:** Empty app builds and deploys to GitHub Pages

#### Steps

1. **Initialize Vite + React + TypeScript project**
   ```bash
   npm create vite@latest . -- --template react-ts
   npm install
   ```

2. **Configure Vite for GitHub Pages**
   ```typescript
   // vite.config.ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/wow-tbc-pvp-grinder/',  // Must match repo name
   })
   ```

3. **Add Vitest for testing**
   ```bash
   npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom
   ```

   ```typescript
   // vite.config.ts - add test config
   export default defineConfig({
     // ...
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: './src/test/setup.ts',
       coverage: {
         provider: 'v8',
         reporter: ['text', 'html'],
       },
     },
   })
   ```

4. **Add ESLint + Prettier**
   ```bash
   npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint-config-prettier
   ```

5. **Create GitHub Actions workflow**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
         - run: npm ci
         - run: npm run lint
         - run: npm run test -- --coverage
         - run: npm run build

     deploy:
       needs: test
       if: github.ref == 'refs/heads/main'
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
         - run: npm ci
         - run: npm run build
         - uses: actions/configure-pages@v4
         - uses: actions/upload-pages-artifact@v3
           with:
             path: './dist'
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

6. **Update package.json scripts**
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "tsc && vite build",
       "preview": "vite preview",
       "test": "vitest",
       "test:coverage": "vitest --coverage",
       "lint": "eslint src --ext ts,tsx"
     }
   }
   ```

7. **Enable GitHub Pages in repo settings**
   - Go to Settings → Pages → Source: GitHub Actions

8. **Push and verify deployment**
   - Commit all files
   - Push to main
   - Verify Actions workflow succeeds
   - Verify app is live at `https://zuhlek.github.io/wow-tbc-pvp-grinder/`

#### Done Criteria
- [ ] `npm run dev` starts local dev server
- [ ] `npm run test` runs (no tests yet, but command works)
- [ ] `npm run build` succeeds
- [ ] GitHub Actions workflow passes
- [ ] Empty app is deployed to GitHub Pages

---

### Sprint 2: Domain Types & Core Logic (TDD)

**Goal:** All business logic implemented and tested (100% coverage)

#### Steps

1. **Create type definitions**
   ```
   src/types/index.ts
   ```
   - `PhaseConfig`
   - `AppConfig`
   - `ComputedPlan`
   - `DayOverrides`
   - `DayEntry`
   - `DayResult`
   - `ValidationResult`

2. **Create test file first (TDD)**
   ```
   src/logic/__tests__/calculations.test.ts
   ```
   - Copy all test cases from Test Plan (T1-T10)
   - Run tests → all fail (red)

3. **Implement calculation functions one by one**
   ```
   src/logic/calculations.ts
   ```

   Order of implementation:
   1. `expectedMarksPerGame(winRate)` → run T1 tests → green
   2. `expectedHonorPerGame(phase, winRate)` → run T2 tests → green
   3. `computeTurnInSets(marks, reserve, perTurnIn, enabled)` → run T3 tests → green
   4. `getPhaseForDate(date, config)` → run T4 tests → green
   5. `computeDayResult(...)` → run T5 tests → green
   6. `computeForecast(config, entries)` → run T6, T7 tests → green
   7. `findGoalReachedDay(results, target)` → run T8 tests → green
   8. `computeRequiredDailyGames(config)` → run T4b tests → green

4. **Implement validation**
   ```
   src/logic/validation.ts
   ```
   - `validateConfig(config)` → run T10 tests → green

5. **Run edge case tests (T9, T9b)** → all green

6. **Check coverage**
   ```bash
   npm run test:coverage
   ```
   - Target: 100% on `src/logic/`

#### Done Criteria
- [ ] All T1-T10 tests pass
- [ ] 100% coverage on `src/logic/`
- [ ] No TypeScript errors
- [ ] Lint passes

---

### Sprint 3: State Management & Hooks

**Goal:** React hooks for config management and forecast computation

#### Steps

1. **Create default config**
   ```
   src/config/defaults.ts
   ```
   ```typescript
   export const DEFAULT_CONFIG: AppConfig = {
     startDate: new Date().toISOString().split('T')[0],
     tbcStartDate: '2024-01-20',
     endDate: '2024-02-15',
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
     honorTarget: 75000,
     startingHonor: 0,
     startingMarks: 0,
   };
   ```

2. **Create useLocalStorage hook**
   ```
   src/hooks/useLocalStorage.ts
   ```
   - Generic hook for persisting state
   - Handles JSON serialization/deserialization
   - Handles storage errors gracefully

3. **Create useConfig hook**
   ```
   src/hooks/useConfig.ts
   ```
   - Manages `AppConfig` state
   - Persists to localStorage
   - Provides update functions for each config section
   - Validates on change

4. **Create useEntries hook**
   ```
   src/hooks/useEntries.ts
   ```
   - Manages `DayEntry[]` (overrides)
   - Persists to localStorage
   - Provides `setOverride(dayIndex, overrides)` and `clearOverride(dayIndex)`

5. **Create useForecast hook**
   ```
   src/hooks/useForecast.ts
   ```
   - Takes `config` and `entries`
   - Calls `computeForecast()`
   - Memoizes result with `useMemo`
   - Returns `{ results, dailyGamesRequired, goalDay, validationErrors }`

6. **Write hook tests**
   ```
   src/hooks/__tests__/useConfig.test.ts
   src/hooks/__tests__/useForecast.test.ts
   ```

#### Done Criteria
- [ ] `useConfig` persists to localStorage
- [ ] `useEntries` persists to localStorage
- [ ] `useForecast` returns correct results
- [ ] Hooks are tested
- [ ] State persists across page refresh

---

### Sprint 4: UI Components (Config Panels)

**Goal:** All input panels functional

#### Steps

1. **Create base layout**
   ```
   src/App.tsx
   src/components/Layout/Layout.tsx
   src/index.css
   ```
   - Header with title
   - Import/Export buttons (placeholder)
   - Main content area (grid layout)

2. **Timeline panel**
   ```
   src/components/ConfigPanel/TimelineInput.tsx
   ```
   - Start date picker
   - TBC start date picker
   - End date picker
   - Date validation (start ≤ tbc ≤ end)

3. **Game settings panel**
   ```
   src/components/ConfigPanel/GameSettingsInput.tsx
   ```
   - Win rate slider (0-100%)
   - Marks threshold input
   - Enable turn-ins checkbox

4. **Multipliers panel**
   ```
   src/components/ConfigPanel/MultiplierInput.tsx
   ```
   - BG Honor Mult input
   - Quest Honor Mult input

5. **Phase settings panel**
   ```
   src/components/PhaseSettingsPanel/PhaseSettingsPanel.tsx
   ```
   - Table with Classic | TBC columns
   - Rows: Honor/Win, Honor/Loss, Daily Quest, Turn-in
   - Editable inputs

6. **Starting state panel**
   ```
   src/components/ConfigPanel/StartingStateInput.tsx
   ```
   - Starting honor input
   - Starting marks input

7. **Target panel**
   ```
   src/components/ConfigPanel/TargetInput.tsx
   ```
   - Honor target input

8. **Wire up all panels to useConfig**
   - Each panel receives relevant config slice
   - Each panel calls update function on change

#### Done Criteria
- [ ] All config values editable in UI
- [ ] Changes persist to localStorage
- [ ] Validation errors shown inline
- [ ] Responsive layout works on mobile

---

### Sprint 5: Summary & Forecast Table

**Goal:** Core app functionality complete

#### Steps

1. **Summary panel**
   ```
   src/components/Summary/Summary.tsx
   ```
   - Honor progress: current / target (remaining)
   - Marks current (reserve info)
   - Days until deadline
   - **Required games/day** (calculated, highlighted)
   - Goal reached: Day X (Date) with checkmark
   - Warning if goal after end date

2. **Forecast table**
   ```
   src/components/ForecastTable/ForecastTable.tsx
   src/components/ForecastTable/DayRow.tsx
   ```
   - Columns: Day, Date, Phase, Games, +Marks, Marks, TurnIn, Honor
   - Scrollable if many days
   - **Goal reached row highlighted** (green background)
   - Override indicator (*) on rows with overrides

3. **Override inputs**
   ```
   src/components/ForecastTable/OverrideInputs.tsx
   ```
   - Expandable row on click
   - Actual Honor input
   - Actual Marks input
   - Clear override button
   - Wire to `useEntries`

4. **Phase column styling**
   - "CLA" badge (blue)
   - "TBC" badge (green)

5. **Number formatting**
   - Honor with thousands separator (e.g., 15,000)
   - Games with 1 decimal (e.g., 18.5)

#### Done Criteria
- [ ] Summary shows all calculated values
- [ ] Forecast table displays all days
- [ ] Goal day is highlighted
- [ ] Overrides can be set/cleared
- [ ] Overrides affect subsequent days

---

### Sprint 6: Import/Export & Polish

**Goal:** Data portability and UX polish

#### Steps

1. **Export functionality**
   ```
   src/components/ImportExport/ExportButton.tsx
   ```
   - Collects config + entries
   - Creates JSON blob
   - Downloads as `wow-pvp-grind-YYYY-MM-DD.json`

2. **Import functionality**
   ```
   src/components/ImportExport/ImportButton.tsx
   ```
   - File input (accepts .json)
   - Parses and validates JSON
   - Shows error if invalid
   - Replaces config + entries on success

3. **Schema versioning**
   ```
   src/utils/migration.ts
   ```
   - `CURRENT_VERSION = 1`
   - `migrate(data)` function for future upgrades

4. **UI Polish**
   - Loading state while computing
   - Error boundaries
   - Empty state (no days)
   - Tooltips for complex fields
   - Better mobile responsiveness

5. **Accessibility**
   - Proper labels on inputs
   - Keyboard navigation
   - Focus management

6. **Final styling**
   - Consistent spacing
   - Color scheme (WoW-inspired?)
   - Fonts

#### Done Criteria
- [ ] Export downloads valid JSON
- [ ] Import loads and applies config
- [ ] Invalid import shows error
- [ ] UI looks polished
- [ ] Works well on mobile

---

### Sprint 7: Final Testing & Launch

**Goal:** Production-ready release

#### Steps

1. **End-to-end testing**
   - Manual test all user flows
   - Test with real-world values
   - Test edge cases (0 games, 100% WR, etc.)
   - Test phase transition

2. **Cross-browser testing**
   - Chrome
   - Firefox
   - Safari
   - Mobile browsers

3. **Performance check**
   - Test with 60 days
   - Test with many overrides
   - Profile if slow

4. **Final code review**
   - Remove console.logs
   - Remove dead code
   - Check for security issues

5. **Update README**
   ```
   README.md
   ```
   - Project description
   - How to use
   - How to develop locally
   - License

6. **Create release**
   - Tag v1.0.0
   - Verify GitHub Pages deployment

7. **Share!**
   - Post link

#### Done Criteria
- [ ] All manual tests pass
- [ ] Works in all major browsers
- [ ] Performance is acceptable
- [ ] README is complete
- [ ] v1.0.0 released
- [ ] Live at GitHub Pages

---

## Sprint Summary

| Sprint | Focus | Key Deliverables |
|--------|-------|------------------|
| 1 | Scaffolding | Vite, CI/CD, GitHub Pages |
| 2 | Core Logic | Types, calculations, tests (TDD) |
| 3 | State | Hooks, localStorage persistence |
| 4 | Config UI | All input panels |
| 5 | Display | Summary, forecast table, overrides |
| 6 | Polish | Import/export, accessibility, styling |
| 7 | Launch | Testing, README, release |

---

## Quick Reference: Commands

```bash
# Development
npm run dev              # Start dev server
npm run test             # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Build & Deploy
npm run build            # Build for production
npm run preview          # Preview production build locally

# Quality
npm run lint             # Check for lint errors
npm run lint -- --fix    # Auto-fix lint errors
```

---

## Quick Reference: File Structure

```
src/
├── components/
│   ├── ConfigPanel/
│   │   ├── TimelineInput.tsx
│   │   ├── GameSettingsInput.tsx
│   │   ├── MultiplierInput.tsx
│   │   ├── StartingStateInput.tsx
│   │   └── TargetInput.tsx
│   ├── PhaseSettingsPanel/
│   │   └── PhaseSettingsPanel.tsx
│   ├── Summary/
│   │   └── Summary.tsx
│   ├── ForecastTable/
│   │   ├── ForecastTable.tsx
│   │   ├── DayRow.tsx
│   │   └── OverrideInputs.tsx
│   ├── ImportExport/
│   │   ├── ExportButton.tsx
│   │   └── ImportButton.tsx
│   └── Layout/
│       └── Layout.tsx
├── hooks/
│   ├── useConfig.ts
│   ├── useEntries.ts
│   ├── useForecast.ts
│   └── useLocalStorage.ts
├── logic/
│   ├── calculations.ts
│   ├── validation.ts
│   └── __tests__/
│       └── calculations.test.ts
├── config/
│   └── defaults.ts
├── types/
│   └── index.ts
├── utils/
│   └── migration.ts
├── App.tsx
├── main.tsx
└── index.css
```
