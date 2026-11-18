export type GearMode = 'GLOBAL' | 'ENGINE' | 'PREVIOUS';

export interface GearCircle {
  id: number;
  mode: GearMode;
  // Radius values
  radius: number; // For Engine or when Global
  radiusGlobal: number;
  radiusEngineMult: number;
  radiusPrevMult: number;
  radiusBase?: number;
  radiusStepIndex?: number;
  // Speed values (in degrees per second)
  speedDeg: number; // For Engine or when Global
  speedGlobal: number;
  speedEngineMult: number;
  speedPrevMult: number;
  speedBase?: number;
  speedStepIndex?: number;
  // Angle state
  angle: number;
  initialAngle: number;
  // Drawing options
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

export interface PathChunk {
  path: Path2D;
  startIdx: number;
  endIdx: number;
}

export interface InkStroke {
  id: number;
  color: string;
  weight: number;
  points: StrokePoint[];
  chunks?: PathChunk[];
  activePath?: Path2D;
  lastChunkEndIdx?: number;
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

export interface SavedDesign {
  id: string;
  name: string;
  createdAt: number;
  circles: GearCircle[];
  globalSpeedMult: number;
  inkWeight: number;
}

export type ExportFormat = 'LABELED' | 'ARRAY' | 'EQUATION';
