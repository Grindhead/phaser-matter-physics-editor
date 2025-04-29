import { Scene, GameObjects } from "phaser";
import { getLevel } from "../helpers/levelManager";

/**
 * A stateless UI component that displays a level count using the Roboto font.
 */
export class LevelUI {
  private scene: Scene;
  private text: GameObjects.Text;

  constructor(scene: Scene) {
    this.scene = scene;

    this.text = this.scene.add
      .text(16, 70, "Level: 0", {
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
    this.text.setText("Level: " + getLevel());
  }

  /**
   * Destroys the UI element.
   */
  destroy(): void {
    this.text.destroy();
  }
}
