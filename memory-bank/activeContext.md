# Active Context

## Current Focus

Loading both texture atlases in the Preloader.

## Recent Changes

- **Updated `Preloader.ts`:** Added a line to load the second texture atlas (`assets2.png`, `assets2.json`) using the key `texturePack2`.

## Next Steps

- Verify that animations or entities using the second atlas work correctly.
- Update animation creation if necessary to use the second atlas.
- Continue with other tasks listed in `progress.md`.

## Active Decisions & Considerations

- Using the base constant `TEXTURE_ATLAS` and appending `"2"` maintains a consistent naming convention.

## Important Patterns & Preferences

- Loading all necessary atlases during the preloading phase.

## Learnings & Project Insights

- Ensure all required asset packs are loaded before scenes that depend on them start.

## Current Focus

Preventing enemy placement on the final platform.

## Recent Changes

- **Excluded Last Platform from Enemy/Crate Placement in `LevelGenerator.ts`:**
  - Modified the `generateLevel` method.
  - After the platform generation loop, the `lastPlatform` instance is now filtered out from the `itemPlacementPlatforms` list.
  - This filtered list (`finalItemPlacementPlatforms`) is then passed to `placeEnemiesAndCrates`, ensuring the final platform cannot receive an enemy or a crate.

## Next Steps

- Test level generation to confirm enemies/crates no longer appear on the very last platform.
- Address the potentially stale linter error regarding `segmentCount` in `LevelGenerator.ts` if it persists after environment refresh.
- Continue with other tasks listed in `progress.md`.

## Active Decisions & Considerations

- Filtering the list _before_ passing it to the placement function is a clean way to exclude specific platforms from consideration.

## Important Patterns & Preferences

- **List Filtering:** Using array filter methods to refine collections based on specific criteria before further processing.

## Learnings & Project Insights

- Ensuring specific locations (like the start or end of a level) adhere to special placement rules often requires targeted logic outside the general placement procedures.

## Current Focus

Enforcing minimum platform length for enemy placement.

## Recent Changes

- **Reinstated Enemy Platform Length Check in `LevelGenerator.ts`:**
  - Set `MIN_PLATFORM_LENGTH_WITH_ENEMY` constant to `10`.
  - Uncommented and activated the check in `placeEnemiesAndCrates` to ensure enemies are only placed on platforms with `segmentCount >= MIN_PLATFORM_LENGTH_WITH_ENEMY`.
- **Modified `Platform.ts` (`src/entities/Platforms/Platform.ts`):**
  - Added a public `segmentCount` property to the `Platform` class.
  - Stored the `width` parameter (representing segment count) passed to the constructor into the new `segmentCount` property.
  - Corrected the order of operations to ensure `super()` is called before accessing `this` when setting `segmentCount`.

## Next Steps

- Test level generation to confirm enemies only appear on platforms of length 10 or greater.
- Continue with other tasks listed in `progress.md`.

## Active Decisions & Considerations

- Restoring the minimum platform length check for enemies ensures generation follows previously intended constraints.
- Modifying the `Platform` class to store its segment count was necessary to enable this check.

## Important Patterns & Preferences

- **Entity State:** Ensuring entity classes store relevant state information (like segment count) needed by other systems (like level generation logic).

## Learnings & Project Insights

- Refactoring can sometimes inadvertently remove or disable existing constraints; careful review or testing is needed.
- Class constructors in TypeScript require `super()` to be called before `this` can be accessed.

## Current Focus

Increasing enemy and crate density in level generation.

## Recent Changes

- **Increased Enemy/Crate Probabilities in `LevelGenerator.ts`:**
  - Modified `getLevelGenerationParams` to increase the base probability for enemy generation from `0.2` to `0.3`.
  - Increased the base probability for crate generation from `0.15` to `0.25`.
  - This aims to increase the calculated `targetEnemies` and `targetCrates`, resulting in more items placed per level.

## Next Steps

- Test the level generation to see if the increased enemy/crate density improves engagement.
- Continue with other tasks listed in `progress.md`.

## Active Decisions & Considerations

- Increasing base probabilities is a direct way to increase average item density per level.
- The level scaling component of the probability calculation remains unchanged.

## Important Patterns & Preferences

- **Generation Tuning:** Adjusting probability parameters to control the density of specific generated elements.

## Learnings & Project Insights

- Item density significantly impacts perceived level difficulty and engagement.

## Current Focus

Improving platform spacing and coin placement in level generation.

## Recent Changes

- **Further Adjusted Platform Gaps in `LevelGenerator.ts`:**
  - Increased `minHorizontalGap` from 80 to 120.
  - Increased `MIN_ABS_VERTICAL_GAP` (minimum absolute vertical gap check) from 10 to 20.
- **Modified Coin Placement Logic in `LevelGenerator.ts`:**
  - Added a check in `populatePlatformWithCoins` to prevent placing coins within a small buffer zone (`centerBuffer = 16`) around the platform's horizontal center (`bounds.centerX`). This aims to reduce visual occlusion by enemies/crates placed centrally on _other_ platforms.

## Next Steps

- Test the level generation with the latest adjustments to platform spacing and coin placement.
- Continue with other tasks listed in `progress.md`.

## Active Decisions & Considerations

- Increasing minimum gaps aims for more varied and less clustered platform layouts.
- Avoiding the central area for coin placement is a simple heuristic to reduce visual overlap with centrally-placed items on potentially overlapping platforms, without requiring complex occlusion checks.

