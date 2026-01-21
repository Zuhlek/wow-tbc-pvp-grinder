import type { DayResult } from '../../types';

interface DayRowProps {
  result: DayResult;
  enableTurnIns: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

export function DayRow({ result, enableTurnIns, isExpanded, onClick }: DayRowProps) {
  const rowClasses = [
    'forecast-row',
    result.isGoalReachedDay ? 'goal-row' : '',
    result.overrideApplied ? 'override-row' : '',
    isExpanded ? 'expanded' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Format date to shorter form (Jan 18)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <tr className={rowClasses} onClick={onClick}>
      <td className="day-cell">
        {result.dayIndex}
        {result.overrideApplied && <span className="override-indicator">*</span>}
      </td>
      <td className="date-cell">{formatDate(result.date)}</td>
      <td className="phase-cell">
        <span className={`badge badge-${result.phase}`}>
          {result.phase === 'classic' ? 'CLA' : 'TBC'}
        </span>
      </td>
      <td className="text-right">{result.gamesPlanned.toFixed(1)}</td>
      <td className="text-right">+{Math.round(result.expectedMarksGained)}</td>
      <td className="text-right">{Math.round(result.marksAfterTurnIn)}</td>
      {enableTurnIns && (
        <td className="text-right">
          {result.turnInSets > 0 ? result.turnInSets : '-'}
        </td>
      )}
      <td className="text-right honor-cell">
        {result.honorEndOfDay.toLocaleString()}
        {result.isGoalReachedDay && <span className="goal-indicator">✓</span>}
      </td>
    </tr>
  );
}
