import React, { useEffect, useState } from 'react';
import { Bookmark, ClipboardPaste, Code2, Share2, Sparkles, X } from 'lucide-react';
import { THEME } from '../constants/palette';
import { ExportFormat } from '../types/spirograph';
import { BottomSheetShell } from './BottomSheetShell';

interface LoadSheetProps {
  exportFormat: ExportFormat;
  exportedCode: string;
  codeMessage: string | null;
  isSuccessMessage: boolean;
  onDismiss: () => void;
  onFormatChange: (fmt: ExportFormat) => void;
  onImportCode: (code: string) => void;
  onClearCodeMessage: () => void;
  onOpenPresetsGallery: () => void;
}

export const LoadSheet: React.FC<LoadSheetProps> = ({
  exportFormat,
  exportedCode,
  codeMessage,
  isSuccessMessage,
  onDismiss,
  onFormatChange,
  onImportCode,
  onClearCodeMessage,
  onOpenPresetsGallery,
}) => {
  const [importText, setImportText] = useState('');
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  useEffect(() => {
    if (!copiedFeedback) return;
    const t = window.setTimeout(() => setCopiedFeedback(false), 2000);
    return () => window.clearTimeout(t);
  }, [copiedFeedback]);

  useEffect(() => {
    if (!codeMessage) return;
    const t = window.setTimeout(() => onClearCodeMessage(), 4000);
    return () => window.clearTimeout(t);
  }, [codeMessage, onClearCodeMessage]);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setImportText(text);
      }
    } catch {
      // Clipboard read may require permission in some browsers; textarea still allows Ctrl+V / Cmd+V
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(exportedCode);
      setCopiedFeedback(true);
    } catch {
      // Fallback copy
      const ta = document.createElement('textarea');
      ta.value = exportedCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedFeedback(true);
    }
  };

  const handleShareCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Spirograph Studio Epicycle Setup',
          text: exportedCode,
        });
        return;
      } catch {
        // User cancelled or share failed; fall back to copy
      }
    }
    await handleCopyCode();
  };

  return (
    <BottomSheetShell onDismiss={onDismiss}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Code2 className="h-[22px] w-[22px]" style={{ color: THEME.BrassGold }} />
            <h2
              className="text-[18px] font-bold tracking-[1.5px]"
              style={{ color: THEME.BrassGold }}
            >
              LOAD &amp; EXPORT
            </h2>
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

        <div className="h-3" />

        {/* Quick Shortcut to Presets & Gallery */}
        <button
          type="button"
          onClick={() => {
            onDismiss();
            onOpenPresetsGallery();
          }}
          className="flex w-full items-center justify-between rounded-[12px] px-3.5 py-3 text-left transition-colors hover:brightness-110 cursor-pointer"
          style={{
            backgroundColor: THEME.PanelBgElevated,
            border: `1px solid ${THEME.BrassDim}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
              style={{ backgroundColor: THEME.BrassGlow }}
            >
              <Bookmark className="h-5 w-5" style={{ color: THEME.BrassGold }} />
            </div>
            <div>
              <div className="text-[14px] font-bold" style={{ color: THEME.PaperWhite }}>
                Presets &amp; Storage Gallery
              </div>
              <div className="font-mono text-[11px]" style={{ color: THEME.MutedGray }}>
                Browse 9 curated mathematical designs or saved slots
              </div>
            </div>
          </div>
          <span
            className="ml-2 shrink-0 font-mono text-[10px] font-bold"
            style={{ color: THEME.BrassGold }}
          >
            OPEN →
          </span>
        </button>

        <div className="my-4 h-px w-full" style={{ backgroundColor: THEME.PanelEdge }} />

        {/* 1. Load from Code Section */}
        <div>
          <div className="flex items-center justify-between">
            <span
              className="font-mono text-[10.5px] font-bold tracking-[0.05em]"
              style={{ color: THEME.BrassGold }}
            >
              LOAD SETUP FROM CODE
            </span>

            <button
              type="button"
              onClick={handlePasteClipboard}
              className="flex h-[30px] items-center gap-1 rounded-[6px] px-2 font-mono text-[10px] hover:bg-white/5 cursor-pointer"
              style={{
                color: THEME.TealAccent,
                border: '1px solid rgba(95, 211, 196, 0.5)',
              }}
            >
              <ClipboardPaste className="h-3 w-3" />
              <span>PASTE CLIPBOARD</span>
            </button>
          </div>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste array (e.g. [1,2,4, 0,20,50,0,0, ...]) or labeled C1: ... setup here"
            className="mt-2 h-[110px] w-full resize-none rounded-[10px] p-3 font-mono text-[11px] outline-none"
            style={{
              backgroundColor: THEME.CanvasBg,
              color: THEME.PaperWhite,
              border: `1px solid ${THEME.PanelEdge}`,
            }}
          />

          <button
            type="button"
            onClick={() => onImportCode(importText)}
            className="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-[10px] font-mono text-[11px] font-bold transition-opacity hover:opacity-90 cursor-pointer"
            style={{
              backgroundColor: THEME.TealAccent,
              color: '#000000',
            }}
          >
            <Sparkles className="h-4 w-4" />
            <span>LOAD CODE INTO CANVAS</span>
          </button>

          {codeMessage && (
            <div
              className="mt-2 rounded-[6px] px-2.5 py-1.5 font-mono text-[10px] font-bold"
              style={{
                backgroundColor: isSuccessMessage
                  ? 'rgba(95, 211, 196, 0.15)'
                  : 'rgba(232, 92, 92, 0.15)',
                border: `1px solid ${isSuccessMessage ? THEME.TealAccent : THEME.DangerRed}`,
                color: isSuccessMessage ? THEME.TealAccent : THEME.DangerRed,
              }}
            >
              {codeMessage}
            </div>
          )}
        </div>

        <div className="my-4 h-px w-full" style={{ backgroundColor: THEME.PanelEdge }} />

        {/* 2. Code Export Section */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className="font-mono text-[10.5px] font-bold tracking-[0.05em]"
              style={{ color: THEME.BrassGold }}
            >
              SETUP EXPORT &amp; FORMULA
            </span>

            <div
              className="flex items-center gap-0.5 rounded-[8px] p-0.5"
              style={{ backgroundColor: THEME.CanvasBg }}
            >
              {(
                [
                  { fmt: ExportFormat.LABELED, label: 'Labeled' },
                  { fmt: ExportFormat.ARRAY, label: 'Array' },
                  { fmt: ExportFormat.EQUATION, label: 'Eq(x,y)' },
                ] as const
              ).map((item) => {
                const isSel = exportFormat === item.fmt;
                return (
                  <button
                    key={item.fmt}
                    type="button"
                    onClick={() => onFormatChange(item.fmt)}
                    className="rounded-[6px] px-2 py-1 font-mono text-[10px] cursor-pointer"
                    style={{
                      backgroundColor: isSel ? THEME.BrassGlow : 'transparent',
                      color: isSel ? THEME.BrassGold : THEME.MutedGray,
                      fontWeight: isSel ? 700 : 400,
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="mt-2 max-h-[200px] overflow-auto rounded-[10px] p-3 font-mono text-[11px] leading-[16px] whitespace-pre-wrap break-all"
            style={{
              backgroundColor: THEME.CanvasBg,
              color: THEME.PaperWhite,
              border: `1px solid ${THEME.PanelEdge}`,
            }}
          >
            {exportedCode}
          </div>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex h-10 flex-1 items-center justify-center rounded-[8px] font-mono text-[11px] font-medium hover:bg-white/5 cursor-pointer"
              style={{
                color: copiedFeedback ? THEME.TealAccent : THEME.PaperWhite,
                border: `1px solid ${copiedFeedback ? THEME.TealAccent : THEME.PanelEdge}`,
              }}
            >
              {copiedFeedback ? 'COPIED ✓' : 'COPY CODE'}
            </button>

            <button
              type="button"
              onClick={handleShareCode}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[8px] font-mono text-[11px] font-medium hover:bg-white/5 cursor-pointer"
              style={{
                color: THEME.BrassGold,
                border: `1px solid ${THEME.BrassDim}`,
              }}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>SHARE</span>
            </button>
          </div>
        </div>
      </div>
    </BottomSheetShell>
  );
};
