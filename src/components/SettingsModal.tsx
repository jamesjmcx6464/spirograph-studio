import React, { useState, useEffect } from 'react';
import { X, Sliders, RotateCcw, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  globalSpeedMult: number;
  inkWeight: number;
  showGuides: boolean;
  showPoints: boolean;
  strokePointCount: number;
  onClose: () => void;
  onSetGlobalSpeed: (speed: number) => void;
  onSetInkWeight: (weight: number) => void;
  onToggleGuides: () => void;
  onTogglePoints: () => void;
  onClearDrawing: () => void;
  onZeroAngles: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  globalSpeedMult,
  inkWeight,
  showGuides,
  showPoints,
  strokePointCount,
  onClose,
  onSetGlobalSpeed,
  onSetInkWeight,
  onToggleGuides,
  onTogglePoints,
  onClearDrawing,
  onZeroAngles,
}) => {
  const [speedText, setSpeedText] = useState(globalSpeedMult.toString());
  const [isEditingSpeed, setIsEditingSpeed] = useState(false);

  const [weightText, setWeightText] = useState(inkWeight.toString());
  const [isEditingWeight, setIsEditingWeight] = useState(false);

  useEffect(() => {
    if (!isEditingSpeed) {
      setSpeedText(globalSpeedMult % 1 === 0 ? globalSpeedMult.toString() : parseFloat(globalSpeedMult.toFixed(2)).toString());
    }
  }, [globalSpeedMult, isEditingSpeed]);

  useEffect(() => {
    if (!isEditingWeight) {
      setWeightText(inkWeight % 1 === 0 ? inkWeight.toString() : parseFloat(inkWeight.toFixed(2)).toString());
    }
  }, [inkWeight, isEditingWeight]);

  if (!isOpen) return null;

  const commitSpeed = (valStr: string) => {
    setIsEditingSpeed(false);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      const clamped = Math.max(1.0, Math.min(100.0, parsed));
      onSetGlobalSpeed(clamped);
      setSpeedText(clamped % 1 === 0 ? clamped.toString() : parseFloat(clamped.toFixed(2)).toString());
    } else {
      setSpeedText(globalSpeedMult % 1 === 0 ? globalSpeedMult.toString() : parseFloat(globalSpeedMult.toFixed(2)).toString());
    }
  };

  const commitWeight = (valStr: string) => {
    setIsEditingWeight(false);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      const clamped = Math.max(0.01, Math.min(50.0, parsed));
      onSetInkWeight(clamped);
      setWeightText(clamped % 1 === 0 ? clamped.toString() : parseFloat(clamped.toFixed(2)).toString());
    } else {
      setWeightText(inkWeight % 1 === 0 ? inkWeight.toString() : parseFloat(inkWeight.toFixed(2)).toString());
    }
  };

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-[#12161B] border border-[#1F262E] rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[85%] flex flex-col shadow-2xl overflow-hidden font-['Plus_Jakarta_Sans'] select-none">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1F262E] flex items-center justify-between bg-[#0E1216]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#C9A26A]/15 border border-[#C9A26A]/30 flex items-center justify-center text-[#C9A26A]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide uppercase">
                SETTINGS
              </h2>
              <p className="text-[10px] text-[#7B838C]">
                Simulation & Drafting Controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#7B838C] hover:text-[#E7E3DA] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Global Speed (1x minimum up to 100x, with manual input) */}
          <div className="p-3.5 rounded-xl bg-[#0E1216] border border-[#1F262E] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#E7E3DA]">Global Speed Velocity</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={isEditingSpeed ? speedText : (globalSpeedMult % 1 === 0 ? globalSpeedMult.toString() : parseFloat(globalSpeedMult.toFixed(2)).toString())}
                  onFocus={e => {
                    setIsEditingSpeed(true);
                    setSpeedText(globalSpeedMult % 1 === 0 ? globalSpeedMult.toString() : parseFloat(globalSpeedMult.toFixed(2)).toString());
                    e.target.select();
                  }}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val)) {
                      setSpeedText(val);
                      const parsed = parseFloat(val);
                      if (!isNaN(parsed) && parsed >= 1.0) {
                        onSetGlobalSpeed(Math.min(100.0, parsed));
                      }
                    }
                  }}
                  onBlur={() => commitSpeed(speedText)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      commitSpeed(speedText);
                      (e.target as HTMLInputElement).blur();
                    } else if (e.key === 'Escape') {
                      setIsEditingSpeed(false);
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-18 h-7 px-2 bg-[#12161B] border border-[#1F262E] focus:border-[#C9A26A] rounded-lg text-right font-mono text-xs font-bold text-[#C9A26A] outline-none transition-colors"
                />
                <span className="font-mono text-[#C9A26A] font-bold">×</span>
              </div>
            </div>

            <input
              type="range"
              min={1.0}
              max={100.0}
              step={0.5}
              value={Math.max(1.0, Math.min(100.0, globalSpeedMult))}
              onChange={e => onSetGlobalSpeed(parseFloat(e.target.value))}
              className="w-full accent-[#C9A26A] h-2 bg-[#161C22] rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#7B838C]">
              <span>1.0× (Min)</span>
              <span>25.0×</span>
              <span>50.0×</span>
              <span>100.0× (Max)</span>
            </div>
          </div>

          {/* Ink Stroke Weight (Manual input down to .01) */}
          <div className="p-3.5 rounded-xl bg-[#0E1216] border border-[#1F262E] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#E7E3DA]">Ink Line Weight</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={isEditingWeight ? weightText : (inkWeight % 1 === 0 ? inkWeight.toString() : parseFloat(inkWeight.toFixed(2)).toString())}
                  onFocus={e => {
                    setIsEditingWeight(true);
                    setWeightText(inkWeight % 1 === 0 ? inkWeight.toString() : parseFloat(inkWeight.toFixed(2)).toString());
                    e.target.select();
                  }}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val)) {
                      setWeightText(val);
                      const parsed = parseFloat(val);
                      if (!isNaN(parsed) && parsed >= 0.01) {
                        onSetInkWeight(Math.min(50.0, parsed));
                      }
                    }
                  }}
                  onBlur={() => commitWeight(weightText)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      commitWeight(weightText);
                      (e.target as HTMLInputElement).blur();
                    } else if (e.key === 'Escape') {
                      setIsEditingWeight(false);
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-18 h-7 px-2 bg-[#12161B] border border-[#1F262E] focus:border-[#5FD3C4] rounded-lg text-right font-mono text-xs font-bold text-[#5FD3C4] outline-none transition-colors"
                />
                <span className="font-mono text-[#5FD3C4] font-bold">px</span>
              </div>
            </div>

            <input
              type="range"
              min={0.01}
              max={15.0}
              step={0.01}
              value={Math.max(0.01, Math.min(15.0, inkWeight))}
              onChange={e => onSetInkWeight(parseFloat(e.target.value))}
              className="w-full accent-[#5FD3C4] h-2 bg-[#161C22] rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#7B838C]">
              <span>0.01 px (Fine)</span>
              <span>2.0 px (Standard)</span>
              <span>15.0 px (Bold)</span>
            </div>
          </div>

          {/* Visual Guides */}
          <div className="p-3.5 rounded-xl bg-[#0E1216] border border-[#1F262E] space-y-2.5">
            <span className="text-[11px] font-bold text-[#C9A26A] uppercase tracking-wider block">
              Visual Overlays
            </span>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-[#8B95A1]">Show Dashed Orbit Guides</span>
                <input
                  type="checkbox"
                  checked={showGuides}
                  onChange={onToggleGuides}
                  className="accent-[#C9A26A] w-4 h-4 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer py-1 border-t border-[#1F262E] pt-2">
                <span className="text-[#8B95A1]">Show Pen Nibs & Bolts</span>
                <input
                  type="checkbox"
                  checked={showPoints}
                  onChange={onTogglePoints}
                  className="accent-[#5FD3C4] w-4 h-4 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Telemetry & Clear */}
          <div className="p-3.5 rounded-xl bg-[#0E1216] border border-[#1F262E] space-y-3 text-xs">
            <div className="flex justify-between text-[#8B95A1]">
              <span>Stroke Points:</span>
              <span className="font-mono text-[#E7E3DA] tabular-nums font-bold">
                {strokePointCount.toLocaleString()} pts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1F262E]">
              <button
                onClick={onZeroAngles}
                className="py-2 px-3 rounded-lg border border-[#1F262E] bg-[#161C22] text-[#E7E3DA] hover:border-[#323D4A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Zero Angles</span>
              </button>
              <button
                onClick={onClearDrawing}
                className="py-2 px-3 rounded-lg border border-[#E85C5C]/40 bg-[#E85C5C]/10 text-[#E85C5C] hover:bg-[#E85C5C]/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Ink</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0E1216] border-t border-[#1F262E] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1F262E] hover:bg-[#2A3440] text-[#E7E3DA] text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
