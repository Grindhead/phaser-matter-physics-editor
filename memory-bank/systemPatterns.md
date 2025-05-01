# System Patterns

## Architecture

- **Framework:** Phaser 3
- **Language:** TypeScript
- **Build Tool:** Vite
- **Structure:**
  - Root: Config files, `index.html`, `assets/`, `public/`, `src/`, `dist/`.
  - `src/`: Main entry (`main.ts`), scenes (`scenes/`), entities (`entities/`), libraries/helpers (`lib/`).

## Key Technical Decisions

- **Level Generation:** Uses a procedural approach to place platforms, items, and enemies.
  - **Vertical Walls:** Constructed by rotating standard platform sprites by 90 degrees.
  - **Barrel Substitution:** If the horizontal gap between potential platform placements exceeds the player's maximum jump distance, a barrel is placed instead of the platform to create a mandatory jump sequence.
  - **Strategic Crate Placement:** Crates are placed near vertical walls only when the calculated jump height difference requires them for the player to clear the wall.
  - **Difficulty Scaling:** Level length (platform count) and enemy density increase with level number through multipliers, creating a progressive difficulty curve.
- **Screen Scaling:** Uses Phaser's Scale Manager with `mode: Phaser.Scale.EXPAND` and `autoCenter: Phaser.Scale.CENTER_BOTH` to fill the available screen space while maintaining the game's aspect ratio within the view.
- **Mobile Controls:** On-screen touch buttons (implemented as interactive `Phaser.GameObjects.Image`) are displayed for movement and jump. Pointer events on these buttons update state flags in the `Player` entity.
- **Depth Management:** Game objects use consistent depth values to ensure proper visual layering:
  - Player has a depth of 10
  - Finish line has a depth of 5
  - UI elements (buttons, overlays) have a depth of 1000
  - Debug visualizations have a depth of 9999

## Design Patterns

- **Entity State Management:** Entities like Player track state through boolean flags (isGrounded, isInBarrel, etc.), which determine behavior and animations.
- **Event-Driven Animation:** Animation transitions are triggered by events (collisions, level completion), with completion callbacks to manage subsequent state transitions.
- **Collision Detection Strategy:** Uses Matter.js collision events and helper functions to categorize collisions (isPlayerBody, isGroundBody) and manage interaction logic.
- **Conditional Generation Logic:** Helper functions accept context flags (e.g., `isInitialPlatform` in `populatePlatformWithCoins`) to apply specific rules during procedural generation.

## Component Relationships

- **Scene Hierarchy:** Game scene coordinates entity creation through the LevelGenerator, which produces a procedural level layout.
- **Entity Interaction:** Direct interaction between entities occurs via collision detection, with state changes propagated through method calls.
- **Input Processing:** Player entity accepts input from both keyboard and mobile touch controls, abstracting the input source from the movement logic.
