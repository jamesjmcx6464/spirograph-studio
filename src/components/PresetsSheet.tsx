import React, { useMemo, useState } from 'react';
import { Play, Plus, Trash2, X } from 'lucide-react';
import { THEME, parseHexColor } from '../constants/palette';
import { PRESET_LIBRARY } from '../data/presetLibrary';
import { CuratedPreset, SavedPreset } from '../types/spirograph';
import { BottomSheetShell } from './BottomSheetShell';

interface PresetsSheetProps {
  savedPresets: SavedPreset[];
  onDismiss: () => void;
  onSelectCurated: (preset: CuratedPreset) => void;
  onSelectSaved: (saved: SavedPreset) => void;
  onDeleteSaved: (saved: SavedPreset) => void;
  onOpenSaveDialog: () => void;
}

export const PresetsSheet: React.FC<PresetsSheetProps> = ({
  savedPresets,
  onDismiss,
  onSelectCurated,
  onSelectSaved,
  onDeleteSaved,
  onOpenSaveDialog,
}) => {
  const [selectedTab, setSelectedTab] = useState<0 | 1>(0);

  return (
    <BottomSheetShell onDismiss={onDismiss}>
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-7">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <h2
            className="text-[18px] font-bold tracking-[1.5px]"
            style={{ color: THEME.BrassGold }}
          >
            PRESETS &amp; GALLERY
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

        {/* Tabs: Curated vs Saved */}
        <div
          className="mt-2 grid grid-cols-2 overflow-hidden rounded-[10px]"
          style={{
            backgroundColor: THEME.CanvasBg,
            border: `1px solid ${THEME.PanelEdge}`,
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedTab(0)}
            className="relative py-2.5 font-mono text-[10.5px] tracking-[0.05em] transition-colors cursor-pointer"
            style={{
              color: selectedTab === 0 ? THEME.BrassGold : THEME.MutedGray,
              fontWeight: selectedTab === 0 ? 700 : 400,
            }}
          >
            <span>CURATED ({PRESET_LIBRARY.length})</span>
            {selectedTab === 0 && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: THEME.BrassGold }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab(1)}
            className="relative py-2.5 font-mono text-[10.5px] tracking-[0.05em] transition-colors cursor-pointer"
            style={{
              color: selectedTab === 1 ? THEME.BrassGold : THEME.MutedGray,
              fontWeight: selectedTab === 1 ? 700 : 400,
            }}
          >
            <span>SAVED ({savedPresets.length})</span>
            {selectedTab === 1 && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: THEME.BrassGold }}
              />
            )}
          </button>
        </div>

        <div className="h-3.5 shrink-0" />

        {/* Content */}
        {selectedTab === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
            {PRESET_LIBRARY.map((preset) => (
              <CuratedPresetCard
                key={preset.id}
                preset={preset}
                onSelect={() => onSelectCurated(preset)}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <button
              type="button"
              onClick={onOpenSaveDialog}
              className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-[10px] font-mono text-[11px] font-bold transition-opacity hover:opacity-90 cursor-pointer"
              style={{
                backgroundColor: THEME.BrassGold,
                color: THEME.CanvasBg,
              }}
            >
              <Plus className="h-4 w-4" />
              <span>SAVE CURRENT DESIGN</span>
            </button>

            <div className="h-2.5 shrink-0" />

            {savedPresets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="font-mono text-[12px]" style={{ color: THEME.MutedGray }}>
                  No saved patterns yet
                </div>
                <div
                  className="mt-1 font-mono text-[10.5px]"
                  style={{ color: 'rgba(123, 131, 140, 0.7)' }}
                >
                  Tweak gears and save your favorite curves here!
                </div>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
                {savedPresets.map((saved) => (
                  <SavedPresetCard
                    key={saved.id}
                    saved={saved}
                    onSelect={() => onSelectSaved(saved)}
                    onDelete={() => onDeleteSaved(saved)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheetShell>
  );
};

interface CuratedPresetCardProps {
  preset: CuratedPreset;
  onSelect: () => void;
}

const CuratedPresetCard: React.FC<CuratedPresetCardProps> = ({ preset, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className="rounded-[12px] p-3.5 transition-colors hover:brightness-110 cursor-pointer"
      style={{
        backgroundColor: THEME.PanelBgElevated,
        border: `1px solid ${THEME.PanelEdge}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold" style={{ color: THEME.PaperWhite }}>
            {preset.title}
          </div>
          <div className="font-mono text-[10.5px]" style={{ color: THEME.BrassGold }}>
            {preset.subtitle}
          </div>
        </div>

        <span
          className="shrink-0 rounded-[6px] px-2 py-0.5 font-mono text-[9.5px]"
          style={{
            backgroundColor: THEME.BrassGlow,
            color: THEME.BrassGold,
          }}
        >
          {preset.category}
        </span>
      </div>

      <p
        className="mt-1.5 font-mono text-[10.5px] leading-[15px]"
        style={{ color: THEME.MutedGray }}
      >
        {preset.description}
      </p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {preset.circles
            .filter((c) => c.isPen)
            .map((c) => (
              <span
                key={c.id}
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: c.color }}
              />
            ))}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="flex h-8 items-center gap-1 rounded-[8px] px-3 font-mono text-[9.5px] font-bold hover:bg-white/5 cursor-pointer"
          style={{
            color: THEME.TealAccent,
            border: `1px solid ${THEME.TealAccent}`,
          }}
        >
          <Play className="h-3.5 w-3.5" fill={THEME.TealAccent} />
          <span>LOAD</span>
        </button>
      </div>
    </div>
  );
};

interface SavedPresetCardProps {
  saved: SavedPreset;
  onSelect: () => void;
  onDelete: () => void;
}

const SavedPresetCard: React.FC<SavedPresetCardProps> = ({
  saved,
  onSelect,
  onDelete,
}) => {
  const dateStr = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(saved.createdAt));
    } catch {
      return '';
    }
  }, [saved.createdAt]);

  const previewColors = useMemo(() => {
    if (!saved.previewColors || !saved.previewColors.trim()) return [];
    return saved.previewColors.split(',').map((hex) => parseHexColor(hex));
  }, [saved.previewColors]);

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className="flex items-center justify-between gap-2 rounded-[12px] p-3 transition-colors hover:brightness-110 cursor-pointer"
      style={{
        backgroundColor: THEME.PanelBgElevated,
        border: `1px solid ${THEME.PanelEdge}`,
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold" style={{ color: THEME.PaperWhite }}>
          {saved.title}
        </div>
        <div className="font-mono text-[9.5px]" style={{ color: THEME.MutedGray }}>
          {saved.circleCount} circles · {dateStr}
        </div>
        {saved.description && (
          <div
            className="mt-0.5 truncate font-mono text-[10px]"
            style={{ color: 'rgba(123, 131, 140, 0.8)' }}
          >
            {saved.description}
          </div>
        )}
        {previewColors.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {previewColors.map((color, idx) => (
              <span
                key={`${color}-${idx}`}
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="flex h-8 items-center rounded-[8px] px-3 font-mono text-[9.5px] font-bold hover:bg-white/5 cursor-pointer"
          style={{
            color: THEME.TealAccent,
            border: `1px solid ${THEME.TealAccent}`,
          }}
        >
          LOAD
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete preset"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/5 cursor-pointer"
          style={{ color: 'rgba(232, 92, 92, 0.8)' }}
        >
          <Trash2 className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
};
