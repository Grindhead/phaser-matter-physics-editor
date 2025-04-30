# Progress

## What Works

- Player movement (left/right).
- Player jumping.
- Basic animation states (idle, run, jump, fall).
- Ground detection using Matter.js collision events.
- `FXLand` effect exists as a separate entity.
- **`FXLand` effect spawns when player lands.**
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
  - **Physics debug view state now persists across level restarts.**
- **Barrel Entity & Interaction:**
  - `Barrel` class with correct rotation origin (`0.22, 0.5`).
  - Barrels placed procedurally by `LevelGenerator` (mandatory bridge barrels and optional barrels between platforms).
  - Correct vertical positioning for player accessibility.
  - Collision detection between Player and Barrel (`Game.ts`).
  - Player enters barrel (`Player.enterBarrel`, `Barrel.enter`), disabling player controls and snapping position.
  - Barrel rotates (`Barrel.update`).
  - Player input (jump) triggers launch (`Player.launchFromBarrel`).
  - Barrel plays enter/launch animations (`BARREL_ANIMATION_KEYS`).
  - Player is launched based on barrel angle and speed (`Barrel.launch`, `Player.exitBarrel`).
  - State management (`Player.isInBarrel`, `Player.currentBarrel`, `Barrel.isEntered`).

## What's Left to Build

- **Improve mobile responsiveness and UI scaling.**
- Implement mobile controls (`createMobileControls` is empty).
- Define level completion logic/trigger.
- Implement player death sequence (`kill` method exists but needs trigger).
- Test improved level generation (enemy/crate placement).
- Level progression logic beyond simple counter increment.
- More complex level designs/generation features.
- Additional enemy types or behaviors.
- Sound effects and music.
- Potential main menu/level select.
- Debug Panel: Display culling information.
- Debug Panel: Investigate and fix `CameraManager.update` call (still commented out in `Game.ts`).
- Fine-tuning entity behaviors, level design, etc.

## Current Status

- Core gameplay loop is functional with procedurally generated levels including barrel mechanics.
- Level generation logic for enemy and crate placement has been refactored for better distribution and to prevent overlap.
- Barrel placement logic refactored: Barrels are now placed between platforms, **with Y-position calculated relative to adjacent platforms for reachability**, and overlap prevention.
- Debug panel refactored into a separate scene for independence from game camera.
- Basic culling implemented for coins and enemies.
- **Preloader updated to load both `texturePack` and `texturePack2` atlases.**
- **Physics debug rendering state is now correctly maintained across level restarts.**

## Known Issues

- `CameraManager.update()` call in `Game.ts` is commented out due to potential signature mismatch or missing implementation error during integration.
- Idle animation doesn't always play immediately upon landing. (Fixed: Added explicit idle animation check in `Player.ts::handleCollisionStart`)

## Evolution of Project Decisions

- Initial static background replaced with `ParallaxBackground` class for improved visual effect and modularity.
- Static entity placement replaced with `LevelGenerator` for procedural content.
- Camera logic refactored into `CameraManager`.
- Added a conditional debug UI (`DebugPanel`) to aid development without impacting production builds.
- **Refactored Debug UI:** Moved `DebugPanel` into its own `DebugUIScene` launched in parallel to `Game` scene. This prevents the debug UI from being affected by the game camera zoom and uses event emission for data transfer.
  - **Physics debug state persistence:** The `Game` scene now stores and restores the physics debug state (`matter.world.drawDebug`) when the scene restarts, ensuring the toggle state is maintained.
- **Added Culling:** Introduced bounds checking in `Game.ts` to disable rendering and physics processing for off-screen coins and enemies, improving performance.
- **Refactored Item Placement:** Changed level generation (`LevelGenerator.ts`) to place enemies and crates _after_ all platforms are created using a shuffled list of eligible platforms. This ensures they don't share a platform and allows better control over total counts.
- Landing effect (`FXLand`) is triggered within the `Player`'s `handleCollisionStart` method for immediate feedback upon landing.
- **Added Barrel Entity:** Introduced `Barrel.ts` as a new interactive element.
- **Updated Barrel Spawning:** Updated `LevelGenerator.ts` and added helper `itemPlacementHelper.ts` to procedurally place `Barrel` instances on the ground _between_ platforms, ensuring they don't overlap, calculating Y-position relative to adjacent platforms for reachability, and substituting barrels for platforms over large gaps. Added overlap checks for bridge barrels.
- **Guaranteed Barrel Spawn Chance:** Updated `LevelGenerator.ts` to calculate a minimum required platform count based on target item counts (enemies, crates, barrel) to ensure enough eligible platforms exist, guaranteeing at least one barrel can be placed.
- **Barrel Interaction Implemented:** Added collision handling (`Game.ts`), state management (`Player.ts`, `Barrel.ts`), animation triggers, and launch physics for the Donkey Kong Country-style barrel mechanic. Resolved initial state toggling issues through careful state management and potentially animation events.
