# Active Context

## Current Focus

- **Integrate Editor Levels into Game:** Modify `Game.ts` to load level data from the editor's JSON format and instantiate entities using their respective classes (including specific enemy types).
- **Adapt Game Mechanics:** Ensure core mechanics (player movement, physics, interactions, death zones, restart) work correctly with manually loaded levels.
- **Implement Coin Placement:** Repurpose `LevelGenerator.ts` (or create a new system) solely for placing coins on loaded platforms, avoiding those with enemies/crates.
- **Refine Editor:** Implement entity dragging/movement. Consider UI improvements (e.g., enemy type selection) and undo/redo.

## Recent Changes

- **Level Editor Core Implemented:**
  - Created `EditorScene` with UI (`Palette`, `Inspector`, `Toolbar`).
  - Implemented entity placement (snapped to grid), selection, and property editing.
  - **Platforms use actual `Platform` class:** Editor now instantiates `Platform` entities directly. `isVertical` property handled correctly.
  - **Enemies use actual `EnemyLarge`/`EnemySmall` classes:** Editor differentiates and instantiates specific enemy types.
  - Implemented Save/Load functionality for level JSON data (handles specific enemy types).
  - Added graphics-based grid.
  - Configured separate editor launch (`pnpm run editor`).
- **Memory Bank Updated:** Reflects implementation progress, including specific enemy types and use of actual entity classes.

## Next Steps

- **Game Scene (`Game.ts`) Modifications:**
  - Remove procedural generation logic.
  - Add functionality to load a specified level JSON file.
  - Parse the JSON and instantiate all entities (Platforms, Enemies - large/small, Barrels, Crates, FinishLine) using classes from `src/entities/`.
- **Coin Placement Logic:**
  - Design and implement the method to place coins on loaded platforms, checking for enemy/crate conflicts.
  - Call this coin placement logic from `Game.ts` _after_ other entities are loaded.
- **Editor Dragging:** Implement dragging logic for selected entities within `EditorScene`.
- **Testing:** Begin testing the game scene's ability to load and render editor-created levels.

## Active Decisions

- **Primary Focus:** Shifted to integrating the editor's output into the game and adapting game mechanics.
- **Platform Handling in Editor:** Uses `Platform` class instances. `isVertical` changes trigger recreation.
- **Enemy Handling in Editor:** Uses `EnemyLarge`/`EnemySmall` class instances. Type is set at creation.
- **No Placement Ghosts:** Removed.
- **Grid Implementation:** Uses Phaser Graphics API.
- **Level Data Format:** Remains the agreed JSON structure (includes enemy `type`).
- **Coin Placement:** Handled post-load in the game scene.
- **Entity Source:** Editor uses entity classes from `src/entities/`.

## Important Patterns & Preferences

- **Focus on Game Integration:** Prioritize getting levels loaded and playable in the main game.
- **Reuse Entity Classes:** Leverage existing entity classes (`Platform`, `EnemyLarge`, `EnemySmall`, etc.) in both editor and game.
- **Modular Editor Components:** Continue logical structure (Scene, UI, Data Handling).
- **Clear Data Flow:** Maintain clean serialization/deserialization between editor state and JSON format.
- **Clean Game Scene:** Remove old procedural code paths cleanly when integrating editor data.
- **Follow custom instructions:** Continue adhering to memory bank, planning, and communication guidelines.

## Learnings & Project Insights

- Using actual entity classes in the editor improves consistency but requires careful handling of recreation when properties change.
- A graphics-based grid provides flexibility.

## Design Patterns

- **Entity Instantiation:** Game scene will instantiate entities based on loaded JSON data.
- **Editor Tool Pattern (Potential for Dragging):** Dragging logic could be encapsulated in a tool/state.
- **Command Pattern (Potential):** Still relevant for undo/redo in the editor.
- **Scene Graph:** Editor manages placed game objects (including `Platform`, `EnemyLarge`, `EnemySmall` instances).
- **Observer Pattern (Potential for Editor):** Still relevant for UI updates in the editor.
