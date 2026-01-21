import { InfoTooltip } from '../InfoTooltip';
import './ConfigPanel.css';

interface StartingStateInputProps {
  startingHonor: number;
  startingMarks: number;
  onStartingHonorChange: (value: number) => void;
  onStartingMarksChange: (value: number) => void;
  errors?: string[];
}

const MARKS_TOOLTIP = `Enter the sum of all your battleground marks (WSG + AB + AV, or +EotS in TBC).

The calculator assumes you'll earn marks evenly across all BG types during the grind, so tracking individual mark types isn't necessary.

Example: If you have 20 WSG, 15 AB, and 10 AV marks, enter 45.`;

export function StartingStateInput({
  startingHonor,
  startingMarks,
  onStartingHonorChange,
  onStartingMarksChange,
  errors = [],
}: StartingStateInputProps) {
  const hasError = (field: string) =>
    errors.some((e) => e.toLowerCase().includes(field.toLowerCase()));

  return (
    <div className="panel">
      <h3 className="panel-title">Current Progress</h3>

      <div className="form-group">
        <label htmlFor="startingHonor">Current Honor</label>
        <input
          type="number"
          id="startingHonor"
          min="0"
          value={startingHonor}
          onChange={(e) => onStartingHonorChange(Number(e.target.value))}
          className={hasError('startinghonor') ? 'input-error' : ''}
        />
        <small className="text-muted">Your honor at start of calculation</small>
      </div>

      <div className="form-group">
        <label htmlFor="startingMarks">
          Total Marks
          <InfoTooltip content={MARKS_TOOLTIP} />
        </label>
        <input
          type="number"
          id="startingMarks"
          min="0"
          value={startingMarks}
          onChange={(e) => onStartingMarksChange(Number(e.target.value))}
          className={hasError('startingmarks') ? 'input-error' : ''}
        />
        <small className="text-muted">Sum of all BG marks combined</small>
      </div>

      {errors.filter((e) => e.includes('starting')).length > 0 && (
        <div className="error-messages">
          {errors
            .filter((e) => e.includes('starting'))
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
