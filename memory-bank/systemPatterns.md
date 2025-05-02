# System Patterns

## Architecture

- **Framework:** Phaser 3
- **Language:** TypeScript
- **Build Tool:** Vite
- **Package Manager:** pnpm
- **Structure:**
  - Root: Config files, `index.html`, `assets/`, `public/`, `src/`, `dist/`.
  - `src/`: Main entry (`main.ts`), scenes (`scenes/`), entities (`entities/`), libraries/helpers (`lib/`).
  - **Potentially:** Add `editor/` directory for editor-specific scenes, UI components, and logic.

## Key Technical Decisions

- **Level Generation (Main Game):** Uses a procedural approach to place platforms, items, and enemies.
  - **Vertical Walls:** Constructed by rotating standard platform sprites by 90 degrees.
  - **Barrel Substitution:** If the horizontal gap between potential platform placements exceeds the player's maximum jump distance, a barrel is placed instead of the platform to create a mandatory jump sequence.
  - **Strategic Crate Placement:** Crates are placed near vertical walls only when the calculated jump height difference requires them for the player to clear the wall.
  - **Crate Placement:** Crates are placed strategically near walls (with type selection based on jump height + randomness) and randomly on other eligible platforms to ensure variety and utility.
  - **Difficulty Scaling:** Level length (platform count) and enemy density increase with level number through multipliers, creating a progressive difficulty curve.
- **Screen Scaling:** Uses Phaser's Scale Manager with `mode: Phaser.Scale.EXPAND` and `autoCenter: Phaser.Scale.CENTER_BOTH` to fill the available screen space while maintaining the game's aspect ratio within the view.
- **Mobile Controls:** On-screen touch buttons (implemented as interactive `Phaser.GameObjects.Image`) are displayed for movement and jump. Pointer events on these buttons update state flags in the `Player` entity.
- **Depth Management:** Game objects use consistent depth values to ensure proper visual layering:
  - Player has a depth of 10
  - Finish line has a depth of 5
  - UI elements (buttons, overlays) have a depth of 1000
  - Debug visualizations have a depth of 9999
- **Multiple Death Zones:** Creates segmented death zone colliders throughout longer levels instead of a single wide death zone:
  - For levels shorter than 2000px, one large death zone is used.
  - For longer levels, multiple overlapping death zones are created with 200px overlap margin.
  - Death zones are positioned 500px below the lowest platform in each section.
  - Implementation in `Game.ts` using the `createDeathZones` and `createFallSensor` methods.
- **Automatic Restart Flow:** Implements immediate gameplay transitions:
  - Game restarts instantly upon game over or level completion, without any delay.
  - Keyboard shortcuts (Space/Enter) remain active for optional manual restart during gameplay.
- **Crate Management:** Uses a two-part strategy for tracking and respawning crates:

  - Original crate positions are stored during level generation in an array of `{x, y, type}` objects.
  - Destruction occurs in collision detection with death zones (`checkFallSensorCollision`).
  - Respawning is handled by the `LevelGenerator.respawnCrates` method which creates new crates at the original positions.

- **Level Editor Implementation (New):**
  - **Separate Scene/State:** The editor will likely run within a dedicated Phaser Scene, distinct from the main `Game` scene.
  - **Data Format:** A JSON format will be defined to store level layouts. The agreed structure includes arrays for `platforms` (with `x`, `y`, `segmentCount`, `orientation`), `enemies` (with `x`, `y`, `type`), `barrels` (with `x`, `y`), and a single `finishLine` object (with `x`, `y`).
    ```json
    // Example Structure
    {
      "platforms": [
        { "x": 100, "y": 500, "segmentCount": 5, "orientation": "horizontal" }
      ],
      "enemies": [{ "x": 450, "y": 400, "type": "default" }],
      "barrels": [{ "x": 200, "y": 450 }],
      "finishLine": { "x": 800, "y": 400 }
    }
    ```
  - **UI Elements:** Editor UI (object selection, property editing, orientation toggle) will be built using Phaser GameObjects or potentially a dedicated UI library.
  - **Loading Custom Levels:** The main game will need logic to load and parse the custom level **JSON** format instead of using the procedural generator when a custom level is selected.

## Design Patterns

- **Entity State Management:** Entities like Player track state through boolean flags (isGrounded, isInBarrel, etc.), which determine behavior and animations.
- **Event-Driven Animation:** Animation transitions are triggered by events (collisions, level completion), with completion callbacks to manage subsequent state transitions.
- **Collision Detection Strategy:** Uses Matter.js collision events and helper functions to categorize collisions (isPlayerBody, isGroundBody) and manage interaction logic.
- **Conditional Generation Logic:** Helper functions accept context flags (e.g., `isInitialPlatform` in `populatePlatformWithCoins`) to apply specific rules during procedural generation.
- **Timed State Transitions:** Game state changes (game over → restart, level complete → next level) use timed delays rather than requiring explicit player input, creating smoother game flow.
- **Original State Preservation:** For dynamic objects (crates), original state is preserved at creation time to enable accurate recreation after restarts.
- **Editor Tool Pattern (Potential):** Implement distinct tools (e.g., PlatformTool, EnemyTool, SelectTool) activated via the UI, each handling specific input events and placement logic.
- **Command Pattern (Potential):** Could be used for undo/redo functionality within the editor.

## Component Relationships

- **Scene Hierarchy:** Game scene coordinates entity creation through the LevelGenerator, which produces a procedural level layout.
- **Entity Interaction:** Direct interaction between entities occurs via collision detection, with state changes propagated through method calls.
- **Input Processing:** Player entity accepts input from both keyboard and mobile touch controls, abstracting the input source from the movement logic.
- **Scene-Entity State Synchronization:** Game scene tracks entity states that need to persist across restarts (e.g., original crate positions), passing necessary data during scene transitions.
- **Editor-Game Separation:** The editor components (Scenes, UI) will be largely separate from the main game logic, interacting primarily through the shared level data format.
