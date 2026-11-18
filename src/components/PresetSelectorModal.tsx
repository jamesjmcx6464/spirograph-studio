import React, { useState } from 'react';
import { X, Compass, Check, Bookmark, Trash2, FolderPlus } from 'lucide-react';
import { CuratedPreset, SavedDesign } from '../types/spirograph';
import { PresetLibrary } from '../constants/presets';

interface PresetSelectorModalProps {
  isOpen: boolean;
  activePresetId: string;
  savedDesigns: SavedDesign[];
  onSelectPreset: (preset: CuratedPreset) => void;
  onSelectSavedDesign: (saved: SavedDesign) => void;
  onDeleteSavedDesign: (id: string) => void;
  onClose: () => void;
}

export const PresetSelectorModal: React.FC<PresetSelectorModalProps> = ({
  isOpen,
  activePresetId,
  savedDesigns,
  onSelectPreset,
  onSelectSavedDesign,
  onDeleteSavedDesign,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'saved'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Featured', 'Spirographs', 'Harmonics', 'Curves', 'Fourier'];
  const filteredPresets =
    selectedCategory === 'All'
      ? PresetLibrary
      : PresetLibrary.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans']"
    >
      <div className="bg-[#12161B] border border-[#1F262E] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1F262E] flex items-center justify-between bg-[#0E1216]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C9A26A]/15 border border-[#C9A26A]/30 flex items-center justify-center text-[#C9A26A]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Presets & Storage Gallery
              </h2>
              <p className="text-[10px] text-[#7B838C]">
                Curated harmonic geometries and saved workspaces
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7B838C] hover:text-[#E7E3DA] hover:bg-[#161C22] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Two Top Containers Navigation Tabs */}
        <div className="px-5 pt-3 pb-2 bg-[#0E1216] border-b border-[#1F262E] flex items-center gap-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-[#C9A26A] text-[#0A0D10] shadow-md font-extrabold'
                : 'bg-[#14191F] border border-[#1F262E] text-[#8B95A1] hover:text-white hover:border-[#323D4A]'
            }`}
          >
            <span>Presets</span>
            <span
              className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center tabular-nums ${
                activeTab === 'presets' ? 'bg-[#0A0D10]/20 text-[#0A0D10]' : 'bg-[#1F262E] text-[#8B95A1]'
              }`}
            >
              {PresetLibrary.length}
            </span>
          </button>

          <button
            data-tour="saved-designs-tab"
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-[#C9A26A] text-[#0A0D10] shadow-md font-extrabold'
                : 'bg-[#14191F] border border-[#1F262E] text-[#8B95A1] hover:text-white hover:border-[#323D4A]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Designs</span>
            <span
              className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center tabular-nums ${
                activeTab === 'saved' ? 'bg-[#0A0D10]/20 text-[#0A0D10]' : 'bg-[#1F262E] text-[#8B95A1]'
              }`}
            >
              {savedDesigns.length}
            </span>
          </button>
        </div>

        {/* CONTAINER 1: PRESETS (Curated designs) */}
        {activeTab === 'presets' && (
          <>
            {/* Category Filter Pills */}
            <div className="px-5 py-2.5 bg-[#0E1216] border-b border-[#1F262E] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {categories.map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#2A2318] border border-[#6E5F45] text-[#C9A26A]'
                        : 'text-[#8B95A1] hover:text-[#E7E3DA] hover:bg-[#161C22]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Presets Cards List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 no-scrollbar">
              {filteredPresets.map(preset => {
                const isActive = preset.id === activePresetId;
                const penColors = preset.circles.filter(c => c.isPen).map(c => c.color);

                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                    className={`group relative text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? 'bg-[#161C22] border-[#C9A26A] shadow-md shadow-[#C9A26A]/5'
                        : 'bg-[#14191F] border-[#1F262E] hover:border-[#323D4A] hover:bg-[#181E26]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <span className="text-[10px] font-bold text-[#C9A26A] tracking-wider uppercase block">
                            {preset.category}
                          </span>
                          <h3 className="text-sm font-bold text-[#E7E3DA] group-hover:text-white transition-colors">
                            {preset.title}
                          </h3>
                        </div>
                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] text-[#5FD3C4] font-semibold bg-[#5FD3C4]/10 border border-[#5FD3C4]/30 px-2 py-0.5 rounded">
                            <Check className="w-2.5 h-2.5" /> Active
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#7B838C] mb-1 font-medium">
                        {preset.subtitle}
                      </p>

                      <p className="text-xs text-[#8B95A1] line-clamp-2 mb-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#1F262E]/60 flex items-center justify-between text-xs text-[#7B838C]">
                      {/* Gear count & Colors */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#8B95A1]">{preset.circles.length} Gears</span>
                        <span className="text-[#323D4A]">·</span>
                        <div className="flex items-center gap-1">
                          {penColors.map((color, i) => (
                            <span
                              key={i}
                              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <span className="text-xs text-[#C9A26A] group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-bold">
                        Load Preset →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* CONTAINER 2: SAVED DESIGNS (User-saved configurations) */}
        {activeTab === 'saved' && (
          <div className="p-5 overflow-y-auto space-y-3 flex-1 no-scrollbar">
            {savedDesigns.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1F26] border border-[#2A3440] text-[#C9A26A] flex items-center justify-center mx-auto shadow-inner">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    No Saved Designs Yet
                  </h3>
                  <p className="text-xs text-[#8B95A1] max-w-xs mx-auto leading-relaxed">
                    Tap the bookmark button in the top right of the canvas to type a name and save your current gear setup.
                  </p>
                </div>
              </div>
            ) : (
              savedDesigns.map(design => {
                const penColors = design.circles.filter(c => c.isPen).map(c => c.color);
                const dateStr = new Date(design.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={design.id}
                    className="p-4 rounded-xl border border-[#1F262E] bg-[#14191F] hover:border-[#323D4A] hover:bg-[#181E26] transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[10px] text-[#7B838C] font-mono block mb-0.5">
                          {dateStr}
                        </span>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#C9A26A] transition-colors">
                          {design.name}
                        </h3>
                      </div>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          if (window.confirm(`Delete saved design "${design.name}"?`)) {
                            onDeleteSavedDesign(design.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-[#7B838C] hover:text-[#E85C5C] hover:bg-[#E85C5C]/10 transition-colors cursor-pointer"
                        title="Delete saved design"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-2.5 border-t border-[#1F262E]/60 flex items-center justify-between text-xs text-[#7B838C]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#8B95A1]">{design.circles.length} Gears</span>
                        <span className="text-[#323D4A]">·</span>
                        <div className="flex items-center gap-1">
                          {penColors.map((color, i) => (
                            <span
                              key={i}
                              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectSavedDesign(design);
                          onClose();
                        }}
                        className="px-3 py-1 rounded-lg bg-[#C9A26A] hover:bg-[#d6b27d] text-[#0A0D10] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        Load onto Canvas
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#0E1216] border-t border-[#1F262E] flex items-center justify-between text-xs text-[#7B838C]">
          <span>
            {activeTab === 'presets'
              ? `${PresetLibrary.length} Curated Presets`
              : `${savedDesigns.length} Saved Designs`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-[#1F262E] hover:border-[#323D4A] text-[#E7E3DA] font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
