/**
 * PocketLab Engine — Color Grading Shader
 * 
 * Color grading with shadows, midtones, highlights, and global wheels.
 * Each wheel applies hue, saturation, and luminance adjustments to its tonal range.
 */

// ============================================================================
// Grading Shader
// ============================================================================

/**
 * Color grading shader with 4 wheels (shadows, midtones, highlights, global).
 * 
 * Uniforms:
 * - shadowHue, shadowSat, shadowLum: shadow wheel adjustments
 * - midtoneHue, midtoneSat, midtoneLum: midtone wheel adjustments
 * - highlightHue, highlightSat, highlightLum: highlight wheel adjustments
 * - globalHue, globalSat, globalLum: global wheel adjustments
 * - blending: 0-100, controls how much the wheels affect the image
 * - balance: -100 to 100, shifts the boundary between shadows/midtones/highlights
 */
export const GRADING_SHADER = `
uniform shader image;

// Shadow wheel
uniform float shadowHue;      // 0-360 degrees
uniform float shadowSat;      // -1 to 1
uniform float shadowLum;      // -1 to 1

// Midtone wheel
uniform float midtoneHue;
uniform float midtoneSat;
uniform float midtoneLum;

// Highlight wheel
uniform float highlightHue;
uniform float highlightSat;
uniform float highlightLum;

// Global wheel
uniform float globalHue;
uniform float globalSat;
uniform float globalLum;

// Control parameters
uniform float blending;       // 0-100
uniform float balance;        // -100 to 100

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

// Convert hue angle to RGB tint color
float3 hueToTint(float hue, float sat) {
    float h = hue / 360.0;
    float3 hsv = float3(h, abs(sat), 1.0);
    return hsvToRgb(hsv);
}

// Calculate luminance weight
float getLuminance(float3 c) {
    return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

// Smooth mask for shadows
float shadowMask(float lum, float balance) {
    float center = 0.33 + balance / 300.0; // Shift center based on balance
    return 1.0 - smoothstep(0.0, 0.5, lum - center + 0.25);
}

// Smooth mask for midtones
float midtoneMask(float lum, float balance) {
    float center = 0.5 + balance / 200.0;
    float low = smoothstep(0.0, 0.5, lum - center + 0.35);
    float high = 1.0 - smoothstep(0.0, 0.5, lum - center - 0.15);
    return low * high;
}

// Smooth mask for highlights
float highlightMask(float lum, float balance) {
    float center = 0.67 + balance / 300.0;
    return smoothstep(0.0, 0.5, lum - center + 0.25);
}

half4 main(float2 pos) {
    half4 color = image.eval(pos);
    float3 rgb = float3(color.r, color.g, color.b);
    float lum = getLuminance(rgb);
    
    // Calculate masks for each tonal range
    float shadowWeight = shadowMask(lum, balance / 100.0);
    float midtoneWeight = midtoneMask(lum, balance / 100.0);
    float highlightWeight = highlightMask(lum, balance / 100.0);
    
    // Normalize weights
    float totalWeight = shadowWeight + midtoneWeight + highlightWeight;
    if (totalWeight > 0.0) {
        shadowWeight /= totalWeight;
        midtoneWeight /= totalWeight;
        highlightWeight /= totalWeight;
    }
    
    // Convert blending from 0-100 to 0-1
    float blendFactor = blending / 100.0;
    
    // Apply shadow grading
    float3 shadowTint = hueToTint(shadowHue, shadowSat);
    rgb = mix(rgb, rgb * shadowTint, shadowWeight * blendFactor);
    rgb += shadowLum * shadowWeight * blendFactor * 0.3;
    
    // Apply midtone grading
    float3 midtoneTint = hueToTint(midtoneHue, midtoneSat);
    rgb = mix(rgb, rgb * midtoneTint, midtoneWeight * blendFactor);
    rgb += midtoneLum * midtoneWeight * blendFactor * 0.3;
    
    // Apply highlight grading
    float3 highlightTint = hueToTint(highlightHue, highlightSat);
    rgb = mix(rgb, rgb * highlightTint, highlightWeight * blendFactor);
    rgb += highlightLum * highlightWeight * blendFactor * 0.3;
    
    // Apply global grading
    float3 globalTint = hueToTint(globalHue, globalSat);
    rgb = mix(rgb, rgb * globalTint, blendFactor * 0.5);
    rgb += globalLum * blendFactor * 0.2;
    
    return half4(clamp(rgb.r, 0.0, 1.0), clamp(rgb.g, 0.0, 1.0), clamp(rgb.b, 0.0, 1.0), color.a);
}
`;

// ============================================================================
// Grading Uniform Preparation
// ============================================================================

import type { GradingAdjustment, GradeRegion } from '../../model/types';

/**
 * Prepare grading uniforms for the shader.
 */
export function prepareGradingUniforms(grading: GradingAdjustment): {
  shadowHue: number;
  shadowSat: number;
  shadowLum: number;
  midtoneHue: number;
  midtoneSat: number;
  midtoneLum: number;
  highlightHue: number;
  highlightSat: number;
  highlightLum: number;
  globalHue: number;
  globalSat: number;
  globalLum: number;
  blending: number;
  balance: number;
} {
  return {
    shadowHue: grading.shadows.hue,
    shadowSat: grading.shadows.saturation,
    shadowLum: grading.shadows.luminance,
    midtoneHue: grading.midtones.hue,
    midtoneSat: grading.midtones.saturation,
    midtoneLum: grading.midtones.luminance,
    highlightHue: grading.highlights.hue,
    highlightSat: grading.highlights.saturation,
    highlightLum: grading.highlights.luminance,
    globalHue: grading.global.hue,
    globalSat: grading.global.saturation,
    globalLum: grading.global.luminance,
    blending: grading.blending,
    balance: grading.balance,
  };
}

/**
 * Check if any grading adjustments are non-default.
 */
export function hasGradingAdjustments(grading: GradingAdjustment): boolean {
  const isDefaultRegion = (r: GradeRegion) =>
    r.hue === 0 && r.saturation === 0 && r.luminance === 0;

  return (
    !isDefaultRegion(grading.shadows) ||
    !isDefaultRegion(grading.midtones) ||
    !isDefaultRegion(grading.highlights) ||
    !isDefaultRegion(grading.global) ||
    grading.blending !== 50 ||
    grading.balance !== 0
  );
}
