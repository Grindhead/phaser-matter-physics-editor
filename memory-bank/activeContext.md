# Active Context

## Current Focus

**Conditionally Initialize Game Based on Orientation:** Modify `src/main.ts` to only initialize the Phaser `Game` instance when the screen is detected to be in a landscape orientation. Implement checks both on initial load and on orientation changes.

## Recent Changes

- **Tested `EXPAND` Scaling Mode:** Reverted the scaling mode to `EXPAND` (the original setting) to test if it achieves the goal of filling the screen adaptively while correctly positioning entities within the viewable area, avoiding the cropping seen with `ENVELOP` and the black bars from `FIT`. Testing is ongoing (Step 5 in `implementation-plan.mdc`).
- **Reverted to `FIT` Mode:** Changed scale mode from `ENVELOP` back to `FIT` due to entity cropping issues.
- **Attempted `ENVELOP` Mode:** Changed scale mode to `ENVELOP` to test full-screen coverage.
- **UI Responsiveness Implemented:** Adapted `CoinUI`, `LevelUI`, and `DebugPanel` for responsive positioning and font scaling.
- **Initial Scaling Configured:** Set Scale Manager mode to `FIT` and `CENTER_BOTH` in `main.ts` initially.
- **Test `EXPAND` Mode:**
- **Implement Mobile Controls:**
- **Update Memory Bank:** Document mobile control implementation.

## Next Steps

- **Implement Orientation Check:** Add the logic to `src/main.ts` to check `window.matchMedia('(orientation: landscape)')`.
- **Test Orientation Logic:** Verify the game only loads in landscape and displays a message in portrait.
- **Continue Responsiveness Testing:** Proceed with Step 5 (`Test EXPAND Mode`) and subsequent steps in `implementation-plan.mdc`.

## Active Decisions & Considerations

- **Display Message:** Show a simple message (e.g., "Please rotate your device to landscape mode") when in portrait orientation.
- **Scale Manager Strategy:** Continue testing `EXPAND`. The goal is full-screen adaptive display without cropping critical elements. `FIT` remains the fallback if `EXPAND` is unsuitable.
- **`EXPAND` Mode Theory:** `EXPAND` might resize the canvas to fill space but scale the internal game world like `FIT`, potentially offering the best visual compromise.
- **UI Positioning:** Responsive UI logic should still work, but testing is needed to confirm positioning relative to the `EXPAND` mode's canvas/game size.
- **UI Anchoring/Positioning:** Relative positioning (top-left, top-right, center) implemented in UI elements works well with `FIT` mode.
- **`ENVELOP` Issues:** Determined that `ENVELOP` is unsuitable without redesigning levels/entity placement to account for potential cropping on different aspect ratios.
- **Mobile Controls:** Add interactive UI elements (`Phaser.GameObjects.Image`) to the scene for touch input. Use `setInteractive()`, `setScrollFactor(0)`, and pointer events (`pointerdown`, `pointerup`, `pointerout`) to manage state flags (e.g., `mobileLeftActive`). Player logic reads these flags.

## Important Patterns & Preferences

- **Orientation Check:** Use `window.matchMedia('(orientation: landscape)')` to check screen orientation both initially and via an event listener for changes.
- **State Persistence Across Restarts (Revised):** When state needs to persist across `scene.restart()`, explicitly pass the state as data (`scene.restart({ key: value })`) and retrieve it in the scene's `init(data)` method. Relying on reading the state from engine objects at the start of `create()` can be unreliable if the engine resets those objects based on initial configurations before `create` executes.
- **Event Listener Cleanup:** Removing event listeners (e.g., `this.game.events.off(...)`) before restarting a scene or destroying an object is crucial to prevent memory leaks and duplicate listeners.
- **State Tracking during Generation:** Maintaining state (occupied ranges) within the generation loop to inform subsequent placement decisions.
- Leveraging Matter.js collision events.
- Encapsulating entity-specific logic within the entity class (`Player`, `Barrel`).
- Using state machines or flags within entities to manage behavior.
- **State Management for Interaction:** Using boolean flags and methods across interacting entities to manage complex interaction flows.
- **Mobile Controls:** Add interactive UI elements (`Phaser.GameObjects.Image`) to the scene for touch input. Use `setInteractive()`, `setScrollFactor(0)`, and pointer events (`pointerdown`, `pointerup`, `pointerout`) to manage state flags (e.g., `mobileLeftActive`). Player logic reads these flags.

## Learnings & Project Insights

