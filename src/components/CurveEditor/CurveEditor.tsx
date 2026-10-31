/**
 * PocketLab — Curve Editor
 * 
 * Interactive curve editor for RGB tone curves.
 * Supports add/move/remove points with monotone cubic interpolation.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Canvas, Path, Circle, Line, Skia } from 'react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import type { Curve, Point, CurvesAdjustment } from '../../model/types';
import {
  addCurvePoint,
  removeCurvePoint,
  moveCurvePoint,
  resetCurve,
  findClosestCurvePoint,
} from '../../engine/color/curveLut';

// ============================================================================
// Types
// ============================================================================

export type CurveChannel = 'master' | 'red' | 'green' | 'blue';

export interface CurveEditorProps {
  /** Current curves */
  curves: CurvesAdjustment;
  /** Currently selected channel */
  channel: CurveChannel;
  /** Called when curve changes */
  onChange: (channel: CurveChannel, curve: Curve) => void;
  /** Called to commit changes */
  onCommit: (channel: CurveChannel, curve: Curve) => void;
  /** Called to reset a channel */
  onReset: (channel: CurveChannel) => void;
}

// ============================================================================
// Constants
// ============================================================================

const CHANNEL_COLORS: Record<CurveChannel, string> = {
  master: '#ffffff',
  red: '#ff4444',
  green: '#44ff44',
  blue: '#4488ff',
};

const EDITOR_SIZE = 200;
const POINT_RADIUS = 6;

// ============================================================================
// Component
// ============================================================================

