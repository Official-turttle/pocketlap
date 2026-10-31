/**
 * PocketLab — Shared Value Slider
 * 
 * High-performance slider that bypasses React state during drags.
 * Uses Reanimated shared values for 60fps interaction.
 * Commits to Zustand store only on release.
 */

import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, GestureResponderEvent } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

// ============================================================================
// Types
// ============================================================================

export interface SliderProps {
  /** Current value */
  value: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step size (0 for continuous) */
  step?: number;
  /** Label text */
  label: string;
  /** Unit suffix (e.g., "%", "EV") */
  unit?: string;
  /** Explanation text (shown on long press) */
  explanation?: string;
  /** Called during drag with the new value (shared value update) */
  onDrag: (value: number) => void;
  /** Called on release to commit the final value */
  onCommit: (value: number) => void;
  /** Called on double-tap to reset */
  onReset?: () => void;
  /** Default value for reset */
  defaultValue?: number;
  /** Whether the slider is disabled */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 0,
  label,
  unit = '',
  explanation,
  onDrag,
  onCommit,
  onReset,
  defaultValue = 0,
  disabled = false,
}) => {
  const sliderWidth = 200; // Will be measured in practice
  const sharedValue = useSharedValue(value);
  const isDragging = useSharedValue(false);
  const showExplanation = useSharedValue(false);

  // Update shared value when prop changes (but not during drag)
  React.useEffect(() => {
    if (!isDragging.value) {
      sharedValue.value = value;
    }
  }, [value]);

  // Calculate normalized position (0-1)
  const normalizedValue = (value - min) / (max - min);
  const fillWidth = `${normalizedValue * 100}%`;

  // Format display value
  const displayValue = step >= 1 ? Math.round(value) : value.toFixed(1);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    isDragging.value = true;
  }, []);

  // Handle drag update
  const handleDragUpdate = useCallback((newValue: number) => {
    // Clamp and apply step
    let clamped = Math.max(min, Math.min(max, newValue));
    if (step > 0) {
      clamped = Math.round(clamped / step) * step;
    }
    sharedValue.value = clamped;
    onDrag(clamped);
  }, [min, max, step, onDrag]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    isDragging.value = false;
    onCommit(sharedValue.value);
  }, [onCommit]);

  // Handle double-tap to reset
  const handleDoubleTap = useCallback(() => {
    if (onReset) {
      onReset();
    }
  }, [onReset]);

  // Pan gesture for slider
  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      runOnJS(handleDragStart)();
    })
    .onChange((event) => {
      // Calculate value from touch position
      // This is simplified - in practice, measure the track width
      const relativeX = event.translationX / sliderWidth;
      const newValue = min + (max - min) * (normalizedValue + relativeX);
      runOnJS(handleDragUpdate)(newValue);
    })
    .onEnd(() => {
      runOnJS(handleDragEnd)();
    });

  // Long press for explanation
  const longPressGesture = Gesture.LongPress()
    .enabled(!!explanation)
    .duration(500)
    .onStart(() => {
      showExplanation.value = true;
    })
    .onEnd(() => {
      showExplanation.value = false;
    });

  // Double tap for reset
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTap)();
    });

  const composedGesture = Gesture.Race(
    doubleTapGesture,
    longPressGesture,
    panGesture
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {displayValue}{unit}
        </Text>
      </View>
      
      <GestureDetector gesture={composedGesture}>
        <View style={styles.track}>
          <View style={styles.trackBackground}>
            <View style={[styles.trackFill, { width: fillWidth }]} />
          </View>
          <View
            style={[
              styles.thumb,
              { left: `${normalizedValue * 100}%` },
              disabled && styles.thumbDisabled,
            ]}
          />
        </View>
      </GestureDetector>

      {explanation && showExplanation.value && (
        <View style={styles.explanation}>
          <Text style={styles.explanationText}>{explanation}</Text>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  track: {
    height: 32,
    justifyContent: 'center',
  },
  trackBackground: {
    height: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    marginLeft: -10,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  thumbDisabled: {
    backgroundColor: Colors.textMuted,
  },
  explanation: {
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
  },
  explanationText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
