import { Scene } from "phaser";
import { SCENES, TEXTURE_ATLAS } from "../lib/constants";
import { Player } from "../entities/Player/Player";
import { Enemy } from "../entities/Enemy/Enemy";
import { Coin } from "../entities/Coin/Coin";
import { Platform } from "../entities/Platforms/Platform";
import { CrateBig } from "../entities/CrateBig/CrateBig";
import { CrateSmall } from "../entities/CrateSmall/CrateSmall";
import { Finish } from "../entities/Finish/Finish";
import { isCoinBody } from "../lib/helpers/isCoinBody";
import { isPlayerBody } from "../lib/helpers/isPlayerBody";
import { isFinishBody } from "../lib/helpers/isFinishBody";
import { isEnemyBody } from "../lib/helpers/isEnemyBody";

const WORLD_WIDTH = 10000;
const WORLD_HEIGHT = 4000;

/**
 * The main game scene. Handles gameplay logic, world setup,
 * collisions, camera follow, and UI for restarting the level.
 */
export class Game extends Scene {
  private background: Phaser.GameObjects.Image;
  private player: Player;
  private coins: number = 0;
  private gameOverButton?: Phaser.GameObjects.Image;
  private restartTriggered = false;

  constructor() {
    super(SCENES.GAME);
  }

  /**
   * Called once when the scene is created. Sets up the world, physics, camera, and entities.
   */
  create() {
    this.background = this.add.image(
      this.game.canvas.width / 2,
      this.game.canvas.height / 2,
      "background"
    );
    this.background.setOrigin(0.5, 0.5);

    this.matter.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.createMatterWorld();

    this.matter.world.on(
      "collisionstart",
      (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
        this.checkCollisions(event);
      }
    );

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setLerp(0.08, 0.08);

    this.restartTriggered = false;
  }

  /**
   * Handles all collision start events.
   * @param pairs Matter.js collision pairs
   */
  checkCollisions = ({
    pairs,
  }: Phaser.Physics.Matter.Events.CollisionEndEvent): void => {
    for (const { bodyA, bodyB } of pairs) {
      if (
        this.checkCoinCollision(bodyA, bodyB) ||
        this.checkFinishCollision(bodyA, bodyB) ||
        this.checkEnemyCollision(bodyA, bodyB)
      ) {
        return;
      }
    }
  };

  /**
   * Handles player-enemy collisions.
   * @returns True if a collision was handled
   */
  checkEnemyCollision(
    bodyA: MatterJS.BodyType,
    bodyB: MatterJS.BodyType
  ): boolean {
    if (
      (isEnemyBody(bodyA) && isPlayerBody(bodyB)) ||
      (isEnemyBody(bodyB) && isPlayerBody(bodyA))
    ) {
      this.handleGameOver();
      return true;
    }

    return false;
  }

  /**
   * Handles player-finish collisions.
   * @returns True if a collision was handled
   */
  checkFinishCollision(
    bodyA: MatterJS.BodyType,
    bodyB: MatterJS.BodyType
  ): boolean {
    if (isFinishBody(bodyA) && isPlayerBody(bodyB)) {
      const finishSprite = bodyA.gameObject as Finish;
      finishSprite.activate();
      return true;
    }

    if (isFinishBody(bodyB) && isPlayerBody(bodyA)) {
      return true;
    }

    return false;
  }

  /**
   * Handles player-coin collisions.
   * @returns True if a coin was collected
   */
  checkCoinCollision(
    bodyA: MatterJS.BodyType,
    bodyB: MatterJS.BodyType
  ): boolean {
    if (isCoinBody(bodyA) && isPlayerBody(bodyB)) {
      this.collectCoin(bodyA);
      return true;
    }

    if (isCoinBody(bodyB) && isPlayerBody(bodyA)) {
      this.collectCoin(bodyB);
      return true;
    }

    return false;
  }

  /**
   * Increments coin count and plays collection logic.
   * @param body The Matter body associated with the coin
   */
  collectCoin(body: MatterJS.BodyType) {
    const coinSprite = body.gameObject as Coin;

    if (coinSprite) {
      coinSprite.collect();
    }

    this.coins++;
    console.log(this.coins);
  }

  /**
   * Spawns all physics-based objects and the player in the scene.
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
    new Enemy(this, 880, 250);

    this.player = new Player(this, 100, 200);
  }

  /**
   * Called every game tick. Updates the player.
   */
  update(time: number, delta: number): void {
    this.player.update(time, delta);
  }

  /**
   * Triggers game over logic and shows the restart UI centered on the camera.
   */
  /**
   * Triggers game over logic and shows the restart UI centered on the camera's current view.
   */
  handleGameOver() {
    this.player.kill();

    const cam = this.cameras.main;
    const x = cam.scrollX + cam.width / 2;
    const y = cam.scrollY + cam.height / 2;

    this.gameOverButton = this.add
      .image(x, y, TEXTURE_ATLAS, "ui/game-over.png")
      .setOrigin(0.5)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: this.gameOverButton,
      alpha: 1,
      duration: 400,
      ease: "Power2",
    });

    this.gameOverButton.on("pointerup", () => {
      if (!this.restartTriggered) this.restartLevel();
    });
  }

  /**
   * Restarts the level by reloading the current scene.
   */
  restartLevel() {
    this.restartTriggered = true;
    this.scene.restart();
  }
}
