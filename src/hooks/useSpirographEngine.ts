import { useCallback, useEffect, useRef, useState } from 'react';
import { INK_PALETTE, toHexString } from '../constants/palette';
import {
  ActiveSheet,
  CompassInkUiState,
  CuratedPreset,
  ExportFormat,
  GearCircle,
  GearMode,
  InkStroke,
  SavedPreset,
} from '../types/spirograph';
import {
  computeChain,
  createGearCircle,
  exportEquation,
  exportFlatArray,
  exportLabeled,
  parseSetupCode,
} from '../utils/gearMath';
import {
  clearWorkspaceStrokesStorage,
  loadSavedPresets,
  loadWorkspaceFromStorage,
  savePresetsList,
  saveWorkspaceToStorage,
} from '../utils/storage';

const DEFAULT_CIRCLES: GearCircle[] = [
  createGearCircle({
    id: 1,
    radius: 20,
    radiusGlobal: 20,
    speedDeg: 50,
    angle: -90,
    initialAngle: -90,
    isPen: false,
    color: INK_PALETTE[0],
  }),
  createGearCircle({
    id: 2,
    mode: GearMode.PREVIOUS,
    radiusPrevMult: 4.9,
    speedPrevMult: -0.2,
    angle: -90,
    initialAngle: -90,
    isPen: false,
    color: INK_PALETTE[0],
  }),
  createGearCircle({
    id: 3,
    mode: GearMode.PREVIOUS,
    radiusPrevMult: 0.7,
    speedPrevMult: -1.5,
    angle: -90,
    initialAngle: -90,
    isPen: false,
    color: INK_PALETTE[0],
  }),
  createGearCircle({
    id: 4,
    mode: GearMode.PREVIOUS,
    radiusPrevMult: 0.3,
    speedPrevMult: 7.0,
    angle: -90,
    initialAngle: -90,
    isPen: true,
    color: INK_PALETTE[0],
  }),
];

function computeExportedCode(
  format: ExportFormat,
  circles: GearCircle[],
  globalSpeedMult: number,
  inkWeight: number
): string {
  switch (format) {
    case ExportFormat.LABELED:
      return exportLabeled(circles, globalSpeedMult, inkWeight);
    case ExportFormat.ARRAY:
      return exportFlatArray(circles, globalSpeedMult, inkWeight);
    case ExportFormat.EQUATION:
      return exportEquation(circles, globalSpeedMult);
  }
}

