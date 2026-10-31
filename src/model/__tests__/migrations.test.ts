/**
 * Tests for PocketLab Schema Migrations
 */

import {
  migrate,
  migrateProjectFile,
  migratePresetFile,
  ensureCompleteEditState,
} from '../migrations';
import { SCHEMA_VERSION, type ProjectFile, type PresetFile } from '../types';
import { createDefaultEditState } from '../defaults';

describe('Schema Migrations', () => {
  describe('migrate', () => {
    it('should return data unchanged if versions match', () => {
      const data = { foo: 'bar' };
      const result = migrate(data, SCHEMA_VERSION, SCHEMA_VERSION);
      expect(result).toEqual(data);
    });

    it('should throw on downgrade', () => {
      const data = { foo: 'bar' };
      expect(() => migrate(data, SCHEMA_VERSION + 1, SCHEMA_VERSION))
        .toThrow('Cannot downgrade');
    });

    it('should throw on invalid source version', () => {
      const data = { foo: 'bar' };
      expect(() => migrate(data, 0, SCHEMA_VERSION))
        .toThrow('Invalid schema version');
    });

    it('should throw on future target version', () => {
      const data = { foo: 'bar' };
      expect(() => migrate(data, SCHEMA_VERSION, SCHEMA_VERSION + 1))
        .toThrow('Cannot migrate to version');
    });
  });

  describe('migrateProjectFile', () => {
    it('should accept valid current-version project', () => {
      const project: ProjectFile = {
        schemaVersion: SCHEMA_VERSION,
        projectId: 'test-123',
        name: 'Test Project',
        source: {
          path: '/path/to/image.jpg',
          width: 4000,
          height: 3000,
          orientation: 1,
          colorSpace: 'srgb',
        },
        edit: createDefaultEditState(),
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const result = migrateProjectFile(project);
      expect(result).toEqual(project);
    });

    it('should reject non-object input', () => {
      expect(() => migrateProjectFile(null)).toThrow('not an object');
      expect(() => migrateProjectFile('string')).toThrow('not an object');
    });

    it('should reject missing schemaVersion', () => {
      expect(() => migrateProjectFile({ projectId: '123' }))
        .toThrow('missing or invalid schemaVersion');
    });

    it('should reject missing required fields', () => {
      const partial = {
        schemaVersion: SCHEMA_VERSION,
        projectId: '123',
        // Missing name, source, edit, etc.
      };

      expect(() => migrateProjectFile(partial))
        .toThrow('missing required field');
    });
  });

  describe('migratePresetFile', () => {
    it('should accept valid current-version preset', () => {
      const preset: PresetFile = {
        schemaVersion: SCHEMA_VERSION,
        name: 'Test Preset',
        category: 'Cinematic',
        global: createDefaultEditState().global,
        effects: createDefaultEditState().effects,
      };

      const result = migratePresetFile(preset);
      expect(result).toEqual(preset);
    });

    it('should reject non-object input', () => {
      expect(() => migratePresetFile(null)).toThrow('not an object');
    });

    it('should reject missing required fields', () => {
      const partial = {
        schemaVersion: SCHEMA_VERSION,
        name: 'Test',
        // Missing category, global, effects
      };

      expect(() => migratePresetFile(partial))
        .toThrow('missing required field');
    });
  });

  describe('ensureCompleteEditState', () => {
    it('should fill in missing fields with defaults', () => {
      const partial = {
        global: createDefaultEditState().global,
        // Missing effects, geometry, masks
      };

      const result = ensureCompleteEditState(partial);
      
      expect(result.effects).toBeDefined();
      expect(result.geometry).toBeDefined();
      expect(result.masks).toEqual([]);
    });

    it('should preserve existing fields', () => {
      const editState = createDefaultEditState();
      const modified = {
        ...editState,
        effects: {
          ...editState.effects,
          grain: 50,
        },
      };

      const result = ensureCompleteEditState(modified);
      
      expect(result.effects.grain).toBe(50);
    });
  });
});
