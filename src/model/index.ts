/**
 * PocketLab Data Model
 * 
 * Public API for types, defaults, migrations, and history.
 */

// Types
export * from './types';

// Defaults
export * from './defaults';

// Migrations
export {
  migrate,
  migrateProjectFile,
  migratePresetFile,
  ensureCompleteEditState,
  type Migration,
  type MigrationContext,
} from './migrations';

// History
export {
  // Patch operations
  getPath,
  setPath,
  applyPatchEntry,
  revertPatchEntry,
  applyPatches,
  revertPatches,
  generatePatches,
  
  // History management
  createHistoryEntry,
  createHistoryState,
  pushEntry,
  undo,
  redo,
  canUndo,
  canRedo,
  
  // Coalescing
  coalesceEntries,
  
  // Constants
  MAX_HISTORY_ENTRIES,
  
  // Types
  type PatchEntry,
  type HistoryEntry,
  type HistoryState,
} from './history';
