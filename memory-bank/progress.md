# Progress

## What Works

- Basic platformer mechanics (movement, jumping).
- Coin collection and UI tracking.
- Enemy presence.
- Level finish detection.
- Game states (Start, Playing, Game Over, Level Complete) with UI overlays.
- Fall detection.
- Parallax background scrolling.
- Procedural level generation (platforms, enemies, coins, crates, player start, finish).
- Dynamic camera zoom based on player state (movement, death).
- **Development Debug Panel:**
  - Runs in a separate `DebugUIScene` parallel to `Game`.
  - Toggleable (Q key).
  - Available in dev builds (`npm run dev`).
  - Displays entity counts (platforms, enemies, coins, crates) and player position.
  - Immune to game camera zoom.
  - Larger font size (24px).

## What's Left to Build

- Level progression logic beyond simple counter increment.
- More complex level designs/generation features.
- Additional enemy types or behaviors.
- Sound effects and music.
- Potential main menu/level select.
- Debug Panel: Display culling information.
- Debug Panel: Investigate and fix `CameraManager.update` call (still commented out in `Game.ts`).

## Current Status

- Core gameplay loop is functional with procedurally generated levels.
- Debug panel refactored into a separate scene for independence from game camera.

## Known Issues

- `CameraManager.update()` call in `Game.ts` is commented out due to potential signature mismatch or missing implementation error during integration.

## Evolution of Project Decisions

- Initial static background replaced with `ParallaxBackground` class for improved visual effect and modularity.
- Static entity placement replaced with `LevelGenerator` for procedural content.
- Camera logic refactored into `CameraManager`.
- Added a conditional debug UI (`DebugPanel`) to aid development without impacting production builds.
- **Refactored Debug UI:** Moved `DebugPanel` into its own `DebugUIScene` launched in parallel to `Game` scene. This prevents the debug UI from being affected by the game camera zoom and uses event emission for data transfer.
