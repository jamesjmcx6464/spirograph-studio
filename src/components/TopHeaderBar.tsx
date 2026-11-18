import React from 'react';
import { Bookmark, GraduationCap, Image as ImageIcon, Layers, Pause, Play } from 'lucide-react';
import { THEME } from '../constants/palette';

interface TopHeaderBarProps {
  isPlaying: boolean;
  isLayersOpen: boolean;
  onTogglePlayPause: () => void;
  onOpenPresets: () => void;
  onOpenExport: () => void;
  onToggleLayers: () => void;
  onOpenLearn: () => void;
}

export const TopHeaderBar: React.FC<TopHeaderBarProps> = ({
  isPlaying,
  isLayersOpen,
  onTogglePlayPause,
  onOpenPresets,
  onOpenExport,
  onToggleLayers,
  onOpenLearn,
}) => {
  return (
    <header className="pointer-events-none fixed top-0 left-0 right-0 z-30 flex items-start justify-between px-4 py-3 sm:px-6 sm:py-4">
      {/* Left: Title + Learn button */}
      <div className="pointer-events-auto flex flex-col items-start gap-1.5 pt-1">
        <div className="select-none">
          <div
            className="text-[16px] font-bold leading-[20px] tracking-[1.6px]"
            style={{ color: THEME.PaperWhite }}
          >
            SPIROGRAPH
          </div>
          <div
            className="text-[16px] font-bold leading-[20px] tracking-[1.6px]"
            style={{ color: THEME.BrassGold }}
          >
            STUDIO
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenLearn}
          className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold tracking-[1.2px] transition-opacity hover:opacity-90 active:scale-95 cursor-pointer"
          style={{
            backgroundColor: 'rgba(201, 162, 106, 0.14)',
            border: '1px solid rgba(201, 162, 106, 0.55)',
            color: THEME.PaperWhite,
          }}
        >
          <GraduationCap className="h-3.5 w-3.5" style={{ color: THEME.BrassGold }} />
          <span>LEARN</span>
        </button>
      </div>

      {/* Right: 2x2 Button Grid */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {/* Row 1: Layers and Photo (Export) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleLayers}
            title="Pen Layers Switchboard"
            aria-label="Pen Layers Switchboard"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95 cursor-pointer"
            style={{
              backgroundColor: isLayersOpen ? THEME.BrassGold : 'rgba(18, 22, 27, 0.85)',
              border: `1px solid ${isLayersOpen ? THEME.PaperWhite : THEME.PanelEdge}`,
            }}
          >
            <Layers
              className="h-[18px] w-[18px]"
              style={{ color: isLayersOpen ? THEME.CanvasBg : THEME.BrassGold }}
            />
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            title="Export Artwork"
            aria-label="Export Artwork"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95 cursor-pointer"
            style={{
              backgroundColor: 'rgba(18, 22, 27, 0.85)',
              border: `1px solid ${THEME.PanelEdge}`,
            }}
          >
            <ImageIcon className="h-[18px] w-[18px]" style={{ color: THEME.TealAccent }} />
          </button>
        </div>

        {/* Row 2: Pause/Play and Bookmarks (Presets) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlayPause}
            title={isPlaying ? 'Pause simulation' : 'Play simulation'}
            aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95 cursor-pointer"
            style={{
              backgroundColor: isPlaying ? THEME.BrassDim : THEME.BrassGold,
              border: `1px solid ${THEME.BrassGold}`,
            }}
          >
            {isPlaying ? (
              <Pause
                className="h-5 w-5"
                style={{ color: THEME.PaperWhite }}
                fill={THEME.PaperWhite}
              />
            ) : (
              <Play
                className="h-5 w-5 translate-x-[1px]"
                style={{ color: THEME.CanvasBg }}
                fill={THEME.CanvasBg}
              />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenPresets}
            title="Presets & Storage Gallery"
            aria-label="Presets & Storage Gallery"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95 cursor-pointer"
            style={{
              backgroundColor: 'rgba(18, 22, 27, 0.85)',
              border: `1px solid ${THEME.PanelEdge}`,
            }}
          >
            <Bookmark className="h-[18px] w-[18px]" style={{ color: THEME.BrassGold }} />
          </button>
        </div>
      </div>
    </header>
  );
};
