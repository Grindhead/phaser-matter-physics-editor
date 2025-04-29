import Phaser from "phaser";

export class DebugPanel {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private active: boolean = false; // Start hidden

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Basic text setup
    this.text = this.scene.add.text(x, y, "Debug Panel (Press Q)", {
      fontSize: "24px",
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: { x: 8, y: 5 },
      fixedWidth: 500,
    });
    this.text.setOrigin(1, 0); // Set origin to top-right
    this.text.setScrollFactor(0); // Keep it fixed on screen
    this.text.setDepth(100); // Ensure it's on top of other UI
    this.text.setVisible(this.active);
  }

  public toggle(): void {
    this.active = !this.active;
    this.text.setVisible(this.active);
  }

  public update(debugData: { [key: string]: any }): void {
    if (!this.active) {
      return;
    }

    let debugContent = `Debug Panel (Q)\n-----------------\n`; // Use backticks for multi-line

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
    this.text.destroy();
  }
}
