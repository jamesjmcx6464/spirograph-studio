import React from 'react';
import { X, Layers, Eye, EyeOff, Trash2, Plus } from 'lucide-react';
import { GearCircle } from '../types/spirograph';

interface PenLayersModalProps {
  isOpen: boolean;
  circles: GearCircle[];
  hiddenLayerIds: Set<number>;
  onClose: () => void;
  onToggleLayer: (circleId: number) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onAddPen: (circleId: number) => void;
  onClearGearInk: (circleId: number) => void;
}

export const PenLayersModal: React.FC<PenLayersModalProps> = ({
  isOpen,
  circles,
  hiddenLayerIds,
  onClose,
  onToggleLayer,
  onShowAll,
  onHideAll,
  onAddPen,
  onClearGearInk,
}) => {
  if (!isOpen) return null;

  const penCircles = circles.filter(c => c.isPen);
  const totalPens = penCircles.length;
  const activePens = penCircles.filter(c => !hiddenLayerIds.has(c.id)).length;

  const formatGearSubtitle = (circle: GearCircle, index: number) => {
    const isEngine = index === 0;
    if (isEngine) {
      return `R: ${circle.radius}px • Speed: ${circle.speedDeg}°/s`;
    }
    const rDisp = circle.radiusGlobal || circle.radius;
    if (circle.mode === 'PREVIOUS') {
      const mult = circle.speedPrevMult !== undefined ? circle.speedPrevMult : 1;
      const multStr = mult % 1 === 0 ? `${mult}.0` : `${mult}`;
      return `R: ${rDisp}px • Speed: ${multStr}× Prev`;
    }
    if (circle.mode === 'ENGINE') {
      const mult = circle.speedEngineMult !== undefined ? circle.speedEngineMult : 1;
      const multStr = mult % 1 === 0 ? `${mult}.0` : `${mult}`;
      return `R: ${rDisp}px • Speed: ${multStr}× Engine`;
    }
    return `R: ${rDisp}px • Speed: ${circle.speedGlobal ?? circle.speedDeg}°/s`;
  };

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-40 flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans']"
    >
      <div className="w-full max-w-sm sm:max-w-md bg-[#0F1318]/95 border border-[#2A2318] rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3.5 mt-16 sm:mt-18 animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1A1F26] border border-[#2A2318] flex items-center justify-center text-[#C9A26A] shadow-inner">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-wider text-white uppercase font-sans">
                PEN LAYERS
              </h2>
              <p className="text-xs text-[#C9A26A] font-semibold">
                {activePens} of {totalPens} lines active
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#14181D] hover:bg-[#1C222A] text-[#8B95A1] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#1F262E]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons: Show All & Hide All */}
        <div className="grid grid-cols-2 gap-2.5 pt-1" data-tour="pen-layers-header-actions">
          <button
            onClick={onShowAll}
            className="border border-[#2A2318] hover:border-[#6E5F45] bg-[#14181D] hover:bg-[#1A2026] text-[#C9A26A] text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Show All</span>
          </button>
          <button
            onClick={onHideAll}
            className="border border-[#1F262E] hover:border-[#323D4A] bg-[#14181D] hover:bg-[#1A2026] text-[#8B95A1] hover:text-[#E7E3DA] text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Hide All</span>
          </button>
        </div>

        {/* Gear List */}
        <div className="space-y-2 max-h-[58vh] overflow-y-auto no-scrollbar pr-0.5 pt-1">
          {circles.map((circle, index) => {
            const isEngine = index === 0;
            const title = isEngine ? 'Gear #1 (Engine)' : `Gear #${index + 1}`;
            const subtitle = formatGearSubtitle(circle, index);
            const isLineActive = circle.isPen && !hiddenLayerIds.has(circle.id);
            const isFirstGuide = !circle.isPen && !circles.slice(0, index).some(c => !c.isPen);
            const isFirstPen = circle.isPen && !circles.slice(0, index).some(c => c.isPen);

            // BOLT (Guide Only) Row
            if (!circle.isPen) {
              return (
                <div
                  key={circle.id}
                  {...(isFirstGuide ? { 'data-tour': 'pen-layers-guide-row' } : {})}
                  className="rounded-xl p-3 bg-[#12161B]/80 border border-[#1A2027] flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-[#1A2028] border border-[#2C3440] shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[#8B95A1] truncate">
                          {title}
                        </span>
                        <span className="text-[11px] text-[#555E68] font-medium">
                          Guide Only
                        </span>
                      </div>
                      <p className="text-[10px] text-[#66707A] font-mono truncate">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddPen(circle.id)}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#1E1912] hover:bg-[#C9A26A] border border-[#6E5F45] text-[#C9A26A] hover:text-[#0A0D10] text-[11px] font-bold tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Add Pen</span>
                  </button>
                </div>
              );
            }

            // PEN Row
            return (
              <div
                key={circle.id}
                className={`rounded-xl p-3 flex items-center justify-between gap-3 transition-all ${
                  isLineActive
                    ? 'bg-[#12161B]/95 border border-[#6E5F45]/80 shadow-sm'
                    : 'bg-[#12161B]/80 border border-[#1A2027]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Ink color dot */}
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-sm ring-1 ring-white/10"
                    style={{ backgroundColor: circle.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white truncate">
                        {title}
                      </span>
                      {isLineActive ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#5FD3C4]/15 border border-[#5FD3C4]/30 text-[#5FD3C4] tracking-wider uppercase">
                          LINE ON
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#E85C5C]/15 border border-[#E85C5C]/30 text-[#E85C5C] tracking-wider uppercase">
                          LINE OFF
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#7B838C] font-mono truncate">
                      {subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Trash Icon Button to clear only this gear's ink */}
                  <button
                    type="button"
                    {...(isFirstPen ? { 'data-tour': 'pen-layers-clear-btn' } : {})}
                    onClick={() => onClearGearInk(circle.id)}
                    className="p-1.5 text-[#7B838C] hover:text-[#E85C5C] hover:bg-[#E85C5C]/10 rounded-lg transition-colors cursor-pointer"
                    title="Clear this pen's ink"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isLineActive}
                    {...(isFirstPen ? { 'data-tour': 'pen-layers-pen-toggle' } : {})}
                    onClick={() => onToggleLayer(circle.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer p-0.5 ${
                      isLineActive ? 'bg-[#785E36]' : 'bg-[#1A2027]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                        isLineActive
                          ? 'translate-x-5 bg-[#C9A26A] shadow-md'
                          : 'translate-x-0 bg-[#4B5563]'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