- **Scene Restart Lifecycle:** Understanding that `scene.restart()` might reset certain engine states based on initial configuration _before_ `create()` runs is crucial for reliable state persistence. Explicitly passing state via `restart` data is safer than trying to read potentially reset state in `create`.
- Implementing interactive mechanics often involves coordinating state changes across multiple entities (`Player`, `Barrel`, `Game`).
- Animation events or delays can be crucial for correct state synchronization during interactions.
- Visual asset origins might not align with geometric centers.
- Adding new generation features can introduce conflicts requiring explicit checks.

## _Previous Context Entries Below_

## Current Focus

Preventing overlap between consecutively generated bridge barrels.

- **Status:** Bridge barrel substitution logic is working (barrels generate when `dX > maxHorizontalGap` with reduced jump distance). Enemy spawning is fixed.
- **Issue:** Bridge barrels generated in the main loop can overlap horizontally if impossible gaps occur close together, as there's no overlap check in that specific logic path.
- **Goal:** Prevent bridge barrels from overlapping horizontally.
- **Approach:**
  1.  **Track Bridge Barrel Ranges:** In `generateLevel`, maintain a list (`bridgeBarrelRanges`) of horizontal extents occupied by already-placed bridge barrels.
  2.  **Add Overlap Check:** Inside the `if (dX > params.maxHorizontalGap)` block:
      - Calculate the potential range of the new barrel.
      - Check this range against `bridgeBarrelRanges`.
      - **If Overlap:** Log a warning, skip barrel placement, and allow the code to fall through to place a normal (but distant) platform instead.
      - **If No Overlap:** Place the barrel, add its range to `bridgeBarrelRanges`, adjust `currentPlatformX` for the next iteration, and `continue` the loop (skipping platform placement).
  3.  **Keep Jump Distance Reduced:** Keep `MAX_JUMP_DISTANCE_X` temporarily at 150 for testing.
  4.  **Keep Optional Barrels Disabled:** Keep `placeBarrelsBetweenPlatforms` commented out.

## Recent Changes

- Confirmed bridge barrel substitution logic triggers with reduced `MAX_JUMP_DISTANCE_X` (150).
- Temporarily reduced `MAX_JUMP_DISTANCE_X`.
- Reduced `MIN_PLATFORM_LENGTH_WITH_ENEMY` to 6, fixing enemy spawning.

## Next Steps

- Implement the overlap check for bridge barrels in `LevelGenerator.ts`.
- Test level generation, checking console logs and visually inspecting barrel placement for overlaps.
- If overlap is prevented, revert `MAX_JUMP_DISTANCE_X` to 200.
- Then, uncomment `placeBarrelsBetweenPlatforms`.
- Perform final test.

## Active Decisions & Considerations

- Choosing to place a platform instead of an overlapping barrel simplifies the logic, although it removes the mandatory jump for that specific gap.
- This overlap check is separate from the one in `placeBarrelsBetweenPlatforms`, which handles optional barrels.

## Important Patterns & Preferences

- **State Tracking during Generation:** Maintaining state (occupied ranges) within the generation loop to inform subsequent placement decisions.

## Learnings & Project Insights

- Adding new generation features can introduce conflicts (like overlaps) with existing or similar features placed nearby, requiring explicit checks.

## _Previous Context Entries Below_

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
  - **Implement launch logic in `Player.ts` (`launchFromBarrel(vector: Phaser.Math.Vector2)`) triggered by `Barrel` via `Game.ts`. The launch direction \_must\* be based on the barrel's current rotation (`Barrel.angle`) and a defined launch speed.**
  - Add properties to `Barrel.ts` (e.g., `launchSpeed`). These could be set in the constructor or potentially randomized/configured by `LevelGenerator` later.
- **Connect barrel animations:**
  - Call `barrel.enter()` and `barrel.launch()` methods from the collision/input logic.

## Active Decisions & Considerations

- Determine how barrel launch speed is defined (fixed per barrel instance? random? based on player input?). Start with fixed values on the `Barrel` class. Launch angle is determined by the barrel's current rotation.
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

Refining level generation logic, specifically enemy and crate placement.

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

## Current Focus

Investigating the rapid toggling of the `Barrel.isEntered` flag during gameplay.

- **Observed Behavior:** The `console.log` in `Barrel.update()` shows the `isEntered` property flipping between `true` and `false` frequently when the player interacts with a barrel.
- **Current Hypothesis:** The toggling likely stems from the interplay between the player entering the barrel (`player.enterBarrel()` called on collision), the barrel's state update (`barrel.isEntered` set to `true` only _after_ the enter animation completes), the player attempting to launch (`player.launchFromBarrel()` calls `barrel.launch()`), and the barrel's state being immediately set to `false` by `barrel.launch()`. Rapid re-collision after launching might restart this cycle.

