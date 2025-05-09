import { Scene, GameObjects } from "phaser";
import { getCoins, getTotalCoinsInLevel } from "../helpers/coinManager";

const PADDING = 16; // Define padding from screen edges

/**
 * A stateless UI component that displays a coin count using the Roboto font.
 */
export class CoinUI {
  private scene: Scene;
  private text: GameObjects.Text;

  constructor(scene: Scene) {
    this.scene = scene;

    this.text = this.scene.add
      .text(PADDING, PADDING, "Coins: 0 / 0", {
        // Use PADDING for position
        fontFamily: "Roboto",
        fontSize: "36px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0, 0) // Set origin to top-left
      .setScrollFactor(0)
      .setDepth(100);

    // Add a resize listener to reposition the text if the screen size changes
    this.scene.scale.on("resize", this.handleResize, this);
  }

  /** Reposition text on resize */
  private handleResize(): void {
    this.text.setPosition(PADDING, PADDING);
  }

  /**
   * Updates the visible coin count.
   * @param count - The current coin count
   */
  update(): void {
    this.text.setText(`Coins: ${getCoins()} / ${getTotalCoinsInLevel()}`);
  }

  /**
   * Destroys the UI element and removes listeners.
   */
  destroy(): void {
    this.scene.scale.off("resize", this.handleResize, this); // Remove listener
    this.text.destroy();
  }
}
