import { useState } from 'react';
import type { DayResult, DayOverrides } from '../../types';
import { DayRow } from './DayRow';
import { OverrideInputs } from './OverrideInputs';
import './ForecastTable.css';

interface ForecastTableProps {
  results: DayResult[];
  enableTurnIns: boolean;
  onSetOverride: (dayIndex: number, date: string, overrides: DayOverrides) => void;
  onClearOverride: (dayIndex: number) => void;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function ForecastTable({
  results,
  enableTurnIns,
  onSetOverride,
  onClearOverride,
}: ForecastTableProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const today = getToday();

  const handleRowClick = (dayIndex: number) => {
    setExpandedDay(expandedDay === dayIndex ? null : dayIndex);
  };

  const handleOverrideSave = (
    dayIndex: number,
    date: string,
    overrides: DayOverrides
  ) => {
    onSetOverride(dayIndex, date, overrides);
    setExpandedDay(null);
  };

  const handleOverrideClear = (dayIndex: number) => {
    onClearOverride(dayIndex);
    setExpandedDay(null);
  };

  if (results.length === 0) {
    return (
      <div className="panel forecast-panel">
        <h3 className="panel-title">Forecast</h3>
        <p className="text-muted">No forecast data available.</p>
      </div>
    );
  }

  return (
    <div className="panel forecast-panel">
      <h3 className="panel-title">Forecast</h3>

      <div className="forecast-table-container">
        <table className="forecast-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Date</th>
              <th className="text-right">Games</th>
              <th className="text-right">Marks</th>
              {enableTurnIns && <th className="text-right">Turn-ins</th>}
              <th className="text-right">Honor</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <DayRow
                key={result.dayIndex}
                result={result}
                enableTurnIns={enableTurnIns}
                isExpanded={expandedDay === result.dayIndex}
                isToday={result.date === today}
                onClick={() => handleRowClick(result.dayIndex)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {expandedDay !== null && (
        <OverrideInputs
          result={results.find((r) => r.dayIndex === expandedDay)!}
          onSave={handleOverrideSave}
          onClear={handleOverrideClear}
          onCancel={() => setExpandedDay(null)}
        />
      )}

      <p className="forecast-hint text-muted">
        Click a row to override actual values
      </p>
    </div>
  );
}
