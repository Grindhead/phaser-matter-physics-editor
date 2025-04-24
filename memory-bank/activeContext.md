# Active Context

## Current Focus

Refactoring the Debug Panel into a separate Phaser Scene.

## Recent Changes

- **Increased Debug Font Size:** Updated `DebugPanel.ts` to use `24px` font size and adjusted padding/width.
- **Created `DebugUIScene.ts`:**
  - New scene extending `Phaser.Scene` (key `SCENES.DEBUG_UI`).
  - Instantiates `DebugPanel`.
  - Listens for `updateDebugData` events from the `Game` scene via `gameScene.events.on()`.
  - Handles the 'Q' key press to toggle the `DebugPanel` visibility.
  - Includes cleanup logic to remove the event listener on scene shutdown.
- **Added `SCENES.DEBUG_UI` Constant:** Updated `src/lib/constants.ts`.
- **Modified `Game.ts`:**
  - Removed all `DebugPanel` related code (import, member, instantiation, update, toggle, destroy).
  - Added logic in `create()` to conditionally launch `DebugUIScene` in parallel (`this.scene.launch()`) if `import.meta.env.DEV` is true.
  - Added logic in `update()` to conditionally emit the `updateDebugData` event (`this.events.emit()`) with entity counts and player position if `import.meta.env.DEV` is true.
  - Added logic in `restartLevel()` to stop the `DebugUIScene` (`this.scene.stop()`) if it is active before restarting the `Game` scene.
- **Updated `main.ts`:** Imported `DebugUIScene` and added it to the scene array in the main `Phaser.Game` configuration.
- **Updated Memory Bank:** Updated `systemPatterns.md` and `progress.md` to reflect the new two-scene structure for the debug UI, the use of parallel scenes, and event-based communication.

## Next Steps

- Test the refactored debug panel functionality (launching, toggling, data updates, restart behavior).
- Test the new culling implementation for coins and enemies, verifying counts in the debug panel.
- Investigate the issue with the `CameraManager.update()` call (currently commented out in `Game.ts`).
- Continue with tasks listed in `progress.md` (tuning generation, level progression etc.).

## Active Decisions & Considerations

- Moving UI to a separate scene is the standard Phaser approach for overlays independent of the main game camera.
- Using Phaser's built-in event emitter (`scene.events` or `game.events`) is suitable for communication between parallel scenes.
- Ensuring cleanup (stopping parallel scenes, removing listeners) during restarts or transitions is important to prevent memory leaks or unexpected behavior.
- The debug scene is only launched and data is only emitted in development builds, minimizing production overhead.
- Culling logic uses camera bounds + a buffer to determine visibility.
- Setting visibility (`setVisible(false)`) hides culled objects.
- Waking up bodies (`setAwake()`) is done when culled objects become visible again.
- **Limitation:** Could not reliably force Matter bodies to sleep via API (`Matter.Sleeping.set` or `gameObject.sleep()`) due to type/import issues. Physics calculations for culled dynamic bodies may continue.

## Important Patterns & Preferences

- **Parallel Scenes:** Utilizing Phaser's ability to run multiple scenes concurrently, often for separating UI layers from the main game logic.
- **Scene Communication (Events):** Employing the event emitter pattern for decoupled communication between scenes.
- **Performance Optimization (Culling):** Checking entity visibility against camera bounds and disabling rendering/physics for off-screen objects.
- Using `Matter.Sleeping` can help optimize physics performance for inactive bodies.
- Phaser's `setAwake()` can be used to wake bodies that slept automatically.

## Learnings & Project Insights

- Refactoring UI into separate scenes improves modularity and solves issues related to conflicting camera manipulations between game layers and UI layers.
- Event-based communication provides a clean decoupling mechanism between different parts of the application (in this case, scenes).
- Simple bounds checking is a common first step for implementing culling.
- Using `Matter.Sleeping` can help optimize physics performance for inactive bodies.

---

_(Previous context below this line)_

## Current Focus

Implementing and integrating a conditional debug panel UI.

## Recent Changes

