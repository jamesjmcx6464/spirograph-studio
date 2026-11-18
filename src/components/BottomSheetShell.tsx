import React, { useEffect } from 'react';
import { THEME } from '../constants/palette';

interface BottomSheetShellProps {
  onDismiss: () => void;
  showDragHandle?: boolean;
  children: React.ReactNode;
}

export const BottomSheetShell: React.FC<BottomSheetShellProps> = ({
  onDismiss,
  showDragHandle = true,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-[560px] flex-col rounded-t-[24px] shadow-2xl"
        style={{
          backgroundColor: THEME.PanelBg,
          color: THEME.PaperWhite,
          borderTop: `1px solid ${THEME.PanelEdge}`,
          borderLeft: `1px solid ${THEME.PanelEdge}`,
          borderRight: `1px solid ${THEME.PanelEdge}`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {showDragHandle && (
          <div className="flex justify-center pt-2.5 pb-1.5 shrink-0">
            <div
              className="h-1 w-9 rounded-[2px]"
              style={{ backgroundColor: THEME.PanelEdge }}
            />
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
