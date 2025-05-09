import { Scene, Geom } from "phaser";
import {
  GAME_STATE,
  SCENES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  TEXTURE_ATLAS,
  MAX_LEVELS,
} from "../lib/constants";
import { Player } from "../entities/Player/Player";
import { Platform, PlatformInterface } from "../entities/Platforms/Platform";
import { EnemyLarge } from "../entities/Enemies/EnemyLarge";
import { EnemySmall } from "../entities/Enemies/EnemySmall";
import { Crate, CrateInterface } from "../entities/Crate/Crate";
import { Barrel, BarrelInterface } from "../entities/Barrel/Barrel";
import { Finish } from "../entities/Finish/Finish";
import { Coin } from "../entities/Coin/Coin";
import { isCoinBody } from "../lib/helpers/isCoinBody";
import { isPlayerBody } from "../lib/helpers/isPlayerBody";
import { isFinishBody } from "../lib/helpers/isFinishBody";
import { isEnemyBody } from "../lib/helpers/isEnemyBody";
import { isFallSensorBody } from "../lib/helpers/isFallSensor";
import { isBarrelBody } from "../lib/helpers/isBarrelBody";
import {
  addCoins,
  resetCoins,
  resetTotalCoinsInLevel,
} from "../lib/helpers/coinManager";
import { CameraManager } from "../lib/ui/CameraManager";
import { GameStateType, LoadedEntity } from "../lib/types";
import { ParallaxManager } from "../lib/parralax/ParallaxManager";
import { createDeathZones } from "../lib/level-generation/createDeathZones";
import { LevelData } from "../editor/lib/LevelData";
import { EnemyInterface } from "../entities/Enemies/EnemyBase";
import { addLevel, getLevel } from "../lib/helpers/levelManager";

/**
 * Main gameplay scene: responsible for setting up world entities, collisions, UI, and camera.
 */
export class Game extends Scene {
  private player: Player;
  private overlayButton?: Phaser.GameObjects.Image;
  private restartTriggered = false;
  private physicsEnabled = false;
  private gameState: GameStateType = GAME_STATE.WAITING_TO_START;
  private enemies: (EnemyLarge | EnemySmall)[] = [];
  private barrels: Barrel[] = [];
  private crates: Crate[] = [];
  private platforms: Platform[] = [];
  private cameraManager: CameraManager;
  private parallaxManager: ParallaxManager;
  private totalBarrelsGenerated: number = 0;
  private culledBarrelsCount: number = 0;
  private physicsDebugActive: boolean = false;
  private debugGraphics: Phaser.GameObjects.Graphics;
  private initialPhysicsDebugState: boolean = false;
  private restartKeys: Phaser.Input.Keyboard.Key[] = [];
  private originalCratePositions: { x: number; y: number; type: string }[] = [];
  private allCoinsInLevel: Coin[] = [];

  constructor() {
    super(SCENES.GAME);
  }

  private createDebugUI(): void {
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
    }
    this.debugGraphics = this.add.graphics().setAlpha(1).setDepth(9999);
    this.matter.world.debugGraphic = this.debugGraphics;

    this.matter.world.drawDebug = this.initialPhysicsDebugState;
    this.physicsDebugActive = this.initialPhysicsDebugState;
    this.debugGraphics.setVisible(this.initialPhysicsDebugState);

    this.game.events.on("togglePhysicsDebug", this.togglePhysicsDebug, this);

