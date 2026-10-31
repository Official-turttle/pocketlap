/**
 * PocketLab Engine — SkSL Shaders
 * 
 * Collection of SkSL shader sources for image adjustments.
 * These are compiled at runtime by React Native Skia.
 */

// ============================================================================
// White Balance & Exposure
// ============================================================================

/**
 * White balance and exposure adjustment.
 * Operates in linear light space.
 * 
 * Uniforms:
 * - temperature: -100 to 100 (cool to warm)
 * - tint: -100 to 100 (green to magenta)
 * - exposure: -5 to 5 (EV stops)
 */
export const WHITE_BALANCE_EXPOSURE_SHADER = `
uniform shader image;
uniform float temperature;  // -100 to 100
uniform float tint;         // -100 to 100
uniform float exposure;     // -5 to 5 (EV)

// sRGB to linear
float srgbToLinear(float c) {
    return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4);
}

// Linear to sRGB
float linearToSrgb(float c) {
    return c <= 0.0031308 ? c * 12.92 : 1.055 * pow(c, 1.0 / 2.4) - 0.055;
}

half4 main(float2 pos) {
    half4 color = image.eval(pos);
    
    // Convert to linear
    float r = srgbToLinear(color.r);
    float g = srgbToLinear(color.g);
    float b = srgbToLinear(color.b);
    
    // Apply exposure (in linear space)
    float exposureMult = pow(2.0, exposure);
    r *= exposureMult;
    g *= exposureMult;
    b *= exposureMult;
    
    // Apply white balance (simplified)
    // Temperature: shift red/blue
    float tempFactor = temperature / 100.0;
    r *= 1.0 + tempFactor * 0.1;
    b *= 1.0 - tempFactor * 0.1;
    
    // Tint: shift green/magenta
    float tintFactor = tint / 100.0;
    g *= 1.0 + tintFactor * 0.1;
    
    // Convert back to sRGB
    return half4(
        linearToSrgb(clamp(r, 0.0, 1.0)),
        linearToSrgb(clamp(g, 0.0, 1.0)),
        linearToSrgb(clamp(b, 0.0, 1.0)),
        color.a
    );
}
`;

// ============================================================================
// Tone Adjustments
// ============================================================================

/**
 * Tone adjustments: brightness, contrast, highlights, shadows, whites, blacks.
 * Operates in gamma-encoded space for user-friendly behavior.
 * 
 * Uniforms:
 * - brightness: -100 to 100
 * - contrast: -100 to 100
 * - highlights: -100 to 100
 * - shadows: -100 to 100
 * - whites: -100 to 100
 * - blacks: -100 to 100
 */
export const TONE_SHADER = `
uniform shader image;
uniform float brightness;   // -100 to 100
uniform float contrast;     // -100 to 100
uniform float highlights;   // -100 to 100
uniform float shadows;      // -100 to 100
uniform float whites;       // -100 to 100
uniform float blacks;       // -100 to 100

// Calculate luminance
float getLuminance(float3 c) {
    return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

half4 main(float2 pos) {
    half4 color = image.eval(pos);
    float3 rgb = float3(color.r, color.g, color.b);
    float lum = getLuminance(rgb);
    
    // Brightness (additive)
    float brightAdj = brightness / 100.0;
    rgb += brightAdj;
    
    // Contrast (scale around 0.5)
    float contFactor = (contrast + 100.0) / 100.0;
    rgb = (rgb - 0.5) * contFactor + 0.5;
    
    // Highlights (affect bright areas)
    float highlightMask = smoothstep(0.5, 1.0, lum);
    float highlightAdj = highlights / 100.0;
    rgb += highlightMask * highlightAdj * 0.5;
    
    // Shadows (affect dark areas)
    float shadowMask = 1.0 - smoothstep(0.0, 0.5, lum);
    float shadowAdj = shadows / 100.0;
    rgb += shadowMask * shadowAdj * 0.5;
    
    // Whites (affect brightest areas)
    float whiteMask = smoothstep(0.8, 1.0, lum);
    float whiteAdj = whites / 100.0;
    rgb += whiteMask * whiteAdj * 0.3;
    
    // Blacks (affect darkest areas)
    float blackMask = 1.0 - smoothstep(0.0, 0.2, lum);
    float blackAdj = blacks / 100.0;
    rgb += blackMask * blackAdj * 0.3;
    
    return half4(
        clamp(rgb.r, 0.0, 1.0),
        clamp(rgb.g, 0.0, 1.0),
        clamp(rgb.b, 0.0, 1.0),
        color.a
    );
}
`;

