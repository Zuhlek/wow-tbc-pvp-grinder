import { InfoTooltip } from '../InfoTooltip';
import './ConfigPanel.css';

interface GameSettingsInputProps {
  winRate: number;
  marksThresholdPerBG: number;
  enableTurnIns: boolean;
  dailyQuestHonor: number;
  turnInHonor: number;
  onWinRateChange: (value: number) => void;
  onMarksThresholdChange: (value: number) => void;
  onEnableTurnInsChange: (value: boolean) => void;
  onDailyQuestHonorChange: (value: number) => void;
  onTurnInHonorChange: (value: number) => void;
  errors?: string[];
}

const RESERVE_TOOLTIP = `The reserve threshold prevents you from running out of marks for a specific BG type.

Since marks are tracked as a combined total (assuming equal distribution), the reserve is calculated as: threshold × number of BG types.

Example: 50 per BG × 3 BGs = 150 total marks kept in reserve before turn-ins begin.`;

const TURNIN_TOOLTIP = `A turn-in set requires one mark from each BG type. In Classic (3 BGs), that's 3 marks total. In TBC (4 BGs), it's 4 marks.

The calculator automatically converts excess marks above your reserve into turn-in sets.`;

export function GameSettingsInput({
  winRate,
  marksThresholdPerBG,
  enableTurnIns,
  dailyQuestHonor,
  turnInHonor,
  onWinRateChange,
  onMarksThresholdChange,
  onEnableTurnInsChange,
  onDailyQuestHonorChange,
  onTurnInHonorChange,
  errors = [],
}: GameSettingsInputProps) {
  const hasError = (field: string) =>
    errors.some((e) => e.toLowerCase().includes(field.toLowerCase()));

  return (
    <div className="panel">
      <h3 className="panel-title">Game Settings</h3>

      <div className="form-group slider-group">
        <div className="slider-header">
          <label htmlFor="winRate">Win Rate</label>
          <span className="slider-value">{Math.round(winRate * 100)}%</span>
        </div>
        <input
          type="range"
          id="winRate"
          min="0"
          max="100"
          value={winRate * 100}
          onChange={(e) => onWinRateChange(Number(e.target.value) / 100)}
          className={hasError('winrate') ? 'input-error' : ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="marksThreshold">
          Marks Reserve
          <InfoTooltip content={RESERVE_TOOLTIP} />
        </label>
        <div className="input-with-suffix">
          <input
            type="number"
            id="marksThreshold"
            min="0"
            value={marksThresholdPerBG}
            onChange={(e) => onMarksThresholdChange(Number(e.target.value))}
            className={hasError('marksthreshold') ? 'input-error' : ''}
          />
          <span className="input-suffix">per BG type</span>
        </div>
        <small className="text-muted">
          Marks kept before turning in excess
        </small>
      </div>

      <div className="form-group">
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="enableTurnIns"
            checked={enableTurnIns}
            onChange={(e) => onEnableTurnInsChange(e.target.checked)}
          />
          <label htmlFor="enableTurnIns">
            Enable Mark Turn-ins
            <InfoTooltip content={TURNIN_TOOLTIP} />
          </label>
        </div>
        <small className="text-muted">
          Uncheck to track marks without turning them in
        </small>
      </div>

      <hr className="divider" />

      <div className="form-group">
        <label htmlFor="dailyQuestHonor">Daily Quest Honor</label>
        <input
          type="number"
          id="dailyQuestHonor"
          min="0"
          value={dailyQuestHonor}
          onChange={(e) => onDailyQuestHonorChange(Number(e.target.value))}
          className={hasError('dailyquesthonor') ? 'input-error' : ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="turnInHonor">Turn-in Honor (per set)</label>
        <input
          type="number"
          id="turnInHonor"
          min="0"
          value={turnInHonor}
          onChange={(e) => onTurnInHonorChange(Number(e.target.value))}
          className={hasError('turninhonor') ? 'input-error' : ''}
        />
      </div>

      {errors.filter((e) => e.includes('winRate') || e.includes('marks')).length > 0 && (
        <div className="error-messages">
          {errors
            .filter((e) => e.includes('winRate') || e.includes('marks'))
            .map((error, i) => (
              <p key={i} className="error-message">
                {error}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
