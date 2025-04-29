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
  - **Improved:** Enemy and crate placement ensures they occupy distinct platforms and utilizes a post-platform-generation shuffling approach for distribution.
- Dynamic camera zoom based on player state (movement, death).
- **Development Debug Panel:**
  - Runs in a separate `DebugUIScene` parallel to `Game`.
  - Toggleable (Q key).
  - Available in dev builds (`npm run dev`).
  - Displays entity counts (platforms, enemies, coins, crates) and player position.
  - Immune to game camera zoom.
  - Larger font size (24px).
  - Displays culled entity counts (coins, enemies).

## What's Left to Build

- Test improved level generation (enemy/crate placement).
- Level progression logic beyond simple counter increment.
- More complex level designs/generation features.
- Additional enemy types or behaviors.
- Sound effects and music.
- Potential main menu/level select.
- Debug Panel: Display culling information.
- Debug Panel: Investigate and fix `CameraManager.update` call (still commented out in `Game.ts`).

## Current Status

- Core gameplay loop is functional with procedurally generated levels.
- Level generation logic for enemy and crate placement has been refactored for better distribution and to prevent overlap.
- Debug panel refactored into a separate scene for independence from game camera.
- Basic culling implemented for coins and enemies.
- **Preloader updated to load both `texturePack` and `texturePack2` atlases.**

## Known Issues

- `CameraManager.update()` call in `Game.ts` is commented out due to potential signature mismatch or missing implementation error during integration.
- Idle animation doesn't always play immediately upon landing. (Fixed: Added explicit idle animation check in `Player.ts::handleCollisionStart`)

## Evolution of Project Decisions

- Initial static background replaced with `ParallaxBackground` class for improved visual effect and modularity.
- Static entity placement replaced with `LevelGenerator` for procedural content.
- Camera logic refactored into `CameraManager`.
- Added a conditional debug UI (`DebugPanel`) to aid development without impacting production builds.
- **Refactored Debug UI:** Moved `DebugPanel` into its own `DebugUIScene` launched in parallel to `Game` scene. This prevents the debug UI from being affected by the game camera zoom and uses event emission for data transfer.
- **Added Culling:** Introduced bounds checking in `Game.ts` to disable rendering and physics processing for off-screen coins and enemies, improving performance.
- **Refactored Item Placement:** Changed level generation (`LevelGenerator.ts`) to place enemies and crates _after_ all platforms are created using a shuffled list of eligible platforms. This ensures they don't share a platform and allows better control over total counts.
