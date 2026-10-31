# PocketLab — Agent Instructions

## Stack
- React Native + Expo (development builds, NOT Expo Go)
- TypeScript (strict mode)
- React Native Skia for image rendering and GPU processing
- Zustand for state management
- Reanimated for shared values (slider drags bypass React)
- React Native Gesture Handler for gestures
- Expo Router for navigation
- SQLite (expo-sqlite) for project/preset index
- Jest for testing

## Commands
- `npm start` — start Expo dev server
- `npm run ios` — run on iOS device/simulator
- `npm run android` — run on Android device/emulator
- `npm test` — run Jest tests
- `npm run lint` — run ESLint
- `npm run typecheck` — run TypeScript type checking

## Folder Rules
- `app/` — Expo Router screens only (index, editor, presets, learn)
- `src/engine/` — NO React dependencies. Pure TypeScript + SkSL shaders.
- `src/model/` — Types, schema, migrations, history patches. NO React.
- `src/store/` — Zustand stores. Bridge between engine and UI.
- `src/components/` — UI components only. No business logic.
- `src/features/` — Screen-level logic that composes components and stores.
- `src/hooks/` — Custom React hooks.
- `src/utils/` — Pure utility functions.
- `src/constants/` — Constants and configuration.
- `docs/` — Project notes (ARCHITECTURE.md, PROGRESS.md, SPIKE.md).

## Do NOT
- Do not use `<Image>` or CSS filters for editing. Use Skia canvas.
- Do not write to React state during slider drags. Use Reanimated shared values.
- Do not modify the original image. Edits are parameters only.
- Do not import React in `src/engine/` or `src/model/`.
- Do not skip tests. Engine work is test-first.
- Do not re-open files outside the batch scope.

## Conventions
- All coordinates normalized (0–1) relative to image dimensions.
- All types versioned with `schemaVersion`.
- All edits are non-destructive parameters in `EditState`.
- Slider drags write to shared values; commit to Zustand on release.
- Engine functions are pure: `(EditState, Image) => Pixels`.
