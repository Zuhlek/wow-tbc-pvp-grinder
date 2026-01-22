import { useState } from 'react';
import type { DayResult, DayOverrides } from '../../types';
import { NumberInput } from '../NumberInput';

interface OverrideInputsProps {
  result: DayResult;
  onSave: (dayIndex: number, date: string, overrides: DayOverrides) => void;
  onClear: (dayIndex: number) => void;
  onCancel: () => void;
}

export function OverrideInputs({
  result,
  onSave,
  onClear,
  onCancel,
}: OverrideInputsProps) {
  const [honor, setHonor] = useState<number | null>(
    result.overrideApplied ? result.honorEndOfDay : null
  );
  const [marks, setMarks] = useState<number | null>(
    result.overrideApplied ? result.marksPerBGEnd : null
  );

  const handleSave = () => {
    const overrides: DayOverrides = {};

    if (honor !== null) {
      overrides.actualHonorEndOfDay = honor;
    }
    if (marks !== null) {
      overrides.actualMarksPerBG = marks;
    }

    if (Object.keys(overrides).length > 0) {
      onSave(result.dayIndex, result.date, overrides);
    }
  };

  const handleClear = () => {
    onClear(result.dayIndex);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="override-panel">
      <div className="override-header">
        <h4>Override Day {result.dayIndex}</h4>
        <span className="text-muted">{formatDate(result.date)}</span>
      </div>

      <div className="override-form">
        <div className="override-field">
          <label htmlFor="override-honor">Actual Honor</label>
          <NumberInput
            id="override-honor"
            value={honor ?? Math.round(result.honorEndOfDay)}
            onChange={setHonor}
            min={0}
          />
          <small className="text-muted">
            Forecast: {Math.round(result.honorEndOfDay).toLocaleString()}
          </small>
        </div>

        <div className="override-field">
          <label htmlFor="override-marks">Actual Marks per BG</label>
          <NumberInput
            id="override-marks"
            value={marks ?? Math.round(result.marksPerBGEnd)}
            onChange={setMarks}
            min={0}
          />
          <small className="text-muted">
            Forecast: {result.marksPerBGEnd.toFixed(1)}
          </small>
        </div>
      </div>

      <div className="override-actions">
        <button type="button" onClick={handleSave}>
          Save
        </button>
        {result.overrideApplied && (
          <button type="button" className="danger" onClick={handleClear}>
            Clear
          </button>
        )}
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
