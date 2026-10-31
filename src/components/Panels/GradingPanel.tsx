/**
 * PocketLab — Grading Wheels Panel
 * 
 * Color grading wheels for shadows, midtones, highlights, and global.
 * Each wheel allows adjusting hue, saturation, and luminance.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Canvas, Circle, Line, Skia, Path } from 'react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Slider } from '../Sliders/Slider';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import type { GradingAdjustment, GradeRegion } from '../../model/types';

// ============================================================================
// Types
// ============================================================================

export type GradingRegionType = 'shadows' | 'midtones' | 'highlights' | 'global';

export interface GradingPanelProps {
  /** Current grading adjustments */
  grading: GradingAdjustment;
  /** Called during drag */
  onDrag: (updates: Partial<GradingAdjustment>) => void;
  /** Called on release */
  onCommit: (updates: Partial<GradingAdjustment>) => void;
  /** Called to reset a region */
  onReset: (region: GradingRegionType) => void;
}

// ============================================================================
// Constants
// ============================================================================

const WHEEL_SIZE = 120;
const WHEEL_RADIUS = WHEEL_SIZE / 2 - 10;

const REGION_LABELS: Record<GradingRegionType, string> = {
  shadows: 'Shadows',
  midtones: 'Midtones',
  highlights: 'Highlights',
  global: 'Global',
};

// ============================================================================
// Grading Wheel Component
// ============================================================================

interface GradingWheelProps {
  region: GradeRegion;
  label: string;
  onHueSatChange: (hue: number, sat: number) => void;
  onLumChange: (lum: number) => void;
  onReset: () => void;
}

const GradingWheel: React.FC<GradingWheelProps> = ({
  region,
  label,
  onHueSatChange,
  onLumChange,
  onReset,
}) => {
  // Convert region values to wheel position
  const angle = (region.hue * Math.PI) / 180;
  const distance = Math.abs(region.saturation) * WHEEL_RADIUS;
  const indicatorX = WHEEL_SIZE / 2 + Math.cos(angle) * distance;
  const indicatorY = WHEEL_SIZE / 2 + Math.sin(angle) * distance;

  // Handle wheel interaction
  const handleWheelInteraction = (x: number, y: number) => {
    const centerX = WHEEL_SIZE / 2;
    const centerY = WHEEL_SIZE / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), WHEEL_RADIUS);
    const angle = Math.atan2(dy, dx);
    
    const hue = ((angle * 180) / Math.PI + 360) % 360;
    const saturation = distance / WHEEL_RADIUS;
    
    onHueSatChange(hue, saturation);
  };

  const panGesture = Gesture.Pan()
    .onChange((event) => {
      handleWheelInteraction(event.x, event.y);
    });

  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      handleWheelInteraction(event.x, event.y);
    });

  const composedGesture = Gesture.Race(tapGesture, panGesture);

  return (
    <View style={styles.wheelContainer}>
      <Text style={styles.wheelLabel}>{label}</Text>
      
      <GestureDetector gesture={composedGesture}>
        <View style={styles.wheelOuter}>
          <Canvas style={styles.wheelCanvas}>
            {/* Color wheel background */}
            <Circle
              cx={WHEEL_SIZE / 2}
              cy={WHEEL_SIZE / 2}
              r={WHEEL_RADIUS}
              color={Colors.surfaceElevated}
              style="fill"
            />
            
            {/* Hue ring segments (simplified) */}
            {Array.from({ length: 12 }).map((_, i) => {
              const startAngle = (i * 30 * Math.PI) / 180;
              const endAngle = ((i + 1) * 30 * Math.PI) / 180;
              const x1 = WHEEL_SIZE / 2 + Math.cos(startAngle) * WHEEL_RADIUS;
              const y1 = WHEEL_SIZE / 2 + Math.sin(startAngle) * WHEEL_RADIUS;
              const x2 = WHEEL_SIZE / 2 + Math.cos(endAngle) * WHEEL_RADIUS;
              const y2 = WHEEL_SIZE / 2 + Math.sin(endAngle) * WHEEL_RADIUS;
              
              return (
                <Line
                  key={i}
                  p1={Skia.Point(WHEEL_SIZE / 2, WHEEL_SIZE / 2)}
                  p2={Skia.Point(x1, y1)}
                  color={`hsl(${i * 30}, 70%, 50%)`}
                  strokeWidth={2}
                  opacity={0.3}
                />
              );
            })}
            
            {/* Center circle */}
            <Circle
              cx={WHEEL_SIZE / 2}
              cy={WHEEL_SIZE / 2}
              r={4}
              color={Colors.textMuted}
              style="fill"
            />
            
            {/* Indicator */}
            <Circle
              cx={indicatorX}
              cy={indicatorY}
              r={8}
              color={Colors.accent}
              style="fill"
            />
            <Circle
              cx={indicatorX}
              cy={indicatorY}
              r={8}
              color={Colors.background}
              style="stroke"
              strokeWidth={2}
            />
          </Canvas>
        </View>
      </GestureDetector>

      {/* Luminance slider */}
      <View style={styles.lumSlider}>
        <Text style={styles.lumLabel}>Lum</Text>
        <Slider
          label=""
          value={region.luminance}
          min={-100}
          max={100}
          step={1}
          unit=""
          onDrag={(value) => onLumChange(value)}
          onCommit={(value) => onLumChange(value)}
          onReset={onReset}
        />
      </View>
    </View>
  );
};

