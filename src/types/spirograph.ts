export enum GearMode {
  GLOBAL = 'GLOBAL',
  ENGINE = 'ENGINE',
  PREVIOUS = 'PREVIOUS',
}

export enum ActiveSheet {
  NONE = 'NONE',
  GEARS = 'GEARS',
  SETTINGS = 'SETTINGS',
  PRESETS = 'PRESETS',
  LOAD = 'LOAD',
  LEARN = 'LEARN',
}

export enum ExportFormat {
  LABELED = 'LABELED',
  ARRAY = 'ARRAY',
  EQUATION = 'EQUATION',
}

export interface GearCircle {
  id: number;
  mode: GearMode;
  radius: number;
  radiusGlobal: number;
  radiusEngineMult: number;
  radiusPrevMult: number;
  radiusBase: number | null;
  radiusStepIndex: number;
  speedDeg: number;
  speedGlobal: number;
  speedEngineMult: number;
  speedPrevMult: number;
  speedBase: number | null;
  speedStepIndex: number;
  angle: number;
  initialAngle: number;
  isPen: boolean;
  color: string;
}

export interface ResolvedLink {
  id: number;
  radius: number;
  speedDeg: number;
  cx: number;
  cy: number;
  px: number;
  py: number;
  isPen: boolean;
  color: string;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface InkStroke {
  id: number;
  color: string;
  weight: number;
  points: StrokePoint[];
  path2d?: Path2D;
}

export interface CuratedPreset {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  formulaSummary: string;
  speedMult: number;
  weight: number;
  circles: GearCircle[];
}

export interface SavedPreset {
  id: number;
  title: string;
  description: string;
  encodedData: string;
  circleCount: number;
  previewColors: string;
  createdAt: number;
}

export interface LessonItem {
  id: string;
  number: string;
  title: string;
  summary: string;
  placeholderContent: string;
  tag?: string;
}

export interface TutorialCategory {
  id: string;
  title: string;
  subtitle: string;
  iconName: 'school' | 'settings' | 'autoAwesome';
  accentColor: string;
  lessons: LessonItem[];
}

export interface CompassInkUiState {
  circles: GearCircle[];
  isPlaying: boolean;
  globalSpeedMult: number;
  inkWeight: number;
  showGuides: boolean;
  showPoints: boolean;
  panX: number;
  panY: number;
  zoom: number;
  activeSheet: ActiveSheet;
  exportFormat: ExportFormat;
  exportedCode: string;
  codeMessage: string | null;
  isSuccessMessage: boolean;
  savedPresets: SavedPreset[];
  currentPresetName: string | null;
  showSaveDialog: boolean;
  showExportDialog: boolean;
  strokePointCount: number;
  hiddenLayerIds: number[];
  showLayersDashboard: boolean;
}
