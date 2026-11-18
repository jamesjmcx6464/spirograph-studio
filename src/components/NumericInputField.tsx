import React, { useEffect, useRef, useState } from 'react';
import { THEME } from '../constants/palette';
import { formatDisplayNumber, sanitizeNumericInput } from '../utils/gearMath';

interface NumericInputFieldProps {
  value: number;
  onValueChange: (val: number) => void;
  minVal?: number;
  maxVal?: number;
  maxDecimals?: number;
  allowNegative?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export const NumericInputField: React.FC<NumericInputFieldProps> = ({
  value,
  onValueChange,
  minVal,
  maxVal,
  maxDecimals = 2,
  allowNegative = true,
  className = '',
  style,
  ariaLabel,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [textState, setTextState] = useState(() => formatDisplayNumber(value, maxDecimals));
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isFocused || !isUserTyping) {
      setTextState(formatDisplayNumber(value, maxDecimals));
    }
  }, [value, maxDecimals, isFocused, isUserTyping]);

  const commitAndClamp = () => {
    setIsUserTyping(false);
    const parsed = Number.parseFloat(textState);
    if (Number.isFinite(parsed)) {
      let clamped = parsed;
      if (minVal !== undefined) clamped = Math.max(minVal, clamped);
      if (maxVal !== undefined) clamped = Math.min(maxVal, clamped);
      onValueChange(clamped);
      setTextState(formatDisplayNumber(clamped, maxDecimals));
    } else {
      setTextState(formatDisplayNumber(value, maxDecimals));
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={allowNegative ? 'text' : 'decimal'}
      aria-label={ariaLabel}
      value={textState}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        commitAndClamp();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          inputRef.current?.blur();
        }
      }}
      onChange={(e) => {
        const sanitized = sanitizeNumericInput(e.target.value, allowNegative);
        if (sanitized !== null) {
          setIsUserTyping(true);
          setTextState(sanitized);
          const parsed = Number.parseFloat(sanitized);
          if (Number.isFinite(parsed)) {
            const safeVal = Math.min(Math.max(parsed, -50000), 50000);
            onValueChange(safeVal);
          }
        }
      }}
      className={`h-[38px] rounded-[8px] px-2 text-center font-mono text-[13px] font-semibold outline-none tabular-nums transition-colors ${className}`}
      style={{
        backgroundColor: THEME.CanvasBg,
        color: THEME.PaperWhite,
        border: `1px solid ${isFocused ? THEME.TealAccent : THEME.PanelEdge}`,
        ...style,
      }}
    />
  );
};
