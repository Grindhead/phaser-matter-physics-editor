import { Scene } from "phaser";
import {
  GAME_STATE,
  SCENES,
  TEXTURE_ATLAS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../lib/constants";
import { Player } from "../entities/Player/Player";
import { EnemyLarge } from "../entities/Enemies/EnemyLarge";
import { Coin } from "../entities/Coin/Coin";
import { Finish } from "../entities/Finish/Finish";
import { isCoinBody } from "../lib/helpers/isCoinBody";
import { isPlayerBody } from "../lib/helpers/isPlayerBody";
import { isFinishBody } from "../lib/helpers/isFinishBody";
import { isEnemyBody } from "../lib/helpers/isEnemyBody";
import { isFallSensorBody } from "../lib/helpers/isFallSensor";
import { isBarrelBody } from "../lib/helpers/isBarrelBody";
import {
  getCoins,
  setCoins,
  resetCoins,
  resetTotalCoinsInLevel,
} from "../lib/helpers/coinManager";
import {
  addLevel,
  getLevel,
  setLevel,
  resetLevel,
} from "../lib/helpers/levelManager";
import { CameraManager } from "../lib/ui/CameraManager";
import { GameStateType } from "../lib/types";
import { Geom } from "phaser";
import { Barrel } from "../entities/Barrel/Barrel";
import { LevelGenerator } from "../lib/level-generation/LevelGenerator";
import { ParallaxManager } from "../lib/parralax/ParallaxManager";

/**
 * Main gameplay scene: responsible for setting up world entities, collisions, UI, and camera.
 */
export class Game extends Scene {
  private player: Player;
  private overlayButton?: Phaser.GameObjects.Image;
  private restartTriggered = false;
  private physicsEnabled = false;
  private gameState: GameStateType = GAME_STATE.WAITING_TO_START;
  private enemies: EnemyLarge[] = [];
  private barrels: Barrel[] = [];
  private cameraManager: CameraManager;
  private levelGenerator: LevelGenerator;
  private parallaxManager: ParallaxManager;
  private totalBarrelsGenerated: number = 0;
  private culledBarrelsCount: number = 0;
  private physicsDebugActive: boolean = false; // Track the state
  private debugGraphics: Phaser.GameObjects.Graphics; // Graphics object for debug drawing
  private initialPhysicsDebugState: boolean = false; // Store state passed via init

  constructor() {
    super(SCENES.GAME);
  }

  /**
   * Scene lifecycle hook. Initializes world, entities, and displays start overlay.
   */
  create(): void {
    this.restartTriggered = false;
    this.parallaxManager = new ParallaxManager(this);
    this.setupWorldBounds();
    this.initGame();
    this.showUIOverlay(GAME_STATE.WAITING_TO_START);

    this.createDebugUI();

    // Check for touch support AND non-desktop OS to identify mobile/tablet (real or emulated)
    const isMobileEnvironment = this.sys.game.device.input.touch;
    if (isMobileEnvironment) {
      this.createMobileControls();
    }
  }

  private createDebugUI(): void {
    if (this.debugGraphics) {
      this.debugGraphics.destroy(); // Destroy previous instance if any
    }
    this.debugGraphics = this.add.graphics().setAlpha(1).setDepth(9999);
    this.matter.world.debugGraphic = this.debugGraphics;

    // Use the initial state received from init()
    this.matter.world.drawDebug = this.initialPhysicsDebugState;
    this.physicsDebugActive = this.initialPhysicsDebugState;
    this.debugGraphics.setVisible(this.initialPhysicsDebugState); // Set visibility accordingly

    // Listen for the event from DebugUIScene
    this.game.events.on("togglePhysicsDebug", this.togglePhysicsDebug, this);

    if (!this.scene.isActive(SCENES.DEBUG_UI)) {
      this.scene.launch(SCENES.DEBUG_UI);
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
  private initGame(): void {
    resetCoins();
    resetTotalCoinsInLevel();
    resetLevel();
    if (getLevel() === 0) {
      setLevel(1);
    }
    this.enemies = [];
    this.barrels = [];

    this.generateLevelEntities();

    this.setupCollisions();
    if (!this.player) {
      throw new Error("Player not created during level generation!");
    }
    this.cameraManager = new CameraManager(this, this.player);
  }

  /**
   * Uses LevelGenerator to create the entities for the current level.
   */
  private generateLevelEntities(): void {
    const currentLevel = getLevel();
    this.levelGenerator = new LevelGenerator(this, currentLevel);
    this.player = this.levelGenerator.generateLevel();
    this.enemies = this.levelGenerator.getEnemies();
    this.barrels = this.levelGenerator.getBarrels();
    // Store the total count
    this.totalBarrelsGenerated = this.barrels.length;

    // Get overall bounds directly from the generator
    const levelBounds = this.levelGenerator.getOverallLevelBounds();
    const {
      minX: minPlatformX,
      maxX: maxPlatformX,
      lowestY: lowestPlatformY,
    } = levelBounds;

    // Calculate actual level width
    const startX = minPlatformX === -Infinity ? 0 : minPlatformX;
    const endX = maxPlatformX === Infinity ? startX : maxPlatformX;
    const levelWidth = Math.max(endX - startX, this.scale.width);

    // Initialize parallax background layers with the calculated level width
    if (this.parallaxManager) {
      this.parallaxManager.initialize(levelWidth);
    }

    const sensorWidth = levelWidth + 1000;
    const sensorCenterX = startX + (endX - startX) / 2;

    // Create the fall sensor using bounds from generator
    this.createFallSensor(lowestPlatformY, sensorCenterX, sensorWidth);
  }

  /**
   * Shows a UI overlay based on the current game state
   *
   * @param state - The game state determining which UI to show
   * @param fadeIn - Whether to fade in the UI (default: true)
   */
  private showUIOverlay(state: GameStateType, fadeIn: boolean = true): void {
    // Clean up any existing overlay
    if (this.overlayButton) {
      this.overlayButton.off("pointerup"); // Explicitly remove the listener
      this.overlayButton.destroy();
      this.overlayButton = undefined;
    }

    // If we're transitioning to PLAYING state, don't show an overlay
    if (state === GAME_STATE.PLAYING) {
      this.gameState = state;
      return;
    }

    // Use fixed screen coordinates instead of camera-relative coordinates
    const centerX = this.game.canvas.width / 2;
    const centerY = this.game.canvas.height / 2;

    let texture: string;
    let callback: () => void;

    switch (state) {
      case GAME_STATE.WAITING_TO_START:
        texture = "ui/start.png";
        callback = () => {
          // Hide the overlay and start the game
          this.overlayButton?.destroy();
          this.overlayButton = undefined;
          this.startGame();
        };
        break;
      case GAME_STATE.GAME_OVER:
        texture = "ui/game-over.png";
        callback = () => {
          if (!this.restartTriggered) this.restartLevel();
        };
        break;
      case GAME_STATE.LEVEL_COMPLETE:
        texture = "ui/start.png"; // Using start.png as requested
        callback = () => {
          if (!this.restartTriggered) this.restartLevel();
        };
        break;
      default:
        return;
    }

    // Create the overlay at fixed screen coordinates
    this.overlayButton = this.add
      .image(centerX, centerY, TEXTURE_ATLAS, texture)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000) // Ensure it's on top of everything
      .setInteractive({ useHandCursor: true });

    if (fadeIn) {
      this.overlayButton.setAlpha(0);
      this.tweens.add({
        targets: this.overlayButton,
        alpha: 1,
        duration: 400,
        ease: "Power2",
      });
    }

    this.overlayButton.on("pointerup", callback);
    this.gameState = state;
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
   * Creates an invisible Matter.js sensor below the level to detect if the player falls off.
   * @param lowestPlatformBottomY The Y coordinate of the bottom edge of the lowest platform.
   * @param centerX The calculated center X coordinate for the sensor.
   * @param width The calculated width for the sensor (level width + padding).
   */
  private createFallSensor(
    lowestPlatformBottomY: number,
    centerX: number,
    width: number
  ): void {
    const sensorHeight = 100; // Increased height to 100px
    const offsetBelowPlatform = 500;
    // Calculate the sensor's center Y position
    const yPosition =
      lowestPlatformBottomY + offsetBelowPlatform + sensorHeight / 2;

    // we set the collision filter to match the platform collision filter
    // so that matterjs recognizes the fall sensor as a platform
    this.matter.add.rectangle(
      centerX, // Use calculated center X
      yPosition,
      width, // Use calculated width
      sensorHeight, // Use updated height
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
   * Configures Matter.js collision handlers for key entities.
   */
  private setupCollisions(): void {
    this.matter.world.on("collisionstart", this.handleCollisionStart);
  }

  private handleCollisionStart = ({
    pairs,
  }: Phaser.Physics.Matter.Events.CollisionStartEvent): void => {
    if (!this.physicsEnabled) return; // Ignore collisions before game starts

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
    const coinSprite = body.gameObject as Coin;
    if (coinSprite) {
      this.levelGenerator.removeCoin(coinSprite); // Remove from generator's list
      coinSprite.collect(); // Play animation and schedule destroy
      setCoins(getCoins() + 1);
    }
  }

  /**
   * Scene lifecycle hook. Called every frame, updates entities and checks game state.
   */
  update(): void {
    this.parallaxManager.update();

    if (!this.physicsEnabled) return;

    // Update main game elements
    this.player.update();

    this.enemies.forEach((enemy) => enemy.update());

    // --- Culling Logic ---
    const cam = this.cameras.main;
    const cullBounds = new Geom.Rectangle(
      cam.worldView.x - 100, // Add buffer
      cam.worldView.y - 100,
      cam.worldView.width + 200,
      cam.worldView.height + 200
    );

    // Initialize culling counters
    let culledCoins = 0;
    let culledEnemies = 0;

    this.levelGenerator.getCoins().forEach((coin: Coin) => {
      const visible = Geom.Rectangle.Overlaps(cullBounds, coin.getBounds());
      coin.setVisible(visible);
      coin.setActive(visible); // Also disable updates if not visible
      if (!visible) {
        culledCoins++;
      }
    });

    this.enemies.forEach((enemy) => {
      const visible = Geom.Rectangle.Overlaps(cullBounds, enemy.getBounds());
      enemy.setVisible(visible);
      enemy.setActive(visible); // Disable physics/updates
      if (!visible) {
        culledEnemies++;
      }
    });

    // Reset culled barrel count each frame
    this.culledBarrelsCount = 0;
    this.barrels.forEach((barrel) => {
      const visible = Geom.Rectangle.Overlaps(cullBounds, barrel.getBounds());
      barrel.setVisible(visible);
      barrel.setActive(visible); // Disable physics/updates
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
      Platforms: this.levelGenerator.getPlatforms().length,
      Enemies: this.enemies.length,
      CulledEnemies: culledEnemies,
      Coins: this.levelGenerator.getCoins().length,
      CulledCoins: culledCoins,
      Crates: this.levelGenerator.getCrates().length,
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
    this.enemies.forEach((enemy) => enemy.handleGameOver());

    this.cameraManager.handleZoomIn();
    this.showUIOverlay(GAME_STATE.GAME_OVER);
  }

  private createMobileControls() {
    const yPos = 800;
    console.log("Creating mobile controls");
    // Left Button
    this.createMobileButton(
      100,
      yPos,
      () => (this.player.leftIsDown = true),
      () => (this.player.leftIsDown = false),
      {
        angle: 0,
      }
    );

    // Right Button
    this.createMobileButton(
      300,
      yPos,
      () => (this.player.rightIsDown = true),
      () => (this.player.rightIsDown = false),
      {
        angle: -180,
      }
    );

    // Jump Button (Bottom Right)
    this.createMobileButton(
      1100,
      yPos,
      () => (this.player.upIsDown = true),
      () => (this.player.upIsDown = false),
      {
        angle: 90, // Point up
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
    if (this.gameState !== GAME_STATE.PLAYING) return;

    this.player.finishLevel();
    addLevel(1);
    this.enemies.forEach((enemy) => enemy.handleGameOver());
    this.cameraManager.handleZoomIn();
    this.showUIOverlay(GAME_STATE.LEVEL_COMPLETE);
  }

  /**
   * Restarts the current level by shutting down and starting the scene again.
   * Also restarts the DebugUIScene if it's running.
   */
  private restartLevel(): void {
    if (this.restartTriggered) return;
    this.restartTriggered = true;
    const currentDebugState = this.physicsDebugActive; // Capture state BEFORE stopping/restarting
    console.log(
      `[Game] Restarting level. Passing debug state: ${currentDebugState}`
    ); // Added log

    // Explicitly remove world collision listeners before restart
    if (this.matter.world) {
      this.matter.world.off("collisionstart", this.handleCollisionStart);
    } else {
      console.warn("[Game] Matter world not found during restart cleanup."); // Added log
    }
    // Also remove the debug toggle listener to prevent duplicates on restart
    this.game.events.off("togglePhysicsDebug", this.togglePhysicsDebug, this);

    // Shut down the DebugUI scene if it's active
    if (this.scene.isActive(SCENES.DEBUG_UI)) {
      console.log("[Game Restart] Stopping Debug UI scene."); // Added log
      this.scene.stop(SCENES.DEBUG_UI);
    }
    // Restart this scene, passing the captured debug state
    this.scene.restart({ physicsDebugWasActive: currentDebugState });
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
    // Reverted to original logic to fix unrelated linter error
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
      // Get the corresponding Barrel sprite
      const barrelSprite = barrelBody.gameObject as Barrel;
      if (
        barrelSprite &&
        !this.player.isInBarrel &&
        this.player.canEnterBarrels
      ) {
        console.log("[Game] Player collided with barrel", barrelSprite);
        this.player.enterBarrel(barrelSprite);
        return true; // Collision handled
      }
    }

    return false; // No relevant collision
  }
}
