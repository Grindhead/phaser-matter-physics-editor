# Active Context

## Current Focus

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

- Awaiting further instructions.

## Active Decisions & Considerations

- Using a dedicated class for the parallax background improves modularity and separates concerns.
- The `customScrollFactorX` property in `ParallaxBackground` allows easy adjustment of the parallax speed.
- Encapsulating camera logic in `CameraManager` further improves separation of concerns in the `Game` scene.
- Using linear interpolation (`Phaser.Math.Linear`) in `CameraManager.update` provides smooth zoom transitions.
- Inverted zoom behavior (zooming in on jump) might provide a different game feel.
- Adding a dedicated camera effect (tweened zoom) on player death enhances feedback for this event.
- Using `const` objects with `as const` for state management provides type safety similar to enums but with string values, which can be useful for debugging or serialization.

## Important Patterns & Preferences

- Encapsulate specific visual elements (like the background) into their own classes.
- Utilize Phaser's built-in Game Object types (`TileSprite`) where appropriate.
- Using tweens for camera movements (like the death zoom) provides smoother transitions than instantaneous changes.
- Preferring `const` objects over `enum` for simple state definition when string values are desired.

## Learnings & Project Insights

- Refactoring static elements into dynamic, updatable classes can enhance visual effects like parallax scrolling.
- Separating distinct functionalities (like camera control) into dedicated classes improves code organization and maintainability.
- Dynamic camera adjustments (like zoom) based on player state can enhance game feel.
- The direction of zoom (in vs. out) during actions like jumping significantly impacts player feedback.
- Specific game events (like player death) can be emphasized with targeted camera effects.
- TypeScript's `as const` assertion is powerful for creating strongly-typed constant objects.
