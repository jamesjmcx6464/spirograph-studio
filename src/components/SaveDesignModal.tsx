import React, { useState, useEffect, useRef } from 'react';
import { X, Bookmark, Check } from 'lucide-react';

interface SaveDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const SaveDesignModal: React.FC<SaveDesignModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [designName, setDesignName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDesignName(`Creation #${Math.floor(Math.random() * 900) + 100}`);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = designName.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  };

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans']"
    >
      <div className="bg-[#12161B] border border-[#1F262E] rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1F262E] flex items-center justify-between bg-[#0E1216]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C9A26A]/15 border border-[#C9A26A]/30 flex items-center justify-center text-[#C9A26A]">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Save Design
              </h2>
              <p className="text-[10px] text-[#7B838C]">
                Save current setup to browser storage
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#C9A26A] uppercase tracking-wider block">
              Design Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={designName}
              onChange={e => setDesignName(e.target.value)}
              placeholder="e.g. Amber Lotus, Golden Orbit..."
              className="w-full px-3.5 py-2.5 bg-[#07090C] border border-[#1F262E] focus:border-[#C9A26A] rounded-xl text-xs font-medium text-white placeholder:text-[#4B525B] outline-none transition-colors"
              maxLength={40}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F262E]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#1F262E] hover:border-[#323D4A] text-[#8B95A1] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#C9A26A] hover:bg-[#d6b27d] text-[#0A0D10] text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