export const CurveEditor: React.FC<CurveEditorProps> = ({
  curves,
  channel,
  onChange,
  onCommit,
  onReset,
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const currentCurve = curves[channel];

  // Convert normalized coordinates to editor coordinates
  const toEditorCoords = (point: Point): { x: number; y: number } => ({
    x: point.x * EDITOR_SIZE,
    y: (1 - point.y) * EDITOR_SIZE, // Flip Y axis
  });

  // Convert editor coordinates to normalized
  const toNormalized = (x: number, y: number): Point => ({
    x: Math.max(0, Math.min(1, x / EDITOR_SIZE)),
    y: Math.max(0, Math.min(1, 1 - y / EDITOR_SIZE)), // Flip Y axis
  });

  // Build path string for the curve
  const buildCurvePath = useCallback((): string => {
    if (currentCurve.points.length < 2) return '';

    const sortedPoints = [...currentCurve.points].sort((a, b) => a.x - b.x);
    let path = '';

    for (let i = 0; i < sortedPoints.length; i++) {
      const { x, y } = toEditorCoords(sortedPoints[i]);
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }

    return path;
  }, [currentCurve]);

  // Handle tap to add/select point
  const handleTap = useCallback(
    (x: number, y: number) => {
      const normalized = toNormalized(x, y);

      // Check if tapping near an existing point
      const existingIndex = findClosestCurvePoint(currentCurve, normalized.x, normalized.y);

      if (existingIndex >= 0) {
        // Select existing point
        setSelectedPointIndex(existingIndex);
      } else {
        // Add new point
        const newCurve = addCurvePoint(currentCurve, normalized);
        onChange(channel, newCurve);
      }
    },
    [currentCurve, channel, onChange]
  );

  // Handle drag to move point
  const handleDrag = useCallback(
    (x: number, y: number) => {
      if (selectedPointIndex === null) return;

      const normalized = toNormalized(x, y);
      const newCurve = moveCurvePoint(
        currentCurve,
        selectedPointIndex,
        normalized.x,
        normalized.y
      );
      onChange(channel, newCurve);
    },
    [selectedPointIndex, currentCurve, channel, onChange]
  );

  // Handle drag end to commit
  const handleDragEnd = useCallback(() => {
    if (selectedPointIndex === null) return;
    onCommit(channel, currentCurve);
    setSelectedPointIndex(null);
  }, [selectedPointIndex, channel, currentCurve, onCommit]);

  // Handle double-tap to delete point
  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      const normalized = toNormalized(x, y);
      const existingIndex = findClosestCurvePoint(currentCurve, normalized.x, normalized.y);

      if (existingIndex >= 0) {
        const point = currentCurve.points[existingIndex];
        // Cannot delete endpoints
        if (point.x !== 0 && point.x !== 1) {
          const newCurve = removeCurvePoint(currentCurve, existingIndex);
          onChange(channel, newCurve);
          onCommit(channel, newCurve);
        }
      }
    },
    [currentCurve, channel, onChange, onCommit]
  );

  // Gestures
  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      handleTap(event.x, event.y);
    });

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      const normalized = toNormalized(event.x, event.y);
      const existingIndex = findClosestCurvePoint(currentCurve, normalized.x, normalized.y);
      if (existingIndex >= 0) {
        setSelectedPointIndex(existingIndex);
      }
    })
    .onChange((event) => {
      handleDrag(event.x, event.y);
    })
    .onEnd(() => {
      handleDragEnd();
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      handleDoubleTap(event.x, event.y);
    });

  const composedGesture = Gesture.Race(doubleTapGesture, panGesture, tapGesture);

  return (
    <View style={styles.container}>
      {/* Channel selector */}
      <View style={styles.channelSelector}>
        {(['master', 'red', 'green', 'blue'] as CurveChannel[]).map((ch) => (
          <TouchableOpacity
            key={ch}
            style={[
              styles.channelButton,
              channel === ch && styles.channelButtonSelected,
            ]}
            onPress={() => onChange(ch, curves[ch])}
          >
            <View
              style={[
                styles.channelIndicator,
                { backgroundColor: CHANNEL_COLORS[ch] },
              ]}
            />
            <Text style={styles.channelLabel}>
              {ch.charAt(0).toUpperCase() + ch.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Curve editor canvas */}
      <GestureDetector gesture={composedGesture}>
        <View style={styles.canvasContainer}>
          <Canvas style={styles.canvas}>
            {/* Grid lines */}
            <Line
              p1={Skia.Point(EDITOR_SIZE / 2, 0)}
              p2={Skia.Point(EDITOR_SIZE / 2, EDITOR_SIZE)}
              color={Colors.border}
              strokeWidth={0.5}
            />
            <Line
              p1={Skia.Point(0, EDITOR_SIZE / 2)}
              p2={Skia.Point(EDITOR_SIZE, EDITOR_SIZE / 2)}
              color={Colors.border}
              strokeWidth={0.5}
            />

            {/* Diagonal reference line */}
            <Line
              p1={Skia.Point(0, EDITOR_SIZE)}
              p2={Skia.Point(EDITOR_SIZE, 0)}
              color={Colors.textMuted}
              strokeWidth={0.5}
              style="stroke"
            />

            {/* Curve path */}
            <Path
              path={buildCurvePath()}
              color={CHANNEL_COLORS[channel]}
              style="stroke"
              strokeWidth={2}
            />

            {/* Control points */}
            {currentCurve.points.map((point, index) => {
              const { x, y } = toEditorCoords(point);
              return (
                <Circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={POINT_RADIUS}
                  color={
                    selectedPointIndex === index
                      ? Colors.accent
                      : CHANNEL_COLORS[channel]
                  }
                  style="fill"
                />
              );
            })}
          </Canvas>
        </View>
      </GestureDetector>

      {/* Reset button */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          const reset = resetCurve();
          onChange(channel, reset);
          onCommit(channel, reset);
        }}
      >
        <Text style={styles.resetButtonText}>Reset Curve</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  channelSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.md,
  },
  channelButton: {
    alignItems: 'center',
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  channelButtonSelected: {
    backgroundColor: Colors.surfaceElevated,
  },
  channelIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 2,
  },
  channelLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  canvasContainer: {
    width: EDITOR_SIZE,
    height: EDITOR_SIZE,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  canvas: {
    width: EDITOR_SIZE,
    height: EDITOR_SIZE,
  },
  resetButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
  },
  resetButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
