import type { DayResult } from '../../types';

interface DayRowProps {
  result: DayResult;
  enableTurnIns: boolean;
  isExpanded: boolean;
  isToday: boolean;
  onClick: () => void;
}

export function DayRow({ result, enableTurnIns, isExpanded, isToday, onClick }: DayRowProps) {
  const rowClasses = [
    'forecast-row',
    result.isGoalReachedDay ? 'goal-row' : '',
    result.overrideApplied ? 'override-row' : '',
    isExpanded ? 'expanded' : '',
    isToday ? 'today-row' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${m}/${d}`;
  };

  // Calculate net marks change (gained minus turn-ins)
  const netMarksChange = Math.round(result.marksPerBGEnd - result.marksPerBGStart);

  return (
    <tr className={rowClasses} onClick={onClick}>
      <td className="day-cell">
        {result.dayIndex}
        {result.overrideApplied && <span className="override-indicator">*</span>}
      </td>
      <td className="date-cell">{formatDate(result.date)}</td>
      <td className="text-right">{Math.round(result.gamesPlanned)}</td>
      <td className="text-right change-cell">
        {netMarksChange >= 0 ? '+' : ''}{netMarksChange}
      </td>
      <td className="text-right">{Math.round(result.marksPerBGEnd)}</td>
      {enableTurnIns && (
        <td className="text-right">
          {result.turnInSets > 0 ? result.turnInSets : '-'}
        </td>
      )}
      <td className="text-right change-cell">
        +{Math.round(result.totalHonorGained).toLocaleString()}
      </td>
      <td className="text-right honor-cell">
        {Math.round(result.honorEndOfDay).toLocaleString()}
        {result.isGoalReachedDay && <span className="goal-indicator">✓</span>}
      </td>
    </tr>
  );
}
