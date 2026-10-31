/**
 * PocketLab Engine — Color Space Utilities
 * 
 * Color space conversions and working space management.
 * Pure TypeScript, no React dependencies.
 */

// ============================================================================
// Types
// ============================================================================

export interface RGB {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}

export interface LinearRGB {
  r: number; // 0-1, linear light
  g: number; // 0-1, linear light
  b: number; // 0-1, linear light
}

export interface XYZ {
  x: number;
  y: number;
  z: number;
}

export interface Lab {
  l: number; // 0-100
  a: number; // -128 to 127
  b: number; // -128 to 127
}

// ============================================================================
// sRGB Gamma
// ============================================================================

/**
 * Convert sRGB gamma-encoded value to linear light.
 */
export function srgbToLinear(value: number): number {
  if (value <= 0.04045) {
    return value / 12.92;
  }
  return Math.pow((value + 0.055) / 1.055, 2.4);
}

/**
 * Convert linear light value to sRGB gamma-encoded.
 */
export function linearToSrgb(value: number): number {
  if (value <= 0.0031308) {
    return value * 12.92;
  }
  return 1.055 * Math.pow(value, 1.0 / 2.4) - 0.055;
}

/**
 * Convert RGB (sRGB gamma) to linear RGB.
 */
export function rgbToLinear(rgb: RGB): LinearRGB {
  return {
    r: srgbToLinear(rgb.r),
    g: srgbToLinear(rgb.g),
    b: srgbToLinear(rgb.b),
  };
}

/**
 * Convert linear RGB to sRGB gamma-encoded RGB.
 */
export function linearToRgb(linear: LinearRGB): RGB {
  return {
    r: linearToSrgb(linear.r),
    g: linearToSrgb(linear.g),
    b: linearToSrgb(linear.b),
  };
}

// ============================================================================
// XYZ Conversions (sRGB D65)
// ============================================================================

// sRGB to XYZ matrix (D65 white point)
const SRGB_TO_XYZ = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041],
];

// XYZ to sRGB matrix (D65 white point)
const XYZ_TO_SRGB = [
  [3.2404542, -1.5371385, -0.4985314],
  [-0.9692660, 1.8760108, 0.0415560],
  [0.0556434, -0.2040259, 1.0572252],
];

/**
 * Convert linear RGB to XYZ.
 */
export function linearRgbToXyz(linear: LinearRGB): XYZ {
  return {
    x: SRGB_TO_XYZ[0][0] * linear.r + SRGB_TO_XYZ[0][1] * linear.g + SRGB_TO_XYZ[0][2] * linear.b,
    y: SRGB_TO_XYZ[1][0] * linear.r + SRGB_TO_XYZ[1][1] * linear.g + SRGB_TO_XYZ[1][2] * linear.b,
    z: SRGB_TO_XYZ[2][0] * linear.r + SRGB_TO_XYZ[2][1] * linear.g + SRGB_TO_XYZ[2][2] * linear.b,
  };
}

/**
 * Convert XYZ to linear RGB.
 */
export function xyzToLinearRgb(xyz: XYZ): LinearRGB {
  return {
    r: XYZ_TO_SRGB[0][0] * xyz.x + XYZ_TO_SRGB[0][1] * xyz.y + XYZ_TO_SRGB[0][2] * xyz.z,
    g: XYZ_TO_SRGB[1][0] * xyz.x + XYZ_TO_SRGB[1][1] * xyz.y + XYZ_TO_SRGB[1][2] * xyz.z,
    b: XYZ_TO_SRGB[2][0] * xyz.x + XYZ_TO_SRGB[2][1] * xyz.y + XYZ_TO_SRGB[2][2] * xyz.z,
  };
}

// ============================================================================
// Lab Conversions
// ============================================================================

// D65 white point
const D65 = { x: 0.95047, y: 1.0, z: 1.08883 };

function labF(t: number): number {
  const delta = 6.0 / 29.0;
  if (t > delta * delta * delta) {
    return Math.cbrt(t);
  }
  return t / (3 * delta * delta) + 4.0 / 29.0;
}

function labFInv(t: number): number {
  const delta = 6.0 / 29.0;
  if (t > delta) {
    return t * t * t;
  }
  return 3 * delta * delta * (t - 4.0 / 29.0);
}

/**
 * Convert XYZ to Lab.
 */
export function xyzToLab(xyz: XYZ): Lab {
  const fx = labF(xyz.x / D65.x);
  const fy = labF(xyz.y / D65.y);
  const fz = labF(xyz.z / D65.z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * Convert Lab to XYZ.
 */
export function labToXyz(lab: Lab): XYZ {
  const fy = (lab.l + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  return {
    x: D65.x * labFInv(fx),
    y: D65.y * labFInv(fy),
    z: D65.z * labFInv(fz),
  };
}

/**
 * Convert linear RGB to Lab.
 */
export function linearRgbToLab(linear: LinearRGB): Lab {
  const xyz = linearRgbToXyz(linear);
  return xyzToLab(xyz);
}

/**
 * Convert Lab to linear RGB.
 */
export function labToLinearRgb(lab: Lab): LinearRGB {
  const xyz = labToXyz(lab);
  return xyzToLinearRgb(xyz);
}

// ============================================================================
// Luminance
// ============================================================================

/**
 * Calculate relative luminance from linear RGB.
 * Uses Rec. 709 coefficients.
 */
export function getLuminance(linear: LinearRGB): number {
  return 0.2126 * linear.r + 0.7152 * linear.g + 0.0722 * linear.b;
}

/**
 * Calculate relative luminance from sRGB gamma-encoded RGB.
 */
export function getLuminanceFromSrgb(rgb: RGB): number {
  const linear = rgbToLinear(rgb);
  return getLuminance(linear);
}

// ============================================================================
// Clamping
// ============================================================================

/**
 * Clamp a value to a range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamp RGB values to 0-1 range.
 */
export function clampRgb(rgb: RGB): RGB {
  return {
    r: clamp(rgb.r, 0, 1),
    g: clamp(rgb.g, 0, 1),
    b: clamp(rgb.b, 0, 1),
  };
}

/**
 * Clamp linear RGB values to 0-1 range.
 */
export function clampLinearRgb(linear: LinearRGB): LinearRGB {
  return {
    r: clamp(linear.r, 0, 1),
    g: clamp(linear.g, 0, 1),
    b: clamp(linear.b, 0, 1),
  };
}
