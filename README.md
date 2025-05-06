# phaser-mattter-physics-editor

A Phaser 3 platformer game template using Matter.js physics, featuring a dedicated Level Editor.

## Getting Started

1.  **Install Dependencies:**

    ```bash
    pnpm install
    ```

2.  **Run the Game:**

    ```bash
    pnpm run dev
    ```

3.  **Run the Level Editor:**
    ```bash
    pnpm run editor
    ```

## Using the Level Editor

The editor allows you to manually design levels for the game.

### Launching the Editor

Run the following command in your terminal:

```bash
pnpm run editor
```

This will open the editor interface in your browser.

### Editor Interface

- **Palette (Left):** Contains buttons for selecting different entity types (Platforms, Enemies, Crates, Barrels, Finish Line) to place on the canvas.
- **Canvas (Center):** The main area where you build your level. It features a grid for alignment.
- **Inspector (Right):** Displays properties of the currently selected entity. Allows modification of position (X, Y), platform segment count, platform orientation, and enemy type.
- **Toolbar (Top Center):** Provides options to Save, Load, and Clear the level.

### Controls and Interactions

- **Camera Panning:** Click and drag the middle mouse button (or right mouse button) on the canvas.
- **Camera Zooming:** Use the mouse wheel on the canvas.
- **Select Entity Type for Placement:** Click a button in the Palette. The button will highlight.
- **Place Entity:** While an entity type is selected in the Palette, click on the canvas where you want to place it. The entity will snap to the grid. You can click multiple times to place several entities of the selected type.
- **Select Placed Entity:**
  - If **not** in placement mode (no entity type selected in Palette), simply click on a placed entity.
  - If **in** placement mode, **click and hold (long press)** on a placed entity.
- **Move Selected Entity:** Click and drag a selected entity to a new position. It will snap to the grid.
- **Modify Entity Properties:** Select a placed entity. Use the controls in the Inspector panel on the right to change its properties (X, Y, segment count, orientation, enemy type).
- **Save Level:** Click the "Save" button in the Toolbar. You will be prompted to enter a filename (e.g., `level1.json`). The level data will be downloaded as a JSON file.
- **Load Level:** Click the "Load" button in the Toolbar. Select a previously saved level JSON file.
- **Clear Level:** Click the "Clear" button in the Toolbar to remove all entities from the canvas.
