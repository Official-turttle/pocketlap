/**
 * PocketLab Engine — Mask Shaders
 * 
 * Analytic mask evaluation for linear and radial gradients.
 * Brush masks are rasterized separately (see brushMask.ts).
 */

// ============================================================================
// Linear Gradient Mask Shader
// ============================================================================

/**
 * Linear gradient mask shader.
 * Creates a smooth transition between two points.
 * 
 * Uniforms:
 * - startX, startY: start point (normalized 0-1)
 * - endX, endY: end point (normalized 0-1)
 * - feather: feather amount (0-1)
 * - inverted: 0 or 1
 * - opacity: 0-1
 */
export const LINEAR_MASK_SHADER = `
uniform shader image;
uniform float startX;
uniform float startY;
uniform float endX;
uniform float endY;
uniform float feather;
uniform float inverted;
uniform float opacity;

half4 main(float2 pos) {
    half4 color = image.eval(pos);
    
    // Normalize position to 0-1
    float2 uv = pos / float2(1.0); // Assuming shader provides image dimensions
    
    // Calculate gradient direction
    float2 start = float2(startX, startY);
    float2 end = float2(endX, endY);
    float2 direction = end - start;
    float length = length(direction);
    
    if (length < 0.001) {
        return half4(color.rgb, color.a * opacity * (1.0 - inverted));
    }
    
    direction = direction / length;
    
    // Project UV onto gradient direction
    float2 toPoint = uv - start;
    float projection = dot(toPoint, direction);
    
    // Normalize to 0-1 along gradient
    float t = projection / length;
    
    // Apply feather (smooth transition)
    float featherAmount = max(0.001, feather);
    float mask = smoothstep(0.5 - featherAmount, 0.5 + featherAmount, t);
    
    // Apply inversion
    if (inverted > 0.5) {
        mask = 1.0 - mask;
    }
    
    // Apply opacity
    mask *= opacity;
    
    return half4(color.rgb, color.a * mask);
}
`;

// ============================================================================
// Radial Gradient Mask Shader
// ============================================================================

/**
 * Radial gradient mask shader.
 * Creates a smooth circular/elliptical gradient.
 * 
 * Uniforms:
 * - centerX, centerY: center point (normalized 0-1)
 * - radiusX, radiusY: radii (normalized 0-1)
 * - rotation: rotation in degrees
 * - feather: feather amount (0-1)
 * - inverted: 0 or 1
 * - opacity: 0-1
 */
export const RADIAL_MASK_SHADER = `
uniform shader image;
uniform float centerX;
uniform float centerY;
uniform float radiusX;
uniform float radiusY;
uniform float rotation;
uniform float feather;
uniform float inverted;
uniform float opacity;

half4 main(float2 pos) {
    half4 color = image.eval(pos);
    
    // Normalize position to 0-1
    float2 uv = pos / float2(1.0);
    
    float2 center = float2(centerX, centerY);
    
    // Apply rotation
    float angle = rotation * 3.14159265359 / 180.0;
    float cosA = cos(-angle);
    float sinA = sin(-angle);
    
    float2 translated = uv - center;
    float2 rotated = float2(
        translated.x * cosA - translated.y * sinA,
        translated.x * sinA + translated.y * cosA
    );
    
    // Calculate distance from center (elliptical)
    float rx = max(0.001, radiusX);
    float ry = max(0.001, radiusY);
    float dist = sqrt((rotated.x * rotated.x) / (rx * rx) + (rotated.y * rotated.y) / (ry * ry));
    
    // Apply feather
    float featherAmount = max(0.001, feather);
    float mask = 1.0 - smoothstep(1.0 - featherAmount, 1.0 + featherAmount, dist);
    
    // Apply inversion
    if (inverted > 0.5) {
        mask = 1.0 - mask;
    }
    
    // Apply opacity
    mask *= opacity;
    
    return half4(color.rgb, color.a * mask);
}
`;

// ============================================================================
// Mask Compositing
// ============================================================================

/**
 * Mask compositing shader.
 * Blends the adjusted image with the original based on mask coverage.
 * 
 * result = mix(original, adjusted, coverage)
 * 
 * Uniforms:
 * - original: the original image
 * - adjusted: the image with mask adjustments applied
 * - mask: the mask coverage (single channel)
 */
export const MASK_COMPOSITE_SHADER = `
uniform shader original;
uniform shader adjusted;
uniform shader mask;

half4 main(float2 pos) {
    half4 origColor = original.eval(pos);
    half4 adjColor = adjusted.eval(pos);
    half maskValue = mask.eval(pos).r; // Use red channel as coverage
    
    // Blend based on mask coverage
    return mix(origColor, adjColor, maskValue);
}
`;

// ============================================================================
// Mask Uniform Preparation
// ============================================================================

import type { Mask } from '../../model/types';

/**
 * Prepare linear mask uniforms for the shader.
 */
export function prepareLinearMaskUniforms(mask: Mask): {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  feather: number;
  inverted: number;
  opacity: number;
} | null {
  if (mask.shape.type !== 'linear') {
    return null;
  }

  return {
    startX: mask.shape.start.x,
    startY: mask.shape.start.y,
    endX: mask.shape.end.x,
    endY: mask.shape.end.y,
    feather: mask.shape.feather,
    inverted: mask.inverted ? 1 : 0,
    opacity: mask.opacity,
  };
}

/**
 * Prepare radial mask uniforms for the shader.
 */
export function prepareRadialMaskUniforms(mask: Mask): {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  feather: number;
  inverted: number;
  opacity: number;
} | null {
  if (mask.shape.type !== 'radial') {
    return null;
  }

  return {
    centerX: mask.shape.center.x,
    centerY: mask.shape.center.y,
    radiusX: mask.shape.radiusX,
    radiusY: mask.shape.radiusY,
    rotation: mask.shape.rotation,
    feather: mask.shape.feather,
    inverted: mask.inverted ? 1 : 0,
    opacity: mask.opacity,
  };
}

/**
 * Check if a mask is visible and should be applied.
 */
export function isMaskActive(mask: Mask): boolean {
  return mask.visible && mask.opacity > 0;
}

/**
 * Get active masks from a mask list.
 */
export function getActiveMasks(masks: Mask[]): Mask[] {
  return masks.filter(isMaskActive);
}
