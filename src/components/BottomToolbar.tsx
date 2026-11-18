import React from 'react';
import { THEME } from '../constants/palette';
import { ActiveSheet } from '../types/spirograph';

interface BottomToolbarProps {
  circleCount: number;
  activeSheet: ActiveSheet;
  onOpenGears: () => void;
  onOpenLoad: () => void;
  onOpenSettings: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  circleCount,
  activeSheet,
  onOpenGears,
  onOpenLoad,
  onOpenSettings,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        backgroundColor: THEME.PanelBg,
        borderTop: `1px solid ${THEME.PanelEdge}`,
      }}
      aria-label="Primary Controls"
    >
      <div className="mx-auto flex w-full max-w-xl items-center gap-2.5 px-3.5 py-2.5">
        <ToolbarButton
          label="GEARS"
          badge={String(circleCount)}
          isActive={activeSheet === ActiveSheet.GEARS}
          onClick={onOpenGears}
        />
        <ToolbarButton
          label="LOAD"
          isActive={activeSheet === ActiveSheet.LOAD}
          onClick={onOpenLoad}
        />
        <ToolbarButton
          label="SETTINGS"
          isActive={activeSheet === ActiveSheet.SETTINGS}
          onClick={onOpenSettings}
        />
      </div>
    </nav>
  );
};

interface ToolbarButtonProps {
  label: string;
  badge?: string;
  isActive: boolean;
  onClick: () => void;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  label,
  badge,
  isActive,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 flex-1 items-center justify-center rounded-[10px] font-mono text-[11px] tracking-[0.05em] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      style={{
        backgroundColor: isActive ? 'rgba(95, 211, 196, 0.12)' : 'transparent',
        color: isActive ? THEME.TealAccent : THEME.PaperWhite,
        border: `1px solid ${isActive ? THEME.TealAccent : THEME.PanelEdge}`,
        fontWeight: isActive ? 700 : 500,
      }}
    >
      <span>{label}</span>
      {badge !== undefined && (
        <span
          className="ml-1.5 rounded-[6px] px-1.5 py-[1px] text-[9px] font-bold tabular-nums"
          style={{
            backgroundColor: THEME.BrassGlow,
            color: THEME.BrassGold,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
