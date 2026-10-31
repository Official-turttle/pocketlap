# PocketLab — Architecture

## Layers

### Application Layer
- Navigation (Expo Router)
- Screens (app/)
- Tool panels, sliders, preset/project management, history UI, export settings
- Depends on: Engine layer, Store layer

### Engine Layer
- Image decode, color conversion, rendering pipeline
- Curves/HSL/grading math, mask rasterization and compositing
- Histogram computation, tiled export
- **NO React dependencies**
- Entry point: `renderEditState(editState: EditState, image: ImageData): RenderResult`

### Store Layer
- Zustand stores: editorStore, historyStore, projectStore
- Bridge between engine and UI
- Source of truth for persistence, undo/redo, export

### Model Layer
- Types, schema, migrations, history patches
- **NO React dependencies**
- Defines `EditState`, `ProjectFile`, `PresetFile`, all adjustment types

## Rendering Pipeline

Stages operate in source-image space. Geometry is applied last so masks stay aligned.

1. **Decode** — Apply EXIF orientation, convert to working color space
2. **White balance & exposure** — Linear light adjustments
3. **Tone** — Contrast, highlights, shadows, whites, blacks, brightness
4. **Color** — Vibrance, saturation, HSL mixer, grading wheels
5. **Curves** — Master, R, G, B (via 1D LUT texture)
6. **Local adjustments** — Masks applied in list order: `mix(prev, adjust(prev, mask.adjustments), coverage × opacity)`
7. **Detail** — Structure, sharpness (neighborhood operations)
8. **Geometry** — Crop, rotate, straighten, perspective
9. **Post-crop effects** — Vignette, fade, grain, blur
10. **Output transform** — To display or export color space

## State Flow (Critical for Performance)

### During slider drag:
1. Slider writes to Reanimated shared value
2. Shader uniforms read the shared value directly
3. **NO React re-render, NO store write**

### On slider release:
1. Final value committed to Zustand store
2. Store creates one history entry (patch-based)
3. Store triggers autosave (debounced)

### Why:
- Keeps sliders at 60fps by avoiding React reconciliation
- Store is source of truth for persistence, undo/redo, export
- Shared values are transient interaction state only

## Data Flow

```
User input (slider/gesture)
  ↓
Shared value (Reanimated) → Shader uniform → GPU render
  ↓ (on release)
Zustand store → History patch → Autosave
  ↓
Engine re-renders with new EditState
```

## Preview vs. Export

- **Preview:** Uses downscaled proxy (~2048px long edge). Same shader code as export.
- **Export:** Reads original, renders in tiles (GPU texture limit sized). Overlapping tiles for neighborhood ops.
- **Consistency:** Same shaders, same color path. Only resolution differs.

## Mask Compositing

- Linear/radial masks: Evaluated analytically in shader
- Brush masks: Rasterized from vector strokes to offscreen texture (cached)
- Inversion and opacity applied to coverage before blending
- MVP mask count cap: ~8 (tune after spike)

## Color Management

- Working space: Linear-light for exposure/WB; gamma-encoded for curves/HSL
- Input: Read embedded profile; handle Display P3
- Output: sRGB by default; preserve P3 where supported
- EXIF orientation: Applied at decode, stored in project
