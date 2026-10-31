/**
 * PocketLab — HSL Panel
 * 
 * Adjustment panel for HSL mixer with 8 hue bands.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Slider } from '../Sliders/Slider';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import type { HslAdjustment, HslBand } from '../../model/types';
import { HSL_BANDS } from '../../model/types';

// ============================================================================
// Types
// ============================================================================

export interface HslPanelProps {
  /** Current HSL adjustments */
  hsl: HslAdjustment;
  /** Called during drag */
  onDrag: (updates: Partial<HslAdjustment>) => void;
  /** Called on release */
  onCommit: (updates: Partial<HslAdjustment>) => void;
  /** Called to reset a band */
  onReset: (band: HslBand) => void;
}

// ============================================================================
// Constants
// ============================================================================

const BAND_COLORS: Record<HslBand, string> = {
  red: '#ff4444',
  orange: '#ff8844',
  yellow: '#ffdd44',
  green: '#44ff44',
  aqua: '#44ffdd',
  blue: '#4488ff',
  purple: '#8844ff',
  magenta: '#ff44dd',
};

const BAND_LABELS: Record<HslBand, string> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  aqua: 'Aqua',
  blue: 'Blue',
  purple: 'Purple',
  magenta: 'Magenta',
};

// ============================================================================
// Component
// ============================================================================

export const HslPanel: React.FC<HslPanelProps> = ({
  hsl,
  onDrag,
  onCommit,
  onReset,
}) => {
  const [selectedBand, setSelectedBand] = useState<HslBand>('red');

  const band = hsl[selectedBand];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Band selector */}
      <View style={styles.bandSelector}>
        {HSL_BANDS.map((bandKey) => (
          <TouchableOpacity
            key={bandKey}
            style={[
              styles.bandButton,
              selectedBand === bandKey && styles.bandButtonSelected,
            ]}
            onPress={() => setSelectedBand(bandKey)}
          >
            <View
              style={[
                styles.bandColor,
                { backgroundColor: BAND_COLORS[bandKey] },
                selectedBand === bandKey && styles.bandColorSelected,
              ]}
            />
            <Text
              style={[
                styles.bandLabel,
                selectedBand === bandKey && styles.bandLabelSelected,
              ]}
            >
              {BAND_LABELS[bandKey]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Adjustment sliders for selected band */}
      <View style={styles.sliders}>
        <Slider
          label="Hue"
          value={band.hue}
          min={-180}
          max={180}
          step={1}
          unit="°"
          explanation="Shifts the hue of this color range"
          defaultValue={0}
          onDrag={(value) =>
            onDrag({ [selectedBand]: { ...band, hue: value } })
          }
          onCommit={(value) =>
            onCommit({ [selectedBand]: { ...band, hue: value } })
          }
          onReset={() => onReset(selectedBand)}
        />

        <Slider
          label="Saturation"
          value={band.saturation}
          min={-100}
          max={100}
          step={1}
          unit=""
          explanation="Increases or decreases the intensity of this color range"
          defaultValue={0}
          onDrag={(value) =>
            onDrag({ [selectedBand]: { ...band, saturation: value } })
          }
          onCommit={(value) =>
            onCommit({ [selectedBand]: { ...band, saturation: value } })
          }
          onReset={() => onReset(selectedBand)}
        />

        <Slider
          label="Luminance"
          value={band.luminance}
          min={-100}
          max={100}
          step={1}
          unit=""
          explanation="Brightens or darkens this color range"
          defaultValue={0}
          onDrag={(value) =>
            onDrag({ [selectedBand]: { ...band, luminance: value } })
          }
          onCommit={(value) =>
            onCommit({ [selectedBand]: { ...band, luminance: value } })
          }
          onReset={() => onReset(selectedBand)}
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
  bandSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.xs,
  },
  bandButton: {
    alignItems: 'center',
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  bandButtonSelected: {
    backgroundColor: Colors.surfaceElevated,
  },
  bandColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 2,
    opacity: 0.6,
  },
  bandColorSelected: {
    opacity: 1,
    borderWidth: 2,
    borderColor: Colors.text,
  },
  bandLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  bandLabelSelected: {
    color: Colors.text,
    fontWeight: '600',
  },
  sliders: {
    marginTop: Spacing.md,
  },
});
