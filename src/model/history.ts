/**
 * PocketLab History — Patch-based Undo/Redo
 * 
 * History is stored as a list of patches (changed paths with before/after values),
 * not full state copies. Slider drags and brush strokes coalesce into one entry on release.
 */

import type { EditState } from './types';

// ============================================================================
// Types
// ============================================================================

/** A single property change */
export interface PatchEntry {
  path: string;           // Dot-notation path (e.g., "global.tone.exposure")
  before: unknown;        // Value before the change
  after: unknown;         // Value after the change
}

/** A history entry containing one or more related patches */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  patches: PatchEntry[];
  description?: string;   // Optional human-readable description
}

/** History state */
export interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number;   // -1 means no history, 0 means at first entry
}

// ============================================================================
// Constants
// ============================================================================

export const MAX_HISTORY_ENTRIES = 100;

// ============================================================================
// Patch Operations
// ============================================================================

/**
 * Get a value at a dot-notation path in an object.
 */
export function getPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

/**
 * Set a value at a dot-notation path in an object (immutably).
 * Returns a new object with the value set.
 */
export function setPath(obj: unknown, path: string, value: unknown): unknown {
  const parts = path.split('.');
  
  if (parts.length === 0) {
    return value;
  }
  
  if (parts.length === 1) {
    if (typeof obj !== 'object' || obj === null) {
      return { [parts[0]]: value };
    }
    return { ...obj as Record<string, unknown>, [parts[0]]: value };
  }
  
  const [first, ...rest] = parts;
  if (typeof obj !== 'object' || obj === null) {
    return { [first]: setPath({}, rest.join('.'), value) };
  }
  
  const currentObj = obj as Record<string, unknown>;
  return {
    ...currentObj,
    [first]: setPath(currentObj[first], rest.join('.'), value),
  };
}

/**
 * Apply a patch entry to an object (move forward: use "after" value).
 */
export function applyPatchEntry<T>(obj: T, entry: PatchEntry): T {
  return setPath(obj, entry.path, entry.after) as T;
}

/**
 * Revert a patch entry on an object (move backward: use "before" value).
 */
export function revertPatchEntry<T>(obj: T, entry: PatchEntry): T {
  return setPath(obj, entry.path, entry.before) as T;
}

/**
 * Apply all patches in a history entry.
 */
export function applyPatches<T>(obj: T, patches: PatchEntry[]): T {
  let result = obj;
  for (const patch of patches) {
    result = applyPatchEntry(result, patch);
  }
  return result;
}

/**
 * Revert all patches in a history entry (in reverse order).
 */
export function revertPatches<T>(obj: T, patches: PatchEntry[]): T {
  let result = obj;
  for (let i = patches.length - 1; i >= 0; i--) {
    result = revertPatchEntry(result, patches[i]);
  }
  return result;
}

// ============================================================================
// Diff Generation
// ============================================================================

/**
 * Generate patches by comparing two EditState objects.
 * Only includes paths where values differ.
 */
export function generatePatches(before: EditState, after: EditState): PatchEntry[] {
  const patches: PatchEntry[] = [];
  diffObjects(before, after, '', patches);
  return patches;
}

/**
 * Recursively diff two objects and collect patches.
 */
function diffObjects(before: unknown, after: unknown, path: string, patches: PatchEntry[]): void {
  // If both are the same reference or primitive, no change
  if (before === after) {
    return;
  }
  
  // If either is null/undefined or not an object, treat as atomic change
  if (
    before === null || before === undefined ||
    after === null || after === undefined ||
    typeof before !== 'object' || typeof after !== 'object'
  ) {
    if (before !== after) {
      patches.push({ path, before, after });
    }
    return;
  }
  
  // If they're arrays, compare as atomic (arrays are not deeply diffed)
  if (Array.isArray(before) || Array.isArray(after)) {
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      patches.push({ path, before, after });
    }
    return;
  }
  
  // Both are objects, diff recursively
  const beforeObj = before as Record<string, unknown>;
  const afterObj = after as Record<string, unknown>;
  
  const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
  
  for (const key of allKeys) {
    const childPath = path ? `${path}.${key}` : key;
    diffObjects(beforeObj[key], afterObj[key], childPath, patches);
  }
}

