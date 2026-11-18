import React, { useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Layers, Plus, RefreshCw, X } from 'lucide-react';
import { INK_PALETTE, THEME } from '../constants/palette';
import { GearCircle, GearMode, ResolvedLink } from '../types/spirograph';
import {
  DEFAULT_STEP_INDEX,
  STEP_DISPLAY_LABELS,
  STEP_MULTIPLIERS,
  formatDisplayNumber,
} from '../utils/gearMath';
import { BottomSheetShell } from './BottomSheetShell';
import { NumericInputField } from './NumericInputField';

interface GearTrainSheetProps {
  circles: GearCircle[];
  resolvedChain: ResolvedLink[];
  onDismiss: () => void;
  onAddCircle: () => void;
  onLayerCircle: () => void;
  onRemoveCircle: (id: number) => void;
  onSetMode: (idx: number, mode: GearMode) => void;
  onSetPen: (idx: number, isPen: boolean) => void;
  onSetColor: (idx: number, color: string) => void;
  onSetRadius: (idx: number, product: number, base: number, step: number) => void;
  onSetSpeed: (idx: number, product: number, base: number, step: number) => void;
  onResetDrawing: () => void;
}

export const GearTrainSheet: React.FC<GearTrainSheetProps> = ({
  circles,
  onDismiss,
  onAddCircle,
  onLayerCircle,
  onRemoveCircle,
  onSetMode,
  onSetPen,
  onSetColor,
  onSetRadius,
  onSetSpeed,
  onResetDrawing,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prevCircleCountRef = useRef<number>(circles.length);

  // Auto-scroll to newly added gear when circle count increases
  useEffect(() => {
    if (circles.length > prevCircleCountRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    prevCircleCountRef.current = circles.length;
  }, [circles.length]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <BottomSheetShell onDismiss={onDismiss} showDragHandle={false}>
      <div className="flex min-h-0 flex-1 flex-col px-4 pt-2 pb-6">
        {/* Header with Title, Quick Jump [TOP]/[BOTTOM], and Close [X] */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <h2
              className="text-[18px] font-bold tracking-[1.5px]"
              style={{ color: THEME.BrassGold }}
            >
              GEAR TRAIN
            </h2>
            <span
              className="rounded-[8px] px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums"
              style={{ backgroundColor: THEME.BrassGlow, color: THEME.BrassGold }}
            >
              {circles.length}
            </span>
          </div>

          {/* Quick Jump Buttons */}
          <div
            className="flex items-center gap-0.5 rounded-[8px] p-0.5"
            style={{
              backgroundColor: THEME.CanvasBg,
              border: `1px solid ${THEME.PanelEdge}`,
            }}
          >
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-0.5 rounded-[6px] px-2 py-1 font-mono text-[10px] font-bold hover:bg-white/5 cursor-pointer"
              style={{ color: THEME.PaperWhite }}
            >
              <ChevronUp className="h-4 w-4" style={{ color: THEME.TealAccent }} />
              <span>TOP</span>
            </button>
            <button
              type="button"
              onClick={scrollToBottom}
              className="flex items-center gap-0.5 rounded-[6px] px-2 py-1 font-mono text-[10px] font-bold hover:bg-white/5 cursor-pointer"
              style={{ color: THEME.PaperWhite }}
            >
              <ChevronDown className="h-4 w-4" style={{ color: THEME.BrassGold }} />
              <span>BOTTOM</span>
            </button>
          </div>

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

        <p
          className="mt-1 mb-2.5 font-mono text-[10.5px] leading-[14px]"
          style={{ color: THEME.MutedGray }}
        >
          Configure radii, rotation speeds, modes, and ink pens for each harmonic link.
        </p>

        {/* Top Action: Reset Drawing */}
        <button
          type="button"
          onClick={onResetDrawing}
          className="flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-[10px] font-mono text-[11px] font-medium tracking-[0.05em] hover:bg-white/5 cursor-pointer"
          style={{
            color: THEME.BrassGold,
            border: `1px solid ${THEME.BrassDim}`,
          }}
        >
          <RefreshCw className="h-4 w-4" />
          <span>RESET DRAWING &amp; ANGLES</span>
        </button>

        <div className="h-2.5 shrink-0" />

        {/* Scrollable Circles List */}
        <div
          ref={scrollContainerRef}
          className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5"
        >
          {circles.map((circle, index) => (
            <GearCard
              key={circle.id}
              index={index}
              circle={circle}
              canRemove={circles.length > 1 && index === circles.length - 1}
              onRemove={() => onRemoveCircle(circle.id)}
              onModeChange={(mode) => onSetMode(index, mode)}
              onPenChange={(isPen) => onSetPen(index, isPen)}
              onColorChange={(color) => onSetColor(index, color)}
              onRadiusChange={(prod, base, step) => onSetRadius(index, prod, base, step)}
              onSpeedChange={(prod, base, step) => onSetSpeed(index, prod, base, step)}
            />
          ))}

          {/* ADD & LAYER Buttons */}
          <div className="flex gap-2.5 pt-1 pb-2">
            <button
              type="button"
              onClick={onAddCircle}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[10px] font-mono text-[11.5px] font-bold transition-opacity hover:opacity-90 cursor-pointer"
              style={{
                backgroundColor: THEME.PanelBgElevated,
                color: THEME.BrassGold,
                border: '1px solid rgba(110, 95, 69, 0.6)',
              }}
            >
              <Plus className="h-4 w-4" />
              <span>ADD (r=1, s=1)</span>
            </button>

            <button
              type="button"
              onClick={onLayerCircle}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[10px] font-mono text-[11.5px] font-bold transition-opacity hover:opacity-90 cursor-pointer"
              style={{
                backgroundColor: THEME.PanelBgElevated,
                color: THEME.TealAccent,
                border: '1px solid rgba(95, 211, 196, 0.6)',
              }}
            >
              <Layers className="h-4 w-4" />
              <span>LAYER (r, s)</span>
            </button>
          </div>
        </div>
      </div>
    </BottomSheetShell>
  );
};

interface GearCardProps {
  index: number;
  circle: GearCircle;
  canRemove: boolean;
  onRemove: () => void;
  onModeChange: (mode: GearMode) => void;
  onPenChange: (isPen: boolean) => void;
  onColorChange: (color: string) => void;
  onRadiusChange: (product: number, base: number, stepIndex: number) => void;
  onSpeedChange: (product: number, base: number, stepIndex: number) => void;
}

const GearCard: React.FC<GearCardProps> = ({
  index,
  circle,
  canRemove,
  onRemove,
  onModeChange,
  onPenChange,
  onColorChange,
  onRadiusChange,
  onSpeedChange,
}) => {
  const isEngine = index === 0;
  const cardBg = isEngine ? THEME.EngineCardBg : THEME.PanelBgElevated;
  const cardBorderColor = isEngine
    ? 'rgba(201, 162, 106, 0.85)'
    : circle.isPen
      ? THEME.BrassDim
      : THEME.PanelEdge;
  const cardBorderWidth = isEngine ? '1.5px' : '1px';

  const isRelative = index > 0 && circle.mode !== GearMode.GLOBAL;
  const radiusVal =
    index === 0
      ? circle.radius
      : circle.mode === GearMode.GLOBAL
        ? circle.radiusGlobal
        : circle.mode === GearMode.ENGINE
          ? circle.radiusEngineMult
          : circle.radiusPrevMult;
  const radiusUnit = isRelative ? '×' : 'px';

  const speedVal =
    index === 0
      ? circle.speedDeg
      : circle.mode === GearMode.GLOBAL
        ? circle.speedGlobal
        : circle.mode === GearMode.ENGINE
          ? circle.speedEngineMult
          : circle.speedPrevMult;
  const speedUnit = isRelative ? '×' : '°/s';

  return (
    <div
      className="rounded-[12px] p-3"
      style={{
        backgroundColor: cardBg,
        border: `${cardBorderWidth} solid ${cardBorderColor}`,
      }}
    >
      {/* Card Head */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left: Indicator Dot & Title */}
        <div className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{
              backgroundColor: circle.isPen
                ? circle.color
                : isEngine
                  ? THEME.BrassGold
                  : THEME.BoltGray,
            }}
          />
          {isEngine ? (
            <span
              className="rounded-[6px] px-2 py-0.5 text-[13px] font-bold tracking-[0.5px]"
              style={{
                backgroundColor: THEME.BrassGlow,
                border: '1px solid rgba(201, 162, 106, 0.4)',
                color: THEME.BrassGold,
              }}
            >
              CIRCLE 1 · ENGINE
            </span>
          ) : (
            <span
              className="text-[14px] font-bold"
              style={{ color: THEME.PaperWhite }}
            >
              CIRCLE {index + 1}
            </span>
          )}
        </div>

        {/* Right: Bolt/Pen Toggle + Swatches + Remove */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div
            className="flex items-center gap-0.5 rounded-[6px] p-0.5"
            style={{
              backgroundColor: THEME.CanvasBg,
              border: `1px solid ${THEME.PanelEdge}`,
            }}
          >
            <button
              type="button"
              onClick={() => onPenChange(false)}
              className="rounded-[4px] px-1.5 py-0.5 font-mono text-[9.5px] cursor-pointer"
              style={{
                backgroundColor: !circle.isPen ? 'rgba(139, 149, 161, 0.3)' : 'transparent',
                color: !circle.isPen ? THEME.PaperWhite : THEME.MutedGray,
                fontWeight: !circle.isPen ? 700 : 400,
              }}
            >
              BOLT
            </button>
            <button
              type="button"
              onClick={() => onPenChange(true)}
              className="rounded-[4px] px-1.5 py-0.5 font-mono text-[9.5px] cursor-pointer"
              style={{
                backgroundColor: circle.isPen ? 'rgba(227, 155, 62, 0.3)' : 'transparent',
                color: circle.isPen ? THEME.InkAmber : THEME.MutedGray,
                fontWeight: circle.isPen ? 700 : 400,
              }}
            >
              PEN
            </button>
          </div>

          {circle.isPen && (
            <div className="flex items-center gap-1">
              {INK_PALETTE.map((swatch) => {
                const isSelected = circle.color.toUpperCase() === swatch.toUpperCase();
                return (
                  <button
                    key={swatch}
                    type="button"
                    aria-label={`Select ink color ${swatch}`}
                    onClick={() => onColorChange(swatch)}
                    className="h-[18px] w-[18px] rounded-full cursor-pointer transition-transform active:scale-90"
                    style={{
                      backgroundColor: swatch,
                      border: isSelected
                        ? `2px solid ${THEME.PaperWhite}`
                        : '0.5px solid rgba(255, 255, 255, 0.3)',
                    }}
                  />
                );
              })}
            </div>
          )}

          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove circle"
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10 cursor-pointer"
              style={{ color: THEME.DangerRed }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector for child circles */}
      {index > 0 && (
        <div
          className="mt-2.5 flex gap-1 rounded-[8px] p-[3px]"
          style={{ backgroundColor: THEME.CanvasBg }}
        >
          {(
            [
              { mode: GearMode.GLOBAL, label: 'ABSOLUTE' },
              { mode: GearMode.ENGINE, label: 'ENGINE' },
              { mode: GearMode.PREVIOUS, label: 'PREVIOUS' },
            ] as const
          ).map((item) => {
            const isSelected = circle.mode === item.mode;
            return (
              <button
                key={item.mode}
                type="button"
                onClick={() => onModeChange(item.mode)}
                className="flex-1 rounded-[6px] py-1.5 font-mono text-[9.5px] transition-colors cursor-pointer"
                style={{
                  backgroundColor: isSelected ? 'rgba(201, 162, 106, 0.2)' : 'transparent',
                  color: isSelected ? THEME.BrassGold : THEME.MutedGray,
                  fontWeight: isSelected ? 700 : 400,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Radius Control */}
      <div className="mt-2.5">
        <ParamControlRow
          label="RADIUS"
          unit={radiusUnit}
          storedProduct={radiusVal}
          storedBase={circle.radiusBase}
          storedStepIndex={circle.radiusStepIndex}
          allowNegative={false}
          onValueChange={onRadiusChange}
        />
      </div>

      {/* Speed Control */}
      <div className="mt-2.5">
        <ParamControlRow
          label="SPEED"
          unit={speedUnit}
          storedProduct={speedVal}
          storedBase={circle.speedBase}
          storedStepIndex={circle.speedStepIndex}
          allowNegative={true}
          onValueChange={onSpeedChange}
        />
      </div>
    </div>
  );
};

interface ParamControlRowProps {
  label: string;
  unit: string;
  storedProduct: number;
  storedBase: number | null;
  storedStepIndex: number;
  allowNegative: boolean;
  onValueChange: (product: number, base: number, stepIndex: number) => void;
}

const ParamControlRow: React.FC<ParamControlRowProps> = ({
  label,
  unit,
  storedProduct,
  storedBase,
  storedStepIndex,
  allowNegative,
  onValueChange,
}) => {
  const stepIndex = Math.min(Math.max(storedStepIndex, 0), STEP_MULTIPLIERS.length - 1);
  const mult = STEP_MULTIPLIERS[stepIndex] ?? 1;
  const baseValue = storedBase !== null ? storedBase : storedProduct / mult;

  const applyUpdate = (newBase: number, newIndex: number) => {
    const clampedIndex = Math.min(Math.max(newIndex, 0), STEP_MULTIPLIERS.length - 1);
    const nextMult = STEP_MULTIPLIERS[clampedIndex] ?? 1;
    const finalVal = newBase * nextMult;
    onValueChange(finalVal, newBase, clampedIndex);
  };

  const currentLabel = STEP_DISPLAY_LABELS[stepIndex] ?? '1';
  const productVal = baseValue * mult;

  return (
    <div
      className="rounded-[10px] p-2.5"
      style={{
        backgroundColor: 'rgba(10, 13, 16, 0.6)',
        border: `1px solid ${THEME.PanelEdge}`,
      }}
    >
      {/* Label & Unit */}
      <div className="flex items-center gap-1">
        <span
          className="font-mono text-[9.5px] font-bold tracking-[1.1px]"
          style={{ color: THEME.BrassGold }}
        >
          {label}
        </span>
        <span className="font-mono text-[9.5px]" style={{ color: THEME.MutedGray }}>
          ({unit})
        </span>
      </div>

      {/* [Base Input] x [- N + Stepper] = [Product Box] */}
      <div className="mt-2 flex items-center gap-1.5">
        <NumericInputField
          value={baseValue}
          onValueChange={(newBase) => applyUpdate(newBase, stepIndex)}
          minVal={allowNegative ? -10000 : 0.001}
          maxVal={10000}
          allowNegative={allowNegative}
          maxDecimals={4}
          className="w-[74px] shrink-0"
          ariaLabel={`${label} base value`}
        />

        <span
          className="font-mono text-[16px] font-bold"
          style={{ color: THEME.BrassGold }}
        >
          ×
        </span>

        {/* [- N +] Stepper Box */}
        <div
          className="flex shrink-0 items-center gap-0.5 rounded-[8px] p-0.5"
          style={{
            backgroundColor: THEME.PanelBgElevated,
            border: `1px solid ${THEME.PanelEdge}`,
          }}
        >
          <button
            type="button"
            disabled={stepIndex <= 0}
            onClick={() => applyUpdate(baseValue, stepIndex - 1)}
            aria-label={`Decrease ${label} multiplier`}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[6px] font-mono text-[16px] font-bold disabled:opacity-40 cursor-pointer disabled:cursor-default"
            style={{
              backgroundColor: THEME.CanvasBg,
              border: `1px solid ${THEME.PanelEdge}`,
              color: stepIndex > 0 ? THEME.PaperWhite : THEME.MutedGray,
            }}
          >
            −
          </button>

          <div className="flex min-w-[36px] items-center justify-center px-1">
            <span
              className="font-mono text-[13px] font-bold tabular-nums"
              style={{
                color: stepIndex !== DEFAULT_STEP_INDEX ? THEME.BrassGold : THEME.PaperWhite,
              }}
            >
              {currentLabel}
            </span>
          </div>

          <button
            type="button"
            disabled={stepIndex >= STEP_MULTIPLIERS.length - 1}
            onClick={() => applyUpdate(baseValue, stepIndex + 1)}
            aria-label={`Increase ${label} multiplier`}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[6px] font-mono text-[16px] font-bold disabled:opacity-40 cursor-pointer disabled:cursor-default"
            style={{
              backgroundColor: THEME.CanvasBg,
              border: `1px solid ${THEME.PanelEdge}`,
              color:
                stepIndex < STEP_MULTIPLIERS.length - 1 ? THEME.PaperWhite : THEME.MutedGray,
            }}
          >
            +
          </button>
        </div>

        <span
          className="font-mono text-[16px] font-bold"
          style={{ color: THEME.TealAccent }}
        >
          =
        </span>

        {/* Product Result Box */}
        <div
          className="flex h-[38px] min-w-0 flex-1 items-center rounded-[8px] px-2"
          style={{
            backgroundColor: THEME.CanvasBg,
            border: '1px solid rgba(95, 211, 196, 0.5)',
          }}
        >
          <span
            className="truncate font-mono text-[13px] font-bold tabular-nums"
            style={{ color: THEME.TealAccent }}
          >
            {formatDisplayNumber(productVal, 3)} {unit}
          </span>
        </div>
      </div>

      {/* Constant & Quick Modifier Buttons */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <BigConstantButton
          label="φ"
          subtext="1.618"
          onClick={() => applyUpdate(1.618034, stepIndex)}
          className="flex-1"
        />
        <BigConstantButton
          label="1/φ"
          subtext="0.618"
          onClick={() => applyUpdate(0.618034, stepIndex)}
          className="flex-1"
        />
        <BigConstantButton
          label="π"
          subtext="3.142"
          onClick={() => applyUpdate(3.141593, stepIndex)}
          className="flex-1"
        />
        {allowNegative && (
          <BigConstantButton
            label="±"
            subtext="Invert"
            onClick={() => applyUpdate(-baseValue, stepIndex)}
            className="flex-[0.85]"
          />
        )}
      </div>
    </div>
  );
};

interface BigConstantButtonProps {
  label: string;
  subtext: string;
  onClick: () => void;
  className?: string;
}

const BigConstantButton: React.FC<BigConstantButtonProps> = ({
  label,
  subtext,
  onClick,
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center justify-center rounded-[8px] py-1.5 transition-colors hover:brightness-110 active:scale-[0.98] cursor-pointer ${className}`}
    style={{
      backgroundColor: THEME.PanelBgElevated,
      border: '1px solid rgba(201, 162, 106, 0.45)',
    }}
  >
    <span className="text-[15px] font-bold leading-tight" style={{ color: THEME.BrassGold }}>
      {label}
    </span>
    <span className="font-mono text-[9px]" style={{ color: THEME.MutedGray }}>
      {subtext}
    </span>
  </button>
);
