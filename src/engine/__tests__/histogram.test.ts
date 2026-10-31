/**
 * Tests for PocketLab Engine — Histogram Computation
 */

import {
  computeHistogram,
  detectClipping,
  createEmptyHistogram,
  mergeHistograms,
  normalizeHistogram,
} from '../histogram';

describe('Histogram Computation', () => {
  describe('computeHistogram', () => {
    it('should compute histogram for solid black', () => {
      const pixels = new Uint8Array([
        0, 0, 0, 255,
        0, 0, 0, 255,
        0, 0, 0, 255,
        0, 0, 0, 255,
      ]);
      
      const hist = computeHistogram(pixels, 2, 2);
      
      // All pixels should be in bin 0
      expect(hist.red[0]).toBeCloseTo(1, 1);
      expect(hist.green[0]).toBeCloseTo(1, 1);
      expect(hist.blue[0]).toBeCloseTo(1, 1);
      expect(hist.luminance[0]).toBeCloseTo(1, 1);
    });

    it('should compute histogram for solid white', () => {
      const pixels = new Uint8Array([
        255, 255, 255, 255,
        255, 255, 255, 255,
      ]);
      
      const hist = computeHistogram(pixels, 2, 1);
      
      // All pixels should be in bin 255
      expect(hist.red[255]).toBeCloseTo(1, 1);
      expect(hist.green[255]).toBeCloseTo(1, 1);
      expect(hist.blue[255]).toBeCloseTo(1, 1);
    });

    it('should compute histogram for mid-gray', () => {
      const pixels = new Uint8Array([
        128, 128, 128, 255,
      ]);
      
      const hist = computeHistogram(pixels, 1, 1);
      
      // Mid-gray should be around bin 128
      const maxRedBin = hist.red.indexOf(Math.max(...hist.red));
      expect(maxRedBin).toBeCloseTo(128, -1);
    });

    it('should handle empty image', () => {
      const pixels = new Uint8Array([]);
      const hist = computeHistogram(pixels, 0, 0);
      
      expect(hist.red.every(v => v === 0)).toBe(true);
    });
  });

  describe('detectClipping', () => {
    it('should detect highlight clipping', () => {
      const pixels = new Uint8Array([
        255, 255, 255, 255, // Clipped highlight
        128, 128, 128, 255, // Mid
        128, 128, 128, 255, // Mid
        128, 128, 128, 255, // Mid
      ]);
      
      const info = detectClipping(pixels, 2, 2);
      
      expect(info.highlightClipPercent).toBeCloseTo(25, 0);
      expect(info.shadowClipPercent).toBeCloseTo(0, 0);
      expect(info.showWarnings).toBe(true);
    });

    it('should detect shadow clipping', () => {
      const pixels = new Uint8Array([
        0, 0, 0, 255,       // Clipped shadow
        128, 128, 128, 255, // Mid
        128, 128, 128, 255, // Mid
        128, 128, 128, 255, // Mid
      ]);
      
      const info = detectClipping(pixels, 2, 2);
      
      expect(info.highlightClipPercent).toBeCloseTo(0, 0);
      expect(info.shadowClipPercent).toBeCloseTo(25, 0);
      expect(info.showWarnings).toBe(true);
    });

    it('should not warn for normal images', () => {
      const pixels = new Uint8Array([
        64, 64, 64, 255,
        128, 128, 128, 255,
        192, 192, 192, 255,
        128, 128, 128, 255,
      ]);
      
      const info = detectClipping(pixels, 2, 2);
      
      expect(info.showWarnings).toBe(false);
    });
  });

  describe('createEmptyHistogram', () => {
    it('should create histogram with all zeros', () => {
      const hist = createEmptyHistogram();
      
      expect(hist.red.length).toBe(256);
      expect(hist.red.every(v => v === 0)).toBe(true);
      expect(hist.green.every(v => v === 0)).toBe(true);
      expect(hist.blue.every(v => v === 0)).toBe(true);
      expect(hist.luminance.every(v => v === 0)).toBe(true);
    });
  });

  describe('mergeHistograms', () => {
    it('should add histograms together', () => {
      const a = createEmptyHistogram();
      const b = createEmptyHistogram();
      a.red[0] = 10;
      b.red[0] = 5;
      
      const merged = mergeHistograms(a, b);
      
      expect(merged.red[0]).toBe(15);
    });
  });

  describe('normalizeHistogram', () => {
    it('should normalize to 0-1 range', () => {
      const hist = createEmptyHistogram();
      hist.red[0] = 100;
      hist.red[128] = 50;
      
      const normalized = normalizeHistogram(hist);
      
      expect(normalized.red[0]).toBeCloseTo(1, 2);
      expect(normalized.red[128]).toBeCloseTo(0.5, 2);
    });

    it('should handle all-zero histogram', () => {
      const hist = createEmptyHistogram();
      const normalized = normalizeHistogram(hist);
      
      expect(normalized.red.every(v => v === 0)).toBe(true);
    });
  });
});