## Recent Changes

- Investigation into `Barrel.isEntered` toggling.
- **Rejected:** A proposed solution involving removing `Barrel.isEntered`, adding a new `isRotating` flag to `Barrel.ts`, and adding a collision cooldown to `Player.ts` after exiting a barrel was rejected by the user. The physics collision filtering is handled by `physics.json`.

## Next Steps

- Continue debugging the barrel interaction logic based on the current hypothesis, focusing on the existing state management in `Player.ts` and `Barrel.ts` and the collision handling in `Game.ts`.
- Analyze the sequence of events: player collision -> `player.enterBarrel` -> `barrel.enter` -> animation delay -> `barrel.isEntered = true` -> player input -> `player.launchFromBarrel` -> `barrel.launch` -> `barrel.isEntered = false` -> `player.exitBarrel`. Determine if/where immediate re-collision occurs.

## Active Decisions & Considerations

- Stick to the existing state flags (`player.isInBarrel`, `barrel.isEntered`) and animation-driven logic in `Barrel.ts`.
- Verify if the launch mechanism provides enough separation or if a different approach to prevent immediate re-collision (without changing collision filters) is needed.

## Important Patterns & Preferences

- Relying on `physics.json` for collision filter definitions.
- Debugging complex interactions by analyzing state changes and event sequences across multiple entities (`Player`, `Barrel`, `Game`).

## Learnings & Project Insights

- State synchronization between interacting entities, especially when involving animation delays, can lead to complex debugging scenarios.
- Understanding the exact sequence and timing of events (collisions, state changes, animation completion) is crucial.

## Current Focus

Adjusting barrel vertical placement for player accessibility.

- **Problem:** Barrels placed at a fixed ground level were often unreachable from adjacent platforms.
- **Requirement:** Position barrels vertically so the player can drop onto them from platforms.
- **Approach:** Modified `placeBarrelsBetweenPlatforms` in `itemPlacementHelper.ts`. Instead of a fixed `groundY`, the `placeY` is now calculated for each barrel. It's positioned slightly below the top edge of the _lower_ of the two platforms defining the gap, clamped to prevent falling below the world floor. This ensures barrels are always reachable by dropping down.

## Recent Changes

- **Updated Barrel Y-Placement in `itemPlacementHelper.ts`:**
  - `availableGaps` now stores the `top` Y-coordinate of adjacent platforms.
  - Removed static `groundY` calculation.
  - Barrel `placeY` is calculated dynamically: `Math.max(platformATop, platformBTop) + BARREL_HEIGHT / 2 + buffer`.
  - `placeY` is clamped using `Math.min` against `WORLD_HEIGHT - BARREL_HEIGHT / 2 - buffer` to stay above the absolute bottom.

## Next Steps

- Test level generation to confirm barrels are now positioned at reachable heights below platforms.
- Continue implementing barrel interaction logic (player entry, launch) as per `progress.md`.

## Active Decisions & Considerations

- Placing barrels relative to the lower adjacent platform guarantees accessibility _to_ the barrel via dropping.
- Accessibility _from_ the barrel (jumping back up) will depend on the height difference and the eventual barrel launch mechanics.
- Clamping the Y position prevents barrels from being generated below the playable area.

## Important Patterns & Preferences

- **Context-Aware Placement:** Adjusting procedural placement logic based on the local environment (adjacent platform heights) rather than global coordinates.

## Learnings & Project Insights

- Reachability is a key constraint in procedural generation for platformers. Placement must consider player movement capabilities relative to surrounding structures.

## Current Focus

Debugging level generation: 0 enemies and 0 barrels spawning.

- **Issue:** Level generation results in 0 enemies and 0 barrels.
- **Analysis (based on logs):**
  - `Platforms available for item placement: 12`. This count seems sufficient, indicating the primary issue isn't the number of platforms available _after_ the loop.
  - `0 barrels`: The condition for placing bridge barrels (`dX > params.maxHorizontalGap`) was not met in the test run. Random gaps generated were all jumpable.
  - `0 enemies`: With 12 available platforms, the most likely cause is that none met the `platform.segmentCount >= MIN_PLATFORM_LENGTH_WITH_ENEMY` (currently 10) requirement within `placeItemsOnPlatforms`.
