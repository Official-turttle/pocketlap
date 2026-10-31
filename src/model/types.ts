/**
 * PocketLab Data Model — Types
 * 
 * All types are versioned. Coordinates are normalized (0–1) relative to image dimensions.
 * This is the source of truth for the entire data model.
 */

export const SCHEMA_VERSION = 1;

// ============================================================================
// Basic Types
// ============================================================================

export type HslBand =
  | 'red' | 'orange' | 'yellow' | 'green'
  | 'aqua' | 'blue' | 'purple' | 'magenta';

export const HSL_BANDS: HslBand[] = [
  'red', 'orange', 'yellow', 'green',
  'aqua', 'blue', 'purple', 'magenta'
];

/** Normalized point (0–1 relative to image dimensions) */
export interface Point {
  x: number;
  y: number;
}

/** Curve defined by control points, sorted by x, endpoints fixed at (0,0) and (1,1) */
export interface Curve {
  points: Point[];
}

/** Color grading region (shadows, midtones, highlights, or global) */
export interface GradeRegion {
  hue: number;          // 0–360 degrees
  saturation: number;   // -1 to 1
  luminance: number;    // -1 to 1
}

// ============================================================================
// Adjustment Types
// ============================================================================

/** White balance adjustments */
export interface WhiteBalanceAdjustment {
  temperature: number;  // -100 to 100 (cool to warm)
  tint: number;         // -100 to 100 (green to magenta)
}

/** Tone adjustments */
export interface ToneAdjustment {
  exposure: number;     // -5 to 5 (EV)
  brightness: number;   // -100 to 100
  contrast: number;     // -100 to 100
  highlights: number;   // -100 to 100
  shadows: number;      // -100 to 100
  whites: number;       // -100 to 100
  blacks: number;       // -100 to 100
  ambience: number;     // -100 to 100
}

/** Color adjustments */
export interface ColorAdjustment {
  vibrance: number;     // -100 to 100
  saturation: number;   // -100 to 100
}

/** HSL band adjustment */
export interface HslBandAdjustment {
  hue: number;          // -180 to 180 degrees
  saturation: number;   // -100 to 100
  luminance: number;    // -100 to 100
}

/** HSL mixer (8 bands) */
export type HslAdjustment = Record<HslBand, HslBandAdjustment>;

/** Curves adjustment (master + RGB) */
export interface CurvesAdjustment {
  master: Curve;
  red: Curve;
  green: Curve;
  blue: Curve;
}

/** Color grading adjustment */
export interface GradingAdjustment {
  shadows: GradeRegion;
  midtones: GradeRegion;
  highlights: GradeRegion;
  global: GradeRegion;
  blending: number;     // 0 to 100
  balance: number;      // -100 to 100 (dark to light)
}

/** Detail adjustments */
export interface DetailAdjustment {
  structure: number;    // 0 to 100
  sharpness: number;    // 0 to 100
}

/** 
 * Complete adjustment set.
 * Reused for both global edits and per-mask adjustments.
 */
export interface AdjustmentSet {
  whiteBalance: WhiteBalanceAdjustment;
  tone: ToneAdjustment;
  color: ColorAdjustment;
  hsl: HslAdjustment;
  curves: CurvesAdjustment;
  grading: GradingAdjustment;
  detail: DetailAdjustment;
}

// ============================================================================
// Effects
// ============================================================================

/** Post-crop effects */
export interface EffectSettings {
  grain: number;        // 0 to 100
  vignette: number;     // 0 to 100
  fade: number;         // 0 to 100
  blur: number;         // 0 to 100
}

// ============================================================================
// Geometry
// ============================================================================

/** Crop rectangle (normalized coordinates) */
export interface CropRect {
  x: number;            // 0 to 1
  y: number;            // 0 to 1
  width: number;        // 0 to 1
  height: number;       // 0 to 1
}

export type AspectRatio = 'free' | 'original' | '1:1' | '4:3' | '3:2' | '16:9' | '4:5';

/** Geometry adjustments (crop, rotate, perspective) */
export interface GeometrySettings {
  crop: CropRect;
  aspect: AspectRatio;
  rotation90: 0 | 90 | 180 | 270;
  straighten: number;   // degrees, -45 to 45
  perspective: {
    horizontal: number; // -100 to 100
    vertical: number;   // -100 to 100
  };
}

// ============================================================================
// Masks
// ============================================================================

/** Brush stroke for brush mask */
export interface BrushStroke {
  mode: 'paint' | 'erase';
  points: Point[];      // normalized
  size: number;         // fraction of image long edge
  softness: number;     // 0 to 1
  opacity: number;      // 0 to 1
}

/** Mask shape types */
export type MaskShape =
  | { type: 'brush'; strokes: BrushStroke[] }
  | { type: 'linear'; start: Point; end: Point; feather: number }
  | { type: 'radial'; center: Point; radiusX: number; radiusY: number; rotation: number; feather: number };

/** Mask with adjustments */
export interface Mask {
  id: string;
  name: string;
  visible: boolean;
  inverted: boolean;
  opacity: number;      // 0 to 1
  shape: MaskShape;
  adjustments: AdjustmentSet;
}

// ============================================================================
// Edit State
// ============================================================================

/** Complete edit state (non-destructive parameters) */
export interface EditState {
  global: AdjustmentSet;
  effects: EffectSettings;
  geometry: GeometrySettings;
  masks: Mask[];        // applied in list order
}

// ============================================================================
// Project & Preset
// ============================================================================

export type ColorSpace = 'srgb' | 'display-p3' | 'unknown';

/** Source image metadata */
export interface SourceImage {
  path: string;                 // app-sandbox copy of the original
  width: number;
  height: number;
  orientation: number;          // EXIF orientation (1-8)
  colorSpace: ColorSpace;
  originalAssetId?: string;     // gallery reference, if any
}

/** Project file (persisted to disk) */
export interface ProjectFile {
  schemaVersion: number;
  projectId: string;
  name: string;
  source: SourceImage;
  edit: EditState;
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
}

/** Preset file (persisted to disk) */
export interface PresetFile {
  schemaVersion: number;
  name: string;
  category: string;
  global: AdjustmentSet;
  effects: EffectSettings;
  // Geometry and masks are excluded by default
}

// ============================================================================
// Database Index Types
// ============================================================================

/** Project index entry (stored in SQLite) */
export interface ProjectIndexEntry {
  projectId: string;
  name: string;
  thumbnailPath: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

/** Preset index entry (stored in SQLite) */
export interface PresetIndexEntry {
  name: string;
  category: string;
  schemaVersion: number;
}