    if (!this.scene.isActive(SCENES.UI_SCENE)) {
      this.scene.launch(SCENES.UI_SCENE);
    }
  }

  /**
   * Configures world and camera bounds, disables physics initially.
   */
  private setupWorldBounds(): void {
    this.matter.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.matter.world.enabled = false;
  }

  /**
   * Initializes game objects and collision handlers using procedural generation.
   */
  private initGame(levelKey: string): void {
    console.log("initGame", levelKey);
    resetCoins();
    resetTotalCoinsInLevel();

    this.platforms = [];
    this.enemies = [];
    this.crates = [];
    this.barrels = [];
    this.originalCratePositions = [];

    this.destroyCurrentEntities(false);

    this.loadLevelEntities(levelKey);

    if (this.cameraManager) {
      this.cameraManager.resetCamera(this.player);
    } else {
      this.cameraManager = new CameraManager(this, this.player);
    }
    this.setupCollisions();

    this.restartTriggered = false;
  }

  private loadLevelEntities(levelKey: string): void {
    const levelData = this.cache.json.get(levelKey) as LevelData;

    let playerStartX: number;
    let playerStartY: number;

    playerStartX = levelData.player!.x;
    playerStartY = levelData.player!.y;
    console.log("playerStartX", playerStartX);
    this.player = new Player(this, playerStartX, playerStartY);
    this.player.setVelocity(0, 0);

    levelData.platforms.forEach((platformData: PlatformInterface) => {
      const platform = new Platform(
        this,
        platformData.x,
        platformData.y,
        platformData.segmentCount,
        platformData.id || `platform-${this.platforms.length}`,
        platformData.isVertical
      );
      this.platforms.push(platform);
    });

    levelData.enemies.forEach((enemyData: EnemyInterface) => {
      let enemy;
      if (enemyData.type === "enemy-large") {
        enemy = new EnemyLarge(this, enemyData.x, enemyData.y);
      } else {
        enemy = new EnemySmall(this, enemyData.x, enemyData.y);
      }
      this.enemies.push(enemy);
    });

    levelData.crates.forEach((crateData: CrateInterface) => {
      const crate = new Crate(this, crateData.x, crateData.y, crateData.type);
      this.crates.push(crate);
      this.originalCratePositions.push({
        x: crateData.x,
        y: crateData.y,
        type: crateData.type,
      });
    });

    levelData.barrels.forEach((barrelData: BarrelInterface) => {
      const barrel = new Barrel(this, barrelData.x, barrelData.y);
      this.barrels.push(barrel);
    });

    if (levelData.finishLine) {
      new Finish(this, levelData.finishLine.x, levelData.finishLine.y);
    }

    if (this.parallaxManager) {
      this.parallaxManager.initialize();
    }

    createDeathZones(this, this.platforms);

    this.respawnCrates();

    console.log(`Level ${levelKey} restarted.`);
  }

  /**
   * Toggles the Matter.js debug rendering graphics on or off.
   */
  private togglePhysicsDebug(): void {
    this.physicsDebugActive = !this.physicsDebugActive;
    this.matter.world.drawDebug = this.physicsDebugActive;
    this.debugGraphics.setVisible(this.physicsDebugActive);
  }

  /**
   * Enables physics, sets camera follow, and marks the game as running.
   */
  private startGame(): void {
    this.gameState = GAME_STATE.PLAYING;
    this.matter.world.enabled = true;
    this.physicsEnabled = true;
  }

  /**
   * Configures Matter.js collision handlers for key entities.
   */
  private setupCollisions(): void {
    this.matter.world.on("collisionstart", this.handleCollisionStart);
  }

  private handleCollisionStart = ({
    pairs,
  }: Phaser.Physics.Matter.Events.CollisionStartEvent): void => {
    if (!this.physicsEnabled) return;

    for (const { bodyA, bodyB } of pairs) {
      if (this.checkFallSensorCollision(bodyA, bodyB)) return;
      if (this.checkEnemyCollision(bodyA, bodyB)) return;
      if (this.checkFinishCollision(bodyA, bodyB)) return;
      if (this.checkCoinCollision(bodyA, bodyB)) return;
      if (this.checkBarrelCollision(bodyA, bodyB)) return;
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
      this.handleGameOver();
      return true;
    }

    const isCrateA =
      bodyA.label &&
      (bodyA.label === "crate-small" || bodyA.label === "crate-big");
    const isCrateB =
      bodyB.label &&
      (bodyB.label === "crate-small" || bodyB.label === "crate-big");

    if (
      (isFallSensorBody(bodyA) && isCrateB) ||
      (isFallSensorBody(bodyB) && isCrateA)
    ) {
      const crateBody = isCrateA ? bodyA : bodyB;
      if (crateBody && crateBody.gameObject) {
        const gameObject = crateBody.gameObject;
        if (gameObject) {
          gameObject.destroy();
        }

        const crates = this.crates;
        if (crates) {
          const crateIndex = crates.findIndex(
            (crate) => crate === crateBody.gameObject
          );
          if (crateIndex >= 0) {
            crates.splice(crateIndex, 1);
          }
        }
      }
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
    if (
      (isFinishBody(bodyA) && isPlayerBody(bodyB)) ||
      (isFinishBody(bodyB) && isPlayerBody(bodyA))
    ) {
      if (isFinishBody(bodyA)) {
        const finishSprite = bodyA.gameObject as Finish;
        finishSprite.activate();
      } else if (isFinishBody(bodyB)) {
        const finishSprite = bodyB.gameObject as Finish;
        finishSprite.activate();
      }

      this.handleLevelComplete();
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
    const coin = body.gameObject as Coin;
    if (coin && coin.active && coin.body) {
      coin.collect();
      addCoins(1);
    }
  }

  /**
   * Scene lifecycle hook. Called every frame, updates entities and checks game state.
   */
  update(): void {
    this.parallaxManager.update();

    if (!this.physicsEnabled) return;

    this.player.update();

    this.enemies.forEach((enemy) => enemy.update());

    const cam = this.cameras.main;
    const cullBounds = new Geom.Rectangle(
      cam.worldView.x - 100,
      cam.worldView.y - 100,
      cam.worldView.width + 200,
      cam.worldView.height + 200
    );

    let culledCoins = 0;
    let culledEnemies = 0;

    this.crates.forEach((crate) => {
      const visible = Geom.Rectangle.Overlaps(cullBounds, crate.getBounds());
      crate.setVisible(visible);
      crate.setActive(visible);
      if (!visible) {
        culledCoins++;
      }
    });

    this.enemies.forEach((enemy) => {
      const visible = Geom.Rectangle.Overlaps(cullBounds, enemy.getBounds());
      enemy.setVisible(visible);
      enemy.setActive(visible);
      if (!visible) {
        culledEnemies++;
      }
    });

    this.culledBarrelsCount = 0;
    this.barrels.forEach((barrel) => {
      const visible = Geom.Rectangle.Overlaps(cullBounds, barrel.getBounds());
      barrel.setVisible(visible);
      barrel.setActive(visible);
      if (!visible) {
        this.culledBarrelsCount++;
      } else {
        barrel.update();
      }
    });

    const debugData = {
      PlayerPos: {
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
      },
      Platforms: this.platforms.length,
      Enemies: this.enemies.length,
      CulledEnemies: culledEnemies,
      Coins: this.crates.length,
      CulledCoins: culledCoins,
      Crates: this.crates.length,
      Barrels: this.totalBarrelsGenerated,
      CulledBarrels: this.culledBarrelsCount,
    };

    this.events.emit("updateDebugData", debugData);
  }

  /**
   * Triggers game over state, displays retry UI, and disables physics.
   */
  private handleGameOver(): void {
    if (this.gameState !== GAME_STATE.PLAYING) return;

    this.player.kill();
    this.physicsEnabled = false;
    this.matter.world.enabled = false;
    this.enemies.forEach((enemy) => enemy.handleGameOver());

    this.cameraManager.handleZoomIn();

    this.gameState = GAME_STATE.GAME_OVER;
    this.time.delayedCall(1500, () => {
      this.restartLevel();
    });
  }

  private createMobileControls() {
    const yPos = 800;

    this.createMobileButton(
      100,
      yPos,
      () => (this.player.leftIsDown = true),
      () => (this.player.leftIsDown = false),
      {
        angle: 0,
      }
    );

    this.createMobileButton(
      300,
      yPos,
      () => (this.player.rightIsDown = true),
      () => (this.player.rightIsDown = false),
      {
        angle: -180,
      }
    );

    this.createMobileButton(
      1100,
      yPos,
      () => (this.player.upIsDown = true),
      () => (this.player.upIsDown = false),
      {
        angle: 90,
      }
    );
  }

  private createMobileButton(
    x: number,
    y: number,
    onDown: () => void,
    onUp: () => void,
    { angle }: { angle: number }
  ): Phaser.GameObjects.Image {
    const button = this.add
      .image(x, y, TEXTURE_ATLAS, "ui/direction-button.png")
      .setScrollFactor(1)
      .setInteractive()
      .setAngle(angle)
      .setDepth(10000);

    button.on("pointerdown", () => {
      onDown();
    });
    button.on("pointerup", () => {
      onUp();
    });

    return button;
  }

  /**
   * Triggers level complete state, displays UI, and disables physics.
   */
  private handleLevelComplete(): void {
    this.gameState = GAME_STATE.LEVEL_COMPLETE;

    if (this.player) {
      this.player.finishLevel();
    }

    if (getLevel() < MAX_LEVELS) {
      addLevel();
    }

    this.events.emit("showContinueButton");

    console.log("Level Complete!");
  }

  /**
   * Restarts the current level or advances to the next level.
   */
  public restartLevel(): void {
    if (this.restartTriggered) return;
    this.restartTriggered = true;
    this.scene.stop(SCENES.GAME);
    this.scene.start(SCENES.GAME);
  }

  private respawnCrates(): void {
    this.crates.forEach((crate) => crate.destroy());
    this.crates = [];

    this.originalCratePositions.forEach((pos) => {
      const crateType = pos.type as "small" | "big";
      this.crates.push(new Crate(this, pos.x, pos.y, crateType));
    });
  }

  private destroyCurrentEntities(isFullShutdown: boolean): void {
    if (this.player && isFullShutdown) {
      this.player.destroy();
    }

    this.platforms.forEach((p) => p.destroy());
    this.platforms = [];
    this.enemies.forEach((e) => e.destroy());
    this.enemies = [];
    this.crates.forEach((c) => c.destroy());
    this.crates = [];
    this.barrels.forEach((b) => b.destroy());
    this.barrels = [];
    this.allCoinsInLevel.forEach((c) => c.destroy());
    this.allCoinsInLevel = [];

    this.children.list
      .filter((child) => child instanceof Finish)
      .forEach((child) => child.destroy());

    resetCoins();
    resetTotalCoinsInLevel();

    this.originalCratePositions = [];
  }

  /**
   * Checks for collisions between the Player and a Barrel.
   *
   * @param bodyA - The first body in the collision pair.
   * @param bodyB - The second body in the collision pair.
   * @returns True if a player-barrel collision was handled, false otherwise.
   */
  private checkBarrelCollision(
    bodyA: MatterJS.BodyType,
    bodyB: MatterJS.BodyType
  ): boolean {
    let playerBody: MatterJS.BodyType | null = null;
    let barrelBody: MatterJS.BodyType | null = null;

    if (isPlayerBody(bodyA) && isBarrelBody(bodyB)) {
      playerBody = bodyA;
      barrelBody = bodyB;
    } else if (isPlayerBody(bodyB) && isBarrelBody(bodyA)) {
      playerBody = bodyB;
      barrelBody = bodyA;
    }

    if (playerBody && barrelBody) {
      const barrelSprite = barrelBody.gameObject as Barrel;
      if (
        barrelSprite &&
        !this.player.isInBarrel &&
        this.player.canEnterBarrels
      ) {
        console.log("[Game] Player collided with barrel", barrelSprite);
        this.player.enterBarrel(barrelSprite);
        return true;
      }
    }

    return false;
  }

  /**
   * Sets up keyboard keys to handle game restart
   */
  private setupRestartKeys(): void {
    this.restartKeys.forEach((key) => key.removeAllListeners());
    this.restartKeys = [];

    const spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    const enterKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    spaceKey.on("down", () => this.restartLevel());
    enterKey.on("down", () => this.restartLevel());

    this.restartKeys.push(spaceKey, enterKey);
  }

  /**
   * Called when the scene shuts down
   */
  shutdown(): void {
    console.log("Game scene shutting down...");
    this.game.events.off("togglePhysicsDebug", this.togglePhysicsDebug, this);

    if (this.parallaxManager) {
      this.parallaxManager.destroy();
    }

    this.destroyCurrentEntities(true);

    if (this.player && this.player.scene) {
      this.player.destroy();
    }

    this.restartKeys.forEach((key) => key.destroy());
    this.restartKeys = [];

    if (this.debugGraphics) {
      this.debugGraphics.destroy();
    }

    if (this.overlayButton) {
      this.overlayButton.destroy();
      this.overlayButton = undefined;
    }

    if (this.matter.world) {
      this.matter.world.off("collisionstart", this.handleCollisionStart);
    }

    this.registry.remove("currentLevelKey");
    this.registry.remove("score");

    this.gameState = GAME_STATE.WAITING_TO_START;
    this.physicsEnabled = false;
    this.restartTriggered = false;

    console.log("Game scene shutdown complete.");
  }

  /**
   * Scene lifecycle method called when the scene starts
   * @param data - Any data passed from another scene
   */
  init(): void {
    this.restartTriggered = false;
    this.parallaxManager = new ParallaxManager(this);
    this.setupWorldBounds();

    const levelKeyToLoad = "level-" + getLevel();

    this.initGame(levelKeyToLoad);
    this.startGame();
    this.createDebugUI();
    this.setupRestartKeys();
    if (this.sys.game.device.input.touch) {
      this.createMobileControls();
    }
  }
}
