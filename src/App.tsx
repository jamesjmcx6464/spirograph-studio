import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layers,
  Image as ImageIcon,
  Pause,
  Play,
  Bookmark,
  GraduationCap,
  Crosshair,
  Plus,
  Minus,
} from 'lucide-react';
import { GearCircle, InkStroke, CuratedPreset, SavedDesign } from './types/spirograph';
import { PresetLibrary } from './constants/presets';
import { InkPalette, CanvasBg } from './constants/theme';
import { computeChain, runVirtualSimulation, parseSetupCode, ensureStrokeChunks } from './utils/spiroMath';
import { SpirographCanvas } from './components/SpirographCanvas';
import { LoadExportModal } from './components/LoadExportModal';
import { PresetSelectorModal } from './components/PresetSelectorModal';
import { GearChainEditor } from './components/GearChainEditor';
import { SettingsModal } from './components/SettingsModal';
import { LearnModal } from './components/LearnModal';
import { SaveDesignModal } from './components/SaveDesignModal';
import { PenLayersModal } from './components/PenLayersModal';
import { TourProvider, useTour } from './context/TourContext';
import { TourOverlay } from './components/tour/TourOverlay';

function AppContent() {
  // Initial preset: Character Silhouette from PresetLibrary.kt
  const initialPreset = PresetLibrary[0];

  const [circles, setCircles] = useState<GearCircle[]>(initialPreset.circles.map(c => ({ ...c })));
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [globalSpeedMult, setGlobalSpeedMult] = useState<number>(Math.max(1.0, initialPreset.speedMult));
  const [inkWeight, setInkWeight] = useState<number>(Math.max(0.01, initialPreset.weight));
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [showPoints, setShowPoints] = useState<boolean>(true);

  // Camera viewport
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.6);

  // Modals & Panels
  const [activePresetTitle, setActivePresetTitle] = useState<string>(initialPreset.title);
  const [activePresetId, setActivePresetId] = useState<string>(initialPreset.id);
  const [isGearTrainOpen, setIsGearTrainOpen] = useState<boolean>(false);
  const [isLoadExportOpen, setIsLoadExportOpen] = useState<boolean>(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isLearnModalOpen, setIsLearnModalOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isPenLayersOpen, setIsPenLayersOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tour Integration
  const { startLesson, setActionContext } = useTour();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Register Tour Action Context
  useEffect(() => {
    setActionContext({
      openGears: () => setIsGearTrainOpen(true),
      closeGears: () => setIsGearTrainOpen(false),
      openPenLayers: () => setIsPenLayersOpen(true),
      closePenLayers: () => setIsPenLayersOpen(false),
      openLoad: () => setIsLoadExportOpen(true),
      closeLoad: () => setIsLoadExportOpen(false),
      openPresets: () => setIsPresetModalOpen(true),
      closePresets: () => setIsPresetModalOpen(false),
      resumePlay: () => {
        setIsPlaying(true);
        activeStrokesRef.current.clear();
        virtualAccumulatorRef.current = 0;
      },
      isPaused: () => !isPlaying,
      showToast: msg => showToast(msg),
    });
  }, [isPlaying, showToast, setActionContext]);

  // Saved designs in browser storage
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>(() => {
    try {
      const raw = localStorage.getItem('spirograph_saved_designs');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  // Layers & strokes
  const [hiddenLayerIds, setHiddenLayerIds] = useState<Set<number>>(new Set());
  const strokesListRef = useRef<InkStroke[]>([]);
  const activeStrokesRef = useRef<Map<number, InkStroke>>(new Map());
  const [strokePointCount, setStrokePointCount] = useState<number>(0);
  const [, setStrokesVersion] = useState<number>(0);

  // Next gear ID generator
  const nextGearIdRef = useRef<number>(100);

  // Authoritative simulation state ref (continuous, immune to React rendering latency)
  const simCirclesRef = useRef<GearCircle[]>(initialPreset.circles.map(c => ({ ...c })));
  const virtualAccumulatorRef = useRef<number>(0);

  // Helper to synchronize simCirclesRef whenever user edits gear configuration
  const setCirclesAndSim = useCallback((updater: GearCircle[] | ((prev: GearCircle[]) => GearCircle[])) => {
    setCircles(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      simCirclesRef.current = next.map(c => ({ ...c }));
      virtualAccumulatorRef.current = 0;
      activeStrokesRef.current.clear();
      return next;
    });
  }, []);

  // State refs for simulation animation loop
  const stateRef = useRef({
    isPlaying,
    globalSpeedMult,
    inkWeight,
  });

  useEffect(() => {
    stateRef.current = {
      isPlaying,
      globalSpeedMult,
      inkWeight,
    };
  }, [isPlaying, globalSpeedMult, inkWeight]);

  // Main simulation tick loop running fixed-step virtual simulation
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let lastCountSync = 0;

    const loop = (currentTime: number) => {
      let dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Handle pause or frame rate stutter / tab blur: clamp large gaps to smooth 16ms
      if (dt > 0.35) {
        dt = 0.016;
        virtualAccumulatorRef.current = 0;
      }

      const { isPlaying: playing, globalSpeedMult: speed, inkWeight: weight } = stateRef.current;

      if (playing && dt > 0.0001) {
        const result = runVirtualSimulation(
          simCirclesRef.current,
          activeStrokesRef.current,
          strokesListRef.current,
          dt,
          virtualAccumulatorRef,
          speed,
          weight
        );

        // Update React state for UI gear rods and angle displays
        setCircles(simCirclesRef.current.map(c => ({ ...c })));

        if (result.strokesChanged) {
          setStrokesVersion(v => (v + 1) % 10000);

          if (currentTime - lastCountSync > 250) {
            lastCountSync = currentTime;
            let count = 0;
            for (let i = 0; i < strokesListRef.current.length; i++) {
              count += strokesListRef.current[i].points.length;
            }
            setStrokePointCount(count);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Reset accumulator and active stroke on tab visibility change to prevent jumps
  useEffect(() => {
    const handleVisibilityChange = () => {
      virtualAccumulatorRef.current = 0;
      activeStrokesRef.current.clear();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Pan & Zoom handlers
  const handlePan = useCallback((dx: number, dy: number) => {
    setPanX(px => px + dx);
    setPanY(py => py + dy);
  }, []);

  const handleZoom = useCallback(
    (scaleFactor: number, pivotX: number, pivotY: number, viewWidth: number, viewHeight: number) => {
      setZoom(oldZoom => {
        const newZoom = Math.max(0.02, Math.min(10, oldZoom * scaleFactor));
        if (newZoom === oldZoom) return oldZoom;

        setPanX(oldPanX => {
          const wx = (pivotX - viewWidth / 2 - oldPanX) / oldZoom;
          return pivotX - viewWidth / 2 - wx * newZoom;
        });
        setPanY(oldPanY => {
          const wy = (pivotY - viewHeight / 2 - oldPanY) / oldZoom;
          return pivotY - viewHeight / 2 - wy * newZoom;
        });

        return newZoom;
      });
    },
    []
  );

  // Stepped zoom in and out
  const handleZoomStep = useCallback((factor: number) => {
    setZoom(oldZoom => {
      const newZoom = Math.max(0.02, Math.min(10, oldZoom * factor));
      if (newZoom === oldZoom) return oldZoom;
      const ratio = newZoom / oldZoom;
      setPanX(px => px * ratio);
      setPanY(py => py * ratio);
      return newZoom;
    });
  }, []);

  const zoomIn = useCallback(() => {
    handleZoomStep(1.25);
  }, [handleZoomStep]);

  const zoomOut = useCallback(() => {
    handleZoomStep(1 / 1.25);
  }, [handleZoomStep]);

  // Center camera at origin (0, 0)
  const centerAtOrigin = useCallback(() => {
    setPanX(0);
    setPanY(0);
    showToast('Camera centered at origin');
  }, [showToast]);

  // Keyboard shortcut: Space to toggle play/pause, +/- zoom, 0 to center origin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => {
          activeStrokesRef.current.clear();
          virtualAccumulatorRef.current = 0;
          return !p;
        });
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0' || e.key === 'Home') {
        e.preventDefault();
        centerAtOrigin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, centerAtOrigin]);

  // Play / Pause
  const togglePlay = useCallback(() => {
    setIsPlaying(p => {
      activeStrokesRef.current.clear();
      virtualAccumulatorRef.current = 0;
      return !p;
    });
  }, []);

  const clearDrawing = useCallback(() => {
    strokesListRef.current = [];
    activeStrokesRef.current.clear();
    virtualAccumulatorRef.current = 0;
    setStrokePointCount(0);
    setStrokesVersion(v => v + 1);
  }, []);

  const zeroAngles = useCallback(() => {
    simCirclesRef.current = simCirclesRef.current.map(c => ({ ...c, angle: c.initialAngle }));
    setCircles(simCirclesRef.current.map(c => ({ ...c })));
    activeStrokesRef.current.clear();
    virtualAccumulatorRef.current = 0;
  }, []);

  const handleResetDrawingAndAngles = useCallback(() => {
    zeroAngles();
    clearDrawing();
    showToast('Drawing & angles reset');
  }, [zeroAngles, clearDrawing, showToast]);

  const resetView = useCallback(() => {
    const chain = computeChain(circles);
    const totalReach = chain.reduce((sum, link) => sum + link.radius, 0);
    const idealZoom = totalReach > 0 ? Math.min(2.5, Math.max(0.18, 360 / totalReach)) : 0.28;

    setPanX(0);
    setPanY(0);
    setZoom(idealZoom);
  }, [circles]);

  // Load curated preset
  const loadPreset = useCallback(
    (preset: CuratedPreset) => {
      const clonedCircles = preset.circles.map((c, idx) => ({
        ...c,
        id: idx + 1,
      }));
      nextGearIdRef.current = clonedCircles.length + 10;

      const chain = computeChain(clonedCircles);
      const totalReach = chain.reduce((sum, link) => sum + link.radius, 0);
      const idealZoom = totalReach > 0 ? Math.min(2.5, Math.max(0.18, 360 / totalReach)) : 0.28;

      simCirclesRef.current = clonedCircles.map(c => ({ ...c }));
      virtualAccumulatorRef.current = 0;
      setCircles(clonedCircles);
      setGlobalSpeedMult(preset.speedMult);
      setInkWeight(preset.weight);
      setActivePresetTitle(preset.title);
      setActivePresetId(preset.id);

      setPanX(0);
      setPanY(0);
      setZoom(idealZoom);

      clearDrawing();
      activeStrokesRef.current.clear();
      showToast(`Loaded ${preset.title}`);
    },
    [clearDrawing, showToast]
  );

  // Load saved design from browser storage
  const handleLoadSavedDesign = useCallback(
    (saved: SavedDesign) => {
      const clonedCircles = saved.circles.map((c, idx) => ({
        ...c,
        id: idx + 1,
      }));
      nextGearIdRef.current = clonedCircles.length + 10;

      const chain = computeChain(clonedCircles);
      const totalReach = chain.reduce((sum, link) => sum + link.radius, 0);
      const idealZoom = totalReach > 0 ? Math.min(2.5, Math.max(0.18, 360 / totalReach)) : 0.28;

      simCirclesRef.current = clonedCircles.map(c => ({ ...c }));
      virtualAccumulatorRef.current = 0;
      setCircles(clonedCircles);
      setGlobalSpeedMult(saved.globalSpeedMult);
      setInkWeight(saved.inkWeight);
      setActivePresetTitle(saved.name);
      setActivePresetId(saved.id);

      setPanX(0);
      setPanY(0);
      setZoom(idealZoom);

      clearDrawing();
      activeStrokesRef.current.clear();
      showToast(`Loaded "${saved.name}"`);
    },
    [clearDrawing, showToast]
  );

  // Save current design to browser storage
  const handleSaveCurrentDesign = useCallback(
    (name: string) => {
      const newDesign: SavedDesign = {
        id: `design_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
        createdAt: Date.now(),
        circles: circles.map(c => ({ ...c })),
        globalSpeedMult,
        inkWeight,
      };

      setSavedDesigns(prev => {
        const updated = [newDesign, ...prev];
        try {
          localStorage.setItem('spirograph_saved_designs', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      showToast(`Saved "${name}"`);
    },
    [circles, globalSpeedMult, inkWeight, showToast]
  );

  // Delete saved design from browser storage
  const handleDeleteSavedDesign = useCallback((id: string) => {
    setSavedDesigns(prev => {
      const updated = prev.filter(d => d.id !== id);
      try {
        localStorage.setItem('spirograph_saved_designs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Saved design deleted');
  }, [showToast]);

  // Load setup from code (paste or custom code)
  const handleLoadCode = useCallback(
    (codeText: string) => {
      const parsed = parseSetupCode(codeText);
      const chain = computeChain(parsed.circles);
      const totalReach = chain.reduce((sum, link) => sum + link.radius, 0);
      const idealZoom = totalReach > 0 ? Math.min(2.5, Math.max(0.18, 360 / totalReach)) : 0.28;

      simCirclesRef.current = parsed.circles.map(c => ({ ...c }));
      virtualAccumulatorRef.current = 0;
      setCircles(parsed.circles);
      setGlobalSpeedMult(parsed.speedMult);
      setInkWeight(parsed.weight);
      setActivePresetTitle('Custom Setup');
      setActivePresetId('custom');

      setPanX(0);
      setPanY(0);
      setZoom(idealZoom);

      clearDrawing();
      activeStrokesRef.current.clear();
      showToast('Loaded setup into canvas');
    },
    [clearDrawing, showToast]
  );

  // Gear modifications
  const addGear = useCallback(() => {
    setCirclesAndSim(prev => {
      if (prev.length === 0) return prev;
      // Turns the previous last circle back into a bolt
      const updated = prev.map((c, i) => (i === prev.length - 1 ? { ...c, isPen: false } : c));

      const newId = ++nextGearIdRef.current;
      const newColor = InkPalette[updated.length % InkPalette.length];

      // Appends a new circle in PREVIOUS mode with radius multiplier 1 and speed multiplier 1, makes that new circle the pen
      const newCircle: GearCircle = {
        id: newId,
        mode: 'PREVIOUS',
        radius: 1,
        radiusGlobal: 1,
        radiusEngineMult: 1,
        radiusPrevMult: 1,
        radiusBase: 1,
        speedDeg: 1,
        speedGlobal: 1,
        speedEngineMult: 1,
        speedPrevMult: 1,
        speedBase: 1,
        angle: -90,
        initialAngle: -90,
        isPen: true,
        color: newColor,
      };

      updated.push(newCircle);
      return updated;
    });
  }, [setCirclesAndSim]);

  const layerGear = useCallback(() => {
    setCirclesAndSim(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updated = [...prev];

      const newId = ++nextGearIdRef.current;
      const newColor = InkPalette[updated.length % InkPalette.length];

      // Appends a new circle that copies the last circle's mode and that circle's current radius and speed values, with the next palette color, and makes the new circle the pen
      const newCircle: GearCircle = {
        id: newId,
        mode: last.mode,
        radius: last.radius,
        radiusGlobal: last.radiusGlobal,
        radiusEngineMult: last.radiusEngineMult,
        radiusPrevMult: last.radiusPrevMult,
        radiusBase: last.radiusBase,
        speedDeg: last.speedDeg,
        speedGlobal: last.speedGlobal,
        speedEngineMult: last.speedEngineMult,
        speedPrevMult: last.speedPrevMult,
        speedBase: last.speedBase,
        angle: -90,
        initialAngle: -90,
        isPen: true,
        color: newColor,
      };

      updated.push(newCircle);
      return updated;
    });
  }, [setCirclesAndSim]);

  const removeGear = useCallback(
    (circleId: number) => {
      setCirclesAndSim(prev => {
        if (prev.length <= 1) return prev;
        return prev.filter(c => c.id !== circleId);
      });
      strokesListRef.current = strokesListRef.current.filter(s => s.id !== circleId);
      activeStrokesRef.current.delete(circleId);
      setStrokePointCount(strokesListRef.current.reduce((sum, s) => sum + s.points.length, 0));
      setStrokesVersion(v => v + 1);
    },
    [setCirclesAndSim]
  );

  const updateGear = useCallback((updated: GearCircle) => {
    setCirclesAndSim(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    // Live update existing strokes for this gear circle to the new color
    strokesListRef.current.forEach(stroke => {
      if (stroke.id === updated.id) {
        stroke.color = updated.color;
      }
    });
    setStrokesVersion(v => v + 1);
  }, [setCirclesAndSim]);

  // Pen Layers actions
  const handleToggleLayer = useCallback((circleId: number) => {
    setHiddenLayerIds(prev => {
      const next = new Set(prev);
      if (next.has(circleId)) {
        next.delete(circleId);
      } else {
        next.add(circleId);
      }
      return next;
    });
  }, []);

  const handleShowAllLayers = useCallback(() => {
    setHiddenLayerIds(new Set());
  }, []);

  const handleHideAllLayers = useCallback(() => {
    const allPenIds = circles.filter(c => c.isPen).map(c => c.id);
    setHiddenLayerIds(new Set(allPenIds));
  }, [circles]);

  const handleAddPenToGear = useCallback((circleId: number) => {
    setCirclesAndSim(prev =>
      prev.map(c => {
        if (c.id === circleId) {
          return { ...c, isPen: true };
        }
        return c;
      })
    );
    setHiddenLayerIds(prev => {
      const next = new Set(prev);
      next.delete(circleId);
      return next;
    });
    showToast(`Turned Gear #${circles.findIndex(c => c.id === circleId) + 1} into a Pen`);
  }, [circles, setCirclesAndSim, showToast]);

  const handleClearGearInk = useCallback((circleId: number) => {
    strokesListRef.current = strokesListRef.current.filter(s => s.id !== circleId);
    activeStrokesRef.current.delete(circleId);
    let count = 0;
    for (let i = 0; i < strokesListRef.current.length; i++) {
      count += strokesListRef.current[i].points.length;
    }
    setStrokePointCount(count);
    setStrokesVersion(v => v + 1);
    showToast(`Cleared ink for Gear #${circles.findIndex(c => c.id === circleId) + 1}`);
  }, [circles, showToast]);

  // Snapshot PNG export
  const exportPng = useCallback(() => {
    const exportWidth = 2400;
    const exportHeight = 2400;
    const offscreen = document.createElement('canvas');
    offscreen.width = exportWidth;
    offscreen.height = exportHeight;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = CanvasBg;
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    ctx.save();
    ctx.translate(exportWidth / 2, exportHeight / 2);

    for (const stroke of strokesListRef.current) {
      if (hiddenLayerIds.has(stroke.id)) continue;
      if (stroke.points.length < 2) continue;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(1, stroke.weight * 1.5);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (!stroke.chunks && !stroke.activePath) {
        ensureStrokeChunks(stroke);
      }

      if (stroke.chunks && stroke.chunks.length > 0) {
        for (let c = 0; c < stroke.chunks.length; c++) {
          ctx.stroke(stroke.chunks[c].path);
        }
      }

      if (stroke.activePath) {
        ctx.stroke(stroke.activePath);
      } else {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
    }

    ctx.restore();

    const url = offscreen.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `spirograph_${activePresetTitle.toLowerCase().replace(/\s+/g, '_')}.png`;
    a.click();
    showToast('Snapshot saved');
  }, [hiddenLayerIds, activePresetTitle, showToast]);

  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#0A0D10] text-[#E7E3DA] select-none font-['Plus_Jakarta_Sans']">
      {/* Full-Screen Canvas filling browser window */}
      <div className="w-full h-full absolute inset-0 z-0" data-tour="canvas">
        <SpirographCanvas
          circles={circles}
          strokes={strokesListRef.current}
          showGuides={showGuides}
          showPoints={showPoints}
          panX={panX}
          panY={panY}
          zoom={zoom}
          hiddenLayerIds={hiddenLayerIds}
          onPan={handlePan}
          onZoom={handleZoom}
          onResetView={resetView}
        />
      </div>

      {/* Top Left Title and LEARN Pill */}
      <div className="absolute top-6 left-6 z-20 flex flex-col items-start gap-2 pointer-events-none">
        <div className="leading-tight">
          <div className="text-base sm:text-lg font-extrabold tracking-wider text-white">
            SPIROGRAPH
          </div>
          <div className="text-base sm:text-lg font-extrabold tracking-wider text-[#C9A26A]">
            STUDIO
          </div>
        </div>

        {/* LEARN pill button */}
        <button
          onClick={() => setIsLearnModalOpen(true)}
          data-tour="learn-btn"
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#C9A26A]/60 bg-[#12161B]/80 text-[#C9A26A] text-xs font-bold tracking-wider hover:bg-[#C9A26A]/15 active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>LEARN</span>
        </button>
      </div>

      {/* Top Right Controls Container */}
      <div className="absolute top-6 right-6 z-20 flex items-start gap-2.5 sm:gap-3">
        {/* Camera Navigation Dock: Crosshairs (Center Origin), Zoom In (+), Zoom Out (-) */}
        <div
          data-tour="camera-dock"
          className="flex flex-col items-center bg-[#12161B]/95 backdrop-blur-md border border-[#1F262E] rounded-2xl p-1 shadow-2xl gap-1"
        >
          <button
            onClick={centerAtOrigin}
            data-tour="crosshair-btn"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
              Math.abs(panX) < 1 && Math.abs(panY) < 1
                ? 'bg-[#C9A26A]/20 text-[#C9A26A] border border-[#C9A26A]/40 shadow-inner'
                : 'hover:bg-[#1C222A] text-[#8B95A1] hover:text-[#C9A26A]'
            }`}
            title="Center camera at origin (0, 0)"
            aria-label="Center camera at origin"
          >
            <Crosshair className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="w-5 h-px bg-[#1F262E]" />

          <button
            onClick={zoomIn}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl hover:bg-[#1C222A] text-[#8B95A1] hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title={`Zoom in (+) [${Math.round(zoom * 100)}%]`}
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={zoomOut}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl hover:bg-[#1C222A] text-[#8B95A1] hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title={`Zoom out (-) [${Math.round(zoom * 100)}%]`}
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Top Right Cluster of Round Buttons (2x2 grid) */}
        <div className="grid grid-cols-2 gap-3 items-center">
          {/* Row 1, Col 1: Layers Icon Button (Opens PEN LAYERS Panel) */}
          <button
            onClick={() => setIsPenLayersOpen(prev => !prev)}
            data-tour="pen-layers-btn"
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer ${
              isPenLayersOpen
                ? 'bg-[#C9A26A] text-[#0A0D10] border-[#C9A26A] shadow-[#C9A26A]/20'
                : 'bg-[#12161B]/90 border-[#1F262E] text-[#8B95A1] hover:text-[#C9A26A]'
            }`}
            title="Pen Layers"
          >
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Row 1, Col 2: Image Snapshot Button */}
          <button
            onClick={exportPng}
            data-tour="snapshot-btn"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#12161B]/90 border border-[#1F262E] text-[#5FD3C4] hover:brightness-110 flex items-center justify-center transition-colors shadow-lg active:scale-95 cursor-pointer"
            title="Save Image Snapshot"
          >
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Row 2, Col 1: Larger Brass Pause / Play Button */}
          <button
            onClick={togglePlay}
            data-tour="play-pause-btn"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#C9A26A] text-[#0A0D10] flex items-center justify-center shadow-xl hover:bg-[#d6b27d] active:scale-95 transition-all cursor-pointer font-bold"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Row 2, Col 2: Bookmark Button (Opens Save Dialog) */}
          <button
            onClick={() => setIsSaveModalOpen(true)}
            data-tour="bookmark-btn"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#12161B]/90 border border-[#1F262E] text-[#C9A26A] hover:brightness-110 flex items-center justify-center transition-colors shadow-lg active:scale-95 cursor-pointer"
            title="Bookmark / Save Design"
          >
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Floating Status Toast */}
      {toastMessage && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 bg-[#161C22]/95 border border-[#C9A26A]/40 text-[#E7E3DA] text-xs font-semibold px-4 py-2 rounded-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {toastMessage}
        </div>
      )}

      {/* Bottom Bar: Three buttons labeled GEARS with count badge, LOAD, and SETTINGS */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4 flex items-center gap-3">
        {/* GEARS Button with Count Badge */}
        <button
          onClick={() => setIsGearTrainOpen(true)}
          data-tour="gears-btn"
          className="flex-1 py-3 px-3 rounded-2xl border border-[#1F262E] bg-[#12161B]/95 backdrop-blur-md hover:bg-[#161C22] hover:border-[#323D4A] active:scale-[0.98] text-xs font-bold text-[#E7E3DA] flex items-center justify-center gap-2 tracking-wider transition-all shadow-xl cursor-pointer"
        >
          <span>GEARS</span>
          <span className="w-5 h-5 rounded-full bg-[#C9A26A]/20 border border-[#C9A26A]/40 text-[#C9A26A] text-[10px] font-bold flex items-center justify-center tabular-nums">
            {circles.length}
          </span>
        </button>

        {/* LOAD Button (Opens LOAD & EXPORT Sheet) */}
        <button
          onClick={() => setIsLoadExportOpen(true)}
          data-tour="load-btn"
          className="flex-1 py-3 px-3 rounded-2xl border border-[#1F262E] bg-[#12161B]/95 backdrop-blur-md hover:bg-[#161C22] hover:border-[#323D4A] active:scale-[0.98] text-xs font-bold text-[#E7E3DA] flex items-center justify-center tracking-wider transition-all shadow-xl cursor-pointer"
        >
          LOAD
        </button>

        {/* SETTINGS Button */}
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          data-tour="settings-btn"
          className="flex-1 py-3 px-3 rounded-2xl border border-[#1F262E] bg-[#12161B]/95 backdrop-blur-md hover:bg-[#161C22] hover:border-[#323D4A] active:scale-[0.98] text-xs font-bold text-[#E7E3DA] flex items-center justify-center tracking-wider transition-all shadow-xl cursor-pointer"
        >
          SETTINGS
        </button>
      </div>

      {/* LOAD & EXPORT Sheet */}
      <LoadExportModal
        isOpen={isLoadExportOpen}
        circles={circles}
        globalSpeedMult={globalSpeedMult}
        inkWeight={inkWeight}
        onClose={() => setIsLoadExportOpen(false)}
        onOpenPresets={() => setIsPresetModalOpen(true)}
        onLoadCode={handleLoadCode}
      />

      {/* Preset Library Dialog (Gallery with Presets & Saved Designs containers) */}
      <PresetSelectorModal
        isOpen={isPresetModalOpen}
        activePresetId={activePresetId}
        savedDesigns={savedDesigns}
        onSelectPreset={loadPreset}
        onSelectSavedDesign={handleLoadSavedDesign}
        onDeleteSavedDesign={handleDeleteSavedDesign}
        onClose={() => setIsPresetModalOpen(false)}
      />

      {/* Small Save Design Dialog */}
      <SaveDesignModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveCurrentDesign}
      />

      {/* Learn Information Modal */}
      <LearnModal
        isOpen={isLearnModalOpen}
        onClose={() => setIsLearnModalOpen(false)}
        onStartLesson={startLesson}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        globalSpeedMult={globalSpeedMult}
        inkWeight={inkWeight}
        showGuides={showGuides}
        showPoints={showPoints}
        strokePointCount={strokePointCount}
        onClose={() => setIsSettingsModalOpen(false)}
        onSetGlobalSpeed={speed => setGlobalSpeedMult(Math.max(1.0, Math.min(100.0, speed)))}
        onSetInkWeight={weight => setInkWeight(Math.max(0.01, Math.min(50.0, weight)))}
        onToggleGuides={() => setShowGuides(g => !g)}
        onTogglePoints={() => setShowPoints(p => !p)}
        onClearDrawing={clearDrawing}
        onZeroAngles={zeroAngles}
      />

      {/* Gear Train Sheet */}
      <GearChainEditor
        isOpen={isGearTrainOpen}
        circles={circles}
        onClose={() => setIsGearTrainOpen(false)}
        onUpdateGear={updateGear}
        onAddGear={addGear}
        onLayerGear={layerGear}
        onRemoveGear={removeGear}
        onResetDrawing={handleResetDrawingAndAngles}
      />

      {/* Floating PEN LAYERS Panel */}
      <PenLayersModal
        isOpen={isPenLayersOpen}
        circles={circles}
        hiddenLayerIds={hiddenLayerIds}
        onClose={() => setIsPenLayersOpen(false)}
        onToggleLayer={handleToggleLayer}
        onShowAll={handleShowAllLayers}
        onHideAll={handleHideAllLayers}
        onAddPen={handleAddPenToGear}
        onClearGearInk={handleClearGearInk}
      />

      {/* First-Run Quick Spin Tour Overlay */}
      <TourOverlay />
    </div>
  );
}

export default function App() {
  return (
    <TourProvider>
      <AppContent />
    </TourProvider>
  );
}
