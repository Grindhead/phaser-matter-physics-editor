# System Patterns

## Architecture Overview

- Phaser 3 game engine.
- Scene-based structure (`src/scenes`).
- Entity-component pattern for game objects (`src/entities`).
- Helper functions for common logic (`src/lib/helpers`).
- Utility classes for core systems (`src/lib`, e.g., `LevelGenerator`, `CameraManager`).

## Key Technical Decisions

- Matter.js for physics.
- TypeScript for type safety and code organization.
- Procedural level generation for dynamic content.

## Design Patterns in Use

- **Scene Management:** Using Phaser's scene system (e.g., `Boot`, `Preloader`, `Game`).
- **Entity Class Pattern:** Each game object (Player, Enemy, Coin, Platform, Background, Crate, Finish) is represented by its own class, typically extending a Phaser `GameObject` or `Sprite`.
- **State Machine (Simple):** The `Game` scene uses a `GAME_STATE` constant object to manage flow (Waiting, Playing, Game Over, Level Complete).
- **UI Components:** Dedicated classes for UI elements (e.g., `CoinUI`, `CameraManager`).
- **Procedural Generation:** A dedicated `LevelGenerator` class encapsulates the logic for creating level layouts based on a seed (level number).

## Component Relationships

- `Game` scene orchestrates level generation (via `LevelGenerator`), updates, and collision detection.
- `LevelGenerator` creates instances of various entity classes (`Player`, `Platform`, `Enemy`, `Coin`, `Crate`, `Finish`) and places them in the scene.
- Entities interact via Matter.js physics collisions detected in `Game.ts`.
- UI elements (`CoinUI`) subscribe to game state changes or events.
- `CameraManager` controls camera bounds, follow, and dynamic zoom.

## Critical Implementation Paths

- Player movement and input handling (`Player.ts`).
- Collision detection and handling (`Game.ts` collision methods, helper functions like `isPlayerBody`).
- Scene transitions and state management (`Game.ts`).
- Asset loading (`Preloader.ts`).
- Procedural level generation logic (`LevelGenerator.ts`).

## New Patterns

- **Procedural Level Generation:** Implemented via `LevelGenerator` class (`src/lib/LevelGenerator.ts`). Uses a seeded PRNG (`SimplePRNG`) for deterministic generation. The `Game` scene calls this generator during initialization (`initGame` -> `generateLevelEntities`) to populate the world instead of using static entity placement.
- **Parallax Background:** Implemented using `ParallaxBackground` class (`src/entities/ParallaxBackground.ts`) which extends `Phaser.GameObjects.TileSprite` and updates its `tilePositionX` based on camera scroll in its `update` method.
- **Camera Management:** A dedicated `CameraManager` class (`src/lib/ui/CameraManager.ts`) handles camera setup (bounds, follow, lerp) and effects like death zoom, separating camera logic from the main `Game` scene.
- **Constants for States:** Using a `const` object (`GAME_STATE`) instead of an `enum` for defining fixed state values, providing string-based values and potentially simpler integration in some contexts.
