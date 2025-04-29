# System Patterns

**Architecture:** Entity-Component System (implicit through Phaser GameObjects and Scenes).

**Key Technical Decisions:**

- Use Matter.js for physics simulation.
- Use TexturePacker for sprite atlases.
- Use PhysicsEditor for defining physics shapes.
- Manage game state within Phaser Scenes.
- Encapsulate game objects (Player, Coin, FX) into distinct classes extending Phaser Sprites/Matter Sprites.

**Component Relationships:**

- `Game` scene manages game loop and instantiates entities.
- `Player` class handles input, movement, physics, and animation state.
- Collision events are handled within the `Player` class to update its state (`isGrounded`).
- FX classes (`FXLand`) are self-contained and handle their own lifecycle (e.g., destroy after animation).

**Critical Paths:**

- Player input -> Velocity update -> Physics step -> Collision detection -> State update (e.g., `isGrounded`) -> Animation update.

## Architecture Overview

- Phaser 3 game engine.
- Scene-based structure (`src/scenes`).
- Entity-component pattern for game objects (`src/entities`).
- Helper functions for common logic (`src/lib/helpers`).
- Utility classes for core systems (`src/lib`, e.g., `LevelGenerator`, `CameraManager`).

## Design Patterns in Use

- **Scene Management:** Using Phaser's scene system (e.g., `Boot`, `Preloader`, `Game`, `DebugUIScene`). Includes running scenes in parallel (`Game` + `DebugUIScene`).
- **Entity Class Pattern:** Each game object (Player, Enemy, Coin, Platform, Background, Crate, Finish, Barrel) is represented by its own class, typically extending a Phaser `GameObject` or `Sprite`.
- **State Machine (Simple):** The `Game` scene uses a `GAME_STATE` constant object to manage flow (Waiting, Playing, Game Over, Level Complete).
- **UI Components:** Dedicated classes for UI elements (e.g., `CoinUI`, `CameraManager`, `DebugPanel`). `DebugPanel` is now managed by `DebugUIScene`.
- **Procedural Generation:** A dedicated `LevelGenerator` class encapsulates the logic for creating level layouts based on a seed (level number).
- **Event Emitter:** Used for communication between parallel scenes (`Game` scene emits `updateDebugData`, `DebugUIScene` listens).

## Component Relationships

- `Game` scene orchestrates level generation (via `LevelGenerator`), updates game entities, handles collisions, manages primary game state, and emits debug data.
- `DebugUIScene` runs in parallel to `Game`, listens for `updateDebugData` events, and manages the `DebugPanel` UI.
- `LevelGenerator` creates instances of various entity classes (`Player`, `Platform`, `Enemy`, `Coin`, `Crate`, `Finish`), places them in the scene, and now provides getters (`getPlatforms`, `getEnemies`, `getCoins`, `getCrates`).
- `ParallaxManager` now uses `ParallaxBackground` instances to manage background layers.
- Entities interact via Matter.js physics collisions detected in `Game.ts`. Collisions with `Barrel` entities will need specific handling for player entry/launch.
- UI elements (`CoinUI`) are managed by the `Game` scene. `DebugPanel` is managed by `DebugUIScene`.
- `CameraManager` controls the `Game` scene's camera bounds, follow, and dynamic zoom.

## Critical Implementation Paths

- Player movement and input handling (`Player.ts`).
- Collision detection and handling (`Game.ts` collision methods, helper functions like `isPlayerBody`). Needs update for player-barrel interaction.
- Scene transitions and state management (`Game.ts`).
- Asset loading (`Preloader.ts`).
- Procedural level generation logic (`LevelGenerator.ts`).
- Scene communication via events (`Game.ts` -> `DebugUIScene.ts`).

## New Patterns

- **Procedural Level Generation:** Implemented via `LevelGenerator` class (`src/lib/LevelGenerator.ts`). Uses a seeded PRNG (`SimplePRNG`) for deterministic generation. The `Game` scene calls this generator during initialization (`initGame` -> `generateLevelEntities`) to populate the world instead of using static entity placement. Includes logic to ensure a minimum number of platforms are generated based on target item counts (enemies, crates, barrels) to guarantee placement possibility.
- **Parallax Background:** Implemented using `ParallaxBackground` class (`src/lib/helpers/parralax/ParallaxBackground.ts`) which extends `Phaser.GameObjects.TileSprite` and updates its `tilePositionX` based on camera scroll in its `update` method. The `ParallaxManager` (`src/lib/helpers/parralax/ParallaxManager.ts`) is responsible for creating and managing multiple `ParallaxBackground` instances.
- **Camera Management:** A dedicated `CameraManager` class (`src/lib/ui/CameraManager.ts`) handles camera setup (bounds, follow, lerp) and effects like death zoom, separating camera logic from the main `Game` scene.
- **Constants for States:** Using a `const` object (`GAME_STATE`) instead of an `enum` for defining fixed state values, providing string-based values and potentially simpler integration in some contexts.
- **Conditional Debug UI (Separate Scene):** A `DebugPanel` class (`src/lib/ui/DebugPanel.ts`) displays runtime information. It is managed by a dedicated `DebugUIScene` (`src/scenes/DebugUIScene.ts`) which runs in parallel to the main `Game` scene. `DebugUIScene` is launched conditionally in development builds (`import.meta.env.DEV`) by the `Game` scene. Communication uses Phaser's event emitter (`Game` emits `updateDebugData`, `DebugUIScene` listens and updates the panel). The panel is toggled via 'Q' key handled within `DebugUIScene`.
