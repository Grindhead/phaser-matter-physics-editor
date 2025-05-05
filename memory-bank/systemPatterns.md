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
    - `lib/`: Editor-specific logic and components:
      - `EditorEventBus.ts` - Centralized event communication system
      - `EditorEventTypes.ts` - Event type definitions
      - `EntityCreator.ts` - Entity factory methods
      - `EntitySelector.ts` - Entity selection logic
      - `EntityDragHandler.ts` - Entity dragging behavior
      - `EntityUpdater.ts` - Entity property updates
      - `EntityManager.ts` - Core entity management facade
      - `KeyboardManager.ts` - Keyboard input handling
      - `CameraPanManager.ts` - Camera control logic
      - `EditorGrid.ts` - Grid rendering
      - `EditorLevelHandler.ts` - Level saving/loading
      - `LevelData.ts` - Level data structure
    - `ui/`: UI components (`Palette.ts`, `Inspector.ts`, `Toolbar.ts`, `PlatformConfig.ts`).
    - `tools/`: Editor tool implementations (`PlatformTool.ts`).

## Key Technical Decisions

- **Level Creation:** Levels are designed manually using the dedicated Level Editor and saved as JSON files. **Procedural generation is not used.**
- **Level Loading (Game):** The main game scene (`Game.ts`) loads level data from a specified JSON file. It parses this data to instantiate platforms, enemies (large/small), crates, barrels, and the finish line using the corresponding entity classes from `src/entities/`.
- **Level Editor Implementation:**Cannot find module './EditorEntity' or its corresponding type declarations.
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
  - **Rendering Layers:** The `EditorScene` uses two `Phaser.GameObjects.Layer` instances (`platformLayer`, `entityLayer`) to manage rendering order and organization. Platforms are added to `platformLayer`, and all other entities (enemies, items) are added to `entityLayer`. Selection and save/load logic have been updated to work with these layers.
  - **UI Elements:** Editor UI (object palette, property inspector, save/load buttons) built using Phaser GameObjects, organized into reusable UI component classes within `src/editor/ui/`. Palette includes separate buttons for large and small enemies.
  - **Platform Configuration:** Platforms are handled differently from other entities. When selected, a platform configuration UI appears allowing segment count and orientation to be set before placement.
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
- **Event-Driven Architecture:** Editor components communicate via the centralized event bus.
- **Entity-Specific Configuration:** Platforms and other complex entities implement configuration interfaces for pre-placement setup.
- **Collision Detection Strategy:** Matter.js collision events and helpers.
- **Editor UI Components:** Separate classes for `Palette`, `Inspector`, `Toolbar`, `PlatformConfig`.
- **Factory Pattern:** `EntityCreator` creates entities based on type.
- **Observer Pattern:** UI elements update based on events through the event bus.
- **Facade Pattern:** `EntityManager` presents a simplified interface to the specialized editor components.
- **Singleton Pattern:** Used for the `EditorEventBus` to ensure a single point of event communication.
- **Command Pattern (Potential):** For undo/redo functionality.

## Component Relationships

- **Editor Scene (`EditorScene.ts`):** Manages editor canvas and overall coordination.
- **Entity Manager (`EntityManager.ts`):** Coordinates between specialized entity components:
  - **Entity Creator (`EntityCreator.ts`):** Creates different types of entities
  - **Entity Selector (`EntitySelector.ts`):** Handles entity selection and highlighting
  - **Entity Updater (`EntityUpdater.ts`):** Updates entity properties
  - **Entity Drag Handler (`EntityDragHandler.ts`):** Manages entity dragging
- **Camera Pan Manager (`CameraPanManager.ts`):** Handles camera movement and zoom.
- **Keyboard Manager (`KeyboardManager.ts`):** Manages keyboard shortcuts.
- **Editor UI Components (`src/editor/ui/`):** Provide controls, trigger actions via the event bus.
- **Editor Level Handler (`EditorLevelHandler.ts`):** Handles JSON serialization/deserialization.
- **Game Scene (`Game.ts`):** Loads JSON, instantiates entities, manages game loop.
- **LevelGenerator (Repurposed):** Contains coin placement logic.
- **Shared Entities (`src/entities/`):** Classes used by both editor and game.
