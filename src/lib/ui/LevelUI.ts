import { Scene, GameObjects } from "phaser";
import { getLevel } from "../helpers/levelManager";

const PADDING = 16; // Define padding from screen edges
const Y_OFFSET = 56; // Additional Y offset to place below CoinUI (approx 16 + 36 font + 4 space)
const BASE_FONT_SIZE = 36;

/**
 * A stateless UI component that displays a level count using the Roboto font.
 */
export class LevelUI {
  private scene: Scene;
  private text: GameObjects.Text;

  constructor(scene: Scene) {
    this.scene = scene;

    this.text = this.scene.add
      .text(PADDING, PADDING + Y_OFFSET, "Level: 0", {
        // Use PADDING and Y_OFFSET
        fontFamily: "Roboto",
        fontSize: `${BASE_FONT_SIZE}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0, 0) // Set origin to top-left
      .setScrollFactor(0)
      .setDepth(100);

    // Add resize listener
    this.scene.scale.on("resize", this.handleResize, this);
    // Call handleResize once initially to set position and scale
    this.handleResize();
  }

  /** Reposition and scale text on resize */
  private handleResize(): void {
    this.text.setPosition(PADDING, PADDING + Y_OFFSET);

    // Scale font size based on display scale, clamped between 12 and BASE_FONT_SIZE
    const scale = Math.min(
      this.scene.scale.displayScale.x,
      this.scene.scale.displayScale.y
    );
    const newFontSize = Math.max(12, Math.round(BASE_FONT_SIZE * scale));
    this.text.setFontSize(`${newFontSize}px`);
  }

  /**
   * Updates the visible coin count.
   * @param count - The current coin count
   */
  update(): void {
    this.text.setText("Level: " + getLevel());
  }

  /**
   * Destroys the UI element and removes listeners.
   */
  destroy(): void {
    this.scene.scale.off("resize", this.handleResize, this); // Remove listener
    this.text.destroy();
  }
}
