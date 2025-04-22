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

  constructor() {
    super(SCENES.GAME);
  }

  /**
   * Scene lifecycle hook. Initializes world, entities, and displays start overlay.
   */
  create() {
    this.setupBackground();
    this.setupWorldBounds();
    this.initGame(); // preload world + entities
    this.setupStartUI(); // overlay comes after setup
  }

  /**
   * Adds static background image centered on screen.
   */
  private setupBackground() {
    this.background = this.add.image(
      this.game.canvas.width / 2,
      this.game.canvas.height / 2,
      "background"
    );
    this.background.setOrigin(0.5, 0.5);
  }

  /**
   * Sets Matter world and camera bounds.
   */
  private setupWorldBounds() {
    this.matter.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.matter.world.enabled = false; // Disable physics until start
  }

  /**
   * Initializes all game objects.
   */
  private initGame() {
    this.spawnEntities();
    this.setupCollisions();
  }

  /**
   * Displays the start button and enables game logic on interaction.
   */
  private setupStartUI() {
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
  }

  /**
   * Starts game logic, enables physics and camera tracking.
   */
  private startGame() {
    this.matter.world.enabled = true;
    this.setupCamera();
    this.restartTriggered = false;
    this.physicsEnabled = true;
  }

  /**
   * Creates static and interactive objects in the scene.
   */
  private spawnEntities() {
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
   * Enables camera to follow the player.
   */
  private setupCamera() {
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setLerp(0.08, 0.08);
  }

  /**
   * Registers physics collision handlers.
   */
  private setupCollisions() {
    this.matter.world.on(
      "collisionstart",
      (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
        if (this.physicsEnabled) this.checkCollisions(event);
      }
    );
  }

  private checkCollisions = ({
    pairs,
  }: Phaser.Physics.Matter.Events.CollisionStartEvent): void => {
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

  private collectCoin(body: MatterJS.BodyType) {
    const coinSprite = body.gameObject as Coin;
    coinSprite?.collect();
    this.coins++;
    console.log(this.coins);
  }

  update(time: number, delta: number): void {
    if (this.physicsEnabled && this.player) {
      this.player.update(time, delta);
    }
  }

  private handleGameOver() {
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

  private restartLevel() {
    this.restartTriggered = true;
    this.scene.restart();
  }
}
