# System Patterns

## Architecture Overview

- Phaser 3 game engine.
- Scene-based structure (`src/scenes`).
- Entity-component pattern for game objects (`src/entities`).
- Helper functions for common logic (`src/lib/helpers`).

## Key Technical Decisions

- Matter.js for physics.
- TypeScript for type safety and code organization.

## Design Patterns in Use

- **Scene Management:** Using Phaser's scene system (e.g., `Boot`, `Preloader`, `Game`).
- **Entity Class Pattern:** Each game object (Player, Enemy, Coin, Platform, Background) is represented by its own class, typically extending a Phaser `GameObject`.
- **State Machine (Simple):** The `Game` scene uses a `GameState` enum to manage flow (Waiting, Playing, Game Over, Level Complete).
- **UI Components:** Dedicated classes for UI elements (e.g., `CoinUI`).

## Component Relationships

- `Game` scene orchestrates entity creation, updates, and collision detection.
- Entities interact via Matter.js physics collisions.
- UI elements subscribe to game state changes or events.

## Critical Implementation Paths

- Player movement and input handling (`Player.ts`).
- Collision detection and handling (`Game.ts` collision methods, helper functions like `isPlayerBody`).
- Scene transitions and state management (`Game.ts`).
- Asset loading (`Preloader.ts`).

## New Patterns

- **Parallax Background:** Implemented using `ParallaxBackground` class (`src/entities/ParallaxBackground.ts`) which extends `Phaser.GameObjects.TileSprite` and updates its `tilePositionX` based on camera scroll in its `update` method.
