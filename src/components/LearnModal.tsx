import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Compass,
  Keyboard,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { LESSONS } from '../types/tour';

interface LearnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLesson?: (lessonId: string) => void;
}

export const LearnModal: React.FC<LearnModalProps> = ({ isOpen, onClose, onStartLesson }) => {
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-[#12161B] border border-[#1F262E] rounded-2xl w-full max-w-md max-h-[88%] flex flex-col shadow-2xl overflow-hidden font-['Plus_Jakarta_Sans']">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1F262E] flex items-center justify-between bg-[#0E1216]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C9A26A]/15 border border-[#C9A26A]/30 flex items-center justify-center text-[#C9A26A]">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Learn & Tutorials
              </h2>
              <p className="text-[10px] text-[#7B838C]">
                Interactive lessons and drafting controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#7B838C] hover:text-[#E7E3DA] hover:bg-[#161C22] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#8B95A1] leading-relaxed no-scrollbar">
          {/* Tutorial Dropdown Section */}
          {onStartLesson && (
            <div className="rounded-xl bg-[#161C22] border border-[#C9A26A]/40 overflow-hidden shadow-md">
              <button
                type="button"
                onClick={() => setIsTutorialOpen(prev => !prev)}
                className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-[#1C232B] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#C9A26A]/15 border border-[#C9A26A]/30 flex items-center justify-center text-[#C9A26A]">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Tutorial
                    </h3>
                    <p className="text-[11px] text-[#8B95A1]">
                      Choose an interactive lesson
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[#C9A26A]">
                  <span className="text-[11px] font-semibold">{LESSONS.length} Lessons</span>
                  {isTutorialOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isTutorialOpen && (
                <div className="p-2 pt-0 space-y-1.5 border-t border-[#1F262E]">
                  {LESSONS.map(lesson => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartLesson(lesson.id);
                      }}
                      className="w-full text-left p-2.5 rounded-lg bg-[#0E1216] border border-[#1F262E] hover:border-[#C9A26A] hover:bg-[#12161B] transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-[#C9A26A] transition-colors">
                            {lesson.name}
                          </span>
                          <span className="text-[10px] text-[#7B838C] font-mono">
                            {lesson.steps.length} steps
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8B95A1] leading-tight mt-0.5 truncate">
                          {lesson.description}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#7B838C] group-hover:text-[#C9A26A] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Keyboard Shortcuts List */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[#E7E3DA] font-semibold text-xs">
              <Keyboard className="w-3.5 h-3.5 text-[#C9A26A]" />
              <span>Keyboard Shortcuts</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-[#161C22] border border-[#1F262E] flex items-center justify-between">
                <span className="text-[#8B95A1] font-sans">Play / Pause Animation</span>
                <kbd className="px-2 py-0.5 rounded bg-[#0A0D10] border border-[#2D3642] text-[#C9A26A] font-bold">Space</kbd>
              </div>
              <div className="p-2 rounded-lg bg-[#161C22] border border-[#1F262E] flex items-center justify-between">
                <span className="text-[#8B95A1] font-sans">Zoom In / Zoom Out</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-[#0A0D10] border border-[#2D3642] text-[#C9A26A] font-bold">+</kbd>
                  <span className="text-[#66707A]">/</span>
                  <kbd className="px-2 py-0.5 rounded bg-[#0A0D10] border border-[#2D3642] text-[#C9A26A] font-bold">−</kbd>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#161C22] border border-[#1F262E] flex items-center justify-between">
                <span className="text-[#8B95A1] font-sans">Center Camera at Origin (0, 0)</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-[#0A0D10] border border-[#2D3642] text-[#C9A26A] font-bold">0</kbd>
                  <span className="text-[#66707A]">or</span>
                  <kbd className="px-2 py-0.5 rounded bg-[#0A0D10] border border-[#2D3642] text-[#C9A26A] font-bold">Home</kbd>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#161C22] border border-[#1F262E] flex items-center justify-between">
                <span className="text-[#8B95A1] font-sans">Next Step / Skip Tutorial</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-[#0A0D10] border border-[#2D3642] text-[#5FD3C4] font-bold">Enter</kbd>
                  <span className="text-[#66707A]">/</span>
                  <kbd className="px-2 py-0.5 rounded bg-[#0A0D10] border border-[#2D3642] text-[#8B95A1] font-bold">Esc</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Epicyclic Mechanics Overview */}
          <div className="p-3 rounded-lg bg-[#0E1216] border border-[#1F262E] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#C9A26A] font-semibold text-xs">
              <Compass className="w-3.5 h-3.5" />
              <span>Epicyclic Geometry</span>
            </div>
            <p className="text-[11px] text-[#8B95A1]">
              Spirograph curves are generated by a kinematic chain of rotating pivots. Each gear arm rotates around the tip of the preceding gear at a defined radius and angular velocity.
            </p>
          </div>

          {/* Gear Modes */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#E7E3DA]">Gear Modes</h3>
            <div className="space-y-2">
              <div className="p-2.5 rounded-md bg-[#161C22] border border-[#1F262E]">
                <span className="text-[#C9A26A] font-mono text-[11px] font-bold block mb-0.5">GLOBAL</span>
                <p className="text-[11px]">Directly assigns absolute radius (px) and speed (°/s) independent of other gears.</p>
              </div>
              <div className="p-2.5 rounded-md bg-[#161C22] border border-[#1F262E]">
                <span className="text-[#5FD3C4] font-mono text-[11px] font-bold block mb-0.5">ENGINE</span>
                <p className="text-[11px]">Multiplies the root engine gear's radius and speed, maintaining fixed ratios.</p>
              </div>
              <div className="p-2.5 rounded-md bg-[#161C22] border border-[#1F262E]">
                <span className="text-[#8E7CE8] font-mono text-[11px] font-bold block mb-0.5">PREVIOUS</span>
                <p className="text-[11px]">Couples to the immediately preceding planetary gear for cascading epicyclic motion.</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#161C22] border border-[#1F262E] space-y-1">
            <span className="text-[#E7E3DA] font-semibold text-[11px] block">Tip</span>
            <p className="text-[11px]">
              Tap <strong>GEARS</strong> at the bottom to adjust individual gear ratios, or tap <strong>LOAD</strong> to choose classic mathematical curves like the Rhodonea Rose, Trefoil Knot, and Golden Bloom.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0E1216] border-t border-[#1F262E] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1F262E] text-[#E7E3DA] hover:bg-[#2A3540] text-xs font-bold transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