- **Added `DebugPanel.ts`:** Created a new UI class (`src/lib/ui/DebugPanel.ts`) to display debug information using Phaser Text objects.
- **Integrated `DebugPanel` into `Game.ts`:**
  - Conditionally creates `DebugPanel` instance if `import.meta.env.DEV` is true.
  - Added a keyboard listener ('Q') to toggle the panel's visibility.
  - Stores the `LevelGenerator` instance to access generated entities.
  - Passes entity counts (platforms, enemies, coins, crates) to `DebugPanel.update()`.
  - Ensures `DebugPanel` is destroyed on scene restart (`restartLevel`).
- **Updated `LevelGenerator.ts`:**
  - Added internal arrays `coins` and `crates` to track generated entities.
  - Added public getter methods `getCoins()` and `getCrates()`.
  - Clears internal entity arrays at the start of `generateLevel`.
- **Refactored `Game.ts` Update Loop:** Adjusted arguments for `player.update`, `enemy.update`, and `background.update` based on linter feedback. Commented out `cameraManager.update()` due to persistent linter errors.
- **Updated Memory Bank:** Modified `systemPatterns.md` and `progress.md` to reflect the addition of the debug panel and associated changes/issues.

## Next Steps

- Test the debug panel functionality in a development build.
- Investigate the issue with the `CameraManager.update()` call.
- Implement the display of culling information in the debug panel.
- Continue with tasks listed in `progress.md` (tuning generation, level progression etc.).

## Active Decisions & Considerations

- Using `import.meta.env.DEV` (provided by Vite) is a standard way to include development-only features.
- Fetching entity data via getters on `LevelGenerator` keeps the debug panel decoupled from the specific generation logic.
- Displaying entity counts is a first step; more detailed info (positions, states) could be added later.
- Culling information display needs investigation (Phaser camera culling API or visual representation).
- The `CameraManager.update` issue needs debugging to understand if the method exists and what its expected signature is.

## Important Patterns & Preferences

- **Conditional Compilation/Features:** Using build flags (`import.meta.env.DEV`) to include/exclude code blocks for different environments (dev vs. production).
- **Decoupled Debug Info:** Accessing data for debug displays through well-defined interfaces (getters) rather than directly accessing internal state of other classes.

## Learnings & Project Insights

- Integrating new UI elements requires careful handling of instantiation, updates, and cleanup (especially during scene restarts).
- Linter feedback is crucial but sometimes requires iterative refinement or temporary workarounds (like commenting out problematic code) when the exact cause isn't immediately clear.
- Assumptions about method signatures or existence based on documentation or previous context can be wrong; direct code checking or targeted debugging is sometimes necessary.

## Current Focus

Testing fall sensor placement using post-generation minimum Y calculation.

## Recent Changes

- **Revised Fall Sensor Placement Logic:**

  - Removed lowest Y tracking from `LevelGenerator.ts`.
  - Added `getPlatforms()` method to `LevelGenerator.ts`.
  - Updated `Game.ts::generateLevelEntities` to call `getPlatforms()`, iterate through the results to find the minimum `platform.getBounds().bottom`, and then call `createFallSensor` with that value. This ensures the calculation happens after all platforms are created.

- **Increased Coin Spacing in `LevelGenerator.ts`:**

  - Increased `MIN_COIN_SPACING` constant from 32 to 64 to enforce a larger gap between coin centers, aiming to resolve collection issues.

- **Refined Coin Placement in `LevelGenerator.ts`:**

  - Logic updated to distribute the target number of coins evenly across the platform's width.
  - It first calculates the max coins that fit with `MIN_COIN_SPACING`, caps the random target by this max, then calculates the `evenSpacing` required for the final `numCoins` and places them accordingly.

- **Further Refined `LevelGenerator.ts`:**

  - **Finish Height:** Increased vertical offset to 100px above the last platform's top surface (`bounds.top - 100`).
  - **Crate Placement Fix:** Corrected logic to check if an enemy was _actually_ placed on the platform (using a local flag) before placing a crate, instead of just checking the initial placement _intent_.

- **Adjusted Finish Line Placement in `LevelGenerator.ts`:**

  - ~~`createFinishPoint` now places the finish line 50px above the _top-right edge_ of the last platform's surface (using `bounds.right` for X and `bounds.top - 50` for Y).~~ (Superseded by above change)

- **Updated `LevelGenerator.ts` for Infinite Bounds & New Rules:**

  - Removed platform position clamping based on world bounds (now Infinity).
  - Modified `populatePlatform` to prevent enemy placement on the _last_ platform.

