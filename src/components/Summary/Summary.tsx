import type { AppConfig, DayResult } from '../../types';
import './Summary.css';

interface SummaryProps {
  config: AppConfig;
  dailyGamesRequired: number;
  goalDay: DayResult | null;
  totalDays: number;
  isValid: boolean;
  errors: string[];
}

export function Summary({
  config,
  dailyGamesRequired,
  goalDay,
  totalDays,
  isValid,
  errors,
}: SummaryProps) {
  const honorRemaining = Math.max(0, config.honorTarget - config.startingHonor);
  const progressPercent = Math.min(
    100,
    (config.startingHonor / config.honorTarget) * 100
  );

  const isManualMode = config.calculationMode === 'manual';

  // Check if goal is after end date (only relevant in auto mode)
  const goalAfterDeadline = !isManualMode && goalDay && goalDay.date > config.endDate;

  if (!isValid) {
    return (
      <div className="panel summary-panel">
        <h3 className="panel-title">Summary</h3>
        <div className="validation-errors">
          <p className="text-danger">Configuration has errors:</p>
          <ul>
            {errors.map((error, i) => (
              <li key={i} className="text-danger">
                {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="panel summary-panel">
      <h3 className="panel-title">Summary</h3>

      <div className="summary-content">
        {/* Honor Progress */}
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">Honor Progress</span>
            <span className="progress-value">
              {config.startingHonor.toLocaleString()} /{' '}
              {config.honorTarget.toLocaleString()}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="progress-footer">
            <span className="text-muted">
              {honorRemaining.toLocaleString()} remaining
            </span>
            <span className="text-muted">{progressPercent.toFixed(1)}%</span>
          </div>
        </div>

        {/* Marks Info */}
        <div className="info-row">
          <span className="info-label">Starting Marks</span>
          <span className="info-value">{config.startingMarksPerBG}/BG</span>
        </div>
        <div className="info-row">
          <span className="info-label">Marks Reserve</span>
          <span className="info-value text-muted">
            {config.marksThresholdPerBG}/BG
          </span>
        </div>

        <hr className="divider" />

        {/* Key Metrics - different for auto vs manual mode */}
        {isManualMode ? (
          <>
            <div className="info-row">
              <span className="info-label">Games/Day</span>
              <span className="info-value">{config.manualGamesPerDay}</span>
            </div>
            {goalDay && (
              <div className="info-row">
                <span className="info-label">Days to Goal</span>
                <span className="info-value">{goalDay.dayIndex}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="info-row">
              <span className="info-label">Days</span>
              <span className="info-value">{totalDays}</span>
            </div>
            <div className="metric-highlight">
              <span className="metric-label">Games/Day</span>
              <span className="metric-value">{dailyGamesRequired.toFixed(1)}</span>
            </div>
          </>
        )}

        {/* Goal Status */}
        <div className="goal-status">
          {goalDay && !goalAfterDeadline && (
            <div className="goal-reached">
              <span className="goal-icon">✓</span>
              <div className="goal-info">
                <span className="goal-label">Goal Reached</span>
                <span className="goal-value">
                  Day {goalDay.dayIndex} ({goalDay.date})
                </span>
              </div>
            </div>
          )}

          {goalDay && goalAfterDeadline && (
            <div className="goal-warning">
              <span className="goal-icon">!</span>
              <div className="goal-info">
                <span className="goal-label text-warning">Goal After Deadline</span>
                <span className="goal-value text-warning">
                  Day {goalDay.dayIndex} ({goalDay.date})
                </span>
              </div>
            </div>
          )}

          {!goalDay && (
            <div className="goal-not-reached">
              <span className="goal-icon">✗</span>
              <div className="goal-info">
                <span className="goal-label text-danger">Goal Not Reached</span>
                <span className="goal-value text-muted">
                  {isManualMode ? 'Increase games or target unreachable' : 'Increase games or extend deadline'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
