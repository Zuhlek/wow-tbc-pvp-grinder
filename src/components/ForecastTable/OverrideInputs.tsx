import { useState } from 'react';
import type { DayResult, DayOverrides } from '../../types';

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
  const [honor, setHonor] = useState<string>(
    result.overrideApplied ? result.honorEndOfDay.toString() : ''
  );
  const [marks, setMarks] = useState<string>(
    result.overrideApplied ? result.marksAfterTurnIn.toString() : ''
  );

  const handleSave = () => {
    const overrides: DayOverrides = {};

    if (honor.trim() !== '') {
      overrides.actualHonorEndOfDay = Number(honor);
    }
    if (marks.trim() !== '') {
      overrides.actualMarksEndOfDay = Number(marks);
    }

    if (Object.keys(overrides).length > 0) {
      onSave(result.dayIndex, result.date, overrides);
    }
  };

  const handleClear = () => {
    onClear(result.dayIndex);
  };

  // Format date for display
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
          <label htmlFor="override-honor">Actual Honor (end of day)</label>
          <input
            type="number"
            id="override-honor"
            value={honor}
            onChange={(e) => setHonor(e.target.value)}
            placeholder={result.honorEndOfDay.toString()}
            min="0"
          />
          <small className="text-muted">
            Forecast: {result.honorEndOfDay.toLocaleString()}
          </small>
        </div>

        <div className="override-field">
          <label htmlFor="override-marks">Actual Marks (end of day)</label>
          <input
            type="number"
            id="override-marks"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            placeholder={Math.round(result.marksAfterTurnIn).toString()}
            min="0"
          />
          <small className="text-muted">
            Forecast: {Math.round(result.marksAfterTurnIn)}
          </small>
        </div>
      </div>

      <div className="override-actions">
        <button type="button" onClick={handleSave}>
          Save Override
        </button>
        {result.overrideApplied && (
          <button type="button" className="danger" onClick={handleClear}>
            Clear Override
          </button>
        )}
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
