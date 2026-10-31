/**
 * PocketLab Store — Editor Store
 * 
 * Zustand store for editor state.
 * Source of truth for the current EditState.
 * Handles history, undo/redo, and autosave triggers.
 */

import { create } from 'zustand';
import type {
  EditState,
  AdjustmentSet,
  EffectSettings,
  GeometrySettings,
  Mask,
} from '../model/types';
import {
  createDefaultEditState,
  createHistoryState,
  createHistoryEntry,
  pushEntry,
  undo,
  redo,
  canUndo,
  canRedo,
  type HistoryState,
} from '../model';

// ============================================================================
// Store State
// ============================================================================

export interface EditorState {
  // Current edit state
  editState: EditState;
  
  // History
  history: HistoryState;
  
  // Transient state (not persisted)
  isDragging: boolean;
  dragStartState: EditState | null;
  
  // Autosave
  isDirty: boolean;
  lastSavedAt: number | null;
}

export interface EditorActions {
  // Bulk update
  setEditState: (state: EditState, description?: string) => void;
  
  // Adjustment updates
  updateGlobal: (updates: Partial<AdjustmentSet>, description?: string) => void;
  updateEffects: (updates: Partial<EffectSettings>, description?: string) => void;
  updateGeometry: (updates: Partial<GeometrySettings>, description?: string) => void;
  
  // Mask operations
  addMask: (mask: Mask) => void;
  updateMask: (maskId: string, updates: Partial<Mask>) => void;
  removeMask: (maskId: string) => void;
  reorderMasks: (maskIds: string[]) => void;
  
  // Drag lifecycle
  startDrag: () => void;
  updateDrag: (updater: (state: EditState) => EditState) => void;
  endDrag: (description?: string) => void;
  
  // History
  undoAction: () => void;
  redoAction: () => void;
  
  // Autosave
  markSaved: () => void;
  
  // Reset
  reset: () => void;
}

export type EditorStore = EditorState & EditorActions;

// ============================================================================
// Store
// ============================================================================

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  editState: createDefaultEditState(),
  history: createHistoryState(),
  isDragging: false,
  dragStartState: null,
  isDirty: false,
  lastSavedAt: null,
  
  // Bulk update
  setEditState: (newState, description) => {
    const state = get();
    const entry = createHistoryEntry(state.editState, newState, description);
    
    set({
      editState: newState,
      history: entry ? pushEntry(state.history, entry) : state.history,
      isDirty: true,
    });
  },
  
  // Adjustment updates
  updateGlobal: (updates, description) => {
    const state = get();
    const newState: EditState = {
      ...state.editState,
      global: {
        ...state.editState.global,
        ...updates,
      },
    };
    
    get().setEditState(newState, description);
  },
  
  updateEffects: (updates, description) => {
    const state = get();
    const newState: EditState = {
      ...state.editState,
      effects: {
        ...state.editState.effects,
        ...updates,
      },
    };
    
    get().setEditState(newState, description);
  },
  
  updateGeometry: (updates, description) => {
    const state = get();
    const newState: EditState = {
      ...state.editState,
      geometry: {
        ...state.editState.geometry,
        ...updates,
      },
    };
    
    get().setEditState(newState, description);
  },
  
  // Mask operations
  addMask: (mask) => {
    const state = get();
    const newState: EditState = {
      ...state.editState,
      masks: [...state.editState.masks, mask],
    };
    
    get().setEditState(newState, 'Add mask');
  },
  
  updateMask: (maskId, updates) => {
    const state = get();
    const masks = state.editState.masks.map(m =>
      m.id === maskId ? { ...m, ...updates } : m
    );
    
    const newState: EditState = {
      ...state.editState,
      masks,
    };
    
    get().setEditState(newState, 'Update mask');
  },
  
  removeMask: (maskId) => {
    const state = get();
    const masks = state.editState.masks.filter(m => m.id !== maskId);
    
    const newState: EditState = {
      ...state.editState,
      masks,
    };
    
    get().setEditState(newState, 'Remove mask');
  },
  
  reorderMasks: (maskIds) => {
    const state = get();
    const maskMap = new Map(state.editState.masks.map(m => [m.id, m]));
    const masks = maskIds
      .map(id => maskMap.get(id))
      .filter((m): m is Mask => m !== undefined);
    
    const newState: EditState = {
      ...state.editState,
      masks,
    };
    
    get().setEditState(newState, 'Reorder masks');
  },
  
  // Drag lifecycle
  startDrag: () => {
    set({
      isDragging: true,
      dragStartState: { ...get().editState },
    });
  },
  
  updateDrag: (updater) => {
    // During drag, update editState directly without creating history entries
    set({
      editState: updater(get().editState),
    });
  },
  
  endDrag: (description) => {
    const state = get();
    
    if (!state.isDragging || !state.dragStartState) {
      set({ isDragging: false, dragStartState: null });
      return;
    }
    
    // Create a single history entry for the entire drag
    const entry = createHistoryEntry(state.dragStartState, state.editState, description);
    
    set({
      isDragging: false,
      dragStartState: null,
      history: entry ? pushEntry(state.history, entry) : state.history,
      isDirty: true,
    });
  },
  
  // History
  undoAction: () => {
    const state = get();
    const result = undo(state.history, state.editState);
    
    if (result) {
      set({
        editState: result.editState,
        history: result.newState,
        isDirty: true,
      });
    }
  },
  
  redoAction: () => {
    const state = get();
    const result = redo(state.history, state.editState);
    
    if (result) {
      set({
        editState: result.editState,
        history: result.newState,
        isDirty: true,
      });
    }
  },
  
  // Autosave
  markSaved: () => {
    set({
      isDirty: false,
      lastSavedAt: Date.now(),
    });
  },
  
  // Reset
  reset: () => {
    set({
      editState: createDefaultEditState(),
      history: createHistoryState(),
      isDragging: false,
      dragStartState: null,
      isDirty: false,
      lastSavedAt: null,
    });
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectEditState = (state: EditorStore) => state.editState;
export const selectCanUndo = (state: EditorStore) => canUndo(state.history);
export const selectCanRedo = (state: EditorStore) => canRedo(state.history);
export const selectIsDirty = (state: EditorStore) => state.isDirty;
