/**
 * PocketLab Data Model — Defaults
 * 
 * Default values for all adjustment types.
 * Used to initialize EditState and reset individual adjustments.
 */

import type {
  AdjustmentSet,
  ColorAdjustment,
  Curve,
  CurvesAdjustment,
  DetailAdjustment,
  EditState,
  EffectSettings,
  GeometrySettings,
  GradeRegion,
  GradingAdjustment,
  HslAdjustment,
  HslBandAdjustment,
  ToneAdjustment,
  WhiteBalanceAdjustment,
} from './types';

// ============================================================================
// Primitive Defaults
// ============================================================================

export const DEFAULT_WHITE_BALANCE: WhiteBalanceAdjustment = {
  temperature: 0,
  tint: 0,
};

export const DEFAULT_TONE: ToneAdjustment = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  ambience: 0,
};

export const DEFAULT_COLOR: ColorAdjustment = {
  vibrance: 0,
  saturation: 0,
};

export const DEFAULT_HSL_BAND: HslBandAdjustment = {
  hue: 0,
  saturation: 0,
  luminance: 0,
};

export const DEFAULT_HSL: HslAdjustment = {
  red: { ...DEFAULT_HSL_BAND },
  orange: { ...DEFAULT_HSL_BAND },
  yellow: { ...DEFAULT_HSL_BAND },
  green: { ...DEFAULT_HSL_BAND },
  aqua: { ...DEFAULT_HSL_BAND },
  blue: { ...DEFAULT_HSL_BAND },
  purple: { ...DEFAULT_HSL_BAND },
  magenta: { ...DEFAULT_HSL_BAND },
};

/** Default curve: straight line from (0,0) to (1,1) */
export const DEFAULT_CURVE: Curve = {
  points: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ],
};

export const DEFAULT_CURVES: CurvesAdjustment = {
  master: { ...DEFAULT_CURVE, points: [...DEFAULT_CURVE.points] },
  red: { ...DEFAULT_CURVE, points: [...DEFAULT_CURVE.points] },
  green: { ...DEFAULT_CURVE, points: [...DEFAULT_CURVE.points] },
  blue: { ...DEFAULT_CURVE, points: [...DEFAULT_CURVE.points] },
};

export const DEFAULT_GRADE_REGION: GradeRegion = {
  hue: 0,
  saturation: 0,
  luminance: 0,
};

export const DEFAULT_GRADING: GradingAdjustment = {
  shadows: { ...DEFAULT_GRADE_REGION },
  midtones: { ...DEFAULT_GRADE_REGION },
  highlights: { ...DEFAULT_GRADE_REGION },
  global: { ...DEFAULT_GRADE_REGION },
  blending: 50,
  balance: 0,
};

export const DEFAULT_DETAIL: DetailAdjustment = {
  structure: 0,
  sharpness: 0,
};

// ============================================================================
// Composite Defaults
// ============================================================================

export const DEFAULT_ADJUSTMENT_SET: AdjustmentSet = {
  whiteBalance: { ...DEFAULT_WHITE_BALANCE },
  tone: { ...DEFAULT_TONE },
  color: { ...DEFAULT_COLOR },
  hsl: {
    red: { ...DEFAULT_HSL_BAND },
    orange: { ...DEFAULT_HSL_BAND },
    yellow: { ...DEFAULT_HSL_BAND },
    green: { ...DEFAULT_HSL_BAND },
    aqua: { ...DEFAULT_HSL_BAND },
    blue: { ...DEFAULT_HSL_BAND },
    purple: { ...DEFAULT_HSL_BAND },
    magenta: { ...DEFAULT_HSL_BAND },
  },
  curves: {
    master: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    red: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    green: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    blue: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
  },
  grading: {
    shadows: { ...DEFAULT_GRADE_REGION },
    midtones: { ...DEFAULT_GRADE_REGION },
    highlights: { ...DEFAULT_GRADE_REGION },
    global: { ...DEFAULT_GRADE_REGION },
    blending: 50,
    balance: 0,
  },
  detail: { ...DEFAULT_DETAIL },
};

export const DEFAULT_EFFECTS: EffectSettings = {
  grain: 0,
  vignette: 0,
  fade: 0,
  blur: 0,
};

export const DEFAULT_GEOMETRY: GeometrySettings = {
  crop: { x: 0, y: 0, width: 1, height: 1 },
  aspect: 'free',
  rotation90: 0,
  straighten: 0,
  perspective: {
    horizontal: 0,
    vertical: 0,
  },
};

// ============================================================================
// Edit State Default
// ============================================================================

export const DEFAULT_EDIT_STATE: EditState = {
  global: {
    whiteBalance: { ...DEFAULT_WHITE_BALANCE },
    tone: { ...DEFAULT_TONE },
    color: { ...DEFAULT_COLOR },
    hsl: {
      red: { ...DEFAULT_HSL_BAND },
      orange: { ...DEFAULT_HSL_BAND },
      yellow: { ...DEFAULT_HSL_BAND },
      green: { ...DEFAULT_HSL_BAND },
      aqua: { ...DEFAULT_HSL_BAND },
      blue: { ...DEFAULT_HSL_BAND },
      purple: { ...DEFAULT_HSL_BAND },
      magenta: { ...DEFAULT_HSL_BAND },
    },
    curves: {
      master: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
      red: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
      green: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
      blue: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    },
    grading: {
      shadows: { ...DEFAULT_GRADE_REGION },
      midtones: { ...DEFAULT_GRADE_REGION },
      highlights: { ...DEFAULT_GRADE_REGION },
      global: { ...DEFAULT_GRADE_REGION },
      blending: 50,
      balance: 0,
    },
    detail: { ...DEFAULT_DETAIL },
  },
  effects: { ...DEFAULT_EFFECTS },
  geometry: { ...DEFAULT_GEOMETRY },
  masks: [],
};

// ============================================================================
// Factory Functions
// ============================================================================

/** Create a fresh AdjustmentSet with all defaults */
export function createDefaultAdjustmentSet(): AdjustmentSet {
  return {
    whiteBalance: { ...DEFAULT_WHITE_BALANCE },
    tone: { ...DEFAULT_TONE },
    color: { ...DEFAULT_COLOR },
    hsl: {
      red: { ...DEFAULT_HSL_BAND },
      orange: { ...DEFAULT_HSL_BAND },
      yellow: { ...DEFAULT_HSL_BAND },
      green: { ...DEFAULT_HSL_BAND },
      aqua: { ...DEFAULT_HSL_BAND },
      blue: { ...DEFAULT_HSL_BAND },
      purple: { ...DEFAULT_HSL_BAND },
      magenta: { ...DEFAULT_HSL_BAND },
    },
    curves: {
      master: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
      red: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
      green: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
      blue: { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    },
    grading: {
      shadows: { ...DEFAULT_GRADE_REGION },
      midtones: { ...DEFAULT_GRADE_REGION },
      highlights: { ...DEFAULT_GRADE_REGION },
      global: { ...DEFAULT_GRADE_REGION },
      blending: 50,
      balance: 0,
    },
    detail: { ...DEFAULT_DETAIL },
  };
}

/** Create a fresh EditState with all defaults */
export function createDefaultEditState(): EditState {
  return {
    global: createDefaultAdjustmentSet(),
    effects: { ...DEFAULT_EFFECTS },
    geometry: { ...DEFAULT_GEOMETRY },
    masks: [],
  };
}
