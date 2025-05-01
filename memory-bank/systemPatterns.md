# System Patterns

## Architecture

- **Framework:** Phaser 3
- **Language:** TypeScript
- **Build Tool:** Vite
- **Structure:**
  - Root: Config files, `index.html`, `assets/`, `public/`, `src/`, `dist/`.
  - `src/`: Main entry (`main.ts`), scenes (`scenes/`), entities (`entities/`), libraries/helpers (`lib/`).

## Key Technical Decisions

(To be defined)

- **Level Generation:** Uses a procedural approach to place platforms, items, and enemies.
  - **Vertical Walls:** Constructed by rotating standard platform sprites by 90 degrees.
  - **Barrel Substitution:** If the horizontal gap between potential platform placements exceeds the player's maximum jump distance, a barrel is placed instead of the platform to create a mandatory jump sequence.
- **Screen Scaling:** Uses Phaser's Scale Manager with `mode: Phaser.Scale.EXPAND` and `autoCenter: Phaser.Scale.CENTER_BOTH` to fill the available screen space while maintaining the game's aspect ratio within the view.
- **Mobile Controls:** On-screen touch buttons (implemented as interactive `Phaser.GameObjects.Image`) are displayed for movement and jump. Pointer events on these buttons update state flags in the `Player` entity.

## Design Patterns

(To be defined)

- **Responsive UI:** UI elements (e.g., score display, debug info, mobile controls) are positioned relative to screen dimensions (`scene.scale.width/height`) and anchored to corners or edges. Scene resize events (`this.scale.on('resize')`) are used to trigger repositioning/rescaling logic.

## Component Relationships

(To be defined)
