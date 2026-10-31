/**
 * PocketLab — Tune Panel
 * 
 * Adjustment panel for basic tone controls:
 * brightness, exposure, contrast, highlights, shadows, whites, blacks, ambience.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Slider } from '../Sliders/Slider';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import type { ToneAdjustment, WhiteBalanceAdjustment } from '../../model/types';

// ============================================================================
// Types
// ============================================================================

export interface TunePanelProps {
  /** Current tone adjustments */
  tone: ToneAdjustment;
  /** Current white balance */
  whiteBalance: WhiteBalanceAdjustment;
  /** Called during drag (shared value update) */
  onDrag: (updates: Partial<ToneAdjustment> | Partial<WhiteBalanceAdjustment>) => void;
  /** Called on release to commit */
  onCommit: (updates: Partial<ToneAdjustment> | Partial<WhiteBalanceAdjustment>) => void;
  /** Called to reset a specific adjustment */
  onReset: (key: string) => void;
}

interface SliderConfig {
  key: keyof ToneAdjustment | keyof WhiteBalanceAdjustment;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  explanation: string;
  group: 'tone' | 'whiteBalance';
}

const SLIDERS: SliderConfig[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    min: -100,
    max: 100,
    step: 1,
    unit: '',
    explanation: 'Adjusts the color temperature from cool (blue) to warm (yellow)',
    group: 'whiteBalance',
  },
  {
    key: 'tint',
    label: 'Tint',
    min: -100,
    max: 100,
    step: 1,
    unit: '',
    explanation: 'Adjusts the tint from green to magenta',
    group: 'whiteBalance',
  },
  {
    key: 'exposure',
    label: 'Exposure',
    min: -5,
    max: 5,
    step: 0.1,
    unit: ' EV',
    explanation: 'Adjusts the overall brightness in EV stops',
    group: 'tone',
  },
  {
    key: 'brightness',
    label: 'Brightness',
    min: -100,
    max: 100,
    step: 1,
    unit: '',
    explanation: 'Adjusts the midtone brightness',
    group: 'tone',
  },
  {
    key: 'contrast',
    label: 'Contrast',
    min: -100,
    max: 100,
    step: 1,
    unit: '',
    explanation: 'Increases or decreases the difference between light and dark areas',
    group: 'tone',
  },
  {
    key: 'highlights',
    label: 'Highlights',
    min: -100,
    max: 100,
    step: 1,
    unit: '',
    explanation: 'Adjusts the brightness of the lightest areas',
    group: 'tone',
  },
  {
    key: 'shadows',
    label: 'Shadows',
    min: -100,
    max: 100,
    step: 1,
    unit: '',
    explanation: 'Adjusts the brightness of the darkest areas',
    group: 'tone',
  },
  {
    key: 'whites',
    label: 'Whites',
    min: -100,
    max: 100,
    step: 1,
    unit: '',
    explanation: 'Sets the white point of the image',
    group: 'tone',
  },
  {
    key: 'blacks',
    label: 'Blacks',
    min: -100,
    max: 100,
    step: 1,
    unit: '',
    explanation: 'Sets the black point of the image',
    group: 'tone',
  },
];

// ============================================================================
// Component
// ============================================================================

export const TunePanel: React.FC<TunePanelProps> = ({
  tone,
  whiteBalance,
  onDrag,
  onCommit,
  onReset,
}) => {
  const getValue = (config: SliderConfig): number => {
    if (config.group === 'whiteBalance') {
      return whiteBalance[config.key as keyof WhiteBalanceAdjustment];
    }
    return tone[config.key as keyof ToneAdjustment];
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>White Balance</Text>
      {SLIDERS.filter(s => s.group === 'whiteBalance').map((config) => (
        <Slider
          key={config.key}
          label={config.label}
          value={getValue(config)}
          min={config.min}
          max={config.max}
          step={config.step}
          unit={config.unit}
          explanation={config.explanation}
          defaultValue={0}
          onDrag={(value) => onDrag({ [config.key]: value })}
          onCommit={(value) => onCommit({ [config.key]: value })}
          onReset={() => onReset(config.key)}
        />
      ))}

      <Text style={styles.sectionTitle}>Tone</Text>
      {SLIDERS.filter(s => s.group === 'tone').map((config) => (
        <Slider
          key={config.key}
          label={config.label}
          value={getValue(config)}
          min={config.min}
          max={config.max}
          step={config.step}
          unit={config.unit}
          explanation={config.explanation}
          defaultValue={0}
          onDrag={(value) => onDrag({ [config.key]: value })}
          onCommit={(value) => onCommit({ [config.key]: value })}
          onReset={() => onReset(config.key)}
        />
      ))}
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
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
