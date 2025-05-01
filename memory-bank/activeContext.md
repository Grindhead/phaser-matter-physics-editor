# Active Context

## Current Focus

- Implement gameplay enhancements:
  - Add keyboard input (Space/Enter) for restarting.
  - Combine game over dismissal and restart into a single action.
  - Implement multiple, dynamic death zone colliders.
  - Ensure boxes respawn on level restart.
  - Implement crate destruction upon hitting a death zone.
  - Implement conditional logic for the 'fx_land' animation.

## Recent Changes

- **Fixed Coin Placement Logic:**
  - Corrected coin spacing to strictly adhere to `MIN_COIN_SPACING`.
  - Removed the `centerBuffer` logic that caused gaps in coin placement near platform centers.
  - Prevented coins from being placed on the initial platform (`isInitialPlatform` flag added to `populatePlatformWithCoins`).
- **Implemented Cool Landing Animation for Level Completion:** Added a dedicated animation that plays when the player completes a level, giving a more satisfying finish.
- **Ensured Player Renders in Front of Finish Line:** Set proper depth values to ensure the player sprite (depth 10) always renders in front of the finish line (depth 5).
- **Increased Enemy Density and Level Length:** Modified level generation parameters to increase the number of platforms and enemies per level, creating a more challenging experience.
- **Refined Crate Placement Logic:** Updated `LevelGenerator.ts` (`placeStrategicCratesNearWalls`) to only place crates when the vertical jump distance to clear the wall exceeds the player's base jump height, considering small/big crate heights. Removed redundant crate placement from `itemPlacementHelper.ts`.
- **Fixed Keyboard Restart:** Implemented keyboard input (Space/Enter) to restart the level.
- **Fixed Conditional Landing Animation:** Implemented logic to prevent the 'fx_land' animation from playing if the player collects a coin during landing.
- **Refined Level Generation Strategy:**
  - Fixed wall generation logic to correctly place vertical walls at platform edges.
  - Improved wall positioning calculations for better gameplay accessibility.
  - Added forced test wall when no natural height differences are found.
  - Modified crate placement to only position crates where needed for jumping up walls.
  - Added debug visualization for walls and crates during level generation.
- **Improved Level Generation Strategy:**
  - Modified vertical wall placement to position walls at the end of platforms that lead to higher platforms.
  - Enhanced crate placement logic to strategically position crates to help players reach higher platforms.
- **Implemented Vertical Walls:** Added support for vertical wall generation using rotated platform sprites. Updated the Platform class, platformBuilder, and LevelGenerator to handle vertical orientation.
- **Enhanced Barrel Substitution Logic:** Refined barrel substitution to work properly with vertical walls and prevent conflicting placements.
- **Implemented Immediate Game Start:** Removed any "click to play" state.
- **Adjusted Platform Visibility:** Reduced `maxVerticalGap` in `LevelGenerator.ts`.
- **Implemented Player-Barrel Interaction Logic:** Added collision detection and state management (`isInBarrel`, `enterBarrel`, etc.) in `Game.ts` and `Player.ts`.
- **Prevented Enemies on First Two Platforms (Level 1):** Updated `LevelGenerator.ts`.
- **Completed Barrel Placement Testing:** Confirmed correct positioning and accessibility for mandatory and optional barrels.
- **Uncommented Optional Barrel Placement:** Enabled barrel placement in large gaps.
- **Completed Mobile Responsiveness and UI Scaling Feature:**
  - Finalized scaling strategy (`EXPAND`, `CENTER_BOTH`).
  - Adapted UI elements (`CoinUI`, `LevelUI`, `DebugPanel`, overlays) for responsiveness.
  - Implemented on-screen mobile controls.
  - Tested successfully across various resolutions.
- **Resolved Enemy Positioning:** Fixed spawning issues related to platform length (`MIN_PLATFORM_LENGTH_WITH_ENEMY` adjusted).

## Next Steps

- Test the updated level generation thoroughly.
- **Implement Gameplay Enhancements:**
  - Single-input restart (dismiss + start).
  - Multiple dynamic death zones (500px below platforms).
  - Ensure boxes respawn on level restart.
  - Implement crate destruction upon hitting a death zone.
- Implement Player-Barrel collision detection in `Game.ts::handleCollisionStart`.
- Add `isInBarrel` state and related methods to `Player.ts`.

## Active Decisions

- **Coin Placement Rules:**
  - No coins on the initial starting platform.
  - Strictly enforce `MIN_COIN_SPACING` between coins.
  - Place coins evenly across the eligible platform width (no center buffer gaps).
- **Vertical Wall Placement Strategy:**
  - Walls now placed at the end of platforms leading to higher platforms.
  - Wall height calculated based on the vertical gap between platforms.
  - Wall position aligned to ensure proper access from the lower platform.
  - Debug visualization added to verify proper wall placement.
