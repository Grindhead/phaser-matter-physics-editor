import { Scene } from "phaser";
import { SCENES } from "../lib/constants";
import { Player } from "../entities/Player/Player";
import { Enemy } from "../entities/Enemy/Enemy";
import { Coin } from "../entities/Coin/Coin";
import { Platform } from "../entities/Platforms/Platform";
import { CrateBig } from "../entities/CrateBig/CrateBig";
import { CrateSmall } from "../entities/CrateSmall/CrateSmall";
import { Finish } from "../entities/Finish/Finish";

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
    new Platform(this, 70, 300, 5, "1");
    new Platform(this, 350, 300, 6, "2");
    new Platform(this, 650, 300, 10, "3");
    new Platform(this, 950, 300, 10, "4");
    new Finish(this, 750, 230);
    new CrateBig(this, 400, 250);
    new CrateSmall(this, 650, 250);
    new Coin(this, 550, 250);
    new Player(this, 100, 200);
    new Enemy(this, 880, 250);
  }

  /**
   *  Handle game over
   */

  handleGameOver() {
    this.scene.start(SCENES.GAME_OVER);
  }
}
