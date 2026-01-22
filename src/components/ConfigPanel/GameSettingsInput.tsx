import { InfoTooltip } from '../InfoTooltip';
import { NumberInput } from '../NumberInput';
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

const RESERVE_TOOLTIP = `Marks per BG type to keep before turning in excess.

Example: With a reserve of 30, you'll keep 30 WSG, 30 AB, and 30 AV marks before any turn-ins happen.`;

const TURNIN_TOOLTIP = `A turn-in requires one mark from each BG type.

When your marks per BG exceed the reserve threshold, excess marks are converted into turn-in sets for bonus honor.`;

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
          <NumberInput
            id="marksThreshold"
            min={0}
            value={marksThresholdPerBG}
            onChange={onMarksThresholdChange}
            className={hasError('marksthreshold') ? 'input-error' : ''}
          />
          <span className="input-suffix">per BG</span>
        </div>
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
            Enable Turn-ins
            <InfoTooltip content={TURNIN_TOOLTIP} />
          </label>
        </div>
      </div>

      <hr className="divider" />

      <div className="form-group">
        <label htmlFor="dailyQuestHonor">Daily Quest Honor</label>
        <NumberInput
          id="dailyQuestHonor"
          min={0}
          value={dailyQuestHonor}
          onChange={onDailyQuestHonorChange}
          className={hasError('dailyquesthonor') ? 'input-error' : ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="turnInHonor">Turn-in Honor</label>
        <NumberInput
          id="turnInHonor"
          min={0}
          value={turnInHonor}
          onChange={onTurnInHonorChange}
          className={hasError('turninhonor') ? 'input-error' : ''}
        />
        <small className="text-muted">Honor per turn-in set</small>
      </div>
    </div>
  );
}
