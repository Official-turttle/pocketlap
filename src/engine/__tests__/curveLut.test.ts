/**
 * Tests for PocketLab Engine — Curve LUT Baking
 */

import {
  bakeCurveLut,
  addCurvePoint,
  removeCurvePoint,
  moveCurvePoint,
  resetCurve,
  findClosestCurvePoint,
} from '../curveLut';
import type { Curve } from '../../model/types';

describe('Curve LUT Baking', () => {
  describe('bakeCurveLut', () => {
    it('should bake a linear curve to identity', () => {
      const curve: Curve = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      };

      const lut = bakeCurveLut(curve);

      expect(lut.width).toBe(256);
      expect(lut.height).toBe(1);
      expect(lut.values.length).toBe(256);

      // Should be approximately identity
      expect(lut.values[0]).toBe(0);
      expect(lut.values[127]).toBeCloseTo(127, 0);
      expect(lut.values[255]).toBe(255);
    });

    it('should bake an S-curve correctly', () => {
      const curve: Curve = {
        points: [
          { x: 0, y: 0 },
          { x: 0.25, y: 0.1 },
          { x: 0.5, y: 0.5 },
          { x: 0.75, y: 0.9 },
          { x: 1, y: 1 },
        ],
      };

      const lut = bakeCurveLut(curve);

      // Midtones should be boosted
      expect(lut.values[127]).toBeGreaterThan(127);
    });

    it('should handle single-point curve as linear', () => {
      const curve: Curve = {
        points: [{ x: 0.5, y: 0.5 }],
      };

      const lut = bakeCurveLut(curve);

      // Should fall back to linear
      expect(lut.values[0]).toBe(0);
      expect(lut.values[255]).toBe(255);
    });

    it('should clamp values to 0-255', () => {
      const curve: Curve = {
        points: [
          { x: 0, y: -0.5 }, // Below 0
          { x: 1, y: 1.5 }, // Above 1
        ],
      };

      const lut = bakeCurveLut(curve);

      // All values should be clamped
      for (let i = 0; i < 256; i++) {
        expect(lut.values[i]).toBeGreaterThanOrEqual(0);
        expect(lut.values[i]).toBeLessThanOrEqual(255);
      }
    });
  });

  describe('addCurvePoint', () => {
    it('should add a point in sorted order', () => {
      const curve: Curve = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      };

      const result = addCurvePoint(curve, { x: 0.5, y: 0.5 });

      expect(result.points).toHaveLength(3);
      expect(result.points[1]).toEqual({ x: 0.5, y: 0.5 });
    });

    it('should maintain sorted order', () => {
      const curve: Curve = {
        points: [
          { x: 0, y: 0 },
          { x: 0.7, y: 0.7 },
          { x: 1, y: 1 },
        ],
      };

      const result = addCurvePoint(curve, { x: 0.3, y: 0.3 });

      expect(result.points[1].x).toBe(0.3);
      expect(result.points[2].x).toBe(0.7);
    });
  });

  describe('removeCurvePoint', () => {
    it('should remove a point', () => {
      const curve: Curve = {
        points: [
          { x: 0, y: 0 },
          { x: 0.5, y: 0.5 },
          { x: 1, y: 1 },
        ],
      };

      const result = removeCurvePoint(curve, 1);

      expect(result.points).toHaveLength(2);
      expect(result.points[0].x).toBe(0);
      expect(result.points[1].x).toBe(1);
    });

    it('should not remove endpoints', () => {
      const curve: Curve = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      };

      const result = removeCurvePoint(curve, 0);

      expect(result.points).toHaveLength(2); // Unchanged
    });
  });

  describe('moveCurvePoint', () => {
    it('should move a point', () => {
      const curve: Curve = {
        points: [
          { x: 0, y: 0 },
          { x: 0.5, y: 0.5 },
          { x: 1, y: 1 },
        ],
      };

      const result = moveCurvePoint(curve, 1, 0.6, 0.7);

      expect(result.points[1].x).toBeCloseTo(0.6, 1);
      expect(result.points[1].y).toBeCloseTo(0.7, 1);
    });

    it('should only move endpoints vertically', () => {
      const curve: Curve = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      };

      const result = moveCurvePoint(curve, 0, 0.5, 0.2);

      // X should remain 0 (endpoint)
      expect(result.points[0].x).toBe(0);
      expect(result.points[0].y).toBeCloseTo(0.2, 1);
    });
  });

  describe('resetCurve', () => {
    it('should return default linear curve', () => {
      const curve = resetCurve();

      expect(curve.points).toHaveLength(2);
      expect(curve.points[0]).toEqual({ x: 0, y: 0 });
      expect(curve.points[1]).toEqual({ x: 1, y: 1 });
    });
  });

  describe('findClosestCurvePoint', () => {
    it('should find the closest point', () => {
      const curve: Curve = {
        points: [
          { x: 0, y: 0 },
          { x: 0.5, y: 0.5 },
          { x: 1, y: 1 },
        ],
      };

      const index = findClosestCurvePoint(curve, 0.48, 0.52);

      expect(index).toBe(1);
    });

    it('should return -1 if no point is close enough', () => {
      const curve: Curve = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      };

      const index = findClosestCurvePoint(curve, 0.5, 0.5, 0.1);

      expect(index).toBe(-1);
    });
  });
});
