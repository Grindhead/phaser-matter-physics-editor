# Active Context

## Current Focus

- Initial project setup and organization.
- Implement new level generation features:
  - Vertical walls using rotated platforms.
  - Barrel substitution for impassable gaps.
- Implement player-barrel interaction logic.

## Recent Changes

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

- Implement vertical wall generation in `LevelGenerator.ts`.
- Implement barrel substitution logic in `LevelGenerator.ts`.
- Test the updated level generation thoroughly.
- Implement conditional logic for the 'fx_land' animation (prevent playing if coin collected).
- **Implement Gameplay Enhancements:**
  - Add keyboard input (Space/Enter) for restarting.
  - Combine game over dismissal and restart into a single action.
  - Implement multiple, dynamic death zone colliders.
  - Ensure boxes respawn on level restart.
  - Implement crate destruction upon hitting a death zone.
  - Increase enemy density and level length, refine placement.
  - Implement the "cool landing" animation for level completion.
  - Ensure player sprite renders in front of the finish line.
- Implement Player-Barrel collision detection in `Game.ts::handleCollisionStart`.
- Add `isInBarrel` state and related methods to `Player.ts`.

## Active Decisions

- **Immediate Start:** Game starts automatically after asset loading.
- **Orientation Handling:** Display message in portrait mode; use `window.matchMedia`.
- **Asset Naming:** Use lowercase, hyphens: `[description]-[framenumber].[extension]`.
- **Vertical Walls:** Implement using rotated platform sprites.
- **Barrel Substitution:** Replace platforms with barrels in gaps > `maxHorizontalGap`.
- **Conditional Landing Animation:** Check game state (e.g., coin collection) before playing `fx_land`.
- **Scale Manager Strategy:** `Phaser.Scale.EXPAND` with `autoCenter: Phaser.Scale.CENTER_BOTH`.
- **UI Positioning:** Use relative positioning and resize listeners.
- **Level Generation Logic:** Extend `LevelGenerator.ts` for walls and barrels.
- **Crate Spawning Constraint:** No crates on the final platform.
- **Crate Purpose and Placement:** Use for vertical navigation; require platform segment count >= 8.

## Important Patterns & Preferences

- Use PowerShell for file system operations on Windows.
- Follow custom instructions regarding memory bank updates, planning, and communication style.
- **Responsive UI:** Position UI relative to screen dimensions using `scene.scale.width/height` and `scene.scale.on('resize', ...)`.
- **Mobile Touch Controls:** Implement via interactive `Image` objects (`setScrollFactor(0)`), using pointer events to set player state flags.
- **State Persistence Across Restarts:** Pass state explicitly via `scene.restart({ key: value })` and retrieve in `init(data)`.
- **Event Listener Cleanup:** Remove listeners (`game.events.off`, `scene.events.off`) before scene restarts/object destruction.
- **State Tracking during Generation:** Maintain state (e.g., occupied ranges) within generation loops.
- **Collision Handling:** Leverage Matter.js collision events.
- **Encapsulation:** Keep entity-specific logic within the entity's class.
- **State Management:** Use state machines or flags within entities.
- **Interaction Logic:** Coordinate state changes across interacting entities (e.g., Player, Barrel) using flags/methods.
- **Conditional Animation:** Check game state to conditionally play/suppress animations.

## Learnings & Project Insights

- **Orientation Handling:** `window.matchMedia` is effective; manage game instance creation/destruction carefully.
- **Scene Restart Lifecycle:** Explicitly passing state via `restart(data)` is safer than reading potentially reset state in `create()`.
- Implementing interactive mechanics requires coordinating state across entities.
- Animation events/delays are crucial for interaction state sync.
- Visual asset origins might not align with geometric centers.
- Adding new generation features can introduce conflicts requiring explicit checks.
