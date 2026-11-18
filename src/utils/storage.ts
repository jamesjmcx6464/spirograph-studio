import { GearCircle, GearMode, InkStroke, SavedPreset, StrokePoint } from '../types/spirograph';
import { createGearCircle } from './gearMath';

const SAVED_PRESETS_KEY = 'spirograph_studio_saved_presets_v1';
const WORKSPACE_STATE_KEY = 'spirograph_studio_workspace_v1';
const WORKSPACE_STROKES_KEY = 'spirograph_studio_strokes_v1';

export interface StoredWorkspaceState {
  circles: GearCircle[];
  isPlaying: boolean;
  globalSpeedMult: number;
  inkWeight: number;
  showGuides: boolean;
  showPoints: boolean;
  panX: number;
  panY: number;
  zoom: number;
  currentPresetName: string | null;
  hiddenLayerIds: number[];
}

export function buildPath2DFromPoints(pts: StrokePoint[]): Path2D {
  const path = new Path2D();
  if (pts.length === 0) return path;
  path.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 2) {
    path.lineTo(pts[1].x, pts[1].y);
  } else if (pts.length > 2) {
    for (let i = 1; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      path.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    const last = pts[pts.length - 1];
    path.lineTo(last.x, last.y);
  }
  return path;
}

export function loadSavedPresets(): SavedPreset[] {
  try {
    const raw = localStorage.getItem(SAVED_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is SavedPreset => typeof item === 'object' && item !== null && typeof item.title === 'string')
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  } catch {
    return [];
  }
}

export function savePresetsList(presets: SavedPreset[]): void {
  try {
    localStorage.setItem(SAVED_PRESETS_KEY, JSON.stringify(presets));
  } catch (e) {
    console.warn('Failed to persist saved presets to localStorage', e);
  }
}

