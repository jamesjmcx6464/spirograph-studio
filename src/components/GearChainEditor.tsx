import React, { useRef, useState } from 'react';
import {
  X,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Check,
  Layers,
} from 'lucide-react';
import { GearCircle, GearMode } from '../types/spirograph';

const INK_SWATCHES = [
  { hex: '#E39B3E', name: 'amber' },
  { hex: '#5FD3C4', name: 'mint' },
  { hex: '#C9A26A', name: 'brass' },
  { hex: '#E7E3DA', name: 'parchment' },
  { hex: '#E85C5C', name: 'ruby' },
  { hex: '#8E7CE8', name: 'violet' },
  { hex: '#4DD0E1', name: 'glacier' },
  { hex: '#FF80AB', name: 'rose' },
];

interface NumberBoxInputProps {
  value: number;
  allowNegative?: boolean;
  min?: number;
  max?: number;
  title?: string;
  onCommit: (val: number) => void;
}

const NumberBoxInput: React.FC<NumberBoxInputProps> = ({
  value,
  allowNegative = false,
  min,
  max,
  title,
  onCommit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('');

  const formatDisplay = (n: number) => {
    if (isNaN(n)) return '0';
    return n % 1 === 0 ? n.toString() : parseFloat(n.toFixed(3)).toString();
  };

  React.useEffect(() => {
    if (!isEditing) {
      setText(formatDisplay(value));
    }
  }, [value, isEditing]);

  const commit = (str: string) => {
    setIsEditing(false);
    const parsed = parseFloat(str);
    if (!isNaN(parsed)) {
      let finalVal = parsed;
      if (min !== undefined) finalVal = Math.max(min, finalVal);
      if (max !== undefined) finalVal = Math.min(max, finalVal);
      onCommit(finalVal);
      setText(formatDisplay(finalVal));
    } else {
      setText(formatDisplay(value));
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={isEditing ? text : formatDisplay(value)}
      title={title || 'Click to type manual value'}
      onFocus={e => {
        setIsEditing(true);
        setText(formatDisplay(value));
        e.target.select();
      }}
      onChange={e => {
        const val = e.target.value;
        if (allowNegative) {
          if (/^-?\d*\.?\d*$/.test(val)) {
            setText(val);
            const parsed = parseFloat(val);
            if (!isNaN(parsed)) {
              onCommit(parsed);
            }
          }
        } else {
          if (/^\d*\.?\d*$/.test(val)) {
            setText(val);
            const parsed = parseFloat(val);
            if (!isNaN(parsed) && parsed >= (min !== undefined ? min : 0)) {
              onCommit(parsed);
            }
          }
        }
      }}
      onBlur={() => commit(text)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          commit(text);
          (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
          setIsEditing(false);
          setText(formatDisplay(value));
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="w-16 sm:w-20 h-13 rounded-xl bg-[#12161B] border border-[#1F262E] focus:border-[#C9A26A] focus:bg-[#07090C] text-center font-mono text-base font-bold text-white outline-none transition-colors selection:bg-[#C9A26A] selection:text-black cursor-text"
    />
  );
};

interface GearChainEditorProps {
  isOpen: boolean;
  circles: GearCircle[];
  onClose: () => void;
  onUpdateGear: (updated: GearCircle) => void;
  onAddGear?: () => void;
  onLayerGear?: () => void;
  onRemoveGear?: (id: number) => void;
  onResetDrawing: () => void;
  onTourEvent?: (event: 'editGear') => void;
}

export const GearChainEditor: React.FC<GearChainEditorProps> = ({
  isOpen,
  circles,
  onClose,
  onUpdateGear,
  onAddGear,
  onLayerGear,
  onRemoveGear,
  onResetDrawing,
  onTourEvent,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Local multiplier state for each circle if not already on the circle
  // We can track multiplier for radius and speed per circle
  const [multState, setMultState] = useState<
    Record<number, { rMult: number; sMult: number; rBase?: number; sBase?: number }>
  >({});

  // Editing base input states
  const [editingField, setEditingField] = useState<{
    id: number;
    type: 'rBase' | 'sBase';
    val: string;
  } | null>(null);

  if (!isOpen) return null;

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const getCircleState = (circle: GearCircle, index: number) => {
    const isEngine = index === 0;
    const isAbs = circle.mode === 'GLOBAL';

    let currentValR = isEngine
      ? circle.radius
      : isAbs
      ? circle.radiusGlobal
      : circle.mode === 'ENGINE'
      ? circle.radiusEngineMult
      : circle.radiusPrevMult;

    let currentValS = isEngine
      ? circle.speedDeg
      : isAbs
      ? circle.speedGlobal
      : circle.mode === 'ENGINE'
      ? circle.speedEngineMult
      : circle.speedPrevMult;

    const saved = multState[circle.id] || { rMult: 1, sMult: 1 };
    const rBase = saved.rBase ?? circle.radiusBase ?? currentValR;
    const sBase = saved.sBase ?? circle.speedBase ?? currentValS;
    const rMult = saved.rMult;
    const sMult = saved.sMult;

    return {
      isEngine,
      isAbs,
      currentValR,
      currentValS,
      rBase,
      sBase,
      rMult,
      sMult,
    };
  };

  const updateRadiusValue = (circle: GearCircle, index: number, newResult: number, newBase?: number, newMult?: number) => {
    const isEngine = index === 0;
    const rounded = Math.round(newResult * 1000) / 1000;

    let updated = { ...circle };
    if (isEngine) {
      updated.radius = Math.max(1, rounded);
    } else if (circle.mode === 'GLOBAL') {
      updated.radiusGlobal = Math.max(1, rounded);
    } else if (circle.mode === 'ENGINE') {
      updated.radiusEngineMult = Math.max(0.01, rounded);
    } else {
      updated.radiusPrevMult = Math.max(0.01, rounded);
    }

    setMultState(prev => ({
      ...prev,
      [circle.id]: {
        rMult: newMult ?? prev[circle.id]?.rMult ?? 1,
        sMult: prev[circle.id]?.sMult ?? 1,
        rBase: newBase ?? prev[circle.id]?.rBase,
        sBase: prev[circle.id]?.sBase,
      },
    }));

    onUpdateGear(updated);
  };

  const updateSpeedValue = (circle: GearCircle, index: number, newResult: number, newBase?: number, newMult?: number) => {
    const isEngine = index === 0;
    const rounded = Math.round(newResult * 1000) / 1000;

    let updated = { ...circle };
    if (isEngine) {
      updated.speedDeg = rounded;
    } else if (circle.mode === 'GLOBAL') {
      updated.speedGlobal = rounded;
    } else if (circle.mode === 'ENGINE') {
      updated.speedEngineMult = rounded;
    } else {
      updated.speedPrevMult = rounded;
    }

    setMultState(prev => ({
      ...prev,
      [circle.id]: {
        rMult: prev[circle.id]?.rMult ?? 1,
        sMult: newMult ?? prev[circle.id]?.sMult ?? 1,
        rBase: prev[circle.id]?.rBase,
        sBase: newBase ?? prev[circle.id]?.sBase,
      },
    }));

    onUpdateGear(updated);
  };

  const setMode = (circle: GearCircle, mode: GearMode) => {
    if (circle.mode === mode) return;

    let activeRadius = circle.mode === 'GLOBAL' ? circle.radiusGlobal : circle.mode === 'ENGINE' ? circle.radiusEngineMult : circle.radiusPrevMult;
    let activeSpeed = circle.mode === 'GLOBAL' ? circle.speedGlobal : circle.mode === 'ENGINE' ? circle.speedEngineMult : circle.speedPrevMult;

    // If switching to global, make sure radius isn't fractional
    let newRadius = mode === 'GLOBAL' && activeRadius < 10 ? 100 : activeRadius;

    const updated: GearCircle = {
      ...circle,
      mode,
      radiusGlobal: mode === 'GLOBAL' ? newRadius : circle.radiusGlobal,
      radiusEngineMult: mode === 'ENGINE' ? activeRadius : circle.radiusEngineMult,
      radiusPrevMult: mode === 'PREVIOUS' ? activeRadius : circle.radiusPrevMult,
      speedGlobal: mode === 'GLOBAL' ? activeSpeed : circle.speedGlobal,
      speedEngineMult: mode === 'ENGINE' ? activeSpeed : circle.speedEngineMult,
      speedPrevMult: mode === 'PREVIOUS' ? activeSpeed : circle.speedPrevMult,
    };

    setMultState(prev => ({
      ...prev,
      [circle.id]: {
        rMult: 1,
        sMult: 1,
        rBase: newRadius,
        sBase: activeSpeed,
      },
    }));

    onUpdateGear(updated);
  };

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
    >
      <aside className="w-full max-w-2xl max-h-[92vh] bg-[#0A0D10] border border-[#1F262E] rounded-t-[32px] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden font-['Plus_Jakarta_Sans']">
        {/* Top Header Bar */}
        <div className="px-5 pt-4 pb-3 border-b border-[#1F262E] bg-[#0E1216] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {/* Title & Badge */}
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-base tracking-wider text-[#C9A26A] uppercase font-sans">
              GEAR TRAIN
            </h2>
            <span className="w-5 h-5 rounded-full bg-[#1F262E] text-[#8B95A1] text-xs font-bold inline-flex items-center justify-center tabular-nums">
              {circles.length}
            </span>
          </div>

          {/* Right actions: TOP, BOTTOM & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#12161B] border border-[#1F262E] rounded-full px-2 py-0.5 text-xs text-[#E7E3DA]">
              <button
                onClick={scrollToTop}
                className="flex items-center gap-0.5 px-1.5 py-0.5 hover:text-[#C9A26A] font-semibold transition-colors cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>TOP</span>
              </button>
              <span className="text-[#1F262E]">|</span>
              <button
                onClick={scrollToBottom}
                className="flex items-center gap-0.5 px-1.5 py-0.5 hover:text-[#C9A26A] font-semibold transition-colors cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>BOTTOM</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-[#8B95A1] hover:text-[#E7E3DA] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-[11px] text-[#7B838C] leading-snug">
          Configure radii, rotation speeds, modes, and ink pens for each harmonic link.
        </p>

        {/* Full-width RESET DRAWING & ANGLES Button */}
        <button
          onClick={onResetDrawing}
          className="w-full mt-1 py-2.5 px-3 rounded-xl border border-[#6E5F45]/60 bg-[#12161B]/80 hover:bg-[#6E5F45]/20 text-[#C9A26A] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET DRAWING & ANGLES</span>
        </button>
      </div>

      {/* Scrollable Gear Cards Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 no-scrollbar"
      >
        {circles.map((circle, index) => {
          const isLastGear = index === circles.length - 1;
          const {
            isEngine,
            isAbs,
            currentValR,
            currentValS,
            rBase,
            sBase,
            rMult,
            sMult,
          } = getCircleState(circle, index);

          const rUnit = isEngine || isAbs ? 'px' : '×';
          const sUnit = isEngine || isAbs ? '°/s' : '×';

          return (
            <div
              key={circle.id}
              {...(isEngine ? { 'data-tour': 'gear-card-1' } : {})}
              className={`rounded-2xl p-4 transition-all space-y-3.5 ${
                isEngine
                  ? 'border border-[#6E5F45] bg-[#0E1216]'
                  : 'border border-[#1F262E] bg-[#0E1216]'
              }`}
            >
              {/* Card Header: Dot, Circle Title, Color Swatches (when PEN), and BOLT/PEN Toggle */}
              <div
                className="flex flex-wrap items-center justify-between gap-2"
                data-tour={isLastGear ? (isEngine ? 'first-gear-header last-gear-header' : 'last-gear-header') : (isEngine ? 'first-gear-header' : undefined)}
                data-tour-last-header={isLastGear ? 'true' : undefined}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isEngine ? 'bg-[#C9A26A]' : 'bg-[#8B95A1]'
                    }`}
                  />
                  {isEngine ? (
                    <span className="px-2.5 py-0.5 rounded-md border border-[#6E5F45] bg-[#161C22] text-[#C9A26A] text-xs font-extrabold tracking-wider uppercase">
                      CIRCLE 1 · ENGINE
                    </span>
                  ) : (
                    <span className="text-sm font-extrabold tracking-wide text-white">
                      CIRCLE {index + 1}
                    </span>
                  )}
                </div>

                {/* Right controls: Color swatches (immediately to the LEFT of BOLT/PEN) and BOLT/PEN Toggle */}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Color Swatches: hidden when BOLT, shown only when PEN */}
                  {circle.isPen && (
                    <div
                      className="flex items-center gap-1 sm:gap-1.5 bg-[#07090C] border border-[#1F262E] rounded-lg px-2 py-1"
                      {...(isEngine ? { 'data-tour': 'gear-colors-1' } : {})}
                    >
                      {INK_SWATCHES.map(({ hex, name }) => {
                        const isSelected = circle.color.toUpperCase() === hex.toUpperCase();
                        return (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => {
                              onUpdateGear({ ...circle, color: hex });
                              if (isEngine) onTourEvent?.('editGear');
                            }}
                            className={`relative w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'ring-2 ring-white scale-110 shadow-sm'
                                : 'opacity-70 hover:opacity-100 hover:scale-105'
                            }`}
                            style={{ backgroundColor: hex }}
                            title={`${name} (${hex})`}
                          >
                            {isSelected && (
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#0A0D10] stroke-[3]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* BOLT / PEN Segmented Toggle */}
                  <div
                    className="flex items-center bg-[#07090C] border border-[#1F262E] rounded-lg p-0.5 text-xs font-bold shrink-0"
                    {...(isEngine ? { 'data-tour': 'gear-bolt-pen-1' } : {})}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateGear({ ...circle, isPen: false });
                        if (isEngine) onTourEvent?.('editGear');
                      }}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        !circle.isPen
                          ? 'bg-[#1F262E] text-[#E7E3DA]'
                          : 'text-[#7B838C] hover:text-[#E7E3DA]'
                      }`}
                    >
                      BOLT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateGear({ ...circle, isPen: true });
                        if (isEngine) onTourEvent?.('editGear');
                      }}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        circle.isPen
                          ? 'bg-[#C9A26A] text-[#0A0D10]'
                          : 'text-[#7B838C] hover:text-[#E7E3DA]'
                      }`}
                    >
                      PEN
                    </button>
                  </div>

                  {/* Remove Circle X button (for non-engine circles) */}
                  {!isEngine && onRemoveGear && (
                    <button
                      type="button"
                      data-tour={isLastGear ? 'last-remove-gear-btn remove-gear-btn' : 'remove-gear-btn'}
                      data-tour-last-remove={isLastGear ? 'true' : undefined}
                      onClick={() => onRemoveGear(circle.id)}
                      className="p-1 rounded-md text-[#7B838C] hover:text-[#E85C5C] hover:bg-[#E85C5C]/10 transition-colors cursor-pointer ml-0.5 shrink-0"
                      title={`Remove Circle ${index + 1}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Later circles have mode tabs: ABSOLUTE, ENGINE, PREVIOUS */}
              {!isEngine && (
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#07090C] rounded-xl border border-[#1F262E] text-xs font-bold">
                  <button
                    onClick={() => setMode(circle, 'GLOBAL')}
                    className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                      circle.mode === 'GLOBAL'
                        ? 'bg-[#2A2318] border border-[#6E5F45] text-[#C9A26A]'
                        : 'text-[#7B838C] hover:text-[#E7E3DA]'
                    }`}
                  >
                    ABSOLUTE
                  </button>
                  <button
                    onClick={() => setMode(circle, 'ENGINE')}
                    className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                      circle.mode === 'ENGINE'
                        ? 'bg-[#2A2318] border border-[#6E5F45] text-[#C9A26A]'
                        : 'text-[#7B838C] hover:text-[#E7E3DA]'
                    }`}
                  >
                    ENGINE
                  </button>
                  <button
                    onClick={() => setMode(circle, 'PREVIOUS')}
                    className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                      circle.mode === 'PREVIOUS'
                        ? 'bg-[#2A2318] border border-[#6E5F45] text-[#C9A26A]'
                        : 'text-[#7B838C] hover:text-[#E7E3DA]'
                    }`}
                  >
                    PREVIOUS
                  </button>
                </div>
              )}

              {/* RADIUS SECTION */}
              <div
                className="p-3.5 rounded-xl bg-[#07090C]/80 border border-[#1A2027] space-y-2.5"
                {...(isEngine ? { 'data-tour': 'gear-radius-speed-1' } : {})}
              >
                <span className="text-[11px] font-bold text-[#C9A26A] uppercase tracking-wider block">
                  RADIUS ({rUnit})
                </span>

                {/* Row: Base × [ - ] Multiplier [ + ] = [ Result ] */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Base Box (manual input) */}
                  <NumberBoxInput
                    value={rBase}
                    allowNegative={false}
                    min={0.01}
                    title={`Type base radius (${rUnit})`}
                    onCommit={val => {
                      updateRadiusValue(circle, index, val * rMult, val, rMult);
                    }}
                  />

                  <span className="text-[#C9A26A] font-bold text-base px-0.5">×</span>

                  {/* Multiplier Stepper: [ - ]  1  [ + ] */}
                  <div className="h-13 rounded-xl bg-[#12161B] border border-[#1F262E] flex items-center px-1 gap-1">
                    <button
                      onClick={() => {
                        const nextMult = Math.max(1, Math.round(rMult) - 1);
                        updateRadiusValue(circle, index, rBase * nextMult, rBase, nextMult);
                      }}
                      className="w-8 h-9 rounded-lg bg-[#0E1216] hover:bg-[#1A2028] text-white flex items-center justify-center font-bold text-base active:scale-95 transition-all cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono text-sm sm:text-base font-bold text-white">
                      {rMult % 1 === 0 ? rMult : rMult.toFixed(2)}
                    </span>
                    <button
                      onClick={() => {
                        const nextMult = Math.round(rMult) + 1;
                        updateRadiusValue(circle, index, rBase * nextMult, rBase, nextMult);
                      }}
                      className="w-8 h-9 rounded-lg bg-[#0E1216] hover:bg-[#1A2028] text-white flex items-center justify-center font-bold text-base active:scale-95 transition-all cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-[#5FD3C4] font-bold text-base px-0.5">=</span>

                  {/* Equals Result Box */}
                  <div className="flex-1 h-13 rounded-xl bg-[#0A0D10] border border-[#5FD3C4]/60 flex items-center justify-center font-mono text-base font-bold text-[#5FD3C4] text-center px-2">
                    {currentValR % 1 === 0 ? currentValR : currentValR.toFixed(1)} {rUnit}
                  </div>
                </div>

                {/* Shortcut Chips: φ, 1/φ, π */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      updateRadiusValue(circle, index, rBase * 1.618, rBase, 1.618);
                    }}
                    className="py-2 rounded-xl bg-[#12161B] border border-[#1F262E] hover:border-[#C9A26A] flex flex-col items-center justify-center transition-all cursor-pointer active:scale-98"
                  >
                    <span className="text-sm font-bold text-[#E7E3DA]">φ</span>
                    <span className="text-[10px] text-[#7B838C] font-mono">1.618</span>
                  </button>
                  <button
                    onClick={() => {
                      updateRadiusValue(circle, index, rBase * 0.618, rBase, 0.618);
                    }}
                    className="py-2 rounded-xl bg-[#12161B] border border-[#1F262E] hover:border-[#C9A26A] flex flex-col items-center justify-center transition-all cursor-pointer active:scale-98"
                  >
                    <span className="text-sm font-bold text-[#E7E3DA]">1/φ</span>
                    <span className="text-[10px] text-[#7B838C] font-mono">0.618</span>
                  </button>
                  <button
                    onClick={() => {
                      updateRadiusValue(circle, index, rBase * 3.142, rBase, 3.142);
                    }}
                    className="py-2 rounded-xl bg-[#12161B] border border-[#1F262E] hover:border-[#C9A26A] flex flex-col items-center justify-center transition-all cursor-pointer active:scale-98"
                  >
                    <span className="text-sm font-bold text-[#E7E3DA]">π</span>
                    <span className="text-[10px] text-[#7B838C] font-mono">3.142</span>
                  </button>
                </div>
              </div>

              {/* SPEED SECTION */}
              <div className="p-3.5 rounded-xl bg-[#07090C]/80 border border-[#1A2027] space-y-2.5">
                <span className="text-[11px] font-bold text-[#C9A26A] uppercase tracking-wider block">
                  SPEED ({sUnit})
                </span>

                {/* Row: Base × [ - ] Multiplier [ + ] = [ Result ] */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Base Box (manual input) */}
                  <NumberBoxInput
                    value={sBase}
                    allowNegative={true}
                    title={`Type base speed (${sUnit})`}
                    onCommit={val => {
                      updateSpeedValue(circle, index, val * sMult, val, sMult);
                    }}
                  />

                  <span className="text-[#C9A26A] font-bold text-base px-0.5">×</span>

                  {/* Multiplier Stepper: [ - ]  1  [ + ] */}
                  <div className="h-13 rounded-xl bg-[#12161B] border border-[#1F262E] flex items-center px-1 gap-1">
                    <button
                      onClick={() => {
                        const nextMult = Math.max(1, Math.round(sMult) - 1);
                        updateSpeedValue(circle, index, sBase * nextMult, sBase, nextMult);
                      }}
                      className="w-8 h-9 rounded-lg bg-[#0E1216] hover:bg-[#1A2028] text-white flex items-center justify-center font-bold text-base active:scale-95 transition-all cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono text-sm sm:text-base font-bold text-white">
                      {sMult % 1 === 0 ? sMult : sMult.toFixed(2)}
                    </span>
                    <button
                      onClick={() => {
                        const nextMult = Math.round(sMult) + 1;
                        updateSpeedValue(circle, index, sBase * nextMult, sBase, nextMult);
                      }}
                      className="w-8 h-9 rounded-lg bg-[#0E1216] hover:bg-[#1A2028] text-white flex items-center justify-center font-bold text-base active:scale-95 transition-all cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-[#5FD3C4] font-bold text-base px-0.5">=</span>

                  {/* Equals Result Box */}
                  <div className="flex-1 h-13 rounded-xl bg-[#0A0D10] border border-[#5FD3C4]/60 flex items-center justify-center font-mono text-base font-bold text-[#5FD3C4] text-center px-2">
                    {currentValS % 1 === 0 ? currentValS : currentValS.toFixed(1)} {sUnit}
                  </div>
                </div>

                {/* Shortcut Chips: φ, 1/φ, π, ± Invert */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      updateSpeedValue(circle, index, sBase * 1.618, sBase, 1.618);
                    }}
                    className="py-2 rounded-xl bg-[#12161B] border border-[#1F262E] hover:border-[#C9A26A] flex flex-col items-center justify-center transition-all cursor-pointer active:scale-98"
                  >
                    <span className="text-sm font-bold text-[#E7E3DA]">φ</span>
                    <span className="text-[10px] text-[#7B838C] font-mono">1.618</span>
                  </button>
                  <button
                    onClick={() => {
                      updateSpeedValue(circle, index, sBase * 0.618, sBase, 0.618);
                    }}
                    className="py-2 rounded-xl bg-[#12161B] border border-[#1F262E] hover:border-[#C9A26A] flex flex-col items-center justify-center transition-all cursor-pointer active:scale-98"
                  >
                    <span className="text-sm font-bold text-[#E7E3DA]">1/φ</span>
                    <span className="text-[10px] text-[#7B838C] font-mono">0.618</span>
                  </button>
                  <button
                    onClick={() => {
                      updateSpeedValue(circle, index, sBase * 3.142, sBase, 3.142);
                    }}
                    className="py-2 rounded-xl bg-[#12161B] border border-[#1F262E] hover:border-[#C9A26A] flex flex-col items-center justify-center transition-all cursor-pointer active:scale-98"
                  >
                    <span className="text-sm font-bold text-[#E7E3DA]">π</span>
                    <span className="text-[10px] text-[#7B838C] font-mono">3.142</span>
                  </button>
                  <button
                    onClick={() => {
                      const inverted = -currentValS;
                      updateSpeedValue(circle, index, inverted, -sBase, sMult);
                    }}
                    className="py-2 rounded-xl bg-[#12161B] border border-[#1F262E] hover:border-[#C9A26A] flex flex-col items-center justify-center transition-all cursor-pointer active:scale-98"
                  >
                    <span className="text-sm font-bold text-[#C9A26A]">±</span>
                    <span className="text-[10px] text-[#7B838C]">Invert</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Two buttons side by side matching screenshot */}
        <div className="grid grid-cols-2 gap-3 pt-3 pb-6" data-tour="add-layer-buttons">
          {/* Left button: + ADD (r=1, s=1) */}
          <button
            type="button"
            data-tour="add-gear-btn"
            onClick={onAddGear}
            className="rounded-2xl border border-[#232B36] bg-[#12161B] hover:bg-[#181F26] hover:border-[#323D4A] text-[#E7E3DA] text-xs font-bold py-3.5 px-3 flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md"
          >
            <span>+ ADD (r=1, s=1)</span>
          </button>

          {/* Right button: LAYER (r, s), teal outline */}
          <button
            type="button"
            data-tour="layer-gear-btn"
            onClick={onLayerGear}
            className="rounded-2xl border border-[#5FD3C4] bg-[#0E1619] hover:bg-[#5FD3C4]/15 text-[#5FD3C4] text-xs font-bold py-3.5 px-3 flex items-center justify-center gap-2 uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md"
          >
            <Layers className="w-4 h-4 text-[#5FD3C4]" />
            <span>LAYER (r, s)</span>
          </button>
        </div>
      </div>
    </aside>
    </div>
  );
};
