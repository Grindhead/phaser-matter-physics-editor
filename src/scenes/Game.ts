import { Scene } from "phaser";
import { PHYSICS, SCENES } from "../lib/constants";
import { Player } from "../entities/Player/Player";
import { Enemy } from "../entities/Enemy/Enemy";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;

  constructor() {
    super(SCENES.GAME);
  }

  create() {
    this.background = this.add.image(
      this.game.canvas.width / 2,
      this.game.canvas.height / 2,
      "background"
    );
    this.background.setOrigin(0.5, 0.5);

    this.createMatterWorld();
  }

  /**
   * Create the matter world
   */

  createMatterWorld() {
    const shapes = this.cache.json.get(PHYSICS);
    this.matter.add.sprite(200, 200, "assets", "crate/crate-big.png", {
      shape: shapes["crate-large"],
    });

    this.matter.add.sprite(220, 200, "assets", "crate/crate-small.png", {
      shape: shapes["crate-small"],
    });

    this.matter.add.sprite(
      220,
      200,
      "assets",
      "finish/finish-idle/finish-idle.png",
      {
        shape: shapes["finish"],
      }
    );

    this.matter.add.sprite(
      280,
      200,
      "assets",
      "coin/coin-idle/coin-idle-0001.png",
      {
        shape: shapes["coin"],
      }
    );

    new Player(this, 100, 200);
    new Enemy(this, 300, 200);
  }

  /**
   *  Handle game over
   */

  handleGameOver() {
    this.scene.start(SCENES.GAME_OVER);
  }
}
