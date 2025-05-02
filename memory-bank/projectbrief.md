# Project Brief: Phaser Platformer Game

## Core Requirements and Goals

Develop a responsive Phaser 3 platformer game utilizing the Matter.js physics engine. The game features procedural level generation, mobile controls, and various gameplay mechanics like wall jumping (assisted by crates), barrel interaction, and dynamic death zones.

**Additionally, create a separate level editor to allow manual design of levels, including placement of platforms (with adjustable segment counts and orientation), enemies, barrels, and the finish line.**

## Scope

- Procedural level generation with increasing difficulty (for the main game).
- Player movement (walk, jump) and interactions (crates, barrels, enemies, coins).
- Physics-based interactions using Matter.js.
- Responsive design for desktop and mobile (with touch controls).
- Dynamic elements: Respawning crates, multiple death zones.
- Core gameplay loop: Level progression, restart mechanics.
- **Level Editor:**
  - Separate execution mode (e.g., via `pnpm run editor` script).
  - UI for selecting and placing platforms, enemies, barrels, and the finish line.
  - Ability to set platform `segmentCount` and orientation (horizontal/vertical).
  - Saving and loading level data in JSON format.
  - Coins remain procedurally generated within the main game, not placed in the editor.
