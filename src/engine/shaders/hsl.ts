/**
 * PocketLab Engine — HSL Mixer
 * 
 * HSL adjustment shader with 8 hue bands.
 * Each band can be adjusted independently for hue, saturation, and luminance.
 */

// ============================================================================
// HSL Shader
// ============================================================================

/**
 * HSL mixer shader.
 * Adjusts 8 hue bands independently.
 * 
 * Uniforms:
 * - hueShift[8]: hue shift for each band (-180 to 180 degrees)
 * - satShift[8]: saturation shift for each band (-100 to 100)
 * - lumShift[8]: luminance shift for each band (-100 to 100)
 */
export const HSL_SHADER = `
uniform shader image;

// 8 bands: red, orange, yellow, green, aqua, blue, purple, magenta
uniform float hueShift[8];
uniform float satShift[8];
uniform float lumShift[8];

const float PI = 3.14159265359;

// Convert RGB to HSV
float3 rgbToHsv(float3 c) {
    float4 K = float4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    float4 p = mix(float4(c.bg, K.wz), float4(c.gb, K.xy), step(c.b, c.g));
    float4 q = mix(float4(p.xyw, c.r), float4(c.r, p.yzx), step(p.x, c.r));
    
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return float3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// Convert HSV to RGB
float3 hsvToRgb(float3 c) {
    float4 K = float4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    float3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Calculate weight for a hue band (smooth falloff between adjacent bands)
float bandWeight(float hue, float bandCenter) {
    float diff = abs(hue - bandCenter);
    diff = min(diff, 1.0 - diff); // Wrap around
    // Smooth falloff over 1/6 of the hue wheel (adjacent bands)
    float weight = 1.0 - smoothstep(0.0, 1.0 / 6.0, diff);
    return weight;
}

half4 main(float2 pos) {
    half4 color = image.eval(pos);
    float3 rgb = float3(color.r, color.g, color.b);
    float3 hsv = rgbToHsv(rgb);
    
    float hue = hsv.x;
    float sat = hsv.y;
    float val = hsv.z;
    
    // Band centers (in 0-1 hue space)
    // red=0, orange=0.083, yellow=0.167, green=0.333, aqua=0.5, blue=0.667, purple=0.75, magenta=0.917
    float bandCenters[8] = float[8](0.0, 0.083, 0.167, 0.333, 0.5, 0.667, 0.75, 0.917);
    
    // Calculate weighted adjustments
    float totalHueShift = 0.0;
    float totalSatShift = 0.0;
    float totalLumShift = 0.0;
    float totalWeight = 0.0;
    
    for (int i = 0; i < 8; i++) {
        float weight = bandWeight(hue, bandCenters[i]);
        if (weight > 0.0) {
            totalHueShift += hueShift[i] * weight;
            totalSatShift += satShift[i] * weight;
            totalLumShift += lumShift[i] * weight;
            totalWeight += weight;
        }
    }
    
    // Normalize by total weight
    if (totalWeight > 0.0) {
        totalHueShift /= totalWeight;
        totalSatShift /= totalWeight;
        totalLumShift /= totalWeight;
    }
    
    // Apply adjustments
    hsv.x = fract(hsv.x + totalHueShift / 360.0);
    hsv.y = clamp(hsv.y + totalSatShift / 100.0, 0.0, 1.0);
    hsv.z = clamp(hsv.z + totalLumShift / 100.0, 0.0, 1.0);
    
    // Convert back to RGB
    float3 result = hsvToRgb(hsv);
    
    return half4(result.r, result.g, result.b, color.a);
}
`;

// ============================================================================
// HSL Uniform Preparation
// ============================================================================

import type { HslAdjustment, HslBand } from '../../model/types';
import { HSL_BANDS } from '../../model/types';

/**
 * Band center hues in degrees (0-360).
 */
export const HSL_BAND_HUES: Record<HslBand, number> = {
  red: 0,
  orange: 30,
  yellow: 60,
  green: 120,
  aqua: 180,
  blue: 240,
  purple: 270,
  magenta: 330,
};

/**
 * Prepare HSL uniforms for the shader.
 * Returns arrays of hue, saturation, and luminance shifts.
 */
export function prepareHslUniforms(hsl: HslAdjustment): {
  hueShift: number[];
  satShift: number[];
  lumShift: number[];
} {
  const hueShift: number[] = [];
  const satShift: number[] = [];
  const lumShift: number[] = [];

  for (const band of HSL_BANDS) {
    const adjustment = hsl[band];
    hueShift.push(adjustment.hue);
    satShift.push(adjustment.saturation);
    lumShift.push(adjustment.luminance);
  }

  return { hueShift, satShift, lumShift };
}
