/**
 * Tests for PocketLab Engine — Color Space Utilities
 */

import {
  srgbToLinear,
  linearToSrgb,
  rgbToLinear,
  linearToRgb,
  linearRgbToXyz,
  xyzToLinearRgb,
  xyzToLab,
  labToXyz,
  getLuminance,
  getLuminanceFromSrgb,
  clamp,
  clampRgb,
  type RGB,
  type LinearRGB,
} from '../colorSpace';

describe('sRGB Gamma Conversions', () => {
  describe('srgbToLinear', () => {
    it('should convert 0 to 0', () => {
      expect(srgbToLinear(0)).toBeCloseTo(0, 5);
    });

    it('should convert 1 to 1', () => {
      expect(srgbToLinear(1)).toBeCloseTo(1, 5);
    });

    it('should convert 0.5 to approximately 0.214', () => {
      expect(srgbToLinear(0.5)).toBeCloseTo(0.214, 2);
    });

    it('should handle linear segment (values <= 0.04045)', () => {
      const value = 0.04;
      expect(srgbToLinear(value)).toBeCloseTo(value / 12.92, 5);
    });
  });

  describe('linearToSrgb', () => {
    it('should convert 0 to 0', () => {
      expect(linearToSrgb(0)).toBeCloseTo(0, 5);
    });

    it('should convert 1 to 1', () => {
      expect(linearToSrgb(1)).toBeCloseTo(1, 5);
    });

    it('should be inverse of srgbToLinear', () => {
      const values = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0];
      for (const v of values) {
        const linear = srgbToLinear(v);
        const srgb = linearToSrgb(linear);
        expect(srgb).toBeCloseTo(v, 4);
      }
    });
  });

  describe('rgbToLinear and linearToRgb', () => {
    it('should round-trip correctly', () => {
      const rgb: RGB = { r: 0.5, g: 0.3, b: 0.8 };
      const linear = rgbToLinear(rgb);
      const back = linearToRgb(linear);
      
      expect(back.r).toBeCloseTo(rgb.r, 4);
      expect(back.g).toBeCloseTo(rgb.g, 4);
      expect(back.b).toBeCloseTo(rgb.b, 4);
    });

    it('should handle black', () => {
      const rgb: RGB = { r: 0, g: 0, b: 0 };
      const linear = rgbToLinear(rgb);
      expect(linear.r).toBe(0);
      expect(linear.g).toBe(0);
      expect(linear.b).toBe(0);
    });

    it('should handle white', () => {
      const rgb: RGB = { r: 1, g: 1, b: 1 };
      const linear = rgbToLinear(rgb);
      expect(linear.r).toBeCloseTo(1, 5);
      expect(linear.g).toBeCloseTo(1, 5);
      expect(linear.b).toBeCloseTo(1, 5);
    });
  });
});

describe('XYZ Conversions', () => {
  it('should round-trip linear RGB to XYZ', () => {
    const linear: LinearRGB = { r: 0.5, g: 0.3, b: 0.8 };
    const xyz = linearRgbToXyz(linear);
    const back = xyzToLinearRgb(xyz);
    
    expect(back.r).toBeCloseTo(linear.r, 3);
    expect(back.g).toBeCloseTo(linear.g, 3);
    expect(back.b).toBeCloseTo(linear.b, 3);
  });

  it('should convert white to D65 white point', () => {
    const white: LinearRGB = { r: 1, g: 1, b: 1 };
    const xyz = linearRgbToXyz(white);
    
    // D65 white point
    expect(xyz.x).toBeCloseTo(0.95047, 3);
    expect(xyz.y).toBeCloseTo(1.0, 3);
    expect(xyz.z).toBeCloseTo(1.08883, 3);
  });
});

describe('Lab Conversions', () => {
  it('should round-trip XYZ to Lab', () => {
    const xyz = { x: 0.5, y: 0.5, z: 0.5 };
    const lab = xyzToLab(xyz);
    const back = labToXyz(lab);
    
    expect(back.x).toBeCloseTo(xyz.x, 3);
    expect(back.y).toBeCloseTo(xyz.y, 3);
    expect(back.z).toBeCloseTo(xyz.z, 3);
  });

  it('should convert D65 white to L=100, a=0, b=0', () => {
    const d65 = { x: 0.95047, y: 1.0, z: 1.08883 };
    const lab = xyzToLab(d65);
    
    expect(lab.l).toBeCloseTo(100, 1);
    expect(lab.a).toBeCloseTo(0, 1);
    expect(lab.b).toBeCloseTo(0, 1);
  });

  it('should convert black to L=0', () => {
    const black = { x: 0, y: 0, z: 0 };
    const lab = xyzToLab(black);
    
    expect(lab.l).toBeCloseTo(0, 1);
  });
});

describe('Luminance', () => {
  it('should calculate luminance for white', () => {
    const white: LinearRGB = { r: 1, g: 1, b: 1 };
    const lum = getLuminance(white);
    expect(lum).toBeCloseTo(1, 3);
  });

  it('should calculate luminance for black', () => {
    const black: LinearRGB = { r: 0, g: 0, b: 0 };
    const lum = getLuminance(black);
    expect(lum).toBe(0);
  });

  it('should weight green highest', () => {
    const red: LinearRGB = { r: 1, g: 0, b: 0 };
    const green: LinearRGB = { r: 0, g: 1, b: 0 };
    const blue: LinearRGB = { r: 0, g: 0, b: 1 };
    
    expect(getLuminance(green)).toBeGreaterThan(getLuminance(red));
    expect(getLuminance(green)).toBeGreaterThan(getLuminance(blue));
  });

  it('should calculate luminance from sRGB', () => {
    const white: RGB = { r: 1, g: 1, b: 1 };
    const lum = getLuminanceFromSrgb(white);
    expect(lum).toBeCloseTo(1, 3);
  });
});

describe('Clamping', () => {
  it('should clamp values within range', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it('should clamp values below min', () => {
    expect(clamp(-0.5, 0, 1)).toBe(0);
  });

  it('should clamp values above max', () => {
    expect(clamp(1.5, 0, 1)).toBe(1);
  });

  it('should clamp RGB values', () => {
    const rgb: RGB = { r: -0.1, g: 0.5, b: 1.2 };
    const clamped = clampRgb(rgb);
    
    expect(clamped.r).toBe(0);
    expect(clamped.g).toBe(0.5);
    expect(clamped.b).toBe(1);
  });
});