export function useSpirographEngine() {
  const initialLoad = useRef<{
    state: CompassInkUiState;
    strokes: InkStroke[];
    nextId: number;
  } | null>(null);

  if (initialLoad.current === null) {
    const savedPresets = loadSavedPresets();
    const { state: storedState, strokes: storedStrokes } = loadWorkspaceFromStorage();
    const circles = storedState?.circles ?? DEFAULT_CIRCLES;
    const globalSpeedMult = storedState?.globalSpeedMult ?? 1.0;
    const inkWeight = storedState?.inkWeight ?? 2.0;
    const maxId = circles.reduce((m, c) => Math.max(m, c.id), 0);

    initialLoad.current = {
      strokes: storedStrokes,
      nextId: Math.max(100, maxId + 1),
      state: {
        circles,
        isPlaying: storedState?.isPlaying ?? true,
        globalSpeedMult,
        inkWeight,
        showGuides: storedState?.showGuides ?? true,
        showPoints: storedState?.showPoints ?? true,
        panX: storedState?.panX ?? 0,
        panY: storedState?.panY ?? 0,
        zoom: storedState?.zoom ?? 1.6,
        activeSheet: ActiveSheet.NONE,
        exportFormat: ExportFormat.LABELED,
        exportedCode: computeExportedCode(ExportFormat.LABELED, circles, globalSpeedMult, inkWeight),
        codeMessage: null,
        isSuccessMessage: true,
        savedPresets,
        currentPresetName:
          storedState !== null ? storedState.currentPresetName : 'Character Silhouette',
        showSaveDialog: false,
        showExportDialog: false,
        strokePointCount: storedStrokes.reduce((sum, s) => sum + s.points.length, 0),
        hiddenLayerIds: storedState?.hiddenLayerIds ?? [],
        showLayersDashboard: false,
      },
    };
  }

  const [uiState, setUiState] = useState<CompassInkUiState>(initialLoad.current.state);

  // Mutable high-frequency refs for 60fps Canvas rendering without React re-render per frame
  const uiStateRef = useRef<CompassInkUiState>(uiState);
  uiStateRef.current = uiState;

  const liveCirclesRef = useRef<GearCircle[]>(initialLoad.current.state.circles.map((c) => ({ ...c })));
  const strokesRef = useRef<InkStroke[]>(initialLoad.current.strokes);
  const activeStrokesRef = useRef<Map<number, InkStroke>>(new Map());
  const nextGearIdRef = useRef<number>(initialLoad.current.nextId);
  const saveTimerRef = useRef<number | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  const persistWorkspaceNow = useCallback(() => {
    const current = uiStateRef.current;
    saveWorkspaceToStorage(
      {
        circles: liveCirclesRef.current,
        isPlaying: current.isPlaying,
        globalSpeedMult: current.globalSpeedMult,
        inkWeight: current.inkWeight,
        showGuides: current.showGuides,
        showPoints: current.showPoints,
        panX: current.panX,
        panY: current.panY,
        zoom: current.zoom,
        currentPresetName: current.currentPresetName,
        hiddenLayerIds: current.hiddenLayerIds,
      },
      strokesRef.current
    );
    lastSaveTimeRef.current = Date.now();
  }, []);

  const scheduleWorkspaceSave = useCallback(
    (immediate: boolean = false) => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (immediate) {
        persistWorkspaceNow();
      } else {
        saveTimerRef.current = window.setTimeout(() => {
          saveTimerRef.current = null;
          persistWorkspaceNow();
        }, 800);
      }
    },
    [persistWorkspaceNow]
  );

  // Save workspace on tab hide / page unload
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        persistWorkspaceNow();
      }
    };
    const handleBeforeUnload = () => {
      persistWorkspaceNow();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [persistWorkspaceNow]);

  const resetStrokeContinuity = useCallback(() => {
    activeStrokesRef.current.clear();
  }, []);

  const generateUniqueGearId = useCallback((existing: GearCircle[]) => {
    const maxExisting = existing.reduce((m, c) => Math.max(m, c.id), 0);
    nextGearIdRef.current = Math.max(nextGearIdRef.current, maxExisting + 1);
    return nextGearIdRef.current++;
  }, []);

  // Helper that merges live angles from liveCirclesRef before updating structural circle properties
  const updateCirclesWithLiveAngles = useCallback(
    (
      updater: (
        prevCircles: GearCircle[],
        prevState: CompassInkUiState
      ) => { circles: GearCircle[]; resetContinuity?: boolean; extra?: Partial<CompassInkUiState> }
    ) => {
      setUiState((prev) => {
        const liveById = new Map(liveCirclesRef.current.map((c) => [c.id, c.angle]));
        const merged = prev.circles.map((c) => ({
          ...c,
          angle: liveById.get(c.id) ?? c.angle,
        }));

        const result = updater(merged, prev);
        liveCirclesRef.current = result.circles.map((c) => ({ ...c }));
        if (result.resetContinuity) {
          activeStrokesRef.current.clear();
        }
        const nextSpeed = result.extra?.globalSpeedMult ?? prev.globalSpeedMult;
        const nextWeight = result.extra?.inkWeight ?? prev.inkWeight;
        const nextFormat = result.extra?.exportFormat ?? prev.exportFormat;

        return {
          ...prev,
          ...result.extra,
          circles: result.circles,
          exportedCode: computeExportedCode(nextFormat, result.circles, nextSpeed, nextWeight),
        };
      });
      scheduleWorkspaceSave();
    },
    [scheduleWorkspaceSave]
  );

  // Simulation frame tick (called directly inside requestAnimationFrame)
  const onSimulationTick = useCallback(
    (dt: number) => {
      const state = uiStateRef.current;
      if (!state.isPlaying || dt <= 0) return;

      const currentCircles = liveCirclesRef.current;
      if (currentCircles.length === 0) return;

      const speedMult = state.globalSpeedMult;
      const weight = state.inkWeight;

      const initialChain = computeChain(currentCircles);
      const maxSpeed = initialChain.reduce((m, l) => Math.max(m, Math.abs(l.speedDeg)), 20);
      const maxEffectiveSpeed = Math.max(maxSpeed * speedMult, 10);

      const targetStepAngle = 0.35;
      const calculatedSteps = Math.floor((maxEffectiveSpeed * dt) / targetStepAngle);
      const subSteps = Math.min(Math.max(calculatedSteps, 2), 24);
      const subDt = dt / subSteps;

      for (let step = 0; step < subSteps; step++) {
        const chain = computeChain(currentCircles);
        for (let i = 0; i < currentCircles.length; i++) {
          currentCircles[i].angle =
            (currentCircles[i].angle + chain[i].speedDeg * speedMult * subDt) % 360;
        }

        const newChain = computeChain(currentCircles);
        for (const link of newChain) {
          if (!link.isPen) continue;

          const existingStroke = activeStrokesRef.current.get(link.id);
          if (
            !existingStroke ||
            existingStroke.color !== link.color ||
            existingStroke.weight !== weight ||
            existingStroke.points.length >= 25000
          ) {
            const path2d = new Path2D();
            path2d.moveTo(link.px, link.py);
            const newStroke: InkStroke = {
              id: link.id,
              color: link.color,
              weight,
              points: [{ x: link.px, y: link.py }],
              path2d,
            };
            activeStrokesRef.current.set(link.id, newStroke);
            strokesRef.current.push(newStroke);
          } else {
            const last = existingStroke.points[existingStroke.points.length - 1];
            const dx = link.px - last.x;
            const dy = link.py - last.y;
            const distSq = dx * dx + dy * dy;
            if (distSq >= 2.25) {
              existingStroke.points.push({ x: link.px, y: link.py });
              if (existingStroke.path2d) {
                existingStroke.path2d.lineTo(link.px, link.py);
              }
            }
          }
        }
      }

      if (Date.now() - lastSaveTimeRef.current > 4000) {
        scheduleWorkspaceSave();
      }
    },
    [scheduleWorkspaceSave]
  );

  const togglePlayPause = useCallback(() => {
    setUiState((prev) => {
      const playing = !prev.isPlaying;
      if (playing) {
        activeStrokesRef.current.clear();
      }
      // Sync live angles into state when pausing/playing
      const liveById = new Map(liveCirclesRef.current.map((c) => [c.id, c.angle]));
      const synced = prev.circles.map((c) => ({ ...c, angle: liveById.get(c.id) ?? c.angle }));
      return { ...prev, isPlaying: playing, circles: synced };
    });
    scheduleWorkspaceSave();
  }, [scheduleWorkspaceSave]);

  const clearDrawing = useCallback(() => {
    strokesRef.current = [];
    activeStrokesRef.current.clear();
    clearWorkspaceStrokesStorage();
    setUiState((prev) => ({ ...prev, strokePointCount: 0 }));
    scheduleWorkspaceSave();
  }, [scheduleWorkspaceSave]);

  const zeroAngles = useCallback(() => {
    activeStrokesRef.current.clear();
    setUiState((prev) => {
      const zeroed = prev.circles.map((c) => ({ ...c, angle: c.initialAngle }));
      liveCirclesRef.current = zeroed.map((c) => ({ ...c }));
      return { ...prev, circles: zeroed };
    });
    scheduleWorkspaceSave();
  }, [scheduleWorkspaceSave]);

  const resetDrawing = useCallback(() => {
    strokesRef.current = [];
    activeStrokesRef.current.clear();
    clearWorkspaceStrokesStorage();
    setUiState((prev) => {
      const zeroed = prev.circles.map((c) => ({ ...c, angle: c.initialAngle }));
      liveCirclesRef.current = zeroed.map((c) => ({ ...c }));
      return { ...prev, circles: zeroed, strokePointCount: 0 };
    });
    scheduleWorkspaceSave();
  }, [scheduleWorkspaceSave]);

  const setGlobalSpeed = useCallback(
    (speed: number) => {
      const clamped = Math.min(Math.max(speed, 0.01), 100);
      setUiState((prev) => ({
        ...prev,
        globalSpeedMult: clamped,
        exportedCode: computeExportedCode(
          prev.exportFormat,
          liveCirclesRef.current,
          clamped,
          prev.inkWeight
        ),
      }));
      scheduleWorkspaceSave();
    },
    [scheduleWorkspaceSave]
  );

  const setInkWeight = useCallback(
    (weight: number) => {
      const clamped = Math.min(Math.max(weight, 0.01), 200);
      activeStrokesRef.current.clear();
      setUiState((prev) => ({
        ...prev,
        inkWeight: clamped,
        exportedCode: computeExportedCode(
          prev.exportFormat,
          liveCirclesRef.current,
          prev.globalSpeedMult,
          clamped
        ),
      }));
      scheduleWorkspaceSave();
    },
    [scheduleWorkspaceSave]
  );

  const toggleGuides = useCallback(() => {
    setUiState((prev) => ({ ...prev, showGuides: !prev.showGuides }));
    scheduleWorkspaceSave();
  }, [scheduleWorkspaceSave]);

  const togglePoints = useCallback(() => {
    setUiState((prev) => ({ ...prev, showPoints: !prev.showPoints }));
    scheduleWorkspaceSave();
  }, [scheduleWorkspaceSave]);

  const toggleLayersDashboard = useCallback(() => {
    setUiState((prev) => ({ ...prev, showLayersDashboard: !prev.showLayersDashboard }));
  }, []);

  const setShowLayersDashboard = useCallback((show: boolean) => {
    setUiState((prev) => ({ ...prev, showLayersDashboard: show }));
  }, []);

  const toggleLayerVisibility = useCallback(
    (gearId: number) => {
      setUiState((prev) => {
        const exists = prev.hiddenLayerIds.includes(gearId);
        const hiddenLayerIds = exists
          ? prev.hiddenLayerIds.filter((id) => id !== gearId)
          : [...prev.hiddenLayerIds, gearId];
        return { ...prev, hiddenLayerIds };
      });
      scheduleWorkspaceSave();
    },
    [scheduleWorkspaceSave]
  );

  const setLayerVisibility = useCallback(
    (gearId: number, isVisible: boolean) => {
      setUiState((prev) => {
        const hiddenLayerIds = isVisible
          ? prev.hiddenLayerIds.filter((id) => id !== gearId)
          : prev.hiddenLayerIds.includes(gearId)
            ? prev.hiddenLayerIds
            : [...prev.hiddenLayerIds, gearId];
        return { ...prev, hiddenLayerIds };
      });
      scheduleWorkspaceSave();
    },
    [scheduleWorkspaceSave]
  );

  const showAllLayers = useCallback(() => {
    setUiState((prev) => ({ ...prev, hiddenLayerIds: [] }));
    scheduleWorkspaceSave();
  }, [scheduleWorkspaceSave]);

  const hideAllLayers = useCallback(() => {
    setUiState((prev) => ({
      ...prev,
      hiddenLayerIds: prev.circles.map((c) => c.id),
    }));
    scheduleWorkspaceSave();
  }, [scheduleWorkspaceSave]);

  const clearLayerStrokes = useCallback(
    (gearId: number) => {
      strokesRef.current = strokesRef.current.filter((s) => s.id !== gearId);
      activeStrokesRef.current.delete(gearId);
      setUiState((prev) => ({
        ...prev,
        strokePointCount: strokesRef.current.reduce((sum, s) => sum + s.points.length, 0),
      }));
      scheduleWorkspaceSave();
    },
    [scheduleWorkspaceSave]
  );

  const setActiveSheet = useCallback((sheet: ActiveSheet) => {
    setUiState((prev) => {
      const target = prev.activeSheet === sheet ? ActiveSheet.NONE : sheet;
      const exportedCode =
        target === ActiveSheet.LOAD || target === ActiveSheet.SETTINGS
          ? computeExportedCode(
              prev.exportFormat,
              liveCirclesRef.current,
              prev.globalSpeedMult,
              prev.inkWeight
            )
          : prev.exportedCode;
      return { ...prev, activeSheet: target, exportedCode };
    });
  }, []);

  const setExportFormat = useCallback((format: ExportFormat) => {
    setUiState((prev) => ({
      ...prev,
      exportFormat: format,
      exportedCode: computeExportedCode(
        format,
        liveCirclesRef.current,
        prev.globalSpeedMult,
        prev.inkWeight
      ),
    }));
  }, []);

  const addCircle = useCallback(() => {
    updateCirclesWithLiveAngles((circles) => {
      if (circles.length === 0) {
        const defaultCircle = createGearCircle({
          id: 1,
          mode: GearMode.GLOBAL,
          radius: 140,
          radiusGlobal: 140,
          speedDeg: 50,
          speedGlobal: 50,
          angle: -90,
          initialAngle: -90,
          isPen: true,
          color: INK_PALETTE[0],
        });
        return { circles: [defaultCircle], resetContinuity: true };
      }

      const chain = computeChain(circles);
      const parent = chain[chain.length - 1];
      if (!parent) return { circles };

      const updated = circles.map((c, idx) =>
        idx === circles.length - 1 ? { ...c, isPen: false } : c
      );

      const newRadius = Math.min(Math.max(parent.radius * 0.5, 8), 500);
      const newSpeed =
        (parent.speedDeg >= 0 ? -1 : 1) *
        Math.min(Math.max(Math.abs(parent.speedDeg) * 1.5, 15), 360);
      const newColor = INK_PALETTE[updated.length % INK_PALETTE.length];
      const newCircleId = generateUniqueGearId(updated);

      const newCircle = createGearCircle({
        id: newCircleId,
        mode: GearMode.PREVIOUS,
        radiusGlobal: Math.round(newRadius),
        radiusEngineMult: 1,
        radiusPrevMult: 1,
        radiusBase: 1,
        radiusStepIndex: 11,
        speedGlobal: Math.round(newSpeed),
        speedEngineMult: 1,
        speedPrevMult: 1,
        speedBase: 1,
        speedStepIndex: 11,
        angle: -90,
        initialAngle: -90,
        isPen: true,
        color: newColor,
      });

      return { circles: [...updated, newCircle], resetContinuity: true };
    });
  }, [generateUniqueGearId, updateCirclesWithLiveAngles]);

  const layerCircle = useCallback(() => {
    updateCirclesWithLiveAngles((circles) => {
      if (circles.length === 0) {
        const defaultCircle = createGearCircle({
          id: 1,
          mode: GearMode.GLOBAL,
          radius: 140,
          radiusGlobal: 140,
          speedDeg: 50,
          speedGlobal: 50,
          angle: -90,
          initialAngle: -90,
          isPen: true,
          color: INK_PALETTE[0],
        });
        return { circles: [defaultCircle], resetContinuity: true };
      }

      const lastIndex = circles.length - 1;
      const lastCircle = circles[lastIndex];
      const updated = circles.map((c, idx) => (idx === lastIndex ? { ...c, isPen: false } : c));

      const lastRadius =
        lastIndex === 0
          ? 1
          : lastCircle.mode === GearMode.GLOBAL
            ? lastCircle.radiusGlobal
            : lastCircle.mode === GearMode.ENGINE
              ? lastCircle.radiusEngineMult
              : lastCircle.radiusPrevMult;

      const lastSpeed =
        lastIndex === 0
          ? 1
          : lastCircle.mode === GearMode.GLOBAL
            ? lastCircle.speedGlobal
            : lastCircle.mode === GearMode.ENGINE
              ? lastCircle.speedEngineMult
              : lastCircle.speedPrevMult;

      const newColor = INK_PALETTE[updated.length % INK_PALETTE.length];
      const newCircleId = generateUniqueGearId(updated);
      const targetMode = lastIndex === 0 ? GearMode.PREVIOUS : lastCircle.mode;

      const newCircle = createGearCircle({
        id: newCircleId,
        mode: targetMode,
        radiusGlobal: lastIndex === 0 ? lastCircle.radius : lastCircle.radiusGlobal,
        radiusEngineMult: lastRadius,
        radiusPrevMult: lastRadius,
        radiusBase: lastCircle.radiusBase ?? lastRadius,
        radiusStepIndex: lastCircle.radiusStepIndex,
        speedGlobal: lastIndex === 0 ? lastCircle.speedDeg : lastCircle.speedGlobal,
        speedEngineMult: lastSpeed,
        speedPrevMult: lastSpeed,
        speedBase: lastCircle.speedBase ?? lastSpeed,
        speedStepIndex: lastCircle.speedStepIndex,
        angle: -90,
        initialAngle: -90,
        isPen: true,
        color: newColor,
      });

      return { circles: [...updated, newCircle], resetContinuity: true };
    });
  }, [generateUniqueGearId, updateCirclesWithLiveAngles]);

  const removeCircle = useCallback(
    (circleId: number) => {
      updateCirclesWithLiveAngles((circles) => {
        if (circles.length <= 1) return { circles };
        const updated = circles.filter((c) => c.id !== circleId);
        strokesRef.current = strokesRef.current.filter((s) => s.id !== circleId);
        activeStrokesRef.current.delete(circleId);
        return {
          circles: updated,
          resetContinuity: true,
          extra: {
            strokePointCount: strokesRef.current.reduce((sum, s) => sum + s.points.length, 0),
          },
        };
      });
    },
    [updateCirclesWithLiveAngles]
  );

  const setCircleMode = useCallback(
    (index: number, mode: GearMode) => {
      updateCirclesWithLiveAngles((circles) => {
        if (index < 0 || index >= circles.length) return { circles };
        const c = circles[index];
        if (c.mode === mode) return { circles };

        const activeRadius =
          index === 0
            ? c.radius
            : c.mode === GearMode.GLOBAL
              ? c.radiusGlobal
              : c.mode === GearMode.ENGINE
                ? c.radiusEngineMult
                : c.radiusPrevMult;

        const activeSpeed =
          index === 0
            ? c.speedDeg
            : c.mode === GearMode.GLOBAL
              ? c.speedGlobal
              : c.mode === GearMode.ENGINE
                ? c.speedEngineMult
                : c.speedPrevMult;

        const updated: GearCircle = {
          ...c,
          mode,
          radiusEngineMult:
            mode === GearMode.ENGINE || c.mode === GearMode.PREVIOUS
              ? activeRadius
              : c.radiusEngineMult,
          radiusPrevMult:
            mode === GearMode.PREVIOUS || c.mode === GearMode.ENGINE
              ? activeRadius
              : c.radiusPrevMult,
          speedEngineMult:
            mode === GearMode.ENGINE || c.mode === GearMode.PREVIOUS
              ? activeSpeed
              : c.speedEngineMult,
          speedPrevMult:
            mode === GearMode.PREVIOUS || c.mode === GearMode.ENGINE
              ? activeSpeed
              : c.speedPrevMult,
          radiusBase: c.radiusBase ?? activeRadius,
          speedBase: c.speedBase ?? activeSpeed,
        };

        const list = [...circles];
        list[index] = updated;
        return { circles: list, resetContinuity: true };
      });
    },
    [updateCirclesWithLiveAngles]
  );

  const setCirclePen = useCallback(
    (index: number, isPen: boolean) => {
      updateCirclesWithLiveAngles((circles) => {
        if (index < 0 || index >= circles.length) return { circles };
        const list = [...circles];
        list[index] = { ...list[index], isPen };
        return { circles: list, resetContinuity: true };
      });
    },
    [updateCirclesWithLiveAngles]
  );

  const setCircleColor = useCallback(
    (index: number, color: string) => {
      updateCirclesWithLiveAngles((circles) => {
        if (index < 0 || index >= circles.length) return { circles };
        const list = [...circles];
        list[index] = { ...list[index], color };
        return { circles: list, resetContinuity: true };
      });
    },
    [updateCirclesWithLiveAngles]
  );

  const setCircleRadius = useCallback(
    (index: number, radiusProduct: number, baseValue?: number, stepIndex: number = 11) => {
      updateCirclesWithLiveAngles((circles) => {
        if (index < 0 || index >= circles.length) return { circles };
        const c = circles[index];
        const updated: GearCircle = {
          ...c,
          radius: index === 0 ? radiusProduct : c.radius,
          radiusGlobal: index > 0 && c.mode === GearMode.GLOBAL ? radiusProduct : c.radiusGlobal,
          radiusEngineMult:
            index > 0 && c.mode === GearMode.ENGINE ? radiusProduct : c.radiusEngineMult,
          radiusPrevMult:
            index > 0 && c.mode === GearMode.PREVIOUS ? radiusProduct : c.radiusPrevMult,
          radiusBase: baseValue ?? radiusProduct,
          radiusStepIndex: stepIndex,
        };
        const list = [...circles];
        list[index] = updated;
        return { circles: list, resetContinuity: true };
      });
    },
    [updateCirclesWithLiveAngles]
  );

  const setCircleSpeed = useCallback(
    (index: number, speedProduct: number, baseValue?: number, stepIndex: number = 11) => {
      updateCirclesWithLiveAngles((circles) => {
        if (index < 0 || index >= circles.length) return { circles };
        const c = circles[index];
        const updated: GearCircle = {
          ...c,
          speedDeg: index === 0 ? speedProduct : c.speedDeg,
          speedGlobal: index > 0 && c.mode === GearMode.GLOBAL ? speedProduct : c.speedGlobal,
          speedEngineMult:
            index > 0 && c.mode === GearMode.ENGINE ? speedProduct : c.speedEngineMult,
          speedPrevMult:
            index > 0 && c.mode === GearMode.PREVIOUS ? speedProduct : c.speedPrevMult,
          speedBase: baseValue ?? speedProduct,
          speedStepIndex: stepIndex,
        };
        const list = [...circles];
        list[index] = updated;
        return { circles: list };
      });
    },
    [updateCirclesWithLiveAngles]
  );

  const onPan = useCallback(
    (dx: number, dy: number) => {
      setUiState((prev) => ({
        ...prev,
        panX: prev.panX + dx,
        panY: prev.panY + dy,
      }));
      scheduleWorkspaceSave();
    },
    [scheduleWorkspaceSave]
  );

  const onZoom = useCallback(
    (
      scaleFactor: number,
      pivotX: number,
      pivotY: number,
      viewWidth: number,
      viewHeight: number
    ) => {
      setUiState((prev) => {
        const oldZoom = prev.zoom;
        const newZoom = Math.min(Math.max(oldZoom * scaleFactor, 0.02), 10);
        if (newZoom === oldZoom) return prev;

        const baseScale = Math.min(viewWidth, viewHeight) / 900;
        const wx = (pivotX - viewWidth / 2 - prev.panX) / (oldZoom * baseScale);
        const wy = (pivotY - viewHeight / 2 - prev.panY) / (oldZoom * baseScale);

        const newPanX = pivotX - viewWidth / 2 - wx * newZoom * baseScale;
        const newPanY = pivotY - viewHeight / 2 - wy * newZoom * baseScale;

        return { ...prev, zoom: newZoom, panX: newPanX, panY: newPanY };
      });
      scheduleWorkspaceSave();
    },
    [scheduleWorkspaceSave]
  );

  const applyLoadedCircles = useCallback(
    (
      rawCircles: GearCircle[],
      speedMult: number,
      weight: number,
      presetName: string | null,
      closeSheet: boolean
    ) => {
      const newCircles = rawCircles.map((c, idx) => ({
        ...c,
        id: idx + 1,
        angle: c.initialAngle,
      }));
      const maxId = newCircles.reduce((m, c) => Math.max(m, c.id), 0);
      nextGearIdRef.current = Math.max(nextGearIdRef.current, maxId + 1);

      const chain = computeChain(newCircles);
      const totalReach = chain.reduce((sum, l) => sum + Math.abs(l.radius), 0);
      const idealZoom =
        totalReach > 0 ? Math.min(Math.max(360 / totalReach, 0.18), 2.5) : 0.28;

      strokesRef.current = [];
      activeStrokesRef.current.clear();
      clearWorkspaceStrokesStorage();
      liveCirclesRef.current = newCircles.map((c) => ({ ...c }));

      setUiState((prev) => ({
        ...prev,
        circles: newCircles,
        globalSpeedMult: speedMult,
        inkWeight: weight,
        currentPresetName: presetName,
        panX: 0,
        panY: 0,
        zoom: idealZoom,
        hiddenLayerIds: [],
        strokePointCount: 0,
        activeSheet: closeSheet ? ActiveSheet.NONE : prev.activeSheet,
        exportedCode: computeExportedCode(prev.exportFormat, newCircles, speedMult, weight),
      }));
      scheduleWorkspaceSave();
    },
    [scheduleWorkspaceSave]
  );

  const loadCuratedPreset = useCallback(
    (preset: CuratedPreset) => {
      applyLoadedCircles(preset.circles, preset.speedMult, preset.weight, preset.title, true);
    },
    [applyLoadedCircles]
  );

  const loadSavedPreset = useCallback(
    (saved: SavedPreset) => {
      try {
        const parsed = parseSetupCode(saved.encodedData);
        applyLoadedCircles(parsed.circles, parsed.speedMult, parsed.weight, saved.title, true);
        setUiState((prev) => ({
          ...prev,
          codeMessage: `Loaded "${saved.title}"`,
          isSuccessMessage: true,
        }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Invalid preset data';
        setUiState((prev) => ({
          ...prev,
          codeMessage: `Failed to load preset: ${msg}`,
          isSuccessMessage: false,
        }));
      }
    },
    [applyLoadedCircles]
  );

  const saveCurrentDesign = useCallback(
    (title: string, description: string = '') => {
      const state = uiStateRef.current;
      const circles = liveCirclesRef.current;
      const cleanTitle =
        title.trim() || `Pattern #${Math.floor(100 + Math.random() * 900)}`;
      const encoded = exportFlatArray(circles, state.globalSpeedMult, state.inkWeight);
      const colorsHex = circles
        .filter((c) => c.isPen)
        .map((c) => toHexString(c.color))
        .join(',');

      const newPreset: SavedPreset = {
        id: Date.now(),
        title: cleanTitle,
        description: description.trim(),
        encodedData: encoded,
        circleCount: circles.length,
        previewColors: colorsHex,
        createdAt: Date.now(),
      };

      setUiState((prev) => {
        const nextSaved = [newPreset, ...prev.savedPresets];
        savePresetsList(nextSaved);
        return {
          ...prev,
          savedPresets: nextSaved,
          showSaveDialog: false,
          currentPresetName: cleanTitle,
          codeMessage: 'Design saved to presets!',
          isSuccessMessage: true,
        };
      });
    },
    []
  );

  const deleteSavedPreset = useCallback((preset: SavedPreset) => {
    setUiState((prev) => {
      const nextSaved = prev.savedPresets.filter((p) => p.id !== preset.id);
      savePresetsList(nextSaved);
      return { ...prev, savedPresets: nextSaved };
    });
  }, []);

  const setShowSaveDialog = useCallback((show: boolean) => {
    setUiState((prev) => ({ ...prev, showSaveDialog: show }));
  }, []);

  const setShowExportDialog = useCallback((show: boolean) => {
    setUiState((prev) => ({ ...prev, showExportDialog: show }));
  }, []);

  const importSetupCode = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setUiState((prev) => ({
          ...prev,
          codeMessage: 'Please paste a setup code first',
          isSuccessMessage: false,
        }));
        return;
      }
      try {
        const parsed = parseSetupCode(trimmed);
        applyLoadedCircles(
          parsed.circles,
          parsed.speedMult,
          parsed.weight,
          'Custom Imported Setup',
          false
        );
        setUiState((prev) => ({
          ...prev,
          codeMessage: 'Setup loaded successfully ✓',
          isSuccessMessage: true,
        }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Invalid format';
        setUiState((prev) => ({
          ...prev,
          codeMessage: `Could not parse setup: ${msg}`,
          isSuccessMessage: false,
        }));
      }
    },
    [applyLoadedCircles]
  );

  const clearCodeMessage = useCallback(() => {
    setUiState((prev) => ({ ...prev, codeMessage: null }));
  }, []);

  const getStrokesSnapshot = useCallback((): InkStroke[] => {
    return strokesRef.current.slice();
  }, []);

  return {
    uiState,
    uiStateRef,
    liveCirclesRef,
    strokesRef,
    onSimulationTick,
    togglePlayPause,
    clearDrawing,
    zeroAngles,
    resetDrawing,
    setGlobalSpeed,
    setInkWeight,
    toggleGuides,
    togglePoints,
    toggleLayersDashboard,
    setShowLayersDashboard,
    toggleLayerVisibility,
    setLayerVisibility,
    showAllLayers,
    hideAllLayers,
    clearLayerStrokes,
    setActiveSheet,
    setExportFormat,
    addCircle,
    layerCircle,
    removeCircle,
    setCircleMode,
    setCirclePen,
    setCircleColor,
    setCircleRadius,
    setCircleSpeed,
    onPan,
    onZoom,
    loadCuratedPreset,
    loadSavedPreset,
    saveCurrentDesign,
    deleteSavedPreset,
    setShowSaveDialog,
    setShowExportDialog,
    importSetupCode,
    clearCodeMessage,
    getStrokesSnapshot,
    resetStrokeContinuity,
  };
}
