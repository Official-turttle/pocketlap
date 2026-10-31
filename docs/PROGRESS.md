# PocketLab — Progress

## Completed Batches

### B1: Scaffold, Tooling, Notes Files ✓
- **What was built:**
  - Expo project with TypeScript (strict mode)
  - Expo Router setup with dark theme
  - Full folder structure per plan section 14
  - CLAUDE.md (agent instructions)
  - ARCHITECTURE.md (layers, pipeline, state flow)
  - PROGRESS.md (this file)
  - Jest + ESLint configuration
  - Basic app screens (index, editor, presets, learn)
  - Theme constants

- **Public interfaces:**
  - `app/` screens: index.tsx, editor.tsx, presets.tsx, learn.tsx
  - Theme: `src/constants/theme.ts`

- **Gotchas:**
  - Skia and native modules require development builds (not Expo Go)
  - Path aliases configured in tsconfig.json

### B2: Model, Schema, History Core ✓
- **What was built:**
  - Complete type definitions (types.ts)
  - Default values for all adjustments (defaults.ts)
  - Schema migration system (migrations.ts)
  - Patch-based history with coalescing (history.ts)
  - Zustand editor store (editorStore.ts)
  - Unit tests for defaults, history, and migrations

- **Public interfaces:**
  - Types: `EditState`, `AdjustmentSet`, `Mask`, `ProjectFile`, `PresetFile`
  - Defaults: `createDefaultEditState()`, `createDefaultAdjustmentSet()`
  - History: `createHistoryEntry()`, `pushEntry()`, `undo()`, `redo()`, `coalesceEntries()`
  - Store: `useEditorStore` with actions for all adjustment types

- **Gotchas:**
  - History entries are patch-based (changed paths only), not full state copies
  - Slider drags use startDrag/updateDrag/endDrag lifecycle for coalescing

### B3: Import and Viewer ✓
- **What was built:**
  - Image import feature (imageImport.ts)
  - Skia image canvas with zoom/pan (ImageCanvas.tsx)
  - Integration with home screen for import flow
  - Editor screen receives image params

- **Public interfaces:**
  - Import: `pickImage()`, `deleteProjectFiles()`, `fileExists()`
  - Canvas: `ImageCanvas` component with props for imageUri, dimensions

- **Gotchas:**
  - Proxy generation needs actual implementation with expo-image-manipulator
  - Image dimension detection needs native module implementation

### B4: Engine Core — Pipeline and Basic Shaders ✓
- **What was built:**
  - Color space utilities (sRGB/linear/XYZ/Lab conversions)
  - SkSL shaders for white balance, exposure, tone, color, curves
  - Pipeline orchestration module
  - Histogram computation and clipping detection
  - Unit tests for color space and histogram

- **Public interfaces:**
  - Color: `srgbToLinear()`, `linearToSrgb()`, `rgbToLinear()`, `linearToRgb()`, `getLuminance()`
  - Pipeline: `renderPipeline()`, `hasAdjustments()`, `getActiveStages()`
  - Histogram: `computeHistogram()`, `detectClipping()`, `normalizeHistogram()`
  - Shaders: `WHITE_BALANCE_EXPOSURE_SHADER`, `TONE_SHADER`, `COLOR_SHADER`, `CURVES_SHADER`

- **Gotchas:**
  - Pipeline renderPipeline() is a placeholder — needs React Native Skia integration
  - Shaders are defined but not yet compiled/used in the canvas
  - Curve LUT baking not yet implemented

---

### B5: Editor UI, Sliders, Histogram ✓
- **What was built:**
  - Shared-value slider component (Slider.tsx)
  - Histogram display with RGB + luminance channels (HistogramDisplay.tsx)
  - Editor toolbar with tool selection and undo/redo (Toolbar.tsx)
  - Tune panel with all tone and white balance sliders (TunePanel.tsx)
  - Integrated editor screen with all components
  - Drag lifecycle: startDrag → updateDrag → endDrag

- **Public interfaces:**
  - Slider: `Slider` component with onDrag/onCommit/onReset callbacks
  - Histogram: `HistogramDisplay` with clipping warnings
  - Toolbar: `Toolbar` with tool selection and action buttons
  - Panels: `TunePanel` for tone and white balance adjustments

- **Gotchas:**
  - Slider uses Reanimated shared values for 60fps drags
  - Histogram is placeholder — needs actual computation from rendered image

### B6: Persistence and Presets ✓
- **What was built:**
  - SQLite database for project and preset index (database.ts)
  - Atomic project save/load with temp file rename (projectPersistence.ts)
  - Preset create/load/delete/list operations (presets.ts)
  - Preset import/export as JSON
  - Default preset categories

- **Public interfaces:**
  - Database: `getDatabase()`, `initDatabase()`, `closeDatabase()`
  - Projects: `saveProject()`, `loadProject()`, `deleteProject()`, `listProjects()`
  - Presets: `createPreset()`, `loadPreset()`, `deletePreset()`, `listAllPresets()`

- **Gotchas:**
  - Autosave not yet wired up — needs debounced trigger from editor store
  - Thumbnail generation not yet implemented
  - Home screen project list not yet connected

---

### B8: Grading Wheels and Remaining Color ✓
- **What was built:**
  - Color grading shader with 4 wheels (shadows/midtones/highlights/global)
  - Grading wheels UI with hue/saturation wheel and luminance slider
  - Blending and balance controls
  - Grading uniform preparation

- **Public interfaces:**
  - Shader: `GRADING_SHADER`
  - Utils: `prepareGradingUniforms()`, `hasGradingAdjustments()`
  - UI: `GradingPanel` component

### B9: Gradient Masks and Mask Management ✓
- **What was built:**
  - Linear gradient mask shader
  - Radial gradient mask shader
  - Mask compositing shader
  - Mask list UI (create, rename, duplicate, delete, visibility, invert)
  - Mask uniform preparation utilities

- **Public interfaces:**
  - Shaders: `LINEAR_MASK_SHADER`, `RADIAL_MASK_SHADER`, `MASK_COMPOSITE_SHADER`
  - Utils: `prepareLinearMaskUniforms()`, `prepareRadialMaskUniforms()`, `getActiveMasks()`
  - UI: `MaskList` component

---

## Current Batch
B10: Brush mask and eraser (pending)

---

## Known Issues
- Proxy generation in imageImport.ts needs expo-image-manipulator
- Image dimension detection needs native implementation
- Pipeline renderPipeline() needs React Native Skia integration
- Autosave needs debounced trigger from editor store
- Thumbnail generation not yet implemented
- Home screen project list not yet connected
- Brush mask rasterization not yet implemented

---

## Open Decisions
See project_plan_v3.md section 16 for the full list. Key ones:
1. Proxy resolution (2048px vs adaptive)
2. Brush mask representation (vector vs vector+raster compaction)
3. Output color space (sRGB only vs P3 support)
4. Persist history in project files?
5. Mask count cap (needs profiling)