- **Dynamic Fall Sensor Placement:**

  - Modified `LevelGenerator.ts` to track the bottom Y coordinate of the lowest platform (`lowestPlatformBottomY`) and added `getLowestPlatformBottomY()`.
  - Modified `Game.ts`:
    - `generateLevelEntities` now gets the lowest Y from the generator and calls `createFallSensor` with this value.
    - Removed `createFallSensor` call from `startGame`.
    - `createFallSensor` now accepts `lowestPlatformBottomY` and calculates its Y position dynamically (500px below the lowest platform bottom).

- **Added Enemy Platform Length Constraint to `src/lib/LevelGenerator.ts`:**

  - Platforms intended to have an enemy are now generated with a minimum length of 14 segments (`MIN_PLATFORM_LENGTH_WITH_ENEMY`).
  - The decision to _potentially_ place an enemy is made _before_ platform length is finalized.
  - `populatePlatform` now receives the enemy placement decision as a parameter, removing the redundant internal probability check.

- **Refactored and Refined `src/lib/LevelGenerator.ts`:**

  - **Structure:** Broke down `generateLevel` into smaller private methods (`getLevelGenerationParams`, `createPlayerStart`, `calculateNextPlatformPosition`, `createPlatform`, `populatePlatform`, `createFinishPoint`, `checkCoinCount`) for improved readability and maintainability.
  - **Solvability:** Added basic solvability checks in `calculateNextPlatformPosition`. Platform gaps (horizontal and upward vertical) are clamped based on player jump constants (`MAX_JUMP_DISTANCE_X`, `MAX_JUMP_HEIGHT_UP`) to ensure platforms are generally reachable.
  - **Configuration:** Centralized parameter calculation (gaps, probabilities) in `getLevelGenerationParams`, deriving max gaps from player jump constants.
  - Added placeholder constants for player jump capabilities (require tuning).
  - Added simple interfaces (`PlatformGenerationParams`, `PlacementPosition`).

- **Refined `src/lib/LevelGenerator.ts` (Previous):**

  - **Platform Placement:** Ensure guaranteed horizontal gaps (`minHorizontalGap`) between platforms by calculating the next platform's position based on the previous one's right edge plus a random gap. Added edge clamping.
  - **Coin Placement:** Coins are now placed directly _on_ the platform surface (using platform bounds and estimated coin height). Removed random air coin generation. Dynamically calculate `minCoinsPerPlatform` to improve chances of hitting the 100-coin target, log warning if missed.
  - **Crate Placement:** Crates are now placed only on platforms that do _not_ have an enemy placed on them.
  - Added constants for estimated entity heights to aid placement.
  - Adjusted player/finish placement relative to platform surfaces.

- Created `src/lib/LevelGenerator.ts` containing:
  - `LevelGenerator` class.
  - `SimplePRNG` (Mulberry32) for deterministic generation based on level number seed.
  - `generateLevel()` method to procedurally place platforms, player start, finish, enemies, crates, and coins (ensuring >= 100 coins).
  - `getEnemies()` method to provide generated enemies to the `Game` scene.
- Modified `src/scenes/Game.ts`:
  - Imported `LevelGenerator` and `getLevel`.
  - Created `generateLevelEntities()` method to orchestrate level generation using `LevelGenerator`.
  - Updated `initGame()` to call `generateLevelEntities()` instead of static spawning, handle level initialization, clear previous enemies, and ensure `CameraManager` is created after the player exists.
  - Removed old static `spawnEntities()` and `createEnemies()` methods.
  - Removed redundant enemy cleanup from `restartLevel()`.

Refactoring camera logic into a dedicated `CameraManager` class.

Adding dynamic zoom behavior to `CameraManager`.

Fixing bug where entities were created twice.

Inverting camera zoom behavior in `CameraManager`.

Adding camera zoom-in effect on player death.

Refactoring `GameState` enum to a `GAME_STATE` constant object.

## Recent Changes

