/**
 * Tests for PocketLab History
 */

import {
  getPath,
  setPath,
  generatePatches,
  applyPatches,
  revertPatches,
  createHistoryEntry,
  createHistoryState,
  pushEntry,
  undo,
  redo,
  canUndo,
  canRedo,
  coalesceEntries,
  type HistoryEntry,
} from '../history';
import { createDefaultEditState, type EditState } from '../index';

describe('Path Operations', () => {
  describe('getPath', () => {
    it('should get top-level value', () => {
      const obj = { a: 1 };
      expect(getPath(obj, 'a')).toBe(1);
    });

    it('should get nested value', () => {
      const obj = { a: { b: { c: 42 } } };
      expect(getPath(obj, 'a.b.c')).toBe(42);
    });

    it('should return undefined for missing path', () => {
      const obj = { a: 1 };
      expect(getPath(obj, 'b')).toBeUndefined();
    });

    it('should handle arrays', () => {
      const obj = { items: [1, 2, 3] };
      expect(getPath(obj, 'items')).toEqual([1, 2, 3]);
    });
  });

  describe('setPath', () => {
    it('should set top-level value', () => {
      const obj = { a: 1 };
      const result = setPath(obj, 'a', 2);
      expect(result).toEqual({ a: 2 });
      expect(obj).toEqual({ a: 1 }); // Original unchanged
    });

    it('should set nested value', () => {
      const obj = { a: { b: 1 } };
      const result = setPath(obj, 'a.b', 2);
      expect(result).toEqual({ a: { b: 2 } });
    });

    it('should create nested structure if missing', () => {
      const obj = {};
      const result = setPath(obj, 'a.b.c', 42);
      expect(result).toEqual({ a: { b: { c: 42 } } });
    });
  });
});

describe('Patch Generation', () => {
  it('should generate patches for changed values', () => {
    const before = createDefaultEditState();
    const after: EditState = {
      ...before,
      global: {
        ...before.global,
        tone: {
          ...before.global.tone,
          exposure: 1.5,
        },
      },
    };

    const patches = generatePatches(before, after);
    
    expect(patches).toHaveLength(1);
    expect(patches[0].path).toBe('global.tone.exposure');
    expect(patches[0].before).toBe(0);
    expect(patches[0].after).toBe(1.5);
  });

  it('should generate multiple patches for multiple changes', () => {
    const before = createDefaultEditState();
    const after: EditState = {
      ...before,
      global: {
        ...before.global,
        tone: {
          ...before.global.tone,
          exposure: 1.5,
          contrast: 20,
        },
      },
    };

    const patches = generatePatches(before, after);
    
    expect(patches).toHaveLength(2);
    expect(patches.map(p => p.path)).toContain('global.tone.exposure');
    expect(patches.map(p => p.path)).toContain('global.tone.contrast');
  });

  it('should return empty array for identical states', () => {
    const before = createDefaultEditState();
    const after = createDefaultEditState();

    const patches = generatePatches(before, after);
    
    expect(patches).toHaveLength(0);
  });

  it('should handle array changes', () => {
    const before = createDefaultEditState();
    const after: EditState = {
      ...before,
      masks: [
        {
          id: 'mask1',
          name: 'Mask 1',
          visible: true,
          inverted: false,
          opacity: 1,
          shape: { type: 'linear', start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, feather: 0.5 },
          adjustments: before.global,
        },
      ],
    };

    const patches = generatePatches(before, after);
    
    expect(patches).toHaveLength(1);
    expect(patches[0].path).toBe('masks');
  });
});

describe('Patch Application', () => {
  it('should apply patches forward', () => {
    const before = createDefaultEditState();
    const patches = [
      { path: 'global.tone.exposure', before: 0, after: 1.5 },
    ];

    const result = applyPatches(before, patches);
    
    expect(result.global.tone.exposure).toBe(1.5);
  });

  it('should revert patches backward', () => {
    const after: EditState = {
      ...createDefaultEditState(),
      global: {
        ...createDefaultEditState().global,
        tone: {
          ...createDefaultEditState().global.tone,
          exposure: 1.5,
        },
      },
    };
    const patches = [
      { path: 'global.tone.exposure', before: 0, after: 1.5 },
    ];

    const result = revertPatches(after, patches);
    
    expect(result.global.tone.exposure).toBe(0);
  });

  it('should round-trip correctly', () => {
    const original = createDefaultEditState();
    const modified: EditState = {
      ...original,
      global: {
        ...original.global,
        tone: {
          ...original.global.tone,
          exposure: 1.5,
          contrast: 20,
        },
      },
    };

    const patches = generatePatches(original, modified);
    const applied = applyPatches(original, patches);
    const reverted = revertPatches(applied, patches);
    
    expect(applied).toEqual(modified);
    expect(reverted).toEqual(original);
  });
});

