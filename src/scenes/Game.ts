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
import { EnemySmall } from "../entities/Enemies/EnemySmall";
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
import { CrateBig } from "../entities/CrateBig/CrateBig";

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
  private cameraManager: CameraManager;
  private levelGenerator: LevelGenerator;
  private parallaxManager: ParallaxManager;
  private totalBarrelsGenerated: number = 0;
  private culledBarrelsCount: number = 0;
  private physicsDebugActive: boolean = false; // Track the state
  private debugGraphics: Phaser.GameObjects.Graphics; // Graphics object for debug drawing
  private initialPhysicsDebugState: boolean = false; // Store state passed via init
  private restartKeys: Phaser.Input.Keyboard.Key[] = []; // Keys for restarting
  private originalCratePositions: { x: number; y: number; type: string }[] = []; // Store original crate positions

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
    this.startGame(); // Start the game immediately

    this.createDebugUI();

    // Setup keyboard controls for restart
    this.setupRestartKeys();

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
    // Pass the scene, debug graphics object, and current debug state to the generator
    this.levelGenerator = new LevelGenerator(
      this,
      this.debugGraphics,
      this.physicsDebugActive
    );
    this.player = this.levelGenerator.generateLevel();
    this.enemies = this.levelGenerator.getEnemies();
    this.barrels = this.levelGenerator.getBarrels();
    // Store the total count
    this.totalBarrelsGenerated = this.barrels.length;

    // Save the original crate positions for respawning
    this.originalCratePositions = [];
    this.levelGenerator.getCrates().forEach((crate) => {
      this.originalCratePositions.push({
        x: crate.x,
        y: crate.y,
        type: crate instanceof CrateBig ? "big" : "small",
      });
    });

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

    // Create multiple death zones instead of a single one
    this.createDeathZones(levelWidth, startX, endX, lowestPlatformY);
  }

  /**
   * Creates multiple death zone sensors at strategic positions throughout the level.
   *
   * @param levelWidth - The total width of the level
   * @param startX - The starting X coordinate of the level
   * @param endX - The ending X coordinate of the level
   * @param lowestPlatformY - The Y coordinate of the lowest platform
   */
  private createDeathZones(
    levelWidth: number,
    startX: number,
    endX: number,
    lowestPlatformY: number
  ): void {
    // If the level is short, just create one death zone
    if (levelWidth < 2000) {
      this.createFallSensor(
        lowestPlatformY,
        startX + (endX - startX) / 2,
        levelWidth + 1000
      );
      return;
    }

    // For longer levels, create multiple death zones spaced throughout the level
    const segmentWidth = 2000; // Width of each death zone segment
    const overlapMargin = 200; // Ensure some overlap between segments

    const numSegments = Math.ceil(levelWidth / (segmentWidth - overlapMargin));

    for (let i = 0; i < numSegments; i++) {
      const segmentStartX = startX + i * (segmentWidth - overlapMargin);
      const segmentEndX = Math.min(segmentStartX + segmentWidth, endX);
      const segmentCenter = segmentStartX + (segmentEndX - segmentStartX) / 2;
      const currentSegmentWidth = segmentEndX - segmentStartX;

      this.createFallSensor(
        lowestPlatformY,
        segmentCenter,
        currentSegmentWidth
      );
    }
  }

  /**
   * Creates a fall sensor (death zone) at the specified position.
   *
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
    // Check if player hit a fall sensor (death zone)
    if (
      (isFallSensorBody(bodyA) && isPlayerBody(bodyB)) ||
      (isFallSensorBody(bodyB) && isPlayerBody(bodyA))
    ) {
      this.handleGameOver();
      return true;
    }

    // Check if a crate hit a fall sensor (should be destroyed)
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
      // Get the crate game object
      const crateBody = isCrateA ? bodyA : bodyB;
      if (crateBody && crateBody.gameObject) {
        // Remove the crate from the world
        const gameObject = crateBody.gameObject;
        if (gameObject) {
          gameObject.destroy();
        }

        // Remove from the crates array
        const crates = this.levelGenerator.getCrates();
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
    const coinSprite = body.gameObject as Coin;
    if (coinSprite) {
      this.levelGenerator.removeCoin(coinSprite); // Remove from generator's list
      coinSprite.collect(); // Play animation and schedule destroy
      setCoins(getCoins() + 1);

      // Prevent landing animation if coin is collected during landing
      if (this.player instanceof Player) {
        this.player.setRecentCoinCollection();
      }
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

    // Restart immediately without delay
    this.gameState = GAME_STATE.GAME_OVER;
    this.restartLevel();
  }

  private createMobileControls() {
    const yPos = 800;

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

    this.gameState = GAME_STATE.LEVEL_COMPLETE;
    this.player.finishLevel();
    addLevel(1);
    this.enemies.forEach((enemy) => enemy.handleGameOver());
    this.cameraManager.handleZoomIn();

    // Wait for player to complete landing animation before showing continue button
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.showContinueButton();
    });
  }

  /**
   * Shows the continue button after level completion
   */
  private showContinueButton(): void {
    console.log("level complete");

    // Clean up any existing button
    if (this.overlayButton) {
      this.overlayButton.off("pointerup");
      this.overlayButton.destroy();
    }

    // Calculate the position for the button (center of camera view)
    const cam = this.cameras.main;
    const centerX = cam.midPoint.x;
    const centerY = cam.midPoint.y;

    // Create the continue button
    this.overlayButton = this.add
      .image(centerX, centerY, TEXTURE_ATLAS, "ui/direction-button.png")
      .setScale(2)
      .setScrollFactor(0)
      .setInteractive()
      .setDepth(10000);

    // Add text over the button
    const continueText = this.add
      .text(centerX, centerY, "CONTINUE", {
        fontFamily: "Roboto",
        fontSize: "32px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    // Add event handler
    this.overlayButton.on("pointerup", () => {
      // Clean up text when button is clicked
      if (continueText) continueText.destroy();
      this.restartLevel();
    });
  }

  /**
   * Restarts the current level or advances to the next level.
   */
  private restartLevel(): void {
    if (this.restartTriggered) return;
    this.restartTriggered = true;

    // Clean up UI if any exists
    if (this.overlayButton) {
      this.overlayButton.off("pointerup");
      this.overlayButton.destroy();
      this.overlayButton = undefined;
    }

    // Handle level complete case
    if (this.gameState === GAME_STATE.LEVEL_COMPLETE) {
      addLevel(); // Increment level counter
      this.scene.restart({ keepPhysicsDebug: this.physicsDebugActive });
      return;
    }

    // Handle game over case
    if (this.gameState === GAME_STATE.GAME_OVER) {
      // Manually respawn all crates that were destroyed
      this.respawnCrates();
    }

    // Restart the scene, preserving debug state
    this.scene.restart({ keepPhysicsDebug: this.physicsDebugActive });
  }

  /**
   * Recreates all crates at their original positions
   */
  private respawnCrates(): void {
    // Use the LevelGenerator to respawn crates at their original positions
    if (this.levelGenerator && this.originalCratePositions.length > 0) {
      console.log(`Respawning ${this.originalCratePositions.length} crates`);
      this.levelGenerator.respawnCrates(this.originalCratePositions);
    }
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

  /**
   * Sets up keyboard keys to handle game restart
   */
  private setupRestartKeys(): void {
    // Clean up previous keys if any
    this.restartKeys.forEach((key) => key.removeAllListeners());
    this.restartKeys = [];

    // Add Space and Enter keys for restart
    const spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    const enterKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    spaceKey.on("down", () => this.restartLevel());
    enterKey.on("down", () => this.restartLevel());

    // Store keys for cleanup
    this.restartKeys.push(spaceKey, enterKey);
  }

  /**
   * Called when the scene shuts down
   */
  shutdown(): void {
    // Clean up event listeners
    if (this.restartKeys) {
      this.restartKeys.forEach((key) => {
        if (key) key.removeAllListeners();
      });
      this.restartKeys = [];
    }

    if (this.game && this.game.events) {
      this.game.events.off("togglePhysicsDebug", this.togglePhysicsDebug, this);
    }

    // Clean up Matter.js event listeners
    if (this.matter && this.matter.world) {
      this.matter.world.off("collisionstart", this.handleCollisionStart);
    }

    // Clean up any other scene-specific resources
    if (this.overlayButton) {
      this.overlayButton.off("pointerup");
      this.overlayButton.destroy();
      this.overlayButton = undefined;
    }
  }

  /**
   * Scene lifecycle method called when the scene starts
   * @param data - Any data passed from another scene
   */
  init(data: any): void {
    // If restarting after game over and we have original crate positions stored,
    // they will be used in generateLevelEntities when the level is created

    // Initialize physics debug state from passed data
    if (data && data.keepPhysicsDebug !== undefined) {
      this.initialPhysicsDebugState = data.keepPhysicsDebug;
    } else {
      this.initialPhysicsDebugState = false;
    }
  }
}
