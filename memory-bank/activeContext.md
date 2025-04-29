# Active Context

## Current Focus

Ensuring barrels always have a chance to spawn in `LevelGenerator.ts`.

- **Requirement:** Guarantee that enough platforms are generated to accommodate the targeted number of enemies, crates, and at least one barrel, considering the start/end platforms are ineligible for item placement.
- **Approach:** Modify `getLevelGenerationParams` to calculate a minimum required platform count based on `targetEnemies`, `targetCrates`, and the guaranteed barrel. Use this calculated minimum if it's higher than the level-based minimum.

## Recent Changes

- Updated `DebugUIScene` (`src/scenes/DebugUIScene.ts`), `Game.ts` (`src/scenes/Game.ts`), and `DebugPanel.ts` (`src/lib/ui/DebugPanel.ts`) to track and display the total number of generated barrels and the number currently culled due to being off-screen.
- Corrected `update` method signatures in `Game.ts` for various entities (`Player`, `ParallaxManager`, `Coin`, `Barrel`).

## Next Steps

- Implement the minimum platform count logic in `LevelGenerator.ts::getLevelGenerationParams`.
- Test level generation to ensure barrels appear consistently, even on early levels.
- Continue implementing barrel interaction logic (player entry, launch).

## Active Decisions & Considerations

- Calculating the minimum required platforms dynamically based on target item counts ensures scalability if item probabilities change.
- Using `Math.max` provides a simple way to enforce the higher minimum platform count when necessary.

## Important Patterns & Preferences

- **Procedural Generation Safeguards:** Adding logic to procedural generation to guarantee certain outcomes or prevent undesirable edge cases (like no barrels spawning).

## Learnings & Project Insights

- Simple procedural rules can sometimes lead to edge cases (e.g., not enough platforms for all desired items) that require explicit checks or adjustments.

## _Previous Context Entries Below_

## Current Focus

Implement the Donkey Kong Country-style barrel mechanic interaction logic:

- Player collision with a `Barrel` entity (in `Game.ts`).
- Player enters the barrel (disabling player controls, potentially snapping position).
- Player input (e.g., jump key) triggers the barrel launch.
- Barrel plays entry and launch animations.
- Player is launched from the barrel in a predetermined direction/velocity.

**Verification:** Confirmed that the logic in `LevelGenerator.ts::calculateLevelGenerationParams` correctly calculates a minimum required platform count to guarantee space for at least one barrel, as intended. No changes needed for barrel _creation_ guarantees.

## Recent Changes

- **Verified Barrel Generation Logic:** Confirmed `LevelGenerator.ts` correctly implements logic to ensure minimum platform count for target items, including at least one barrel.
- Updated `DebugUIScene` (`src/scenes/DebugUIScene.ts`), `Game.ts` (`src/scenes/Game.ts`), and `DebugPanel.ts` (`src/lib/ui/DebugPanel.ts`) to track and display the total number of generated barrels and the number currently culled due to being off-screen.
- Corrected `update` method signatures in `Game.ts` for various entities (`Player`, `ParallaxManager`, `Coin`, `Barrel`).

## Next Steps

- **Implement collision detection between Player and Barrel in `Game.ts`:**
  - Add barrels to the `allEntities` group for updates/culling (if applicable).
  - Modify `handleCollisionStart` (or `handleCollisionActive`) to detect `Player` vs `Barrel` collisions.
  - Trigger player entry logic.
- **Add state management to the `Player` class:**
  - Add a state/flag like `isInBarrel`.
  - Add reference to the current barrel (`currentBarrel: Barrel | null`).
  - Modify `update` or input handling to disable normal controls when `isInBarrel` is true.
  - Add methods like `enterBarrel(barrel: Barrel)` and `exitBarrel()`.
- **Implement input handling for launching:**
  - Check for jump input while `isInBarrel` is true.
  - Trigger barrel launch sequence.
- **Define barrel launch trajectory/velocity:**
  - Add properties to `Barrel.ts` (e.g., `launchAngle`, `launchSpeed`). These could be set in the constructor or potentially randomized/configured by `LevelGenerator` later.
  - Implement launch logic in `Player.ts` (applying velocity) triggered by `Barrel`.
- **Connect barrel animations:**
  - Call `barrel.enter()` and `barrel.launch()` methods from the collision/input logic.

## Active Decisions & Considerations

- Determine how barrel launch direction/speed is defined (fixed per barrel instance? random? based on player input?). Start with fixed values on the `Barrel` class.
- How exactly to handle player physics while inside (disable body? set static? just control position?). Simplest might be to disable the player's body and manually set position.
- Player control over launch: For DKC style, typically player input triggers launch. Let's stick with that.

## Important Patterns & Preferences

- Leveraging Matter.js collision events.
- Encapsulating entity-specific logic within the entity class (`Player`, `Barrel`).
- Using state machines or flags within entities to manage behavior (e.g., `player.isInBarrel`).

## Learnings & Project Insights

- Adding interactive objects often requires modifications to both the object's class and the systems handling interactions (like the main game scene's collision logic).

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
  - Stores the `
