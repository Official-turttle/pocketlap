/**
 * PocketLab Engine
 * 
 * Public API for the image processing engine.
 * No React dependencies.
 */

// Pipeline
export {
  renderPipeline,
  hasAdjustments,
  getActiveStages,
  type PipelineInput,
  type PipelineOutput,
  type PipelineContext,
  type HistogramData,
} from './pipeline/pipeline';

// Color
export {
  srgbToLinear,
  linearToSrgb,
  rgbToLinear,
  linearToRgb,
  linearRgbToXyz,
  xyzToLinearRgb,
  xyzToLab,
  labToXyz,
  linearRgbToLab,
  labToLinearRgb,
  getLuminance,
  getLuminanceFromSrgb,
  clamp,
  clampRgb,
  clampLinearRgb,
  type RGB,
  type LinearRGB,
  type XYZ,
  type Lab,
} from './color/colorSpace';

// Curve LUT
export {
  bakeCurveLut,
  bakeAllCurveLuts,
  addCurvePoint,
  removeCurvePoint,
  moveCurvePoint,
  resetCurve,
  findClosestCurvePoint,
  type LutData,
} from './color/curveLut';

// Histogram
export {
  computeHistogram,
  computeHistogramDownsampled,
  detectClipping,
  createEmptyHistogram,
  mergeHistograms,
  normalizeHistogram,
  type HistogramOptions,
  type ClippingInfo,
} from './histogram/histogram';

// Shaders
export {
  WHITE_BALANCE_EXPOSURE_SHADER,
  TONE_SHADER,
  COLOR_SHADER,
  CURVES_SHADER,
  OUTPUT_SHADER,
} from './shaders/adjustments';

// HSL
export {
  HSL_SHADER,
  prepareHslUniforms,
  HSL_BAND_HUES,
} from './shaders/hsl';

// Grading
export {
  GRADING_SHADER,
  prepareGradingUniforms,
  hasGradingAdjustments,
} from './shaders/grading';

// Masks
export {
  LINEAR_MASK_SHADER,
  RADIAL_MASK_SHADER,
  MASK_COMPOSITE_SHADER,
  prepareLinearMaskUniforms,
  prepareRadialMaskUniforms,
  isMaskActive,
  getActiveMasks,
} from './shaders/masks';