- **Strategic Crate Placement:**
  - Crates only placed near walls to help players climb.
  - Crate type (big/small) selected based on wall height.
  - Crate positioned on platform edge near wall.
- **Immediate Start:** Game starts automatically after asset loading.
- **Orientation Handling:** Display message in portrait mode; use `window.matchMedia`.
- **Asset Naming:** Use lowercase, hyphens: `[description]-[framenumber].[extension]`.
- **Vertical Walls:** Implement using rotated platform sprites.
- **Barrel Substitution:** Replace platforms with barrels in gaps > `maxHorizontalGap`.
- **Conditional Landing Animation:** Check game state (e.g., coin collection during landing) before playing/suppressing animations (e.g., `fx_land`).
- **Scale Manager Strategy:** `Phaser.Scale.EXPAND` with `autoCenter: Phaser.Scale.CENTER_BOTH`.
- **UI Positioning:** Use relative positioning and resize listeners.
- **Level Generation Logic:** Extend `LevelGenerator.ts` for walls and barrels.
- **Crate Spawning Constraint:** No crates on the final platform.
- **Crate Purpose and Placement:** Use for vertical navigation; require platform segment count >= 8.
- **Depth Management:** Use consistent depth values for entities, with player (depth 10) always rendering above finish line (depth 5).
- **Difficulty Curve:** Increase platform count and enemy density as level number increases, using multipliers to adjust generation parameters.
- **Passing Context Flags:** Use boolean flags (e.g., `isInitialPlatform`) passed into helper functions (`populatePlatformWithCoins`) to control conditional logic within generation/placement algorithms.

## Important Patterns & Preferences

- Use PowerShell for file system operations on Windows.
- Follow custom instructions regarding memory bank updates, planning, and communication style.
- **Responsive UI:** Position UI relative to screen dimensions using `scene.scale.width/height` and `scene.scale.on('resize', ...)`.
- **Mobile Touch Controls:** On-screen touch buttons (implemented as interactive `Phaser.GameObjects.Image`) are displayed for movement and jump. Pointer events on these buttons update state flags in the `Player` entity.
- **State Persistence Across Restarts:** Pass state explicitly via `scene.restart({ key: value })` and retrieve in `init(data)`.
- **Event Listener Cleanup:** Remove listeners (`game.events.off`, `scene.events.off`) before scene restarts/object destruction.
- **State Tracking during Generation:** Maintain state (e.g., occupied ranges) within generation loops.
- **Collision Handling:** Leverage Matter.js collision events (`collisionstart`, `collisionend`). `isGroundBody` helper excludes vertical walls. Player's `processCollision` uses collision normal (`pair.collision.normal.y < -threshold`) to identify top impacts on vertical walls and treat them as ground.
- **Encapsulation:** Keep entity-specific logic within the entity's class.
- **State Management:** Use state machines or flags within entities.
- **Interaction Logic:** Coordinate state changes across interacting entities (e.g., Player, Barrel) using flags/methods.
- **Conditional Animation:** Check game state (e.g., coin collection during landing) before playing/suppressing animations (e.g., `fx_land`).
- **Level Design Strategy:** Place vertical walls at platform edges to help reach higher platforms; position crates to help vertical navigation.
- **Debug Visualization:** For complex procedural level generation, add debug visualization to verify correct placement.

## Learnings & Project Insights

- **Level Generation Refinement:** Minor details like coin spacing and initial platform item placement significantly impact the perceived quality and fairness of procedurally generated levels.
- **Wall Placement Physics:** Vertical wall position is critical for gameplay; center of wall should be positioned to make bottom align with platform and top extend above target height.
- **Strategic Level Design:** Positioning vertical walls at platform edges and using crates for vertical navigation creates more deliberate paths through levels.
- **Debug Visualization Importance:** Visual feedback during level generation helps identify issues with placement algorithms.
- **Orientation Handling:** `window.matchMedia` is effective; manage game instance creation/destruction carefully.
- **Scene Restart Lifecycle:** Explicitly passing state via `restart(data)` is safer than reading potentially reset state in `create()`.
- **Collision Handling:** Leverage Matter.js collision events (`collisionstart`, `collisionend`) and helper functions (`isPlayerBody`, `isGroundBody`) to manage player state (`isGrounded`). Check collision normals (`pair.collision.normal.y`) to differentiate top vs. side collisions on vertical walls.
- Implementing interactive mechanics requires coordinating state across entities.
- Animation events/delays are crucial for interaction state sync.
- Visual asset origins might not align with geometric centers.
- Adding new generation features can introduce conflicts requiring explicit checks.
- **Depth Management:** Setting appropriate depth values ensures correct visual layering of game objects, critical for maintaining the player's visibility during gameplay moments like level completion.
- **Level Generation Tuning:** Adjusting generation parameters can significantly impact gameplay difficulty and flow. Using multipliers for platform count and enemy density creates a natural difficulty progression.

## Design Patterns

(To be defined)