## Important Patterns & Preferences

- **Generation Tuning:** Iteratively adjusting generation parameters and logic based on observed output and desired gameplay feel.
- **Heuristics for Visuals:** Using simple rules (like avoiding center placement) to improve visual clarity in procedural generation when exact occlusion calculation is complex.

## Learnings & Project Insights

- Achieving an "organic" feel in procedural generation often requires tuning multiple parameters and sometimes adding specific rules to avoid undesirable patterns.
- Visual clarity in 2D procedural generation can sometimes be improved with simple placement heuristics.

## Current Focus

Refining level generation platform placement based on player jump capabilities.

## Recent Changes

- **Aligned `maxHorizontalGap` with Jump Capability in `LevelGenerator.ts`:**
  - Modified `getLevelGenerationParams` to set `maxHorizontalGap` directly to the `MAX_JUMP_DISTANCE_X` constant, removing the previous `- 20` offset. This ensures the random generation range for horizontal platform gaps uses the player's maximum defined horizontal jump distance as its upper limit.

## Next Steps

- Test the level generation with the adjusted `maxHorizontalGap`.
- Continue with other tasks listed in `progress.md`.

## Active Decisions & Considerations

- Setting `maxHorizontalGap` equal to `MAX_JUMP_DISTANCE_X` makes the generation parameters directly reflect the defined player capability.
- The existing clamping in `calculateNextPlatformPosition` remains as a safeguard.

## Important Patterns & Preferences

- **Generation Tuning:** Aligning generation parameters directly with defined game constants (like player jump distance) for clarity and consistency.

## Learnings & Project Insights

- Ensuring generation parameters directly reflect player capabilities can make the generation logic clearer and easier to tune.

## Current Focus

Improving level generation logic, specifically enemy and crate placement.

## Recent Changes

- **Refactored `LevelGenerator.ts` (`src/lib/LevelGenerator.ts`):**
  - Modified item placement logic to ensure enemies and crates do not spawn on the same platform.
  - Platforms are generated first, then a list of eligible platforms (excluding the first) is created.
  - This list is shuffled using a Fisher-Yates algorithm seeded by the level PRNG.
  - Target numbers of enemies and crates are calculated based on probabilities and average platform count.
  - Enemies are placed on the first `targetEnemies` platforms from the shuffled list.
  - Crates are placed on the next `targetCrates` platforms from the shuffled list.
  - Separated coin placement into its own method (`populatePlatformWithCoins`) and removed enemy/crate logic from it.
  - Added `targetEnemies` and `targetCrates` to `PlatformGenerationParams`.
  - Added a private `shuffleArray` helper method.
  - Removed the per-platform check for placing enemies/crates within the main platform generation loop.
  - Fixed a minor import issue (`PlatformSegment` was incorrectly added and then removed).

## Next Steps

- Test the improved level generation to ensure enemies and crates are placed on separate platforms and the distribution feels appropriate.
- Continue with other tasks listed in `progress.md`.

## Active Decisions & Considerations

- Placing items _after_ all platforms are generated allows for better overall distribution control compared to per-platform probability checks.
- Shuffling the platform list ensures random assignment of items to eligible platforms.
- Calculating target counts based on probabilities and platform numbers provides a more predictable number of items per level compared to pure per-platform chance.

## Important Patterns & Preferences

- **Post-Generation Placement:** Decoupling item placement from the initial structure generation (platforms) to allow for global constraints and distribution logic.
- **List Shuffling (Fisher-Yates):** Using a standard algorithm for randomizing the order of potential item locations.

## Learnings & Project Insights

- Refactoring generation steps can improve the ability to enforce global rules (like no item overlap) and achieve better resource distribution.

## Current Focus

Configuring idle animation to play only once.

## Recent Changes

- **Modified `playerAnimations.ts`:** Changed the `loop` property for the `DUCK_IDLE` animation definition from `-1` back to `0` (play once). This aligns with the requirement that the idle animation should play through a single cycle when the player becomes idle, rather than looping indefinitely.

## Next Steps

- Test that the idle animation now plays only once upon landing/stopping.
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
- Called `cameraManager.update()`

## Current Focus

Update ParallaxManager to use texture atlas frames.

## Recent Changes

- Updated `Preloader.ts` to load both texture atlases (`assets-0.json`/`assets-1.json`).
- Modified `ParallaxBackground.ts` constructor to accept atlas/frame, width, height, and scroll factor, removing auto-scaling.
- Refactored `ParallaxManager.ts` to instantiate `ParallaxBackground` for layers and delegate update logic to them.

## Next Steps

- Test the parallax background functionality to ensure layers scroll correctly.
- Verify that animations or entities using the second atlas work correctly.
- Update animation creation if necessary to use the second atlas.
- Continue with other tasks listed in `progress.md`.

## Active Decisions & Considerations

- Using the base constant `TEXTURE_ATLAS` and appending `"2"` maintains a consistent naming convention.
- Centralizing parallax scroll logic within `ParallaxBackground` improves modularity.

## Important Patterns & Preferences

- Loading all necessary atlases during the preloading phase.
- Encapsulating specific behaviors (like parallax scrolling) within dedicated classes.

## Learnings & Project Insights

- Ensure all required asset packs are loaded before scenes that depend on them start.
- Refactoring managers to use specialized component classes can simplify the manager's responsibilities.