describe('History Management', () => {
  it('should create empty history state', () => {
    const state = createHistoryState();
    
    expect(state.entries).toHaveLength(0);
    expect(state.currentIndex).toBe(-1);
  });

  it('should push entries', () => {
    const state = createHistoryState();
    const before = createDefaultEditState();
    const after: EditState = {
      ...before,
      global: {
        ...before.global,
        tone: { ...before.global.tone, exposure: 1 },
      },
    };

    const entry = createHistoryEntry(before, after);
    expect(entry).not.toBeNull();
    
    const newState = pushEntry(state, entry!);
    
    expect(newState.entries).toHaveLength(1);
    expect(newState.currentIndex).toBe(0);
  });

  it('should undo', () => {
    const before = createDefaultEditState();
    const after: EditState = {
      ...before,
      global: {
        ...before.global,
        tone: { ...before.global.tone, exposure: 1 },
      },
    };

    const entry = createHistoryEntry(before, after)!;
    const historyState = pushEntry(createHistoryState(), entry);
    
    const result = undo(historyState, after);
    
    expect(result).not.toBeNull();
    expect(result!.editState.global.tone.exposure).toBe(0);
    expect(result!.newState.currentIndex).toBe(-1);
  });

  it('should redo', () => {
    const before = createDefaultEditState();
    const after: EditState = {
      ...before,
      global: {
        ...before.global,
        tone: { ...before.global.tone, exposure: 1 },
      },
    };

    const entry = createHistoryEntry(before, after)!;
    const historyState = pushEntry(createHistoryState(), entry);
    const undone = undo(historyState, after)!;
    
    const result = redo(undone.newState, undone.editState);
    
    expect(result).not.toBeNull();
    expect(result!.editState.global.tone.exposure).toBe(1);
    expect(result!.newState.currentIndex).toBe(0);
  });

  it('should report canUndo and canRedo correctly', () => {
    const state = createHistoryState();
    expect(canUndo(state)).toBe(false);
    expect(canRedo(state)).toBe(false);
    
    const before = createDefaultEditState();
    const after: EditState = {
      ...before,
      global: {
        ...before.global,
        tone: { ...before.global.tone, exposure: 1 },
      },
    };
    
    const entry = createHistoryEntry(before, after)!;
    const withEntry = pushEntry(state, entry);
    
    expect(canUndo(withEntry)).toBe(true);
    expect(canRedo(withEntry)).toBe(false);
    
    const undone = undo(withEntry, after)!;
    expect(canUndo(undone.newState)).toBe(false);
    expect(canRedo(undone.newState)).toBe(true);
  });
});

describe('Coalescing', () => {
  it('should coalesce multiple entries into one', () => {
    const state1 = createDefaultEditState();
    const state2: EditState = {
      ...state1,
      global: {
        ...state1.global,
        tone: { ...state1.global.tone, exposure: 0.5 },
      },
    };
    const state3: EditState = {
      ...state2,
      global: {
        ...state2.global,
        tone: { ...state2.global.tone, exposure: 1.0 },
      },
    };
    const state4: EditState = {
      ...state3,
      global: {
        ...state3.global,
        tone: { ...state3.global.tone, exposure: 1.5 },
      },
    };

    const entry1 = createHistoryEntry(state1, state2)!;
    const entry2 = createHistoryEntry(state2, state3)!;
    const entry3 = createHistoryEntry(state3, state4)!;

    const coalesced = coalesceEntries([entry1, entry2, entry3]);
    
    expect(coalesced).not.toBeNull();
    expect(coalesced!.patches).toHaveLength(1);
    expect(coalesced!.patches[0].before).toBe(0);
    expect(coalesced!.patches[0].after).toBe(1.5);
  });

  it('should return null for empty array', () => {
    const result = coalesceEntries([]);
    expect(result).toBeNull();
  });

  it('should return single entry unchanged', () => {
    const before = createDefaultEditState();
    const after: EditState = {
      ...before,
      global: {
        ...before.global,
        tone: { ...before.global.tone, exposure: 1 },
      },
    };

    const entry = createHistoryEntry(before, after)!;
    const coalesced = coalesceEntries([entry]);
    
    expect(coalesced).toEqual(entry);
  });
});