- Created `src/entities/ui/CameraManager.ts`.
- Moved camera setup logic (bounds, follow, lerp) from `Game.ts` to `CameraManager`.
- Added initial zoom functionality to `CameraManager`.
- Refactored `Game.ts` to instantiate and use `CameraManager`.
- Removed redundant camera methods (`setupCamera`) from `Game.ts`.
- Updated `systemPatterns.md`.
- Added an `update` method to `CameraManager.ts`.
- Implemented logic in `CameraManager.update` to smoothly adjust camera zoom based on the player's vertical velocity (zooming out slightly when jumping).
- Stored a reference to the `Player` instance within `CameraManager`.
- Called `cameraManager.update()` from within the `Game.ts` update loop.
- Updated `systemPatterns.md` to reflect the dynamic zoom feature.
- **Fixed Bug:** Removed duplicate calls to `createEnemies()` and `new Player()` from `Game.ts`'s `startGame()` method, resolving an issue where entities were instantiated twice.
- Adjusted zoom constants (`BASE_ZOOM`, `JUMP_ZOOM_IN`) in `CameraManager.ts`.
- Modified `CameraManager.update` logic to zoom _in_ when the player jumps (vertical velocity is negative) and use a lower base zoom otherwise.
- Moved `CameraManager.ts` and `CoinUI.ts` from `src/entities/ui` to `src/lib/ui` and updated imports in `Game.ts`.
- Added `isPlayerDead` state and `DEATH_ZOOM_IN` constant to `CameraManager`.
- Created `handlePlayerDeath` method in `CameraManager` to tween camera zoom on death.
- Modified `CameraManager.update` to skip zoom logic if `isPlayerDead` is true.
- Called `cameraManager.handlePlayerDeath()` from `Game.ts`'s `handleGameOver` method.
- **Refactored:** Replaced `GameState` enum in `src/scenes/Game.ts` with a `GAME_STATE` constant object using string values and `as const`.
- Updated all references to `GameState.MEMBER` to use `GAME_STATE.MEMBER`.
- Defined a `GameStateType` type alias for type safety.
- Updated `systemPatterns.md`.

## Next Steps

- **Tune Player Jump Constants:** Adjust `MAX_JUMP_DISTANCE_X`, `MAX_JUMP_HEIGHT_UP`, `MAX_FALL_HEIGHT` in `LevelGenerator.ts` to match actual player physics.
- Test refined procedural level generation thoroughly (solvability, variety, difficulty, fall sensor position).
- Consider adding more complex generation features (e.g., platform patterns, moving platforms, more sophisticated solvability checks) if needed.

## Active Decisions & Considerations

- Calculating the lowest platform Y _after_ generation in `Game.ts` is potentially more robust against timing issues than tracking it within `LevelGenerator.ts`.
- Increased finish line height provides more clearance.
- Evenly distributing coins provides a more predictable and potentially fairer spread compared to simple iterative placement with minimum spacing.
- Fixing the crate placement logic ensures crates and enemies don't unintentionally appear together.
- Removing world bounds clamping allows for truly infinite level generation, matching the constant changes.
- Specific rules for finish placement and preventing enemies on the last platform add polish to the level end.
- Dynamic fall sensor positioning ensures it's always relevant to the generated level height, preventing accidental deaths in high levels or useless sensors in low levels.
- Calculating sensor position based on the lowest platform's _bottom_ edge provides a consistent safety margin.
- Refactoring the generator improves maintainability.
- Basic solvability checks (clamping gaps) provide a minimum guarantee of reachability, though might reduce difficulty/variance slightly.
- Centralizing parameter calculation makes tuning the difficulty curve easier.
- Calculating platform positions based on the previous platform's end ensures non-overlapping placement with guaranteed gaps.
- Placing entities relative to the platform's actual top bound (`getBounds().top`) provides more accurate positioning.
- Removing the random air coin placement makes generation cleaner, relying instead on sufficient placement on platforms (accepting occasional misses of the 100 target).
- Conditional crate placement (no enemies) adds a layer of rule-based generation.
- Procedural generation allows for unlimited, replayable levels.
- Using the level number as a seed ensures deterministic generation (same level number = same layout).
- Separating generation logic into `LevelGenerator` keeps `Game.ts` cleaner.
- Current generation algorithm is basic; needs refinement for complexity and guaranteed solvability.
- Coin generation includes a fallback to ensure the minimum count.
- Using a dedicated class for the parallax background improves modularity and separates concerns.
- The `customScrollFactorX` property in `ParallaxBackground` allows easy adjustment of the parallax speed.
- Encapsulating camera logic in `CameraManager` further improves separation of concerns in the `Game` scene.
- Using linear interpolation (`Phaser.Math.Linear`) in `CameraManager.update` provides smooth zoom transitions.
- Inverted zoom behavior (zooming in on jump) might provide a different game feel.
- Adding a dedicated camera effect (tweened zoom) on player death enhances feedback for this event.
- Using `const` objects with `as const` for state management provides type safety similar to enums but with string values, which can be useful for debugging or serialization.
- Enforcing minimum platform length for enemies ensures sufficient space for encounters.
- Deciding enemy placement _before_ finalizing platform length correctly implements the constraint.
- Placing the finish line at the specific right edge of the last platform provides a clear target location.
- Increasing minimum coin spacing should prevent collision shape overlap and allow for more reliable collection when passing through multiple coins quickly.

