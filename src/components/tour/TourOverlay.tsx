import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useTour } from '../../context/TourContext';

interface TargetRect {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

export const TourOverlay: React.FC = () => {
  const {
    isTourActive,
    currentLesson,
    currentStepIndex,
    currentStep,
    totalStepsInLesson,
    activeSelector,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useTour();

  const [targetHole, setTargetHole] = useState<TargetRect | null>(null);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipSize, setTooltipSize] = useState({ w: 360, h: 200 });

  const isReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Resolve target element supporting preference fallback and selecting the last card/button
  const findTourTarget = useCallback((selector: string | null): Element | null => {
    if (!selector) return null;
    const parts = selector.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      const matches = document.querySelectorAll(part);
      if (matches.length > 0) {
        return matches[matches.length - 1];
      }
    }
    return null;
  }, []);

  // Measure and update target bounding box
  const updateTargetHole = useCallback(() => {
    if (!activeSelector) {
      setTargetHole(null);
      return;
    }

    const el = findTourTarget(activeSelector);
    if (!el) {
      return;
    }

    const rect = el.getBoundingClientRect();
    const pad = 6;
    const x = Math.max(0, rect.left - pad);
    const y = Math.max(0, rect.top - pad);
    const w = Math.min(window.innerWidth - x, rect.width + pad * 2);
    const h = Math.min(window.innerHeight - y, rect.height + pad * 2);

    let r = 16;
    if (rect.width <= 56 && rect.height <= 56) {
      r = Math.min(w, h) / 2; // Circular buttons
    } else if (rect.width > 280) {
      r = 18; // Large cards/drawers/headers
    }

    setTargetHole({ x, y, w, h, r });
  }, [activeSelector, findTourTarget]);

