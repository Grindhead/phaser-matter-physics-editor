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
import { CoinUI } from "../entities/ui/CoinUI";
import { isFallSensorBody } from "../lib/helpers/isFallSensor";

const WORLD_WIDTH = 10000;
const WORLD_HEIGHT = 4000;

/**
 * Main gameplay scene: responsible for setting up world entities, collisions, UI, and camera.
 */
export class Game extends Scene {
  private background: Phaser.GameObjects.Image;
  private player: Player;
  private coins: number = 0;
  private gameOverButton?: Phaser.GameObjects.Image;
  private startButton?: Phaser.GameObjects.Image;
  private restartTriggered = false;
  private physicsEnabled = false;
  private coinUI: CoinUI;
  private fallDetector?: MatterJS.BodyType;

  constructor() {
    super(SCENES.GAME);
  }

  /**
   * Scene lifecycle hook. Initializes world, entities, and displays start overlay.
   */
  create(): void {
    this.setupBackground();
    this.setupWorldBounds();
    this.initGame();
    this.setupStartUI();
  }

  /**
   * Adds a static background image centered on the screen.
   */
  private setupBackground(): void {
    this.background = this.add.image(
      this.game.canvas.width / 2,
      this.game.canvas.height / 2,
      "background"
    );
    this.background.setOrigin(0.5, 0.5);
  }

  /**
   * Configures world and camera bounds, disables physics initially.
   */
  private setupWorldBounds(): void {
    this.matter.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.matter.world.enabled = false;
  }

  /**
   * Initializes game objects and collision handlers.
   */
  private initGame(): void {
    this.spawnEntities();
    this.setupCollisions();
  }

  /**
   * Creates and displays the start button. Begins the game on interaction.
   */
  private setupStartUI(): void {
    const cam = this.cameras.main;
    const x = cam.width / 2;
    const y = cam.height / 2;

    this.startButton = this.add
      .image(x, y, TEXTURE_ATLAS, "ui/start.png")
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.startButton.once("pointerup", () => {
      this.startButton?.destroy();
      this.startGame();
    });

    this.coinUI = new CoinUI(this);
  }

  /**
   * Enables physics, sets camera follow, and marks the game as running.
   */
  private startGame(): void {
    this.matter.world.enabled = true;
    this.setupCamera();
    this.restartTriggered = false;
    this.physicsEnabled = true;

    this.createFallSensor();
  }

  /**
   * Creates an invisible Matter.js sensor below the level to detect if the player falls off.
   */
  private createFallSensor(): void {
    const sensorHeight = 50;
    const yPosition = 500 + sensorHeight;

    // we set the collision filter to match the platform collision filter
    // so that matterjs recognizes the fall sensor as a platform
    this.fallDetector = this.matter.add.rectangle(
      WORLD_WIDTH / 2,
      yPosition,
      WORLD_WIDTH,
      sensorHeight,
      {
        isSensor: true,
        isStatic: true,
        label: "fallSensor",
        collisionFilter: {
          group: 0,
          category: 16,
          mask: 23,
        },
      }
    );
  }

  /**
   * Spawns all required static and interactive game entities.
   */
  private spawnEntities(): void {
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
   * Sets up the camera to follow the player smoothly.
   */
  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setLerp(0.08, 0.08);
  }

  /**
   * Configures Matter.js collision handlers for key entities.
   */
  private setupCollisions(): void {
    this.matter.world.on(
      "collisionstart",
      (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
        if (this.physicsEnabled) this.checkCollisions(event);
      }
    );
  }

  /**
   * Checks for coin, finish, or enemy collisions on contact.
   *
   * @param event - The collision start event data.
   */
  private checkCollisions = ({
    pairs,
  }: Phaser.Physics.Matter.Events.CollisionStartEvent): void => {
    for (const { bodyA, bodyB } of pairs) {
      if (
        this.checkFallSensorCollision(bodyA, bodyB) ||
        this.checkCoinCollision(bodyA, bodyB) ||
        this.checkFinishCollision(bodyA, bodyB) ||
        this.checkEnemyCollision(bodyA, bodyB)
      ) {
        return;
      }
    }
  };

  /**
   * Detects collision with the fall detector sensor to trigger game over.
   */
  private checkFallSensorCollision(
    bodyA: MatterJS.BodyType,
    bodyB: MatterJS.BodyType
  ): boolean {
    if (
      (isFallSensorBody(bodyA) && isPlayerBody(bodyB)) ||
      (isFallSensorBody(bodyB) && isPlayerBody(bodyA))
    ) {
      console.log("Fall sensor collision");
      this.handleGameOver();
      return true;
    }
    return false;
  }

  /**
   * Handles logic when the player collides with an enemy.
   *
   * @param bodyA - First body in the collision.
   * @param bodyB - Second body in the collision.
   * @returns Whether an enemy collision occurred.
   */
  private checkEnemyCollision(
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
   * Handles logic when the player reaches the finish point.
   *
   * @param bodyA - First body in the collision.
   * @param bodyB - Second body in the collision.
   * @returns Whether a finish collision occurred.
   */
  private checkFinishCollision(
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
   * Handles logic when the player collects a coin.
   *
   * @param bodyA - First body in the collision.
   * @param bodyB - Second body in the collision.
   * @returns Whether a coin collision occurred.
   */
  private checkCoinCollision(
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
   * Collects the given coin and updates the coin count.
   *
   * @param body - The Matter body of the coin to collect.
   */
  private collectCoin(body: MatterJS.BodyType): void {
    const coinSprite = body.gameObject as Coin;
    coinSprite?.collect();
    this.coins++;
    this.coinUI.update(this.coins);
    console.log(this.coins);
  }

  /**
   * Per-frame game update logic.
   *
   * @param time - Current game time.
   * @param delta - Time elapsed since last update.
   */
  update(time: number, delta: number): void {
    if (this.physicsEnabled && this.player) {
      this.player.update(time, delta);
    }
  }

  /**
   * Triggers game over state, displays retry UI, and disables physics.
   */
  private handleGameOver(): void {
    this.player.kill();
    this.physicsEnabled = false;

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
   * Restarts the level by restarting the current scene.
   */
  private restartLevel(): void {
    this.restartTriggered = true;
    this.scene.restart();
  }
}
