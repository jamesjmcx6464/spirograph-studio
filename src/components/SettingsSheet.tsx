import React from 'react';
import { X } from 'lucide-react';
import { THEME } from '../constants/palette';
import { BottomSheetShell } from './BottomSheetShell';
import { NumericInputField } from './NumericInputField';

interface SettingsSheetProps {
  globalSpeed: number;
  inkWeight: number;
  showGuides: boolean;
  showPoints: boolean;
  onDismiss: () => void;
  onSpeedChange: (speed: number) => void;
  onWeightChange: (weight: number) => void;
  onToggleGuides: () => void;
  onTogglePoints: () => void;
  onClearDrawing: () => void;
  onZeroAngles: () => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  globalSpeed,
  inkWeight,
  showGuides,
  showPoints,
  onDismiss,
  onSpeedChange,
  onWeightChange,
  onToggleGuides,
  onTogglePoints,
  onClearDrawing,
  onZeroAngles,
}) => {
  const speedMax = Math.max(10, Math.min(globalSpeed, 100));
  const speedVal = Math.min(Math.max(globalSpeed, 0.01), speedMax);
  const speedPct = ((speedVal - 0.01) / (speedMax - 0.01)) * 100;

  const weightMax = Math.max(20, Math.min(inkWeight, 200));
  const weightVal = Math.min(Math.max(inkWeight, 0.01), weightMax);
  const weightPct = ((weightVal - 0.01) / (weightMax - 0.01)) * 100;

  return (
    <BottomSheetShell onDismiss={onDismiss}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <h2
            className="text-[18px] font-bold tracking-[1.5px]"
            style={{ color: THEME.BrassGold }}
          >
            SETTINGS &amp; CONTROLS
          </h2>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close sheet"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/5 cursor-pointer"
            style={{ color: THEME.MutedGray }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-3" />

        {/* Global Speed Section */}
        <div
          className="rounded-[12px] p-3"
          style={{
            backgroundColor: THEME.PanelBgElevated,
            border: `1px solid ${THEME.PanelEdge}`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-mono text-[10.5px] font-medium" style={{ color: THEME.MutedGray }}>
                GLOBAL SPEED MULTIPLIER
              </div>
              <div
                className="font-mono text-[10px]"
                style={{ color: 'rgba(123, 131, 140, 0.7)' }}
              >
                Drag or type exact rate (0.01× - 100×)
              </div>
            </div>

            <div className="flex items-center gap-1">
              <NumericInputField
                value={globalSpeed}
                onValueChange={onSpeedChange}
                minVal={0.01}
                maxVal={100}
                allowNegative={false}
                maxDecimals={2}
                className="w-[76px]"
                style={{ color: THEME.TealAccent, fontWeight: 700 }}
                ariaLabel="Global speed multiplier"
              />
              <span
                className="font-mono text-[11px] font-bold"
                style={{ color: THEME.TealAccent }}
              >
                ×
              </span>
            </div>
          </div>

          <div className="mt-3 mb-1">
            <input
              type="range"
              min={0.01}
              max={speedMax}
              step={0.01}
              value={speedVal}
              onChange={(e) => onSpeedChange(Number.parseFloat(e.target.value))}
              aria-label="Global speed slider"
              className="spiro-slider"
              style={
                {
                  '--slider-thumb': THEME.TealAccent,
                  background: `linear-gradient(to right, ${THEME.TealAccent} 0%, ${THEME.TealAccent} ${speedPct}%, ${THEME.PanelEdge} ${speedPct}%, ${THEME.PanelEdge} 100%)`,
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        <div className="h-2.5" />

        {/* Ink Weight Section */}
        <div
          className="rounded-[12px] p-3"
          style={{
            backgroundColor: THEME.PanelBgElevated,
            border: `1px solid ${THEME.PanelEdge}`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-mono text-[10.5px] font-medium" style={{ color: THEME.MutedGray }}>
                INK STROKE WEIGHT
              </div>
              <div
                className="font-mono text-[10px]"
                style={{ color: 'rgba(123, 131, 140, 0.7)' }}
              >
                Drag or type exact thickness (0.01 - 200)
              </div>
            </div>

            <div className="flex items-center gap-1">
              <NumericInputField
                value={inkWeight}
                onValueChange={onWeightChange}
                minVal={0.01}
                maxVal={200}
                allowNegative={false}
                maxDecimals={2}
                className="w-[76px]"
                style={{ color: THEME.BrassGold, fontWeight: 700 }}
                ariaLabel="Ink stroke weight"
              />
              <span
                className="font-mono text-[11px] font-bold"
                style={{ color: THEME.BrassGold }}
              >
                px
              </span>
            </div>
          </div>

          <div className="mt-3 mb-1">
            <input
              type="range"
              min={0.01}
              max={weightMax}
              step={0.05}
              value={weightVal}
              onChange={(e) => onWeightChange(Number.parseFloat(e.target.value))}
              aria-label="Ink stroke weight slider"
              className="spiro-slider"
              style={
                {
                  '--slider-thumb': THEME.BrassGold,
                  background: `linear-gradient(to right, ${THEME.BrassGold} 0%, ${THEME.BrassGold} ${weightPct}%, ${THEME.PanelEdge} ${weightPct}%, ${THEME.PanelEdge} 100%)`,
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        <div className="h-3.5" />

        {/* Visual Guides Toggles Row */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onToggleGuides}
            className="flex h-11 flex-1 items-center justify-center rounded-[10px] font-mono text-[10.5px] font-medium tracking-[0.05em] cursor-pointer"
            style={{
              backgroundColor: showGuides ? 'rgba(95, 211, 196, 0.12)' : 'transparent',
              color: showGuides ? THEME.TealAccent : THEME.MutedGray,
              border: `1px solid ${showGuides ? THEME.TealAccent : THEME.PanelEdge}`,
            }}
          >
            {showGuides ? 'GUIDES: ON' : 'GUIDES: OFF'}
          </button>

          <button
            type="button"
            onClick={onTogglePoints}
            className="flex h-11 flex-1 items-center justify-center rounded-[10px] font-mono text-[10.5px] font-medium tracking-[0.05em] cursor-pointer"
            style={{
              backgroundColor: showPoints ? 'rgba(95, 211, 196, 0.12)' : 'transparent',
              color: showPoints ? THEME.TealAccent : THEME.MutedGray,
              border: `1px solid ${showPoints ? THEME.TealAccent : THEME.PanelEdge}`,
            }}
          >
            {showPoints ? 'POINTS: ON' : 'POINTS: OFF'}
          </button>
        </div>

        <div className="h-2.5" />

        {/* Clear Canvas & Zero Angles Row */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClearDrawing}
            className="flex h-11 flex-1 items-center justify-center rounded-[10px] font-mono text-[10.5px] font-medium tracking-[0.05em] hover:bg-white/5 cursor-pointer"
            style={{
              color: THEME.DangerRed,
              border: `1px solid ${THEME.PanelEdge}`,
            }}
          >
            CLEAR INK
          </button>

          <button
            type="button"
            onClick={onZeroAngles}
            className="flex h-11 flex-1 items-center justify-center rounded-[10px] font-mono text-[10.5px] font-medium tracking-[0.05em] hover:bg-white/5 cursor-pointer"
            style={{
              color: THEME.BrassGold,
              border: `1px solid ${THEME.PanelEdge}`,
            }}
          >
            ZERO ANGLES
          </button>
        </div>

        <p
          className="mt-6 text-center font-mono text-[10px] tracking-[0.08em] select-none"
          style={{ color: THEME.MutedGray, opacity: 0.7 }}
        >
          {__APP_VERSION__}
        </p>
      </div>
    </BottomSheetShell>
  );
};
