import React, { useState } from 'react';
import { THEME } from '../constants/palette';

interface SavePresetDialogProps {
  circleCount: number;
  onDismiss: () => void;
  onSave: (title: string, description: string) => void;
}

export const SavePresetDialog: React.FC<SavePresetDialogProps> = ({
  circleCount,
  onDismiss,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle =
      title.trim() || `Pattern #${Math.floor(100 + Math.random() * 900)}`;
    onSave(finalTitle, description);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] rounded-[20px] p-6 shadow-2xl"
        style={{
          backgroundColor: THEME.PanelBg,
          border: `1px solid ${THEME.PanelEdge}`,
        }}
      >
        <h3
          className="text-[15px] font-bold tracking-[0.05em]"
          style={{ color: THEME.BrassGold }}
        >
          SAVE TO MY PATTERNS
        </h3>

        <p className="mt-2 font-mono text-[11px]" style={{ color: THEME.MutedGray }}>
          Save this {circleCount}-circle configuration to your local library.
        </p>

        <div className="mt-3">
          <label
            htmlFor="preset-name-input"
            className="mb-1 block font-mono text-[10px]"
            style={{ color: THEME.MutedGray }}
          >
            Pattern Name
          </label>
          <input
            id="preset-name-input"
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Spiral Nexus"
            className="h-11 w-full rounded-[8px] px-3 font-mono text-[13px] outline-none"
            style={{
              backgroundColor: THEME.CanvasBg,
              color: THEME.PaperWhite,
              border: `1px solid ${THEME.PanelEdge}`,
            }}
          />
        </div>

        <div className="mt-2.5">
          <label
            htmlFor="preset-notes-input"
            className="mb-1 block font-mono text-[10px]"
            style={{ color: THEME.MutedGray }}
          >
            Notes (Optional)
          </label>
          <textarea
            id="preset-notes-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Ratio 1:3:7 with cyan ink"
            className="w-full resize-none rounded-[8px] px-3 py-2 font-mono text-[12px] outline-none"
            style={{
              backgroundColor: THEME.CanvasBg,
              color: THEME.PaperWhite,
              border: `1px solid ${THEME.PanelEdge}`,
            }}
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg px-3 py-2 font-mono text-[11px] hover:bg-white/5 cursor-pointer"
            style={{ color: THEME.MutedGray }}
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="rounded-[8px] px-4 py-2 font-mono text-[11px] font-bold cursor-pointer"
            style={{
              backgroundColor: THEME.BrassGold,
              color: THEME.CanvasBg,
            }}
          >
            SAVE
          </button>
        </div>
      </form>
    </div>
  );
};
