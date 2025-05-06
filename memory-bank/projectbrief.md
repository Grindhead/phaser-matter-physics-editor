# Project Brief: Phaser Platformer Game with Level Editor

## Core Requirements and Goals

Develop a responsive Phaser 3 platformer game utilizing the Matter.js physics engine. The game features mobile controls, and various gameplay mechanics like wall jumping (assisted by crates), barrel interaction, and dynamic death zones, played on levels created **manually via a dedicated Level Editor.**

The **primary goal** is to create a robust Level Editor to allow manual design of levels, including placement of platforms (with adjustable segment counts and orientation), enemies, barrels, and the finish line. The game itself will load and play these custom-designed levels.

## Scope

- **Level Editor:**
  - **Primary focus of the project.**
  - Separate execution mode (e.g., via `pnpm run editor` script).
  - UI for selecting and placing platforms, enemies, barrels, and the finish line using assets defined in `@entities`.
  - Ability to set platform `segmentCount` and orientation (horizontal/vertical).
  - Saving and loading level data in JSON format.
- **Game Logic:**
  - Load levels from the editor's saved JSON format.
  - Player movement (walk, jump) and interactions (crates, barrels, enemies, coins).
  - Physics-based interactions using Matter.js.
  - Responsive design for desktop and mobile (with touch controls).
  - Dynamic elements: Respawning crates, multiple death zones (logic might be reused from previous procedural work if applicable, but generation is manual).
  - Core gameplay loop: Level progression, restart mechanics.
- **Note:** Coins remain procedurally generated within the main game (based on platform placement from the editor), not placed in the editor.

* **Note:** Coins are placed onto platforms by a repurposed `LevelGenerator` within the game _after_ loading the level from JSON. Coin placement avoids platforms containing manually placed enemies or crates.
