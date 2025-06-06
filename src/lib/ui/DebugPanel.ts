import Phaser from "phaser";

const PADDING = 10;
const BASE_FONT_SIZE = 24;

export class DebugPanel {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private active: boolean = false; // Start hidden

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Initial position based on constructor args (set by DebugUIScene)
    this.text = this.scene.add.text(x, y, "Debug Panel (Press Q)", {
      fontSize: `${BASE_FONT_SIZE}px`, // Use base font size
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: { x: 8, y: 5 },
      // fixedWidth: 500, // Removed fixed width
    });
    this.text.setOrigin(1, 0); // Set origin to top-right
    this.text.setScrollFactor(0); // Keep it fixed on screen
    this.text.setDepth(100); // Ensure it's on top of other UI
    this.text.setVisible(this.active);

    // Add resize listener
    this.scene.scale.on("resize", this.handleResize, this);
    // Call handleResize once initially to set position and scale
    this.handleResize();
  }

  /** Reposition and scale text on resize */
  private handleResize(): void {
    const newX = this.scene.scale.width - PADDING;
    const newY = PADDING;
    this.text.setPosition(newX, newY);

    // Scale font size based on display scale, clamped between 12 and BASE_FONT_SIZE
    // Use displayScale as it reflects the actual CSS scaling applied by FIT/ENVELOP
    const scale = Math.min(
      this.scene.scale.displayScale.x,
      this.scene.scale.displayScale.y
    );
    const newFontSize = Math.max(12, Math.round(BASE_FONT_SIZE * scale));
    this.text.setFontSize(`${newFontSize}px`);

    // // Optional: Adjust max width based on screen size - removed as setMaxWidth is invalid
    // this.text.setMaxWidth(this.scene.scale.width - 2 * PADDING);
  }

  public toggle(): void {
    this.active = !this.active;
    this.text.setVisible(this.active);
  }

  public update(debugData: { [key: string]: any }): void {
    if (!this.active) {
      return;
    }

    // Get current FPS
    const fps = Math.round(this.scene.game.loop.actualFps);

    let debugContent = `FPS: ${fps}\nDebug Panel (Q)\n-----------------\n`; // Use backticks for multi-line

    // Define preferred display order
    const displayOrder = [
      "PlayerPos",
      "Platforms",
      "Enemies",
      "CulledEnemies",
      "Coins",
      "CulledCoins",
      "Crates",
      "Barrels",
      "CulledBarrels",
    ];

    // Add data in the specified order
    for (const key of displayOrder) {
      if (Object.prototype.hasOwnProperty.call(debugData, key)) {
        const value = debugData[key];
        if (
          key === "PlayerPos" &&
          typeof value === "object" &&
          value !== null
        ) {
          debugContent += `${key}: x=${Math.round(value.x)}, y=${Math.round(
            value.y
          )}\n`;
        } else if (typeof value === "number") {
          debugContent += `${key}: ${value}\n`;
        } else {
          debugContent += `${key}: ${JSON.stringify(value)}\n`;
        }
        // Remove the key from debugData to handle remaining keys later
        delete debugData[key];
      }
    }

    // Append any remaining data not in the display order
    for (const key in debugData) {
      if (Object.prototype.hasOwnProperty.call(debugData, key)) {
        const value = debugData[key];
        debugContent += `${key}: ${JSON.stringify(value)}\n`;
      }
    }

    this.text.setText(debugContent);
  }

  public destroy(): void {
    this.scene.scale.off("resize", this.handleResize, this); // Remove listener
    this.text.destroy();
  }
}