// ============================================================================
// History Management
// ============================================================================

let entryIdCounter = 0;

/**
 * Create a new history entry from before/after states.
 */
export function createHistoryEntry(
  before: EditState,
  after: EditState,
  description?: string
): HistoryEntry | null {
  const patches = generatePatches(before, after);
  
  if (patches.length === 0) {
    return null; // No changes
  }
  
  return {
    id: `history_${++entryIdCounter}_${Date.now()}`,
    timestamp: Date.now(),
    patches,
    description,
  };
}

/**
 * Initialize history state.
 */
export function createHistoryState(): HistoryState {
  return {
    entries: [],
    currentIndex: -1,
  };
}

/**
 * Push a new entry to history.
 * Truncates any future entries (if we're not at the end).
 * Enforces max history size.
 */
export function pushEntry(state: HistoryState, entry: HistoryEntry): HistoryState {
  // Truncate future entries
  const entries = state.entries.slice(0, state.currentIndex + 1);
  
  // Add new entry
  entries.push(entry);
  
  // Enforce max size
  if (entries.length > MAX_HISTORY_ENTRIES) {
    entries.shift();
  }
  
  return {
    entries,
    currentIndex: entries.length - 1,
  };
}

/**
 * Undo: move back one entry and return the reverted state.
 */
export function undo(state: HistoryState, currentState: EditState): {
  newState: HistoryState;
  editState: EditState;
} | null {
  if (state.currentIndex < 0) {
    return null; // Nothing to undo
  }
  
  const entry = state.entries[state.currentIndex];
  const editState = revertPatches(currentState, entry.patches);
  
  return {
    newState: {
      ...state,
      currentIndex: state.currentIndex - 1,
    },
    editState,
  };
}

/**
 * Redo: move forward one entry and return the applied state.
 */
export function redo(state: HistoryState, currentState: EditState): {
  newState: HistoryState;
  editState: EditState;
} | null {
  if (state.currentIndex >= state.entries.length - 1) {
    return null; // Nothing to redo
  }
  
  const nextIndex = state.currentIndex + 1;
  const entry = state.entries[nextIndex];
  const editState = applyPatches(currentState, entry.patches);
  
  return {
    newState: {
      ...state,
      currentIndex: nextIndex,
    },
    editState,
  };
}

/**
 * Check if undo is possible.
 */
export function canUndo(state: HistoryState): boolean {
  return state.currentIndex >= 0;
}

/**
 * Check if redo is possible.
 */
export function canRedo(state: HistoryState): boolean {
  return state.currentIndex < state.entries.length - 1;
}

// ============================================================================
// Coalescing
// ============================================================================

/**
 * Coalesce multiple entries into one.
 * Used for slider drags and brush strokes that should be a single undo step.
 */
export function coalesceEntries(entries: HistoryEntry[]): HistoryEntry | null {
  if (entries.length === 0) {
    return null;
  }
  
  if (entries.length === 1) {
    return entries[0];
  }
  
  // Merge all patches, keeping only the first "before" and last "after" for each path
  const patchMap = new Map<string, PatchEntry>();
  
  for (const entry of entries) {
    for (const patch of entry.patches) {
      const existing = patchMap.get(patch.path);
      if (existing) {
        // Keep the original "before" and update "after"
        patchMap.set(patch.path, {
          path: patch.path,
          before: existing.before,
          after: patch.after,
        });
      } else {
        patchMap.set(patch.path, { ...patch });
      }
    }
  }
  
  return {
    id: entries[entries.length - 1].id,
    timestamp: entries[entries.length - 1].timestamp,
    patches: Array.from(patchMap.values()),
    description: entries[0].description,
  };
}
