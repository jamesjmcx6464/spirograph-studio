import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Clipboard,
  Sparkles,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { GearCircle, ExportFormat } from '../types/spirograph';
import { exportLabeled, exportFlatArray, exportEquation, parseSetupCode } from '../utils/spiroMath';

interface LoadExportModalProps {
  isOpen: boolean;
  circles: GearCircle[];
  globalSpeedMult: number;
  inkWeight: number;
  onClose: () => void;
  onOpenPresets: () => void;
  onLoadCode: (codeText: string) => void;
}

export const LoadExportModal: React.FC<LoadExportModalProps> = ({
  isOpen,
  circles,
  globalSpeedMult,
  inkWeight,
  onClose,
  onOpenPresets,
  onLoadCode,
}) => {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('LABELED');
  const [pasteInput, setPasteInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  // Generate current export code
  let exportedCode = '';
  if (activeFormat === 'LABELED') {
    exportedCode = exportLabeled(circles, globalSpeedMult, inkWeight);
  } else if (activeFormat === 'ARRAY') {
    exportedCode = exportFlatArray(circles, globalSpeedMult, inkWeight);
  } else {
    exportedCode = exportEquation(circles, globalSpeedMult);
  }

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPasteInput(text);
        setStatusMessage(null);
      }
    } catch {
      setStatusMessage({ text: 'Clipboard access not available. Please paste manually.', isError: true });
    }
  };

  const handleLoadCode = () => {
    try {
      if (!pasteInput.trim()) {
        setStatusMessage({ text: 'Please paste or type setup code first.', isError: true });
        return;
      }
      onLoadCode(pasteInput);
      setStatusMessage({ text: 'Code loaded into canvas ✓', isError: false });
      setPasteInput('');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to parse code.', isError: true });
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(exportedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Spirograph Studio Setup',
          text: exportedCode,
        });
      } catch {
        // Dismissed share sheet
      }
    } else {
      await handleCopyCode();
      setStatusMessage({ text: 'Copied setup to clipboard for sharing', isError: false });
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans']"
    >
      <div className="bg-[#0E1216] border border-[#1F262E] rounded-t-[32px] sm:rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Drag Handle on Mobile */}
        <div className="w-12 h-1.5 bg-[#1F262E] rounded-full mx-auto my-3" />

        {/* Header */}
        <div className="px-5 pb-3 border-b border-[#1F262E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-[#C9A26A]">
              {'{ }'}
            </span>
            <h2 className="font-extrabold text-base tracking-wider text-[#C9A26A] uppercase font-sans">
              LOAD & EXPORT
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8B95A1] hover:text-[#E7E3DA] hover:bg-[#161C22] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* Card: Presets & Storage Gallery */}
          <div
            data-tour="load-presets-btn"
            onClick={() => {
              onClose();
              onOpenPresets();
            }}
            className="p-4 rounded-2xl border border-[#6E5F45]/60 bg-[#12161B]/80 hover:border-[#C9A26A] flex items-center gap-3.5 transition-all cursor-pointer group active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#1A1F26] border border-[#2A3440] flex items-center justify-center text-[#C9A26A] shadow-inner group-hover:scale-105 transition-transform shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white group-hover:text-[#C9A26A] transition-colors">
                Presets & Storage Gallery
              </h3>
              <p className="text-xs text-[#8B95A1] leading-relaxed">
                Browse 9 curated mathematical designs or saved slots
              </p>
            </div>
          </div>

          {/* Section: LOAD SETUP FROM CODE */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#C9A26A] uppercase tracking-wider">
                LOAD SETUP FROM CODE
              </span>
              <button
                onClick={handlePasteClipboard}
                className="px-2.5 py-1 rounded-lg border border-[#5FD3C4]/40 bg-[#0E1619] hover:bg-[#5FD3C4]/15 text-[#5FD3C4] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>PASTE CLIPBOARD</span>
              </button>
            </div>

            <textarea
              value={pasteInput}
              onChange={e => setPasteInput(e.target.value)}
              placeholder="Paste array (e.g. [1,2,4, 0,20,50,0,0, ...]) or labeled C1: ... setup here"
              className="w-full h-24 p-3 bg-[#07090C] border border-[#1F262E] focus:border-[#5FD3C4]/60 rounded-xl text-xs font-mono text-[#E7E3DA] placeholder:text-[#4B525B] outline-none resize-none leading-relaxed select-text"
            />

            {statusMessage && (
              <p
                className={`text-xs ${
                  statusMessage.isError ? 'text-[#E85C5C]' : 'text-[#5FD3C4]'
                }`}
              >
                {statusMessage.text}
              </p>
            )}

            {/* Teal LOAD CODE INTO CANVAS Button */}
            <button
              onClick={handleLoadCode}
              className="w-full py-3.5 px-4 rounded-xl bg-[#5FD3C4] hover:bg-[#72dfd2] active:scale-[0.99] text-[#0A0D10] text-xs font-extrabold tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>LOAD CODE INTO CANVAS</span>
            </button>
          </div>

          {/* Section: SETUP EXPORT & FORMULA */}
          <div className="space-y-2.5 pt-1" data-tour="load-export-section">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#C9A26A] uppercase tracking-wider">
                SETUP EXPORT & FORMULA
              </span>

              {/* Segmented Modes: Labeled | Array | Eq(x,y) */}
              <div className="flex items-center bg-[#07090C] border border-[#1F262E] rounded-lg p-0.5 text-xs font-bold">
                <button
                  onClick={() => setActiveFormat('LABELED')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activeFormat === 'LABELED'
                      ? 'bg-[#2A2318] border border-[#6E5F45] text-[#C9A26A]'
                      : 'text-[#7B838C] hover:text-[#E7E3DA]'
                  }`}
                >
                  Labeled
                </button>
                <button
                  onClick={() => setActiveFormat('ARRAY')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activeFormat === 'ARRAY'
                      ? 'bg-[#2A2318] border border-[#6E5F45] text-[#C9A26A]'
                      : 'text-[#7B838C] hover:text-[#E7E3DA]'
                  }`}
                >
                  Array
                </button>
                <button
                  onClick={() => setActiveFormat('EQUATION')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activeFormat === 'EQUATION'
                      ? 'bg-[#2A2318] border border-[#6E5F45] text-[#C9A26A]'
                      : 'text-[#7B838C] hover:text-[#E7E3DA]'
                  }`}
                >
                  Eq(x,y)
                </button>
              </div>
            </div>

            {/* Code Box Display */}
            <div className="p-4 rounded-xl bg-[#07090C] border border-[#1F262E] font-mono text-xs text-[#E7E3DA] overflow-x-auto max-h-48 whitespace-pre leading-relaxed select-text no-scrollbar">
              {exportedCode}
            </div>

            {/* Bottom Actions: COPY CODE and SHARE */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleCopyCode}
                className="py-3 px-3 rounded-xl border border-[#1F262E] bg-[#12161B] hover:bg-[#181E26] hover:border-[#323D4A] active:scale-[0.99] text-[#E7E3DA] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-[#5FD3C4]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
              </button>

              <button
                onClick={handleShare}
                className="py-3 px-3 rounded-xl border border-[#1F262E] bg-[#12161B] hover:bg-[#181E26] hover:border-[#C9A26A]/50 active:scale-[0.99] text-[#C9A26A] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>SHARE</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
