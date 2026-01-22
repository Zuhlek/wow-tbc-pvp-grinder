import { InfoTooltip } from '../InfoTooltip';
import { NumberInput } from '../NumberInput';
import './ConfigPanel.css';

interface StartingStateInputProps {
  startingHonor: number;
  startingMarksPerBG: number;
  onStartingHonorChange: (value: number) => void;
  onStartingMarksPerBGChange: (value: number) => void;
  errors?: string[];
}

const MARKS_TOOLTIP = `Marks per BG type you currently have.

The calculator assumes you maintain roughly equal marks across all BG types throughout the grind.

Example: If you have ~40 of each mark type (WSG, AB, AV), enter 40.`;

export function StartingStateInput({
  startingHonor,
  startingMarksPerBG,
  onStartingHonorChange,
  onStartingMarksPerBGChange,
  errors = [],
}: StartingStateInputProps) {
  const hasError = (field: string) =>
    errors.some((e) => e.toLowerCase().includes(field.toLowerCase()));

  return (
    <div className="panel">
      <h3 className="panel-title">Current Progress</h3>

      <div className="form-group">
        <label htmlFor="startingHonor">Current Honor</label>
        <NumberInput
          id="startingHonor"
          min={0}
          value={startingHonor}
          onChange={onStartingHonorChange}
          className={hasError('startinghonor') ? 'input-error' : ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="startingMarksPerBG">
          Marks per BG
          <InfoTooltip content={MARKS_TOOLTIP} />
        </label>
        <NumberInput
          id="startingMarksPerBG"
          min={0}
          value={startingMarksPerBG}
          onChange={onStartingMarksPerBGChange}
          className={hasError('startingmarks') ? 'input-error' : ''}
        />
        <small className="text-muted">Your marks for each BG type</small>
      </div>
    </div>
  );
}
