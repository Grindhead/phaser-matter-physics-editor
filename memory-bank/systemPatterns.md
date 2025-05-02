# System Patterns

## Architecture

- **Framework:** Phaser 3
- **Language:** TypeScript
- **Build Tool:** Vite
- **Package Manager:** pnpm
- **Structure:**
  - Root: Config files, `index.html`, `assets/`, `public/`, `src/`, `dist/`.
  - `src/`: Main game entry (`main.ts`), game scenes (`scenes/`), shared entities (`entities/`), shared libraries/helpers (`lib/`).
  - `src/editor/`: Contains all code specific to the Level Editor, including:
    - `scenes/`: Editor scene (`EditorScene.ts`).
    - `ui/`: UI components (`Palette.ts`, `Inspector.ts`, `Toolbar.ts`).
    - `lib/`: Editor-specific logic (`LevelData.ts`).

## Key Technical Decisions

- **Level Creation:** Levels are designed manually using the dedicated Level Editor and saved as JSON files. **Procedural generation is not used.**
- **Level Loading (Game):** The main game scene (`Game.ts`) loads level data from a specified JSON file. It parses this data to instantiate platforms, enemies (large/small), crates, barrels, and the finish line using the corresponding entity classes from `src/entities/`.
- **Level Editor Implementation:**
  - **Separate Scene/State:** The editor runs within a dedicated Phaser Scene (`EditorScene.ts`), launched via a separate script (`pnpm run editor`).
  - **Data Format:** A defined JSON format stores level layouts. The structure includes arrays for `platforms` (with `x`, `y`, `segmentCount`, `isVertical`), `enemies` (with `x`, `y`, `type` - either "enemy-large" or "enemy-small"), `barrels` (with `x`, `y`), `crates` (with `x`, `y`, `type`), and a single `finishLine` object (with `x`, `y`).
    ```json
    // Example Structure
    {
      "platforms": [
        { "x": 100, "y": 500, "segmentCount": 5, "isVertical": false }
      ],
      "enemies": [
        { "x": 450, "y": 400, "type": "enemy-large" },
        { "x": 600, "y": 300, "type": "enemy-small" }
      ],
      "barrels": [{ "x": 200, "y": 450 }],
      "crates": [{ "x": 300, "y": 450, "type": "small" }],
      "finishLine": { "x": 800, "y": 400 }
    }
    ```
  - **UI Elements:** Editor UI (object palette, property inspector, save/load buttons) built using Phaser GameObjects, organized into reusable UI component classes within `src/editor/ui/`. Palette includes separate buttons for large and small enemies.
  - **Placement/Manipulation Logic:**
    - Input handling within `EditorScene` manages selecting objects from the palette and placing them on the canvas (snapped to grid).
    - Selection logic handles different entity types (e.g., `Platform`, `EnemyLarge`, `EnemySmall`).
    - Property changes in the `Inspector` update the corresponding entity data and trigger visual updates (platform recreation).
  - **Platform Representation:** Uses the actual `Platform` class. `isVertical` changes trigger recreation.
  - **Enemy Representation:** Uses the actual `EnemyLarge` and `EnemySmall` classes.
  - **Grid:** Rendered using Phaser Graphics API.
  - **No Placement Ghost:** Removed.
- **Coin Placement (Game):** Handled post-load in the game scene, avoiding platforms with enemies/crates.
- **Screen Scaling (Editor):** Uses Phaser's Scale Manager (`RESIZE`). UI elements use resize listeners for responsive positioning.
- **Screen Scaling (Game):** Uses Phaser's Scale Manager (`EXPAND`, `CENTER_BOTH`).
- **Depth Management:** Consistent depth values ensure proper layering (e.g., Player: 10, Platforms: 10, Other Items: 15/20, UI: 1000+).
- **Game Mechanics:** Core mechanics will be adapted to work with loaded levels.

## Design Patterns

- **Entity State Management:** Entities track state.
- **Event-Driven Animation:** Animations triggered by events.
- **Collision Detection Strategy:** Matter.js collision events and helpers.
- **Editor UI Components:** Separate classes for `Palette`, `Inspector`, `Toolbar`.
- **Command Pattern (Potential):** For undo/redo.
- **Scene Graph:** Editor manages placed game objects (including `Platform`, `EnemyLarge`, `EnemySmall` instances).
- **Factory Pattern (Implicit):** `EditorScene` acts as a factory for creating entities based on palette selection.
- **Observer Pattern (Potential for Editor):** UI elements update based on changes.

## Component Relationships

- **Editor Scene (`EditorScene.ts`):** Manages editor canvas, UI, placed entity instances (`Platform`, `EnemyLarge`, `EnemySmall`, etc.), input handling, save/load logic.
- **Editor UI Components (`src/editor/ui/`):** Provide controls, trigger actions/updates.
- **Level Data Manager (`src/editor/lib/LevelData.ts`):** Handles JSON serialization/deserialization.
- **Game Scene (`Game.ts`):** (To be updated) Loads JSON, instantiates entities, manages game loop, physics, input. Calls coin placement logic.
- **LevelGenerator (`LevelGenerator.ts` - To be Repurposed):** Contains coin placement logic.
- **Shared Entities (`src/entities/`):** Classes (`Platform.ts`, `EnemyLarge.ts`, `EnemySmall.ts`, etc.) used by editor and game.
- **Platform Builder (`src/lib/level-generation/platformBuilder.ts`):** Used by `Platform` class.
