# Changelog

## [0.4.0] - 2026-06-26

### Added
- **Timeline**: Full transport controls (Play/Pause/Stop/Replay/Step Forward/Step Backward)
- **Timeline**: Click-to-seek and drag scrubber with live time display
- **Timeline**: Speed selector (0.25x, 0.5x, 1x, 2x, 4x)
- **Timeline**: Keyboard shortcuts (Space=Play/Pause, Arrow Left/Right=Step)
- **Teaching Overlay**: 4 modes (Experiment, Teaching, Solving, Explore) with timeline sync
- **Teaching Overlay**: 7-step guided free-fall walkthrough following the Timeline
- **Visualization Toggles**: 11 toggleable 3D overlays (trail, vectors, axes, grid, labels, formulas, units)
- **Menu Bar**: File/Edit/View/Experiment/Teaching/Language/Theme/Help with dropdown menus
- **Panel Manager**: Dockable panel system with View menu toggle and layout persistence

### Changed
- **experiment.store.ts**: Rewritten with `play()`, `pause()`, `stop()`, `replay()`, `stepForward()`, `stepBackward()`, `jumpToTime()`
- **CenterPanel.tsx**: Simplified — toolbar moved to Timeline; added TeachingOverlay
- **Scene3D.tsx**: Visualization toggle integration for axes, grid, trail, force arrows
- **Teaching store**: Added `showFormulas` field; 4 mode presets

### Removed
- Old ControlPanel.tsx (replaced by Timeline + TeachingOverlay)

## [0.3.0] - 2026-06-26

### Added
- PhysicsPlugin system with plugin registry
- i18n internationalization (zh-CN / en-US, 100+ keys)
- Theme system (Dark / Light / Auto with CSS variables)
- Dockable panel manager with localStorage persistence
- Undo/Redo system with 50-step history
- State bookmarks
- Menu bar with 8 dropdown menus

## [0.2.0] - 2026-06-24

### Added
- 4-panel IDE layout (Problem Input / 3D Experiment / AI Analysis / Charts)
- Phase stepper (Release / Falling / Impact / Bounce)
- SVG chart system (Timeline, v-t, s-t, Energy)
- AI analysis panel (Forces, Motion, Derivation, Topics, Tips)
- Input method tabs (Text / OCR / Image / PDF)
- History list

## [0.1.0] - 2026-06-24

### Added
- Electron + React + Three.js project scaffold
- Free fall 3D experiment with real-time physics
- Interactive parameter controls (mass, height, gravity)
- Coordinate axes, ground grid, ball with trail, force arrows
- OrbitControls (rotate, zoom, pan)
