import { useState, useEffect } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  id,
  className,
  disabled,
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState(String(value));

  useEffect(() => {
    setDisplayValue(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);

    if (raw === '' || raw === '-') {
      return;
    }

    const parsed = Number(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    if (displayValue === '' || displayValue === '-') {
      setDisplayValue(String(min ?? 0));
      onChange(min ?? 0);
    } else {
      const parsed = Number(displayValue);
      if (!isNaN(parsed)) {
        setDisplayValue(String(parsed));
      }
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      id={id}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      min={min}
      max={max}
      step={step}
      className={className}
      disabled={disabled}
    />
  );
}
