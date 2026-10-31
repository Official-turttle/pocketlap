/**
 * PocketLab Data Model — Schema Migrations
 * 
 * Versioned schema with migration chain.
 * Each migration upgrades from version N to N+1.
 * Unknown future versions are rejected with a clear error.
 */

import { SCHEMA_VERSION, type EditState, type ProjectFile, type PresetFile } from './types';
import { createDefaultEditState } from './defaults';

// ============================================================================
// Migration Types
// ============================================================================

export interface MigrationContext {
  /** The data being migrated (partial, may have missing fields in old schemas) */
  data: unknown;
  /** Source version */
  fromVersion: number;
  /** Target version */
  toVersion: number;
}

export type Migration = (context: MigrationContext) => unknown;

// ============================================================================
// Migration Registry
// ============================================================================

/**
 * Migration functions indexed by target version.
 * migrations[2] upgrades from version 1 to version 2.
 */
const migrations: Record<number, Migration> = {
  // Version 1 is the initial schema, no migration needed
};

// ============================================================================
// Migration Engine
// ============================================================================

/**
 * Migrate data from one version to another.
 * Applies migrations in sequence from fromVersion to toVersion.
 */
export function migrate<T>(data: unknown, fromVersion: number, toVersion: number = SCHEMA_VERSION): T {
  if (fromVersion === toVersion) {
    return data as T;
  }

  if (fromVersion > toVersion) {
    throw new Error(
      `Cannot downgrade from version ${fromVersion} to ${toVersion}. ` +
      `This file was created with a newer version of PocketLab.`
    );
  }

  if (fromVersion < 1) {
    throw new Error(
      `Invalid schema version ${fromVersion}. ` +
      `Minimum supported version is 1.`
    );
  }

  if (toVersion > SCHEMA_VERSION) {
    throw new Error(
      `Cannot migrate to version ${toVersion}. ` +
      `Maximum supported version is ${SCHEMA_VERSION}. ` +
      `Please update PocketLab to open this file.`
    );
  }

  let current = data;
  for (let version = fromVersion + 1; version <= toVersion; version++) {
    const migration = migrations[version];
    if (migration) {
      current = migration({
        data: current,
        fromVersion: version - 1,
        toVersion: version,
      });
    }
    // If no migration exists for this version, data passes through unchanged
  }

  return current as T;
}

/**
 * Migrate a project file to the current schema version.
 */
export function migrateProjectFile(file: unknown): ProjectFile {
  if (!file || typeof file !== 'object') {
    throw new Error('Invalid project file: not an object');
  }

  const obj = file as Record<string, unknown>;
  const schemaVersion = obj.schemaVersion;

  if (typeof schemaVersion !== 'number') {
    throw new Error('Invalid project file: missing or invalid schemaVersion');
  }

  if (schemaVersion === SCHEMA_VERSION) {
    // Already current version, validate structure
    return validateProjectFile(obj);
  }

  // Migrate
  const migrated = migrate<Record<string, unknown>>(file, schemaVersion, SCHEMA_VERSION);
  return validateProjectFile(migrated);
}

/**
 * Migrate a preset file to the current schema version.
 */
export function migratePresetFile(file: unknown): PresetFile {
  if (!file || typeof file !== 'object') {
    throw new Error('Invalid preset file: not an object');
  }

  const obj = file as Record<string, unknown>;
  const schemaVersion = obj.schemaVersion;

  if (typeof schemaVersion !== 'number') {
    throw new Error('Invalid preset file: missing or invalid schemaVersion');
  }

  if (schemaVersion === SCHEMA_VERSION) {
    return validatePresetFile(obj);
  }

  const migrated = migrate<Record<string, unknown>>(file, schemaVersion, SCHEMA_VERSION);
  return validatePresetFile(migrated);
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that an object conforms to the ProjectFile structure.
 * Throws if required fields are missing or have wrong types.
 */
function validateProjectFile(obj: Record<string, unknown>): ProjectFile {
  const required = ['schemaVersion', 'projectId', 'name', 'source', 'edit', 'createdAt', 'updatedAt'];
  for (const field of required) {
    if (!(field in obj)) {
      throw new Error(`Invalid project file: missing required field "${field}"`);
    }
  }

  if (typeof obj.projectId !== 'string') {
    throw new Error('Invalid project file: projectId must be a string');
  }

  if (typeof obj.name !== 'string') {
    throw new Error('Invalid project file: name must be a string');
  }

  if (!obj.source || typeof obj.source !== 'object') {
    throw new Error('Invalid project file: source must be an object');
  }

  if (!obj.edit || typeof obj.edit !== 'object') {
    throw new Error('Invalid project file: edit must be an object');
  }

  return obj as unknown as ProjectFile;
}

/**
 * Validate that an object conforms to the PresetFile structure.
 */
function validatePresetFile(obj: Record<string, unknown>): PresetFile {
  const required = ['schemaVersion', 'name', 'category', 'global', 'effects'];
  for (const field of required) {
    if (!(field in obj)) {
      throw new Error(`Invalid preset file: missing required field "${field}"`);
    }
  }

  if (typeof obj.name !== 'string') {
    throw new Error('Invalid preset file: name must be a string');
  }

  if (typeof obj.category !== 'string') {
    throw new Error('Invalid preset file: category must be a string');
  }

  return obj as unknown as PresetFile;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Fill in missing fields with defaults.
 * Useful when loading old files that may have partial data.
 */
export function ensureCompleteEditState(edit: Partial<EditState>): EditState {
  const defaults = createDefaultEditState();
  
  return {
    global: edit.global ?? defaults.global,
    effects: edit.effects ?? defaults.effects,
    geometry: edit.geometry ?? defaults.geometry,
    masks: edit.masks ?? defaults.masks,
  };
}
