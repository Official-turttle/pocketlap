# PocketLab

PocketLab is a mobile photo editing laboratory built with React Native and Expo. The project focuses on non-destructive image editing, GPU-backed rendering, local project persistence, presets, and a responsive editor workflow designed for mobile devices.

This repository is an early MVP. Core model, history, import, persistence, shader, histogram, and editor UI pieces are in place, while some rendering and media-processing integrations are still placeholders.

## Tech Stack

- React Native 0.76
- Expo 52 with Expo Router
- TypeScript in strict mode
- React Native Skia for image rendering and GPU processing
- Reanimated for high-frequency slider interaction state
- React Native Gesture Handler for gestures
- Zustand for editor state
- Expo SQLite for project and preset indexing
- Jest for unit tests

## Requirements

- Node.js compatible with Expo 52
- npm
- iOS Simulator/Xcode or Android Studio/emulator for native builds

PocketLab uses native modules including Skia, SQLite, image picker, and media library access. Use Expo development builds. Expo Go is not supported for normal development.

## Getting Started

Install dependencies:

```sh
npm install
```

Start the Expo dev server:

```sh
npm start
```

Run on iOS:

```sh
npm run ios
```

Run on Android:

```sh
npm run android
```

## Development Commands

```sh
npm test
npm run lint
npm run typecheck
```

## Project Structure

```text
app/                 Expo Router screens
src/components/      UI components
src/constants/       Theme and configuration constants
src/database/        SQLite setup and database access
src/engine/          Pure image-processing engine code and shaders
src/features/        Screen-level feature logic
src/model/           Types, schema, migrations, defaults, history patches
src/store/           Zustand stores bridging UI and model state
docs/                Architecture and progress notes
```

Important boundaries:

- `src/engine/` must not depend on React.
- `src/model/` must not depend on React.
- Original images are not modified; edits are stored as parameters in `EditState`.
- Coordinates are normalized from `0` to `1` relative to image dimensions.

## Current Features

- Expo Router app shell with home, editor, presets, and learn screens
- Image import flow from the device gallery
- Skia-based image canvas with zoom and pan support
- Non-destructive edit model with versioned schema
- Patch-based undo and redo history
- Zustand editor store
- Tone and white-balance slider UI
- Histogram data structures and display component
- Color-space utilities and histogram computation tests
- SkSL shader definitions for adjustment, HSL, grading, and masks
- SQLite-backed project and preset index
- Preset create, load, delete, import, and export operations

## Architecture

PocketLab is split into four main layers:

- Application layer: Expo Router screens, panels, sliders, project and preset UI
- Engine layer: color math, shader code, pipeline orchestration, histogram logic
- Store layer: Zustand state, edit commits, history integration, persistence bridge
- Model layer: versioned types, defaults, migrations, and history patches

The editor is designed so slider drags update Reanimated shared values for responsive interaction. Final values are committed to Zustand on release, creating a single history entry and enabling autosave integration.

See `docs/ARCHITECTURE.md` for the detailed pipeline and state-flow notes.

## Current Limitations

- Proxy generation currently copies the original instead of creating a resized proxy.
- Image dimension detection currently returns placeholder dimensions.
- `renderPipeline()` is a placeholder and still needs React Native Skia integration.
- Shaders are defined but not fully wired into the canvas rendering path.
- Autosave is not yet wired to the editor store.
- Thumbnail generation is not implemented.
- The home screen project list is not connected to persisted projects yet.
- Brush mask rasterization is not implemented.

See `docs/PROGRESS.md` for the latest batch status, known issues, and open decisions.

## Testing

Run the test suite with:

```sh
npm test
```

Engine and model work should be covered by unit tests. Existing tests cover history behavior, defaults, migrations, color-space utilities, curve LUTs, and histogram logic.

## Notes

This app is configured for a dark UI theme and portrait orientation. The Expo app name is `PocketLab`, with the package identifiers `com.pocketlab.app` for both iOS and Android configuration.