  // Scroll target element into view inside its scroll container and update spotlight
  const scrollAndMeasure = useCallback(() => {
    if (!activeSelector) return;
    const el = findTourTarget(activeSelector);
    if (el) {
      el.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: isReducedMotion ? 'auto' : 'smooth',
      });
      updateTargetHole();
    }
  }, [activeSelector, findTourTarget, updateTargetHole, isReducedMotion]);

  // When step changes, or when the user clicks the target (e.g. LAYER button in Gears lesson),
  // or when the DOM mutates (e.g. new gear card added), keep the spotlight on screen.
  useEffect(() => {
    if (!isTourActive || !activeSelector) return;

    scrollAndMeasure();
    const t1 = window.setTimeout(scrollAndMeasure, 80);
    const t2 = window.setTimeout(scrollAndMeasure, 250);
    const t3 = window.setTimeout(scrollAndMeasure, 500);

    // Watch for clicks on the target (e.g. clicking LAYER adds a card, shifting position)
    const handleTargetClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = findTourTarget(activeSelector);
      if (target && el && (el === target || el.contains(target))) {
        // Target was clicked; schedule repeated re-scrolls as React updates DOM & layout
        requestAnimationFrame(scrollAndMeasure);
        const delays = [40, 100, 200, 350, 500, 750];
        delays.forEach(d => window.setTimeout(scrollAndMeasure, d));

        let pollFrames = 0;
        const pollAnim = () => {
          scrollAndMeasure();
          if (++pollFrames < 35) {
            requestAnimationFrame(pollAnim);
          }
        };
        requestAnimationFrame(pollAnim);
      }
    };

    window.addEventListener('click', handleTargetClick, true);

    // MutationObserver to automatically detect when new nodes (like gear cards) are added
    const mutationObserver = new MutationObserver(() => {
      scrollAndMeasure();
      let frames = 0;
      const anim = () => {
        updateTargetHole();
        if (++frames < 20) {
          requestAnimationFrame(anim);
        }
      };
      requestAnimationFrame(anim);
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener('click', handleTargetClick, true);
      mutationObserver.disconnect();
    };
  }, [isTourActive, activeSelector, scrollAndMeasure, updateTargetHole, findTourTarget]);

  // Keep target box synced across window resize, DOM updates, and scroll
  useEffect(() => {
    if (!isTourActive) return;

    updateTargetHole();

    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      updateTargetHole();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updateTargetHole, true);

    const observer = new ResizeObserver(() => {
      updateTargetHole();
    });
    observer.observe(document.body);

    let frames = 0;
    let animId: number;
    const rafPoll = () => {
      updateTargetHole();
      if (++frames < 24) {
        animId = requestAnimationFrame(rafPoll);
      }
    };
    animId = requestAnimationFrame(rafPoll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateTargetHole, true);
      observer.disconnect();
      cancelAnimationFrame(animId);
    };
  }, [isTourActive, currentStepIndex, activeSelector, updateTargetHole]);

  // Measure tooltip size
  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTooltipSize({ w: rect.width, h: rect.height });
      }
    }
  }, [currentStepIndex, isTourActive]);

  // Focus tooltip for screen reader accessibility
  useEffect(() => {
    if (isTourActive && tooltipRef.current) {
      tooltipRef.current.focus();
    }
  }, [isTourActive, currentStepIndex]);

  const handleNext = useCallback(() => {
    if (currentStepIndex === totalStepsInLesson - 1) {
      completeTour();
    } else {
      nextStep();
    }
  }, [currentStepIndex, totalStepsInLesson, completeTour, nextStep]);

  // Keyboard navigation: Enter = Next, Esc = Skip
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        skipTour();
      } else if (e.key === 'Enter') {
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          e.stopPropagation();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isTourActive, skipTour, handleNext]);

  // Build SVG path with evenodd rule so spotlight hole has NO fill and passes clicks
  const buildEvenOddPath = (sw: number, sh: number, h: TargetRect | null) => {
    let d = `M 0 0 H ${sw} V ${sh} H 0 Z`;
    if (!h) return d;
    const { x, y, w, h: height, r } = h;
    const radius = Math.max(0, Math.min(r, w / 2, height / 2));
    d += ` M ${x + radius} ${y}`;
    d += ` H ${x + w - radius}`;
    d += ` A ${radius} ${radius} 0 0 1 ${x + w} ${y + radius}`;
    d += ` V ${y + height - radius}`;
    d += ` A ${radius} ${radius} 0 0 1 ${x + w - radius} ${y + height}`;
    d += ` H ${x + radius}`;
    d += ` A ${radius} ${radius} 0 0 1 ${x} ${y + height - radius}`;
    d += ` V ${y + radius}`;
    d += ` A ${radius} ${radius} 0 0 1 ${x + radius} ${y}`;
    d += ` Z`;
    return d;
  };

  // Calculate tooltip placement - strictly clamped inside viewport
  const calculateTooltipPosition = () => {
    const margin = 16;
    const cardW = Math.min(380, windowSize.w - margin * 2);
    const cardH = tooltipSize.h || 180;

    if (!targetHole) {
      // Centered (e.g. Welcome card)
      return {
        top: Math.max(margin, Math.min(windowSize.h - cardH - margin, (windowSize.h - cardH) / 2)),
        left: Math.max(margin, Math.min(windowSize.w - cardW - margin, (windowSize.w - cardW) / 2)),
        width: cardW,
      };
    }

    const holeBottom = targetHole.y + targetHole.h;
    const holeTop = targetHole.y;

    let top: number;
    if (holeBottom + 14 + cardH <= windowSize.h - margin) {
      top = holeBottom + 14;
    } else if (holeTop - 14 - cardH >= margin) {
      top = holeTop - 14 - cardH;
    } else {
      if (holeTop > windowSize.h - holeBottom) {
        top = holeTop - 14 - cardH;
      } else {
        top = holeBottom + 14;
      }
    }

    // Strictly clamp within viewport
    top = Math.max(margin, Math.min(windowSize.h - cardH - margin, top));

    let left = targetHole.x + targetHole.w / 2 - cardW / 2;
    left = Math.max(margin, Math.min(windowSize.w - cardW - margin, left));

    return { top, left, width: cardW };
  };

  const tooltipPos = calculateTooltipPosition();
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalStepsInLesson - 1;

  return (
    <>
      {/* Full-screen Spotlight Tutorial Overlay - mounted only while isTourActive is true */}
      {isTourActive &&
        createPortal(
          <div className="fixed inset-0 z-[90] overflow-hidden select-none font-['Plus_Jakarta_Sans'] pointer-events-none">
            {/* SVG Mask with Evenodd Hole Cutout */}
            <svg
              className="fixed inset-0 w-full h-full pointer-events-none"
              width={windowSize.w}
              height={windowSize.h}
            >
              <path
                fill="rgba(5, 8, 12, 0.78)"
                fillRule="evenodd"
                d={buildEvenOddPath(windowSize.w, windowSize.h, targetHole)}
                className={`pointer-events-auto transition-all ${
                  isReducedMotion ? 'duration-0' : 'duration-400 ease-out'
                }`}
              />

              {/* Delicate brass glow outline around the active target */}
              {targetHole && (
                <rect
                  x={targetHole.x}
                  y={targetHole.y}
                  width={targetHole.w}
                  height={targetHole.h}
                  rx={targetHole.r}
                  fill="none"
                  stroke="#C9A26A"
                  strokeWidth="2"
                  strokeOpacity="0.85"
                  className={`pointer-events-none transition-all ${
                    isReducedMotion ? 'duration-0' : 'duration-400 ease-out'
                  }`}
                />
              )}
            </svg>

            {/* Floating Tooltip Dialog Card (pointer-events-auto so buttons and links work) */}
            <div
              ref={tooltipRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="tour-step-title"
              aria-describedby="tour-step-desc"
              tabIndex={-1}
              style={{
                position: 'fixed',
                top: `${tooltipPos.top}px`,
                left: `${tooltipPos.left}px`,
                width: `${tooltipPos.width}px`,
              }}
              className={`pointer-events-auto z-[95] bg-[#0E1216]/95 backdrop-blur-md border border-[#2A2318] rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/80 flex flex-col gap-3 outline-none transition-all ${
                isReducedMotion ? 'duration-0' : 'duration-300 ease-out'
              }`}
            >
              {/* Header: Lesson Name, Step Progress & Close */}
              <div className="flex items-center justify-between gap-2 border-b border-[#1F262E] pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold tracking-wider text-[#C9A26A] uppercase font-sans">
                    {currentLesson.name} · STEP {currentStepIndex + 1} OF {totalStepsInLesson}
                  </span>
                  {/* Progress dots */}
                  <div className="flex items-center gap-1">
                    {currentLesson.steps.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === currentStepIndex
                            ? 'w-3.5 bg-[#C9A26A]'
                            : i < currentStepIndex
                            ? 'w-1.5 bg-[#C9A26A]/50'
                            : 'w-1.5 bg-[#1F262E]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={skipTour}
                  className="text-[11px] text-[#8B95A1] hover:text-[#E7E3DA] transition-colors cursor-pointer flex items-center gap-0.5 shrink-0"
                  title="Skip tutorial (Esc)"
                >
                  <span>Skip</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <h3 id="tour-step-title" className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                  {currentStep.title}
                </h3>
                <p id="tour-step-desc" className="text-xs text-[#E7E3DA] leading-relaxed">
                  {currentStep.text}
                </p>
              </div>

              {/* Footer Navigation Buttons */}
              <div className="flex items-center justify-between pt-1 gap-2">
                {currentStepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-3 py-1.5 rounded-xl border border-[#1F262E] hover:border-[#323D4A] bg-[#12161B] text-[#8B95A1] hover:text-[#E7E3DA] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 rounded-xl bg-[#C9A26A] hover:bg-[#d6b27d] text-[#0A0D10] text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>
                      {isFirstStep && currentLesson.id === 'overview'
                        ? 'Start Tutorial'
                        : isLastStep
                        ? 'Done'
                        : 'Next'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
