/**
 * PocketLab Engine — Rendering Pipeline
 * 
 * Orchestrates the rendering pipeline stages.
 * Takes EditState + image and produces rendered output.
 * 
 * Pipeline stages (per plan section 3.3):
 * 1. Decode, apply EXIF orientation, convert to working color space
 * 2. White balance and exposure (linear light)
 * 3. Tone: contrast, highlights, shadows, whites, blacks, brightness
 * 4. Color: vibrance, saturation, HSL mixer, grading wheels
 * 5. Curves (master, R, G, B) via 1D LUT texture
 * 6. Local adjustments (masks, in list order)
 * 7. Detail: structure, sharpness
 * 8. Geometry: crop, rotate, straighten, perspective
 * 9. Post-crop effects: vignette, fade, grain, blur
 * 10. Output transform
 */

import type { EditState } from '../../model/types';

// ============================================================================
// Types
// ============================================================================

export interface PipelineInput {
  /** Path to the proxy image */
  imageUri: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** EXIF orientation (1-8) */
  orientation: number;
}

export interface PipelineOutput {
  /** Rendered image data (Skia image or texture) */
  // This will be a Skia Image when integrated with React Native Skia
  renderedImage: unknown;
  /** Histogram data for display */
  histogram: HistogramData;
}

export interface HistogramData {
  /** Red channel histogram (256 bins) */
  red: number[];
  /** Green channel histogram (256 bins) */
  green: number[];
  /** Blue channel histogram (256 bins) */
  blue: number[];
  /** Luminance histogram (256 bins) */
  luminance: number[];
}

export interface PipelineContext {
  /** Current edit state */
  editState: EditState;
  /** Input image */
  input: PipelineInput;
  /** Whether this is for export (full resolution) or preview (proxy) */
  isExport: boolean;
}

// ============================================================================
// Pipeline Implementation
// ============================================================================

/**
 * Render pipeline entry point.
 * 
 * This is a placeholder that will be implemented with React Native Skia.
 * The actual implementation will:
 * 1. Load the image as a Skia Image
 * 2. Create an offscreen surface
 * 3. Apply each pipeline stage as a shader/effect
 * 4. Compute histogram from the result
 * 5. Return the rendered image and histogram
 */
export async function renderPipeline(context: PipelineContext): Promise<PipelineOutput> {
  const { editState, input } = context;
  
  // TODO: Implement with React Native Skia
  // This is the structure that will be filled in:
  
  // 1. Load image
  // const image = loadImage(input.imageUri);
  
  // 2. Create offscreen surface
  // const surface = createSurface(input.width, input.height);
  
  // 3. Apply pipeline stages
  // let current = image;
  // current = applyWhiteBalanceExposure(current, editState.global.whiteBalance, editState.global.tone.exposure);
  // current = applyTone(current, editState.global.tone);
  // current = applyColor(current, editState.global.color);
  // current = applyCurves(current, editState.global.curves);
  // current = applyMasks(current, editState.masks);
  // current = applyDetail(current, editState.global.detail);
  // current = applyGeometry(current, editState.geometry);
  // current = applyEffects(current, editState.effects);
  // current = applyOutputTransform(current);
  
  // 4. Compute histogram
  // const histogram = computeHistogram(current);
  
  // 5. Return result
  return {
    renderedImage: null, // Will be Skia Image
    histogram: createEmptyHistogram(),
  };
}

/**
 * Create an empty histogram (all zeros).
 */
function createEmptyHistogram(): HistogramData {
  const empty = new Array(256).fill(0);
  return {
    red: [...empty],
    green: [...empty],
    blue: [...empty],
    luminance: [...empty],
  };
}

// ============================================================================
// Pipeline Stage Functions (Placeholders)
// ============================================================================

/**
 * Check if any adjustments are non-default.
 * Used to optimize rendering by skipping stages with no effect.
 */
export function hasAdjustments(editState: EditState): boolean {
  const { global, effects, geometry, masks } = editState;
  
  // Check global adjustments
  if (global.whiteBalance.temperature !== 0 || global.whiteBalance.tint !== 0) return true;
  if (global.tone.exposure !== 0 || global.tone.brightness !== 0) return true;
  if (global.tone.contrast !== 0 || global.tone.highlights !== 0) return true;
  if (global.tone.shadows !== 0 || global.tone.whites !== 0) return true;
  if (global.tone.blacks !== 0 || global.tone.ambience !== 0) return true;
  if (global.color.vibrance !== 0 || global.color.saturation !== 0) return true;
  if (global.detail.structure !== 0 || global.detail.sharpness !== 0) return true;
  
  // Check effects
  if (effects.grain !== 0 || effects.vignette !== 0) return true;
  if (effects.fade !== 0 || effects.blur !== 0) return true;
  
  // Check geometry
  if (geometry.crop.x !== 0 || geometry.crop.y !== 0) return true;
  if (geometry.crop.width !== 1 || geometry.crop.height !== 1) return true;
  if (geometry.rotation90 !== 0 || geometry.straighten !== 0) return true;
  
  // Check masks
  if (masks.length > 0) return true;
  
  return false;
}

/**
 * Get a list of active pipeline stages.
 * Used for optimization and debugging.
 */
export function getActiveStages(editState: EditState): string[] {
  const stages: string[] = ['decode'];
  
  const { global, effects, geometry, masks } = editState;
  
  if (global.whiteBalance.temperature !== 0 || global.whiteBalance.tint !== 0 || global.tone.exposure !== 0) {
    stages.push('whiteBalanceExposure');
  }
  
  if (
    global.tone.brightness !== 0 || global.tone.contrast !== 0 ||
    global.tone.highlights !== 0 || global.tone.shadows !== 0 ||
    global.tone.whites !== 0 || global.tone.blacks !== 0
  ) {
    stages.push('tone');
  }
  
  if (global.color.vibrance !== 0 || global.color.saturation !== 0) {
    stages.push('color');
  }
  
  // Curves always applied (LUT sampling is cheap)
  stages.push('curves');
  
  if (masks.length > 0) {
    stages.push('masks');
  }
  
  if (global.detail.structure !== 0 || global.detail.sharpness !== 0) {
    stages.push('detail');
  }
  
  if (
    geometry.crop.x !== 0 || geometry.crop.y !== 0 ||
    geometry.crop.width !== 1 || geometry.crop.height !== 1 ||
    geometry.rotation90 !== 0 || geometry.straighten !== 0
  ) {
    stages.push('geometry');
  }
  
  if (effects.grain !== 0 || effects.vignette !== 0 || effects.fade !== 0 || effects.blur !== 0) {
    stages.push('effects');
  }
  
  stages.push('output');
  
  return stages;
}
