import './ConfigPanel.css';

interface TimelineInputProps {
  startDate: string;
  tbcStartDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onTbcStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  errors?: string[];
}

export function TimelineInput({
  startDate,
  tbcStartDate,
  endDate,
  onStartDateChange,
  onTbcStartDateChange,
  onEndDateChange,
  errors = [],
}: TimelineInputProps) {
  const hasDateError = (field: string) =>
    errors.some((e) => e.toLowerCase().includes(field.toLowerCase()));

  return (
    <div className="panel">
      <h3 className="panel-title">Timeline</h3>

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
        <label htmlFor="tbcStartDate">TBC Start Date</label>
        <input
          type="date"
          id="tbcStartDate"
          value={tbcStartDate}
          onChange={(e) => onTbcStartDateChange(e.target.value)}
          className={hasDateError('tbcstartdate') ? 'input-error' : ''}
        />
        <small className="text-muted">Switch from 3 to 4 BGs</small>
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

      {errors.length > 0 && (
        <div className="error-messages">
          {errors
            .filter(
              (e) =>
                e.includes('Date') ||
                e.includes('date') ||
                e.includes('startDate') ||
                e.includes('endDate') ||
                e.includes('tbcStartDate')
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
