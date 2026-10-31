/**
 * PocketLab Presets
 * 
 * Create, apply, save, and manage presets.
 * Presets store global adjustments and effects only (no geometry or masks).
 */

import * as FileSystem from 'expo-file-system';
import type { PresetFile, AdjustmentSet, EffectSettings } from '../model/types';
import { SCHEMA_VERSION } from '../model/types';
import { migratePresetFile } from '../model/migrations';
import { getDatabase } from '../database/database';

// ============================================================================
// Constants
// ============================================================================

const PRESETS_DIR = `${FileSystem.documentDirectory}presets/`;

// ============================================================================
// Types
// ============================================================================

export interface CreatePresetOptions {
  name: string;
  category: string;
  global: AdjustmentSet;
  effects: EffectSettings;
}

export interface PresetCategory {
  name: string;
  presets: PresetFile[];
}

// ============================================================================
// Default Categories
// ============================================================================

export const DEFAULT_CATEGORIES = [
  'Cinematic',
  'Vintage',
  'Warm',
  'Cool',
  'Moody',
  'Film-inspired',
  'Black & white',
  'Editorial',
];

// ============================================================================
// Create Preset
// ============================================================================

/**
 * Create and save a new preset.
 */
export async function createPreset(options: CreatePresetOptions): Promise<{ success: boolean; error?: string }> {
  const { name, category, global, effects } = options;

  try {
    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(PRESETS_DIR, { intermediates: true });

    // Create preset file
    const presetFile: PresetFile = {
      schemaVersion: SCHEMA_VERSION,
      name,
      category,
      global,
      effects,
    };

    // Write to disk
    const presetPath = getPresetPath(name);
    await FileSystem.writeAsStringAsync(
      presetPath,
      JSON.stringify(presetFile, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    // Update database index
    const db = await getDatabase();
    await db.insertPreset({
      name,
      category,
      schemaVersion: SCHEMA_VERSION,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating preset',
    };
  }
}

// ============================================================================
// Load Preset
// ============================================================================

/**
 * Load a preset from disk.
 */
export async function loadPreset(name: string): Promise<{ success: boolean; preset?: PresetFile; error?: string }> {
  try {
    const presetPath = getPresetPath(name);
    
    // Check if file exists
    const info = await FileSystem.getInfoAsync(presetPath);
    if (!info.exists) {
      return { success: false, error: 'Preset not found' };
    }

    // Read file
    const content = await FileSystem.readAsStringAsync(presetPath);
    const rawPreset = JSON.parse(content);

    // Migrate if needed
    const preset = migratePresetFile(rawPreset);

    return { success: true, preset };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error loading preset',
    };
  }
}

// ============================================================================
// Delete Preset
// ============================================================================

/**
 * Delete a preset.
 */
export async function deletePreset(name: string): Promise<{ success: boolean; error?: string }> {
  try {
    const presetPath = getPresetPath(name);
    
    // Delete file
    const info = await FileSystem.getInfoAsync(presetPath);
    if (info.exists) {
      await FileSystem.deleteAsync(presetPath);
    }

    // Delete from database
    const db = await getDatabase();
    await db.deletePreset(name);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting preset',
    };
  }
}

// ============================================================================
// List Presets
// ============================================================================

/**
 * Get all presets grouped by category.
 */
export async function listPresetsByCategory(): Promise<PresetCategory[]> {
  const db = await getDatabase();
  const entries = await db.getAllPresets();
  
  // Group by category
  const categoryMap = new Map<string, PresetFile[]>();
  
  for (const entry of entries) {
    const result = await loadPreset(entry.name);
    if (result.success && result.preset) {
      const existing = categoryMap.get(entry.category) ?? [];
      existing.push(result.preset);
      categoryMap.set(entry.category, existing);
    }
  }
  
  // Convert to array
  return Array.from(categoryMap.entries()).map(([name, presets]) => ({
    name,
    presets,
  }));
}

/**
 * Get all presets as a flat list.
 */
export async function listAllPresets(): Promise<PresetFile[]> {
  const db = await getDatabase();
  const entries = await db.getAllPresets();
  
  const presets: PresetFile[] = [];
  for (const entry of entries) {
    const result = await loadPreset(entry.name);
    if (result.success && result.preset) {
      presets.push(result.preset);
    }
  }
  
  return presets;
}

// ============================================================================
// Apply Preset
// ============================================================================

/**
 * Apply a preset to an edit state.
 * Returns new global and effects values.
 */
export function applyPreset(
  preset: PresetFile
): { global: AdjustmentSet; effects: EffectSettings } {
  return {
    global: preset.global,
    effects: preset.effects,
  };
}

// ============================================================================
// Import/Export
// ============================================================================

/**
 * Export a preset to a JSON string.
 */
export function exportPreset(preset: PresetFile): string {
  return JSON.stringify(preset, null, 2);
}

/**
 * Import a preset from a JSON string.
 */
export async function importPreset(json: string): Promise<{ success: boolean; error?: string }> {
  try {
    const rawPreset = JSON.parse(json);
    const preset = migratePresetFile(rawPreset);
    
    return createPreset({
      name: preset.name,
      category: preset.category,
      global: preset.global,
      effects: preset.effects,
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid preset file',
    };
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get the file path for a preset.
 */
function getPresetPath(name: string): string {
  // Sanitize name for filename
  const safeName = name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  return `${PRESETS_DIR}${safeName}.json`;
}

/**
 * Check if a preset exists.
 */
export async function presetExists(name: string): Promise<boolean> {
  const presetPath = getPresetPath(name);
  const info = await FileSystem.getInfoAsync(presetPath);
  return info.exists;
}
