import { Scene } from "phaser";
import { TILE_WIDTH, TILE_HEIGHT } from "../../lib/constants";

export class EditorGrid {
  private scene: Scene;
  private gridGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Scene) {
    this.scene = scene;
    this.gridGraphics = this.scene.add.graphics();
    this.createGrid();
  }

  private createGrid() {
    // Set line style
    this.gridGraphics.lineStyle(1, 0x444444, 0.3);

    // Calculate grid dimensions based on camera size
    const width = this.scene.cameras.main.width * 3; // Make grid larger than screen
    const height = this.scene.cameras.main.height * 3;

    // Draw vertical lines
    for (let x = 0; x <= width; x += TILE_WIDTH) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, height);
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += TILE_HEIGHT) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(width, y);
    }

    // Stroke the lines
    this.gridGraphics.strokePath();

    // Draw red border around the grid
    this.gridGraphics.lineStyle(2, 0xff0000, 1);
    this.gridGraphics.strokeRect(0, 0, width, height);

    // Center the grid relative to (0,0)
    this.gridGraphics.setPosition(0, 0);

    // Make sure the grid scrolls with the camera
    this.gridGraphics.setScrollFactor(1);
  }

  public resize() {
    // Clear existing grid
    this.gridGraphics.clear();
    // Recreate grid with new dimensions
    this.createGrid();
  }
}
