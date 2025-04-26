import { Scene, GameObjects } from "phaser";
import { getCoins } from "../helpers/coinManager";

/**
 * A stateless UI component that displays a coin count using the Roboto font.
 */
export class CoinUI {
  private scene: Scene;
  private text: GameObjects.Text;

  constructor(scene: Scene) {
    this.scene = scene;

    this.text = this.scene.add
      .text(16, 16, "Coins: 0", {
        fontFamily: "Roboto",
        fontSize: "36px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(100);
  }

  /**
   * Updates the visible coin count.
   * @param count - The current coin count
   */
  update(): void {
    this.text.setText("Coins: " + getCoins());
  }

  /**
   * Destroys the UI element.
   */
  destroy(): void {
    this.text.destroy();
  }
}
