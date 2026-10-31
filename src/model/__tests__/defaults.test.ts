/**
 * Tests for PocketLab Data Model — Defaults
 */

import {
  DEFAULT_EDIT_STATE,
  DEFAULT_ADJUSTMENT_SET,
  DEFAULT_EFFECTS,
  DEFAULT_GEOMETRY,
  createDefaultEditState,
  createDefaultAdjustmentSet,
} from '../defaults';
import { SCHEMA_VERSION, HSL_BANDS } from '../types';

describe('Defaults', () => {
  describe('DEFAULT_EDIT_STATE', () => {
    it('should have correct structure', () => {
      expect(DEFAULT_EDIT_STATE).toHaveProperty('global');
      expect(DEFAULT_EDIT_STATE).toHaveProperty('effects');
      expect(DEFAULT_EDIT_STATE).toHaveProperty('geometry');
      expect(DEFAULT_EDIT_STATE).toHaveProperty('masks');
    });

    it('should have empty masks array', () => {
      expect(DEFAULT_EDIT_STATE.masks).toEqual([]);
    });

    it('should have zeroed effects', () => {
      expect(DEFAULT_EDIT_STATE.effects.grain).toBe(0);
      expect(DEFAULT_EDIT_STATE.effects.vignette).toBe(0);
      expect(DEFAULT_EDIT_STATE.effects.fade).toBe(0);
      expect(DEFAULT_EDIT_STATE.effects.blur).toBe(0);
    });

    it('should have default geometry', () => {
      expect(DEFAULT_EDIT_STATE.geometry.crop).toEqual({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      });
      expect(DEFAULT_EDIT_STATE.geometry.aspect).toBe('free');
      expect(DEFAULT_EDIT_STATE.geometry.rotation90).toBe(0);
    });
  });

  describe('DEFAULT_ADJUSTMENT_SET', () => {
    it('should have all adjustment categories', () => {
      expect(DEFAULT_ADJUSTMENT_SET).toHaveProperty('whiteBalance');
      expect(DEFAULT_ADJUSTMENT_SET).toHaveProperty('tone');
      expect(DEFAULT_ADJUSTMENT_SET).toHaveProperty('color');
      expect(DEFAULT_ADJUSTMENT_SET).toHaveProperty('hsl');
      expect(DEFAULT_ADJUSTMENT_SET).toHaveProperty('curves');
      expect(DEFAULT_ADJUSTMENT_SET).toHaveProperty('grading');
      expect(DEFAULT_ADJUSTMENT_SET).toHaveProperty('detail');
    });

    it('should have zeroed white balance', () => {
      expect(DEFAULT_ADJUSTMENT_SET.whiteBalance.temperature).toBe(0);
      expect(DEFAULT_ADJUSTMENT_SET.whiteBalance.tint).toBe(0);
    });

    it('should have zeroed tone adjustments', () => {
      expect(DEFAULT_ADJUSTMENT_SET.tone.exposure).toBe(0);
      expect(DEFAULT_ADJUSTMENT_SET.tone.brightness).toBe(0);
      expect(DEFAULT_ADJUSTMENT_SET.tone.contrast).toBe(0);
    });

    it('should have all 8 HSL bands', () => {
      for (const band of HSL_BANDS) {
        expect(DEFAULT_ADJUSTMENT_SET.hsl[band]).toBeDefined();
        expect(DEFAULT_ADJUSTMENT_SET.hsl[band].hue).toBe(0);
        expect(DEFAULT_ADJUSTMENT_SET.hsl[band].saturation).toBe(0);
        expect(DEFAULT_ADJUSTMENT_SET.hsl[band].luminance).toBe(0);
      }
    });

    it('should have default curves (straight line)', () => {
      const curves = DEFAULT_ADJUSTMENT_SET.curves;
      expect(curves.master.points).toHaveLength(2);
      expect(curves.master.points[0]).toEqual({ x: 0, y: 0 });
      expect(curves.master.points[1]).toEqual({ x: 1, y: 1 });
    });

    it('should have grading blending at 50', () => {
      expect(DEFAULT_ADJUSTMENT_SET.grading.blending).toBe(50);
    });
  });

  describe('createDefaultEditState', () => {
    it('should create a new instance', () => {
      const state1 = createDefaultEditState();
      const state2 = createDefaultEditState();
      
      expect(state1).not.toBe(state2);
      expect(state1.global).not.toBe(state2.global);
    });

    it('should match DEFAULT_EDIT_STATE structure', () => {
      const state = createDefaultEditState();
      expect(state).toEqual(DEFAULT_EDIT_STATE);
    });
  });

  describe('createDefaultAdjustmentSet', () => {
    it('should create a new instance', () => {
      const set1 = createDefaultAdjustmentSet();
      const set2 = createDefaultAdjustmentSet();
      
      expect(set1).not.toBe(set2);
    });

    it('should match DEFAULT_ADJUSTMENT_SET structure', () => {
      const set = createDefaultAdjustmentSet();
      expect(set).toEqual(DEFAULT_ADJUSTMENT_SET);
    });
  });
});
