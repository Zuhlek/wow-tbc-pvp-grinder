import type { Phase } from '../../types';
import './ConfigPanel.css';

interface TimelineInputProps {
  startDate: string;
  endDate: string;
  phase: Phase;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onPhaseChange: (value: Phase) => void;
  errors?: string[];
}

export function TimelineInput({
  startDate,
  endDate,
  phase,
  onStartDateChange,
  onEndDateChange,
  onPhaseChange,
  errors = [],
}: TimelineInputProps) {
  const hasDateError = (field: string) =>
    errors.some((e) => e.toLowerCase().includes(field.toLowerCase()));

  return (
    <div className="panel">
      <h3 className="panel-title">Timeline & Phase</h3>

      <div className="form-group">
        <label htmlFor="startDate">Start Date</label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className={hasDateError('startdate') ? 'input-error' : ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="endDate">End Date (Goal Deadline)</label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className={hasDateError('enddate') ? 'input-error' : ''}
        />
      </div>

      <div className="form-group">
        <label>Game Phase</label>
        <div className="phase-toggle">
          <button
            type="button"
            className={`phase-btn ${phase === 'classic' ? 'active' : ''}`}
            onClick={() => onPhaseChange('classic')}
          >
            Classic (3 BGs)
          </button>
          <button
            type="button"
            className={`phase-btn ${phase === 'tbc' ? 'active' : ''}`}
            onClick={() => onPhaseChange('tbc')}
          >
            TBC (4 BGs)
          </button>
        </div>
        <small className="text-muted">
          Affects marks per turn-in and BG count for reserve calculation
        </small>
      </div>

      {errors.length > 0 && (
        <div className="error-messages">
          {errors
            .filter(
              (e) =>
                e.includes('Date') ||
                e.includes('date') ||
                e.includes('startDate') ||
                e.includes('endDate') ||
                e.includes('phase')
            )
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
