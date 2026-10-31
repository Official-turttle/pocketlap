/**
 * PocketLab — Mask List Component
 * 
 * Displays and manages masks: create, rename, duplicate, delete,
 * reorder, toggle visibility, invert, opacity.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import type { Mask } from '../../model/types';

// ============================================================================
// Types
// ============================================================================

export interface MaskListProps {
  /** List of masks */
  masks: Mask[];
  /** Currently selected mask ID */
  selectedMaskId: string | null;
  /** Called when a mask is selected */
  onSelect: (maskId: string) => void;
  /** Called to create a new mask */
  onCreateMask: (type: 'linear' | 'radial' | 'brush') => void;
  /** Called to update a mask */
  onUpdateMask: (maskId: string, updates: Partial<Mask>) => void;
  /** Called to delete a mask */
  onDeleteMask: (maskId: string) => void;
  /** Called to duplicate a mask */
  onDuplicateMask: (maskId: string) => void;
  /** Called to reorder masks */
  onReorderMasks: (maskIds: string[]) => void;
}

// ============================================================================
// Mask Item Component
// ============================================================================

interface MaskItemProps {
  mask: Mask;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleInvert: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
}

const MaskItem: React.FC<MaskItemProps> = ({
  mask,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleInvert,
  onDelete,
  onDuplicate,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(mask.name);

  const handleRename = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const getMaskTypeIcon = (): string => {
    switch (mask.shape.type) {
      case 'linear':
        return '↗';
      case 'radial':
        return '◯';
      case 'brush':
        return '✎';
      default:
        return '?';
    }
  };

  return (
    <View style={[styles.maskItem, isSelected && styles.maskItemSelected]}>
      <TouchableOpacity style={styles.maskItemContent} onPress={onSelect}>
        <Text style={styles.maskTypeIcon}>{getMaskTypeIcon()}</Text>
        
        {isEditing ? (
          <TextInput
            style={styles.maskNameInput}
            value={editName}
            onChangeText={setEditName}
            onBlur={handleRename}
            onSubmitEditing={handleRename}
            autoFocus
            returnKeyType="done"
          />
        ) : (
          <Text
            style={styles.maskName}
            onLongPress={() => {
              setEditName(mask.name);
              setIsEditing(true);
            }}
          >
            {mask.name}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.maskActions}>
        {/* Visibility toggle */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onToggleVisibility}
        >
          <Text style={[styles.actionIcon, !mask.visible && styles.actionIconInactive]}>
            {mask.visible ? '◉' : '○'}
          </Text>
        </TouchableOpacity>

        {/* Invert toggle */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onToggleInvert}
        >
          <Text style={[styles.actionIcon, mask.inverted && styles.actionIconActive]}>
            ⇄
          </Text>
        </TouchableOpacity>

        {/* Duplicate */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onDuplicate}
        >
          <Text style={styles.actionIcon}>⧉</Text>
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Alert.alert(
              'Delete Mask',
              `Are you sure you want to delete "${mask.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
              ]
            );
          }}
        >
          <Text style={[styles.actionIcon, styles.actionIconDanger]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const MaskList: React.FC<MaskListProps> = ({
  masks,
  selectedMaskId,
  onSelect,
  onCreateMask,
  onUpdateMask,
  onDeleteMask,
  onDuplicateMask,
  onReorderMasks,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <View style={styles.container}>
      {/* Add mask button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddMenu(!showAddMenu)}
        >
          <Text style={styles.addButtonText}>+ Add Mask</Text>
        </TouchableOpacity>

        {showAddMenu && (
          <View style={styles.addMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onCreateMask('linear');
                setShowAddMenu(false);
              }}
            >
              <Text style={styles.menuItemText}>↗ Linear Gradient</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onCreateMask('radial');
                setShowAddMenu(false);
              }}
            >
              <Text style={styles.menuItemText}>◯ Radial Gradient</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onCreateMask('brush');
                setShowAddMenu(false);
              }}
            >
              <Text style={styles.menuItemText}>✎ Brush</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Mask list */}
      <ScrollView style={styles.maskList} showsVerticalScrollIndicator={false}>
        {masks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No masks yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add a mask to edit specific regions
            </Text>
          </View>
        ) : (
          masks.map((mask) => (
            <MaskItem
              key={mask.id}
              mask={mask}
              isSelected={selectedMaskId === mask.id}
              onSelect={() => onSelect(mask.id)}
              onToggleVisibility={() =>
                onUpdateMask(mask.id, { visible: !mask.visible })
              }
              onToggleInvert={() =>
                onUpdateMask(mask.id, { inverted: !mask.inverted })
              }
              onDelete={() => onDeleteMask(mask.id)}
              onDuplicate={() => onDuplicateMask(mask.id)}
              onRename={(name) => onUpdateMask(mask.id, { name })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButtonContainer: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  addButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  addMenu: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemText: {
    color: Colors.text,
    fontSize: FontSize.md,
  },
  maskList: {
    flex: 1,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  maskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  maskItemSelected: {
    backgroundColor: Colors.surfaceElevated,
  },
  maskItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  maskTypeIcon: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
    width: 24,
    textAlign: 'center',
  },
  maskName: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  maskNameInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.surface,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  maskActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  actionIcon: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  actionIconInactive: {
    color: Colors.textMuted,
  },
  actionIconActive: {
    color: Colors.accent,
  },
  actionIconDanger: {
    color: Colors.error,
  },
});