// ============================================================================
// Color Adjustments
// ============================================================================

/**
 * Vibrance and saturation adjustments.
 * 
 * Uniforms:
 * - vibrance: -100 to 100 (boosts muted colors more than saturated)
 * - saturation: -100 to 100 (uniform saturation adjustment)
 */
export const COLOR_SHADER = `
uniform shader image;
uniform float vibrance;     // -100 to 100
uniform float saturation;   // -100 to 100

float getLuminance(float3 c) {
    return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

half4 main(float2 pos) {
    half4 color = image.eval(pos);
    float3 rgb = float3(color.r, color.g, color.b);
    float lum = getLuminance(rgb);
    
    // Saturation (uniform)
    float satFactor = (saturation + 100.0) / 100.0;
    rgb = mix(float3(lum), rgb, satFactor);
    
    // Vibrance (boosts muted colors more)
    float maxChannel = max(max(rgb.r, rgb.g), rgb.b);
    float minChannel = min(min(rgb.r, rgb.g), rgb.b);
    float currentSat = maxChannel - minChannel;
    
    // Vibrance effect is inversely proportional to current saturation
    float vibFactor = vibrance / 100.0;
    float vibranceAmount = vibFactor * (1.0 - currentSat);
    
    rgb = mix(float3(lum), rgb, 1.0 + vibranceAmount);
    
    return half4(
        clamp(rgb.r, 0.0, 1.0),
        clamp(rgb.g, 0.0, 1.0),
        clamp(rgb.b, 0.0, 1.0),
        color.a
    );
}
`;

// ============================================================================
// Curves (LUT-based)
// ============================================================================

/**
 * Tone curves using a 1D LUT texture.
 * Each curve (master, R, G, B) is baked into a 256x1 texture.
 * 
 * Uniforms:
 * - masterLut: 256x1 texture for master curve
 * - redLut: 256x1 texture for red curve
 * - greenLut: 256x1 texture for green curve
 * - blueLut: 256x1 texture for blue curve
 */
export const CURVES_SHADER = `
uniform shader image;
uniform shader masterLut;
uniform shader redLut;
uniform shader greenLut;
uniform shader blueLut;

half4 main(float2 pos) {
    half4 color = image.eval(pos);
    
    // Sample LUTs (using x coordinate as input value)
    float masterVal = masterLut.eval(float2(color.r, 0.5)).r;
    float redVal = redLut.eval(float2(color.r, 0.5)).r;
    float greenVal = greenLut.eval(float2(color.g, 0.5)).g;
    float blueVal = blueLut.eval(float2(color.b, 0.5)).b;
    
    // Apply master curve first, then channel curves
    float r = redLut.eval(float2(masterVal, 0.5)).r;
    float g = greenLut.eval(float2(masterVal, 0.5)).g;
    float b = blueLut.eval(float2(masterVal, 0.5)).b;
    
    return half4(
        clamp(r, 0.0, 1.0),
        clamp(g, 0.0, 1.0),
        clamp(b, 0.0, 1.0),
        color.a
    );
}
`;

// ============================================================================
// Output Transform
// ============================================================================

/**
 * Final output transform.
 * Handles color space conversion and final gamma.
 * 
 * Uniforms:
 * - outputGamma: gamma value for output (typically 2.2 for sRGB)
 */
export const OUTPUT_SHADER = `
uniform shader image;
uniform float outputGamma;

half4 main(float2 pos) {
    half4 color = image.eval(pos);
    
    // Apply output gamma if needed
    // For sRGB output, the image is already in sRGB space
    // This shader is a placeholder for future color management
    
    return color;
}
`;