export function saveWorkspaceToStorage(state: StoredWorkspaceState, strokes: InkStroke[]): void {
  try {
    localStorage.setItem(WORKSPACE_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to persist workspace state', e);
  }

  try {
    if (strokes.length === 0) {
      localStorage.removeItem(WORKSPACE_STROKES_KEY);
      return;
    }
    // Compact stroke encoding to stay well within localStorage quota (~5MB)
    const compact = strokes.map((s) => ({
      i: s.id,
      c: s.color,
      w: s.weight,
      // Round coordinates to 1 decimal place to save ~50% storage space
      p: s.points.flatMap((pt) => [Math.round(pt.x * 10) / 10, Math.round(pt.y * 10) / 10]),
    }));
    const json = JSON.stringify(compact);
    if (json.length < 3_500_000) {
      localStorage.setItem(WORKSPACE_STROKES_KEY, json);
    }
  } catch (e) {
    console.warn('Failed to persist workspace strokes', e);
  }
}

export function loadWorkspaceFromStorage(): {
  state: StoredWorkspaceState | null;
  strokes: InkStroke[];
} {
  try {
    const rawState = localStorage.getItem(WORKSPACE_STATE_KEY);
    if (!rawState) return { state: null, strokes: [] };
    const parsed = JSON.parse(rawState);
    if (!parsed || !Array.isArray(parsed.circles) || parsed.circles.length === 0) {
      return { state: null, strokes: [] };
    }

    const circles: GearCircle[] = parsed.circles.map((obj: Record<string, unknown>, idx: number) => {
      const modeStr = typeof obj.mode === 'string' ? obj.mode : 'GLOBAL';
      const mode =
        modeStr === GearMode.ENGINE
          ? GearMode.ENGINE
          : modeStr === GearMode.PREVIOUS
            ? GearMode.PREVIOUS
            : GearMode.GLOBAL;

      return createGearCircle({
        id: typeof obj.id === 'number' ? obj.id : idx + 1,
        mode,
        radius: typeof obj.radius === 'number' ? obj.radius : 140,
        radiusGlobal: typeof obj.radiusGlobal === 'number' ? obj.radiusGlobal : 140,
        radiusEngineMult: typeof obj.radiusEngineMult === 'number' ? obj.radiusEngineMult : 0.5,
        radiusPrevMult: typeof obj.radiusPrevMult === 'number' ? obj.radiusPrevMult : 0.5,
        radiusBase: typeof obj.radiusBase === 'number' ? obj.radiusBase : null,
        radiusStepIndex: typeof obj.radiusStepIndex === 'number' ? obj.radiusStepIndex : 11,
        speedDeg: typeof obj.speedDeg === 'number' ? obj.speedDeg : 50,
        speedGlobal: typeof obj.speedGlobal === 'number' ? obj.speedGlobal : 50,
        speedEngineMult: typeof obj.speedEngineMult === 'number' ? obj.speedEngineMult : 1.5,
        speedPrevMult: typeof obj.speedPrevMult === 'number' ? obj.speedPrevMult : -1.5,
        speedBase: typeof obj.speedBase === 'number' ? obj.speedBase : null,
        speedStepIndex: typeof obj.speedStepIndex === 'number' ? obj.speedStepIndex : 11,
        angle: typeof obj.angle === 'number' ? obj.angle : -90,
        initialAngle: typeof obj.initialAngle === 'number' ? obj.initialAngle : -90,
        isPen: typeof obj.isPen === 'boolean' ? obj.isPen : true,
        color: typeof obj.color === 'string' ? obj.color : '#E39B3E',
      });
    });

    const state: StoredWorkspaceState = {
      circles,
      isPlaying: typeof parsed.isPlaying === 'boolean' ? parsed.isPlaying : true,
      globalSpeedMult: typeof parsed.globalSpeedMult === 'number' ? parsed.globalSpeedMult : 1.0,
      inkWeight: typeof parsed.inkWeight === 'number' ? parsed.inkWeight : 2.0,
      showGuides: typeof parsed.showGuides === 'boolean' ? parsed.showGuides : true,
      showPoints: typeof parsed.showPoints === 'boolean' ? parsed.showPoints : true,
      panX: typeof parsed.panX === 'number' ? parsed.panX : 0,
      panY: typeof parsed.panY === 'number' ? parsed.panY : 0,
      zoom: typeof parsed.zoom === 'number' ? parsed.zoom : 1.6,
      currentPresetName: typeof parsed.currentPresetName === 'string' && parsed.currentPresetName.trim() !== ''
        ? parsed.currentPresetName
        : null,
      hiddenLayerIds: Array.isArray(parsed.hiddenLayerIds)
        ? parsed.hiddenLayerIds.filter((id: unknown): id is number => typeof id === 'number')
        : [],
    };

    const strokes: InkStroke[] = [];
    const rawStrokes = localStorage.getItem(WORKSPACE_STROKES_KEY);
    if (rawStrokes) {
      try {
        const parsedStrokes = JSON.parse(rawStrokes);
        if (Array.isArray(parsedStrokes)) {
          for (const s of parsedStrokes) {
            if (!s || !Array.isArray(s.p)) continue;
            const pts: StrokePoint[] = [];
            for (let i = 0; i + 1 < s.p.length; i += 2) {
              pts.push({ x: Number(s.p[i]), y: Number(s.p[i + 1]) });
            }
            if (pts.length > 0) {
              strokes.push({
                id: typeof s.i === 'number' ? s.i : 1,
                color: typeof s.c === 'string' ? s.c : '#E39B3E',
                weight: typeof s.w === 'number' ? s.w : 2.0,
                points: pts,
                path2d: buildPath2DFromPoints(pts),
              });
            }
          }
        }
      } catch {
        // Ignore corrupted stroke cache
      }
    }

    return { state, strokes };
  } catch {
    return { state: null, strokes: [] };
  }
}

export function clearWorkspaceStrokesStorage(): void {
  try {
    localStorage.removeItem(WORKSPACE_STROKES_KEY);
  } catch {
    // Ignore
  }
}
