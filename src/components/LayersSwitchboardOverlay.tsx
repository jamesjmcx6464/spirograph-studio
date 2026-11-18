import React from 'react';
import { Eye, EyeOff, Layers, Trash2, X } from 'lucide-react';
import { THEME } from '../constants/palette';
import { GearCircle, GearMode } from '../types/spirograph';
import { computeChain, formatDisplayNumber } from '../utils/gearMath';

interface LayersSwitchboardOverlayProps {
  visible: boolean;
  circles: GearCircle[];
  hiddenLayerIds: number[];
  onDismiss: () => void;
  onToggleLayerVisibility: (gearId: number) => void;
  onShowAllLayers: () => void;
  onHideAllLayers: () => void;
  onClearLayerStrokes: (gearId: number) => void;
  onToggleGearPen: (index: number, isPen: boolean) => void;
}

export const LayersSwitchboardOverlay: React.FC<LayersSwitchboardOverlayProps> = ({
  visible,
  circles,
  hiddenLayerIds,
  onDismiss,
  onToggleLayerVisibility,
  onShowAllLayers,
  onHideAllLayers,
  onClearLayerStrokes,
  onToggleGearPen,
}) => {
  if (!visible) return null;

  const hiddenSet = new Set(hiddenLayerIds);
  const penCount = circles.filter((c) => c.isPen).length;
  const visiblePenCount = circles.filter((c) => c.isPen && !hiddenSet.has(c.id)).length;
  const chain = computeChain(circles);

  return (
    <div
      className="fixed inset-0 z-40"
      onClick={onDismiss}
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute right-4 top-[106px] w-[min(340px,calc(100vw-32px))] rounded-[16px] p-4 shadow-2xl"
        style={{
          backgroundColor: THEME.PanelBgElevated,
          border: '1px solid rgba(201, 162, 106, 0.6)',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65), 0 0 24px rgba(201, 162, 106, 0.12)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: THEME.BrassGlow,
                border: `1px solid ${THEME.BrassGold}`,
              }}
            >
              <Layers className="h-[18px] w-[18px]" style={{ color: THEME.BrassGold }} />
            </div>
            <div>
              <div
                className="text-[13px] font-bold tracking-[1.4px]"
                style={{ color: THEME.PaperWhite }}
              >
                PEN LAYERS
              </div>
              <div
                className="font-mono text-[10px]"
                style={{ color: 'rgba(201, 162, 106, 0.85)' }}
              >
                {visiblePenCount} of {penCount} lines active
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close Layers Dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-full cursor-pointer"
            style={{
              backgroundColor: THEME.PanelBg,
              border: `1px solid ${THEME.PanelEdge}`,
              color: THEME.MutedGray,
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Batch Actions */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onShowAllLayers}
            className="flex h-[34px] flex-1 items-center justify-center gap-1 rounded-[8px] font-mono text-[10px] font-bold cursor-pointer"
            style={{
              border: '1px solid rgba(201, 162, 106, 0.4)',
              color: THEME.BrassGold,
            }}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Show All</span>
          </button>
          <button
            type="button"
            onClick={onHideAllLayers}
            className="flex h-[34px] flex-1 items-center justify-center gap-1 rounded-[8px] font-mono text-[10px] cursor-pointer"
            style={{
              border: `1px solid ${THEME.PanelEdge}`,
              color: THEME.MutedGray,
            }}
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>Hide All</span>
          </button>
        </div>

        {/* Switchboard List */}
        <div className="mt-3 flex max-h-[300px] flex-col gap-2 overflow-y-auto pr-0.5">
          {circles.map((gear, index) => {
            const isLineVisible = !hiddenSet.has(gear.id);
            const resolved = chain[index];
            const displayRadius = Math.trunc(resolved ? resolved.radius : gear.radius);
            const speedText =
              index === 0
                ? `${Math.trunc(gear.speedDeg)}°/s`
                : gear.mode === GearMode.GLOBAL
                  ? `${Math.trunc(gear.speedGlobal)}°/s`
                  : gear.mode === GearMode.ENGINE
                    ? `${formatDisplayNumber(gear.speedEngineMult, 2)}× Eng`
                    : `${formatDisplayNumber(gear.speedPrevMult, 2)}× Prev`;

            return (
              <div
                key={gear.id}
                className="flex items-center justify-between rounded-[10px] px-2.5 py-2"
                style={{
                  backgroundColor: gear.isPen
                    ? isLineVisible
                      ? THEME.PanelBg
                      : 'rgba(18, 22, 27, 0.5)'
                    : 'rgba(10, 13, 16, 0.5)',
                  border: `1px solid ${
                    gear.isPen && isLineVisible ? `${gear.color}80` : THEME.PanelEdge
                  }`,
                }}
              >
                {/* Left */}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className="h-[18px] w-[18px] shrink-0 rounded-full"
                    style={{
                      backgroundColor: gear.isPen ? gear.color : 'rgba(139, 149, 161, 0.3)',
                      border: `1.5px solid ${
                        gear.isPen ? 'rgba(231, 227, 218, 0.8)' : THEME.PanelEdge
                      }`,
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="truncate font-mono text-[12px] font-bold"
                        style={{ color: gear.isPen ? THEME.PaperWhite : THEME.MutedGray }}
                      >
                        {index === 0 || gear.id === 1
                          ? `Gear #${index + 1} (Engine)`
                          : `Gear #${index + 1}`}
                      </span>
                      {gear.isPen ? (
                        <span
                          className="rounded-[4px] px-1 py-[1px] font-mono text-[9px] font-bold"
                          style={{
                            backgroundColor: isLineVisible
                              ? 'rgba(95, 211, 196, 0.15)'
                              : 'rgba(232, 92, 92, 0.15)',
                            color: isLineVisible ? THEME.TealAccent : THEME.DangerRed,
                          }}
                        >
                          {isLineVisible ? 'LINE ON' : 'LINE OFF'}
                        </span>
                      ) : (
                        <span
                          className="font-mono text-[10px]"
                          style={{ color: THEME.MutedGray }}
                        >
                          Guide Only
                        </span>
                      )}
                    </div>
                    <div
                      className="font-mono text-[10px] tabular-nums"
                      style={{ color: 'rgba(123, 131, 140, 0.75)' }}
                    >
                      R: {displayRadius}px • Speed: {speedText}
                    </div>
                  </div>
                </div>

                {/* Right Controls */}
                <div className="ml-2 flex shrink-0 items-center gap-1">
                  {gear.isPen ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onClearLayerStrokes(gear.id)}
                        title={`Clear Pen #${index + 1} Strokes`}
                        aria-label={`Clear Pen #${index + 1} Strokes`}
                        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/5 cursor-pointer"
                        style={{ color: THEME.MutedGray }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      {/* Material-style toggle switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isLineVisible}
                        onClick={() => onToggleLayerVisibility(gear.id)}
                        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isLineVisible
                            ? THEME.BrassDim
                            : THEME.PanelBgElevated,
                          border: `1px solid ${
                            isLineVisible ? THEME.BrassGold : THEME.PanelEdge
                          }`,
                        }}
                      >
                        <span
                          className="inline-block h-4 w-4 rounded-full transition-transform"
                          style={{
                            backgroundColor: isLineVisible ? THEME.BrassGold : THEME.MutedGray,
                            transform: isLineVisible ? 'translateX(22px)' : 'translateX(3px)',
                          }}
                        />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleGearPen(index, true)}
                      className="h-7 rounded-[6px] px-2 font-mono text-[10px] font-bold cursor-pointer"
                      style={{
                        backgroundColor: 'rgba(110, 95, 69, 0.4)',
                        color: THEME.BrassGold,
                      }}
                    >
                      + Add Pen
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
