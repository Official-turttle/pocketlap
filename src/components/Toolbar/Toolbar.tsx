/**
 * PocketLab — Editor Toolbar
 * 
 * Bottom toolbar with tool selection and action buttons.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

// ============================================================================
// Types
// ============================================================================

export type ToolType = 'tune' | 'color' | 'curves' | 'detail' | 'crop' | 'effects' | 'masks';

export interface ToolbarProps {
  /** Currently selected tool */
  selectedTool: ToolType;
  /** Called when a tool is selected */
  onToolSelect: (tool: ToolType) => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Called when undo is pressed */
  onUndo: () => void;
  /** Called when redo is pressed */
  onRedo: () => void;
  /** Called when before/after is pressed */
  onBeforeAfter?: () => void;
  /** Called when export is pressed */
  onExport?: () => void;
}

interface ToolButton {
  type: ToolType;
  label: string;
}

const TOOLS: ToolButton[] = [
  { type: 'tune', label: 'Tune' },
  { type: 'color', label: 'Color' },
  { type: 'curves', label: 'Curves' },
  { type: 'detail', label: 'Detail' },
  { type: 'crop', label: 'Crop' },
  { type: 'effects', label: 'Effects' },
  { type: 'masks', label: 'Masks' },
];

// ============================================================================
// Component
// ============================================================================

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onBeforeAfter,
  onExport,
}) => {
  return (
    <View style={styles.container}>
      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, !canUndo && styles.actionButtonDisabled]}
          onPress={onUndo}
          disabled={!canUndo}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text style={[styles.actionButtonText, !canUndo && styles.actionButtonTextDisabled]}>
            Undo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !canRedo && styles.actionButtonDisabled]}
          onPress={onRedo}
          disabled={!canRedo}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text style={[styles.actionButtonText, !canRedo && styles.actionButtonTextDisabled]}>
            Redo
          </Text>
        </TouchableOpacity>

        {onBeforeAfter && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onBeforeAfter}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Text style={styles.actionButtonText}>Before/After</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tool buttons */}
      <View style={styles.toolButtons}>
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.type}
            style={[
              styles.toolButton,
              selectedTool === tool.type && styles.toolButtonSelected,
            ]}
            onPress={() => onToolSelect(tool.type)}
          >
            <Text
              style={[
                styles.toolButtonText,
                selectedTool === tool.type && styles.toolButtonTextSelected,
              ]}
            >
              {tool.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Export button */}
      {onExport && (
        <TouchableOpacity style={styles.exportButton} onPress={onExport}>
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
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
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  actionButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  actionButtonDisabled: {
    opacity: 0.3,
  },
  actionButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  actionButtonTextDisabled: {
    color: Colors.textMuted,
  },
  toolButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
  },
  toolButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  toolButtonSelected: {
    backgroundColor: Colors.accent,
  },
  toolButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  toolButtonTextSelected: {
    color: Colors.text,
    fontWeight: '600',
  },
  exportButton: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  exportButtonText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
});