- **Debugging Strategy:**
  1.  **Address Enemy Spawning:** Reduce the minimum platform length required for enemy placement. Lower `MIN_PLATFORM_LENGTH_WITH_ENEMY` in `LevelGenerationConfig.ts` from 10 to 6.
  2.  **Monitor Bridge Barrels:** Observe if bridge barrels appear in future runs now that the primary enemy bug is addressed. If they remain absent, we may need to adjust gap parameters to make impossible gaps more likely.
  3.  **Isolate Bridge Barrels:** Keep the call to `placeBarrelsBetweenPlatforms` commented out for now.

## Recent Changes

- Added logging for platform count before item placement.
- Commented out optional barrel placement (`placeBarrelsBetweenPlatforms`).
- Implemented barrel-platform substitution logic in `LevelGenerator.ts` loop.

## Next Steps

- Modify `MIN_PLATFORM_LENGTH_WITH_ENEMY` in `LevelGenerationConfig.ts` to 6.
- Test level generation and report entity counts (platforms, enemies, crates, barrels).
- If enemies spawn but bridge barrels still don't, consider adjusting gap generation parameters (`minHorizontalGap`, `maxHorizontalGap`) or temporarily reducing `MAX_JUMP_DISTANCE_X` to force the condition.
- Once bridge barrels and enemies work reliably, re-enable optional barrel placement.

## Active Decisions & Considerations

- Prioritizing fixing the enemy spawn issue by adjusting the platform length constraint.
- Deferring adjustments to gap generation parameters until the enemy issue is resolved.

## Important Patterns & Preferences

- **Constraint Tuning:** Adjusting specific constraints (like minimum platform length for items) based on observed generation results.

## Learnings & Project Insights

- Item placement functions can fail silently if none of the potential locations meet the required conditions (e.g., platform length).
- Debugging procedural generation often involves isolating different components and checking intermediate results and conditions.

## Current Focus

- **Current Focus:** Refining the behavior of the `Barrel` entity.
- **Task:** Adjust the rotation origin of the barrel sprite to be the center (0.5, 0.5).
- **Recent Changes:** Initial creation of the `Barrel` class and its associated animations.
- **Next Steps:** Implement player interaction with the barrel (entering, launching).

## Current Focus

Implementing player-barrel interaction logic.

- **Status:** Barrel rotation origin confirmed and maintained at `(0.22, 0.5)` based on sprite visual.
- **Goal:** Allow the player to enter and be launched from barrels.
- **Approach:**
  1. Implement collision detection between Player and Barrel in `Game.ts`.
  2. Add state management to `Player.ts` (`isInBarrel`, `currentBarrel`).
  3. Add methods to `Player.ts` (`enterBarrel`, `exitBarrel`, `launchFromBarrel`).
  4. Implement input handling (e.g., jump key) in `Player.ts` or `Game.ts` to trigger `launchFromBarrel`.
  5. Connect `Barrel` animations (`enter`, `launch`) via the interaction logic.
  6. Ensure `Barrel.launch()` returns the correct launch vector based on its angle.

## Recent Changes

- **Corrected Barrel Rotation Origin:** Verified and kept the origin at `(0.22, 0.5)` in `Barrel.ts` after confirming the visual center differed from the geometric center.
- Confirmed bridge barrel substitution logic triggers with reduced `MAX_JUMP_DISTANCE_X` (150).
- Temporarily reduced `MAX_JUMP_DISTANCE_X`.
- Reduced `MIN_PLATFORM_LENGTH_WITH_ENEMY` to 6, fixing enemy spawning.

## Next Steps

- Implement Player-Barrel collision detection in `Game.ts::handleCollisionStart`.
- Add `isInBarrel` state and related methods to `Player.ts`.

## Active Decisions & Considerations

- Collision logic will trigger `player.enterBarrel(barrel)` and `barrel.enter()`.
- Player input (jump) will trigger `player.launchFromBarrel()` which in turn calls `barrel.launch()` and uses the returned vector.
- Choosing to place a platform instead of an overlapping barrel simplifies the logic, although it removes the mandatory jump for that specific gap.
- This overlap check is separate from the one in `placeBarrelsBetweenPlatforms`, which handles optional barrels.

## Important Patterns & Preferences

- State tracking during generation.
- Leveraging Matter.js collision events.
- Encapsulating entity-specific logic within the entity class (`Player`, `Barrel`).
- Using state machines or flags within entities to manage behavior.

## Learnings & Project Insights

- Visual asset origins might not align with geometric centers; always verify against the visual representation if available.
- Adding new generation features can introduce conflicts requiring explicit checks.
- State synchronization between interacting entities, especially with animation delays, can be complex.

## _Previous Context Entries Below_