## Important Patterns & Preferences

- **Adapting to Configuration:** Modify generation logic (like removing clamping) to correctly reflect changes in core configurations (like infinite world bounds).
- **Solvable Procedural Generation:** Incorporate checks (even basic ones like gap clamping) to ensure generated levels are generally possible to complete.
- **Code Structure:** Break down complex logic (like level generation) into smaller, focused methods.
- **Refined Procedural Generation:** Calculate positions based on previous elements and actual bounds to enforce rules like gaps and surface placement.
- **Procedural Generation:** Use a dedicated class (`LevelGenerator`) seeded by level number for deterministic, dynamic level creation.
- Encapsulate specific visual elements (like the background) into their own classes.
- Utilize Phaser's built-in Game Object types (`TileSprite`) where appropriate.
- Using tweens for camera movements (like the death zoom) provides smoother transitions than instantaneous changes.
- Preferring `const` objects over `enum` for simple state definition when string values are desired.
- **Constraint-Based Generation:** Modify generation parameters (like minimum platform length) based on other generation decisions (like placing an enemy) to enforce specific level design rules.
- **Dynamic World Elements:** Adjust static world elements (like the fall sensor) based on procedurally generated content to maintain consistency.
- **Clear Spacing Rules:** Define minimum spacing constants for entity placement (like coins) to enforce visual clarity and gameplay constraints.
- **Even Distribution:** When placing multiple items (like coins) on a surface, calculate spacing to distribute them evenly across the available area rather than just bunching them with minimum spacing.
- **Tuning Gameplay Feel:** Adjust generation parameters like spacing not just for visual appeal but also to ensure core gameplay mechanics (like collection) function reliably.
- **Post-Generation Calculation:** For values that depend on the final state of all generated elements (like the lowest point), calculate them after the generation loop completes by inspecting the generated objects.

## Learnings & Project Insights

- Changing fundamental constraints like world size requires careful review and adaptation of dependent logic (e.g., position clamping).
- Explicitly considering player capabilities (jump distance/height) is necessary for generating solvable platforming levels.
- Refactoring large methods significantly improves code clarity.
- Using actual bounding boxes (`getBounds()`) after entity creation is crucial for accurate procedural placement and spacing.
- Balancing deterministic rules (like minimum gaps) with randomness (variable gaps, probabilities) is key in procedural generation.
- Procedural generation significantly increases replayability.
- Seeded PRNGs are crucial for deterministic procedural content.
- Balancing generation parameters is key to creating fair and engaging levels.
- Refactoring static elements into dynamic, updatable classes can enhance visual effects like parallax scrolling.
- Separating distinct functionalities (like camera control) into dedicated classes improves code organization and maintainability.
- Dynamic camera adjustments (like zoom) based on player state can enhance game feel.
- The direction of zoom (in vs. out) during actions like jumping significantly impacts player feedback.
- Specific game events (like player death) can be emphasized with targeted camera effects.
- TypeScript's `as const` assertion is powerful for creating strongly-typed constant objects.
- The order of operations in procedural generation matters significantly when implementing conditional constraints.
- Procedural generation requires considering not just the placement of interactive elements but also supporting elements like boundaries and safety nets (fall sensors).
- Carefully distinguishing between placement _intent_ and actual placement is important when subsequent generation steps depend on previous outcomes.
- Different placement strategies (iterative vs. even distribution) can significantly affect the visual and gameplay feel of generated content.
- Collision shape sizes, not just center points, must be considered when implementing spacing constraints for gameplay elements.
- Separating the calculation of aggregate properties (like min/max bounds) from the core generation loop can sometimes simplify logic and improve robustness.
