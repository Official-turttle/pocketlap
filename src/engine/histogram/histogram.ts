/**
 * PocketLab Engine — Histogram Computation
 * 
 * Computes RGB + luminance histogram from image data.
 * Used for the histogram display and clipping warnings.
 */

import type { HistogramData } from '../pipeline/pipeline';

// ============================================================================
// Types
// ============================================================================

export interface HistogramOptions {
  /** Number of bins (default: 256) */
  bins?: number;
  /** Whether to normalize the output (default: true) */
  normalize?: boolean;
}

export interface ClippingInfo {
  /** Percentage of pixels with clipped highlights (> 0.99) */
  highlightClipPercent: number;
  /** Percentage of pixels with clipped shadows (< 0.01) */
  shadowClipPercent;
  /** Whether clipping warnings should be shown */
  showWarnings: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BINS = 256;
const HIGHLIGHT_CLIP_THRESHOLD = 0.99;
const SHADOW_CLIP_THRESHOLD = 0.01;
const CLIP_WARNING_PERCENT = 1.0; // Show warning if > 1% of pixels are clipped

// ============================================================================
// Histogram Computation
// ============================================================================

/**
 * Compute histogram from image pixel data.
 * 
 * @param pixels - Uint8Array of RGBA pixel data
 * @param width - Image width
 * @param height - Image height
 * @param options - Histogram options
 * @returns Histogram data with 256 bins per channel
 */
export function computeHistogram(
  pixels: Uint8Array,
  width: number,
  height: number,
  options: HistogramOptions = {}
): HistogramData {
  const { bins = DEFAULT_BINS, normalize = true } = options;
  
  const red = new Array(bins).fill(0);
  const green = new Array(bins).fill(0);
  const blue = new Array(bins).fill(0);
  const luminance = new Array(bins).fill(0);
  
  const totalPixels = width * height;
  const binScale = (bins - 1) / 255;
  
  // Iterate through all pixels
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    // const a = pixels[i + 3]; // Alpha not used for histogram
    
    // Calculate bin indices
    const rBin = Math.round(r * binScale);
    const gBin = Math.round(g * binScale);
    const bBin = Math.round(b * binScale);
    
    // Calculate luminance (Rec. 709)
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const lumBin = Math.round(lum * binScale);
    
    // Increment bins
    red[rBin]++;
    green[gBin]++;
    blue[bBin]++;
    luminance[lumBin]++;
  }
  
  // Normalize if requested
  if (normalize) {
    const maxCount = Math.max(
      Math.max(...red),
      Math.max(...green),
      Math.max(...blue),
      Math.max(...luminance)
    );
    
    if (maxCount > 0) {
      for (let i = 0; i < bins; i++) {
        red[i] = red[i] / maxCount;
        green[i] = green[i] / maxCount;
        blue[i] = blue[i] / maxCount;
        luminance[i] = luminance[i] / maxCount;
      }
    }
  }
  
  return { red, green, blue, luminance };
}

/**
 * Compute histogram from a downsampled preview.
 * More efficient than computing from full resolution.
 */
export function computeHistogramDownsampled(
  pixels: Uint8Array,
  width: number,
  height: number,
  downsampleFactor: number = 4
): HistogramData {
  const newWidth = Math.ceil(width / downsampleFactor);
  const newHeight = Math.ceil(height / downsampleFactor);
  const downsampledPixels = new Uint8Array(newWidth * newHeight * 4);
  
  // Simple nearest-neighbor downsampling
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x * downsampleFactor);
      const srcY = Math.floor(y * downsampleFactor);
      const srcIndex = (srcY * width + srcX) * 4;
      const dstIndex = (y * newWidth + x) * 4;
      
      downsampledPixels[dstIndex] = pixels[srcIndex];
      downsampledPixels[dstIndex + 1] = pixels[srcIndex + 1];
      downsampledPixels[dstIndex + 2] = pixels[srcIndex + 2];
      downsampledPixels[dstIndex + 3] = pixels[srcIndex + 3];
    }
  }
  
  return computeHistogram(downsampledPixels, newWidth, newHeight);
}

// ============================================================================
// Clipping Detection
// ============================================================================

/**
 * Detect clipping in the histogram.
 * Returns information about highlight and shadow clipping.
 */
export function detectClipping(
  pixels: Uint8Array,
  width: number,
  height: number
): ClippingInfo {
  const totalPixels = width * height;
  let highlightClipped = 0;
  let shadowClipped = 0;
  
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] / 255;
    const g = pixels[i + 1] / 255;
    const b = pixels[i + 2] / 255;
    
    // Calculate luminance
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    
    if (lum >= HIGHLIGHT_CLIP_THRESHOLD) {
      highlightClipped++;
    }
    if (lum <= SHADOW_CLIP_THRESHOLD) {
      shadowClipped++;
    }
  }
  
  const highlightClipPercent = (highlightClipped / totalPixels) * 100;
  const shadowClipPercent = (shadowClipped / totalPixels) * 100;
  
  return {
    highlightClipPercent,
    shadowClipPercent,
    showWarnings: highlightClipPercent > CLIP_WARNING_PERCENT || shadowClipPercent > CLIP_WARNING_PERCENT,
  };
}

/**
 * Create an empty histogram.
 */
export function createEmptyHistogram(): HistogramData {
  const empty = new Array(DEFAULT_BINS).fill(0);
  return {
    red: [...empty],
    green: [...empty],
    blue: [...empty],
    luminance: [...empty],
  };
}

// ============================================================================
// Histogram Utilities
// ============================================================================

/**
 * Merge two histograms (additive).
 * Useful for computing histogram incrementally.
 */
export function mergeHistograms(a: HistogramData, b: HistogramData): HistogramData {
  return {
    red: a.red.map((v, i) => v + b.red[i]),
    green: a.green.map((v, i) => v + b.green[i]),
    blue: a.blue.map((v, i) => v + b.blue[i]),
    luminance: a.luminance.map((v, i) => v + b.luminance[i]),
  };
}

/**
 * Normalize a histogram to 0-1 range.
 */
export function normalizeHistogram(hist: HistogramData): HistogramData {
  const maxCount = Math.max(
    Math.max(...hist.red),
    Math.max(...hist.green),
    Math.max(...hist.blue),
    Math.max(...hist.luminance)
  );
  
  if (maxCount === 0) {
    return hist;
  }
  
  return {
    red: hist.red.map(v => v / maxCount),
    green: hist.green.map(v => v / maxCount),
    blue: hist.blue.map(v => v / maxCount),
    luminance: hist.luminance.map(v => v / maxCount),
  };
}
