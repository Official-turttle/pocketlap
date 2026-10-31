/**
 * PocketLab Engine — Curve LUT Baking
 * 
 * Bakes curve control points into a 256x1 LUT texture.
 * Uses monotone cubic interpolation for smooth curves.
 */

import type { Curve, Point } from '../../model/types';

// ============================================================================
// Types
// ============================================================================

export interface LutData {
  /** 256 values, each 0-255 */
  values: Uint8Array;
  /** Width (always 256) */
  width: number;
  /** Height (always 1) */
  height: number;
}

// ============================================================================
// Monotone Cubic Interpolation
// ============================================================================

/**
 * Calculate monotone cubic spline tangents.
 * Ensures the curve doesn't overshoot between control points.
 */
function calculateTangents(points: Point[]): number[] {
  const n = points.length;
  if (n < 2) return [0];
  
  const tangents: number[] = new Array(n);
  const deltas: number[] = [];
  const slopes: number[] = [];
  
  // Calculate slopes between consecutive points
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    deltas.push(dx);
    slopes.push(dy / dx);
  }
  
  // Calculate tangents using Fritsch-Carlson method
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  
  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents[i] = 0;
    } else {
      const common = deltas[i - 1] + deltas[i];
      tangents[i] = (3 * common) / ((common + deltas[i]) / slopes[i - 1] + (common + deltas[i - 1]) / slopes[i]);
    }
  }
  
  return tangents;
}

/**
 * Evaluate monotone cubic spline at a given x value.
 */
function evaluateSpline(
  points: Point[],
  tangents: number[],
  x: number
): number {
  const n = points.length;
  
  // Find the segment containing x
  let i = 0;
  while (i < n - 1 && points[i + 1].x < x) {
    i++;
  }
  
  if (i >= n - 1) {
    return points[n - 1].y;
  }
  
  const p0 = points[i];
  const p1 = points[i + 1];
  const t0 = tangents[i];
  const t1 = tangents[i + 1];
  
  const dx = p1.x - p0.x;
  const t = (x - p0.x) / dx;
  
  // Hermite basis functions
  const h00 = 2 * t * t * t - 3 * t * t + 1;
  const h10 = t * t * t - 2 * t * t + t;
  const h01 = -2 * t * t * t + 3 * t * t;
  const h11 = t * t * t - t * t;
  
  // Evaluate
  const y = h00 * p0.y + h10 * dx * t0 + h01 * p1.y + h11 * dx * t1;
  
  return y;
}

// ============================================================================
// LUT Baking
// ============================================================================

/**
 * Bake a curve into a 256x1 LUT.
 * 
 * @param curve - The curve with control points
 * @returns LUT data with 256 values
 */
export function bakeCurveLut(curve: Curve): LutData {
  const values = new Uint8Array(256);
  
  // Ensure curve has at least 2 points
  if (curve.points.length < 2) {
    // Default to linear
    for (let i = 0; i < 256; i++) {
      values[i] = i;
    }
    return { values, width: 256, height: 1 };
  }
  
  // Sort points by x
  const sortedPoints = [...curve.points].sort((a, b) => a.x - b.x);
  
  // Ensure endpoints are present
  if (sortedPoints[0].x !== 0) {
    sortedPoints.unshift({ x: 0, y: sortedPoints[0].y });
  }
  if (sortedPoints[sortedPoints.length - 1].x !== 1) {
    sortedPoints.push({ x: 1, y: sortedPoints[sortedPoints.length - 1].y });
  }
  
  // Calculate tangents
  const tangents = calculateTangents(sortedPoints);
  
  // Sample the curve at 256 points
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    let y = evaluateSpline(sortedPoints, tangents, x);
    
    // Clamp to 0-1 range
    y = Math.max(0, Math.min(1, y));
    
    // Convert to 0-255
    values[i] = Math.round(y * 255);
  }
  
  return { values, width: 256, height: 1 };
}

/**
 * Bake all four curves (master, R, G, B) into LUTs.
 */
export function bakeAllCurveLuts(curves: {
  master: Curve;
  red: Curve;
  green: Curve;
  blue: Curve;
}): {
  master: LutData;
  red: LutData;
  green: LutData;
  blue: LutData;
} {
  return {
    master: bakeCurveLut(curves.master),
    red: bakeCurveLut(curves.red),
    green: bakeCurveLut(curves.green),
    blue: bakeCurveLut(curves.blue),
  };
}

// ============================================================================
// Curve Operations
// ============================================================================

/**
 * Add a point to a curve.
 * Maintains sorted order by x.
 */
export function addCurvePoint(curve: Curve, point: Point): Curve {
  const newPoints = [...curve.points];
  
  // Find insertion index
  let insertIndex = newPoints.length;
  for (let i = 0; i < newPoints.length; i++) {
    if (newPoints[i].x > point.x) {
      insertIndex = i;
      break;
    }
  }
  
  newPoints.splice(insertIndex, 0, point);
  
  return { points: newPoints };
}

/**
 * Remove a point from a curve.
 * Cannot remove endpoints (x=0 or x=1).
 */
export function removeCurvePoint(curve: Curve, index: number): Curve {
  const point = curve.points[index];
  
  // Cannot remove endpoints
  if (point.x === 0 || point.x === 1) {
    return curve;
  }
  
  const newPoints = [...curve.points];
  newPoints.splice(index, 1);
  
  return { points: newPoints };
}

/**
 * Move a point on a curve.
 * Endpoints can only move vertically.
 */
export function moveCurvePoint(
  curve: Curve,
  index: number,
  newX: number,
  newY: number
): Curve {
  const newPoints = [...curve.points];
  const point = newPoints[index];
  
  // Endpoints can only move vertically
  if (point.x === 0 || point.x === 1) {
    newPoints[index] = { x: point.x, y: Math.max(0, Math.min(1, newY)) };
  } else {
    // Other points can move freely, but maintain sorted order
    newPoints[index] = {
      x: Math.max(0, Math.min(1, newX)),
      y: Math.max(0, Math.min(1, newY)),
    };
    
    // Re-sort if needed
    newPoints.sort((a, b) => a.x - b.x);
  }
  
  return { points: newPoints };
}

/**
 * Reset a curve to the default (straight line).
 */
export function resetCurve(): Curve {
  return {
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
  };
}

/**
 * Find the closest point on a curve to a given position.
 * Returns the index of the closest point, or -1 if none is close enough.
 */
export function findClosestCurvePoint(
  curve: Curve,
  x: number,
  y: number,
  threshold: number = 0.05
): number {
  let closestIndex = -1;
  let closestDistance = threshold;
  
  for (let i = 0; i < curve.points.length; i++) {
    const point = curve.points[i];
    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }
  
  return closestIndex;
}
