/**
 * PocketLab — Histogram Display
 * 
 * Visualizes the RGB + luminance histogram.
 * Shows clipping warnings when enabled.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Rect, Path, Skia } from 'react-native-skia';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import type { HistogramData } from '../../engine';
import type { ClippingInfo } from '../../engine/histogram/histogram';

// ============================================================================
// Types
// ============================================================================

export interface HistogramDisplayProps {
  /** Histogram data */
  histogram: HistogramData;
  /** Clipping information */
  clipping?: ClippingInfo;
  /** Whether to show RGB channels (default: true) */
  showRGB?: boolean;
  /** Whether to show luminance (default: true) */
  showLuminance?: boolean;
  /** Whether to show clipping warnings (default: true) */
  showClipping?: boolean;
  /** Height of the histogram (default: 80) */
  height?: number;
}

// ============================================================================
// Component
// ============================================================================

export const HistogramDisplay: React.FC<HistogramDisplayProps> = ({
  histogram,
  clipping,
  showRGB = true,
  showLuminance = true,
  showClipping = true,
  height = 80,
}) => {
  const width = 200; // Will be measured in practice

  // Build paths for each channel
  const buildPath = (data: number[]): string => {
    if (data.length === 0) return '';
    
    const binWidth = width / data.length;
    let path = `M 0 ${height}`;
    
    for (let i = 0; i < data.length; i++) {
      const x = i * binWidth;
      const y = height - data[i] * height;
      path += ` L ${x} ${y}`;
    }
    
    path += ` L ${width} ${height} Z`;
    return path;
  };

  const luminancePath = showLuminance ? buildPath(histogram.luminance) : '';
  const redPath = showRGB ? buildPath(histogram.red) : '';
  const greenPath = showRGB ? buildPath(histogram.green) : '';
  const bluePath = showRGB ? buildPath(histogram.blue) : '';

  return (
    <View style={styles.container}>
      <Canvas style={{ width: '100%', height }}>
        {/* Luminance (white/gray) */}
        {showLuminance && luminancePath && (
          <Path
            path={luminancePath}
            color="rgba(255, 255, 255, 0.3)"
            style="fill"
          />
        )}
        
        {/* Red channel */}
        {showRGB && redPath && (
          <Path
            path={redPath}
            color="rgba(255, 80, 80, 0.4)"
            style="fill"
          />
        )}
        
        {/* Green channel */}
        {showRGB && greenPath && (
          <Path
            path={greenPath}
            color="rgba(80, 255, 80, 0.4)"
            style="fill"
          />
        )}
        
        {/* Blue channel */}
        {showRGB && bluePath && (
          <Path
            path={bluePath}
            color="rgba(80, 80, 255, 0.4)"
            style="fill"
          />
        )}

        {/* Clipping warnings */}
        {showClipping && clipping?.showWarnings && (
          <>
            {/* Shadow clipping indicator (left edge) */}
            {clipping.shadowClipPercent > 0 && (
              <Rect
                x={0}
                y={0}
                width={4}
                height={height}
                color={Colors.warning}
                opacity={0.8}
              />
            )}
            
            {/* Highlight clipping indicator (right edge) */}
            {clipping.highlightClipPercent > 0 && (
              <Rect
                x={width - 4}
                y={0}
                width={4}
                height={height}
                color={Colors.warning}
                opacity={0.8}
              />
            )}
          </>
        )}
      </Canvas>

      {/* Clipping percentages */}
      {showClipping && clipping?.showWarnings && (
        <View style={styles.clippingInfo}>
          {clipping.shadowClipPercent > 0 && (
            <Text style={styles.clippingText}>
              Shadows: {clipping.shadowClipPercent.toFixed(1)}%
            </Text>
          )}
          {clipping.highlightClipPercent > 0 && (
            <Text style={styles.clippingText}>
              Highlights: {clipping.highlightClipPercent.toFixed(1)}%
            </Text>
          )}
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  clippingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  clippingText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: '500',
  },
});