// ============================================================================
// Main Panel Component
// ============================================================================

export const GradingPanel: React.FC<GradingPanelProps> = ({
  grading,
  onDrag,
  onCommit,
  onReset,
}) => {
  const updateRegion = (
    regionType: GradingRegionType,
    updates: Partial<GradeRegion>
  ) => {
    const newRegion = { ...grading[regionType], ...updates };
    onDrag({ [regionType]: newRegion });
  };

  const commitRegion = (
    regionType: GradingRegionType,
    updates: Partial<GradeRegion>
  ) => {
    const newRegion = { ...grading[regionType], ...updates };
    onCommit({ [regionType]: newRegion });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Wheels grid */}
      <View style={styles.wheelsGrid}>
        <GradingWheel
          region={grading.shadows}
          label="Shadows"
          onHueSatChange={(hue, sat) =>
            updateRegion('shadows', { hue, saturation: sat })
          }
          onLumChange={(lum) => updateRegion('shadows', { luminance: lum })}
          onReset={() => onReset('shadows')}
        />
        
        <GradingWheel
          region={grading.midtones}
          label="Midtones"
          onHueSatChange={(hue, sat) =>
            updateRegion('midtones', { hue, saturation: sat })
          }
          onLumChange={(lum) => updateRegion('midtones', { luminance: lum })}
          onReset={() => onReset('midtones')}
        />
        
        <GradingWheel
          region={grading.highlights}
          label="Highlights"
          onHueSatChange={(hue, sat) =>
            updateRegion('highlights', { hue, saturation: sat })
          }
          onLumChange={(lum) => updateRegion('highlights', { luminance: lum })}
          onReset={() => onReset('highlights')}
        />
        
        <GradingWheel
          region={grading.global}
          label="Global"
          onHueSatChange={(hue, sat) =>
            updateRegion('global', { hue, saturation: sat })
          }
          onLumChange={(lum) => updateRegion('global', { luminance: lum })}
          onReset={() => onReset('global')}
        />
      </View>

      {/* Blending and balance sliders */}
      <View style={styles.controlSliders}>
        <Slider
          label="Blending"
          value={grading.blending}
          min={0}
          max={100}
          step={1}
          unit="%"
          explanation="Controls how much the grading affects the image"
          defaultValue={50}
          onDrag={(value) => onDrag({ blending: value })}
          onCommit={(value) => onCommit({ blending: value })}
        />

        <Slider
          label="Balance"
          value={grading.balance}
          min={-100}
          max={100}
          step={1}
          unit=""
          explanation="Shifts the boundary between shadows, midtones, and highlights"
          defaultValue={0}
          onDrag={(value) => onDrag({ balance: value })}
          onCommit={(value) => onCommit({ balance: value })}
        />
      </View>
    </ScrollView>
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
  wheelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginVertical: Spacing.md,
  },
  wheelContainer: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  wheelLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  wheelOuter: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  wheelCanvas: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  lumSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    width: WHEEL_SIZE + 40,
  },
  lumLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginRight: Spacing.xs,
  },
  controlSliders: {
    marginTop: Spacing.md,
  },
});
