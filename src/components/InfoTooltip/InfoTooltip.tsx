import { useState } from 'react';
import './InfoTooltip.css';

interface InfoTooltipProps {
  content: string;
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="info-tooltip-wrapper">
      <button
        type="button"
        className="info-tooltip-btn"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setIsOpen(false)}
        aria-label="More information"
      >
        ?
      </button>
      {isOpen && (
        <div className="info-tooltip-content">
          {content}
        </div>
      )}
    </span>
  );
}
