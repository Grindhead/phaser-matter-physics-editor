import { Scene } from "phaser";
import { Player } from "../entities/Player/Player";
import { Enemy } from "../entities/Enemy/Enemy";
import { Coin } from "../entities/Coin/Coin";
import { Platform } from "../entities/Platforms/Platform";
import { CrateBig } from "../entities/CrateBig/CrateBig";
import { CrateSmall } from "../entities/CrateSmall/CrateSmall";
import { Finish } from "../entities/Finish/Finish";
import { WORLD_HEIGHT, WORLD_WIDTH } from "./constants";

// Simple Pseudo-Random Number Generator (PRNG) using Mulberry32 algorithm
// Provides deterministic random numbers based on an initial seed.
class SimplePRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Generates the next pseudo-random number (float between 0 and 1)
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Generates a pseudo-random integer between min (inclusive) and max (exclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min) + min);
  }

  // Returns a random element from an array
  choice<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length)];
  }
}

interface PlatformGenerationParams {
  minPlatforms: number;
  maxPlatforms: number;
  minPlatformLength: number;
  maxPlatformLength: number;
  minHorizontalGap: number;
  maxHorizontalGap: number;
  minVerticalGap: number;
  maxVerticalGap: number;
  enemyProbability: number;
  crateProbability: number;
  requiredCoins: number;
}

interface PlacementPosition {
  x: number;
  y: number;
}

/**
 * Handles procedural generation of game levels.
 */
export class LevelGenerator {
  private scene: Scene;
  private levelNumber: number;
  private prng: SimplePRNG;
  private platforms: Platform[] = [];
  private coins: Coin[] = [];
  private enemies: Enemy[] = [];
  private crates: (CrateBig | CrateSmall)[] = [];
  private player?: Player;

  // Calculated bounds after generation
  private levelMinX: number = 0;
  private levelMaxX: number = 0;
  private levelLowestY: number = 0;

  // --- Configuration (Defaults & Constants) ---
  // Estimated player jump capabilities (tune these based on actual player physics)
  private readonly MAX_JUMP_DISTANCE_X = 200; // Max horizontal pixels player can jump
  private readonly MAX_JUMP_HEIGHT_UP = 120; // Max vertical pixels player can jump upwards
  private readonly MAX_FALL_HEIGHT = 400; // Max safe falling distance (downward vertical gap)

  // Entity heights for placement (adjust if assets change)
  private readonly COIN_HEIGHT = 28;
  private readonly ENEMY_HEIGHT = 40;
  private readonly CRATE_SMALL_HEIGHT = 32;
  private readonly CRATE_BIG_HEIGHT = 64;
  private readonly PLATFORM_DISPLAY_HEIGHT = 32;
  private readonly MIN_PLATFORM_LENGTH_WITH_ENEMY = 16;
  // --- New Constant for Coin Spacing ---
  private readonly MIN_COIN_SPACING = 64; // Min horizontal pixels between coin centers (Increased from 32)

  constructor(scene: Scene, levelNumber: number) {
    this.scene = scene;
    this.levelNumber = levelNumber;
    this.prng = new SimplePRNG(this.levelNumber);
  }

  /**
   * Generates the entire level layout including platforms, entities, and player start/finish.
   * Returns the created Player instance.
   */
  generateLevel(): Player {
    const params = this.getLevelGenerationParams();
    const numPlatforms = this.prng.nextInt(
      params.minPlatforms,
      params.maxPlatforms + 1
    );

    let currentPos: PlacementPosition = { x: 150, y: 300 };
    let totalCoins = 0;
    let lastPlatform: Platform | null = null;

    this.platforms = []; // Clear previous generation
    this.enemies = [];
    this.coins = [];
    this.crates = [];

    this.player = undefined;

    this.createPlayerStart(currentPos);

    for (let i = 0; i < numPlatforms; i++) {
      const tryPlaceEnemy = i > 0 && this.prng.next() < params.enemyProbability;

      let minLength = params.minPlatformLength;
      if (tryPlaceEnemy) {
        minLength = Math.max(minLength, this.MIN_PLATFORM_LENGTH_WITH_ENEMY);
      }
      const maxLength = params.maxPlatformLength;
      if (minLength > maxLength) {
        minLength = maxLength;
      }

      const platformLength = this.prng.nextInt(minLength, maxLength + 1);

      currentPos = this.calculateNextPlatformPosition(
        currentPos,
        platformLength,
        lastPlatform,
        params
      );
      const platform = this.createPlatform(currentPos, platformLength, i);

      // Determine if this is the last platform before populating
      const isLastPlatform = i === numPlatforms - 1;
      totalCoins += this.populatePlatform(
        platform,
        params,
        tryPlaceEnemy,
        isLastPlatform
      );

      lastPlatform = platform; // Store reference to the last created platform
    }

    this.createFinishPoint(lastPlatform);
    this.calculateOverallBounds(); // Calculate bounds after all platforms exist

    console.log(
      `Level generated with ${this.platforms.length} platforms, ${this.enemies.length} enemies, ${this.crates.length} crates, ${totalCoins} coins.`
    );

    if (!this.player) {
      throw new Error("Level Generator: Player was not created!");
    }
    return this.player;
  }

  /**
   * Calculates parameters for level generation based on the level number.
   */
  private getLevelGenerationParams(): PlatformGenerationParams {
    const minPlatforms = 10 + this.levelNumber;
    const maxPlatforms = 15 + this.levelNumber;
    const requiredCoins = 100;

    return {
      minPlatforms,
      maxPlatforms,
      minPlatformLength: 4,
      maxPlatformLength: 12,
      minHorizontalGap: 60,
      maxHorizontalGap: this.MAX_JUMP_DISTANCE_X - 20, // Ensure max gap is jumpable
      minVerticalGap: -this.MAX_JUMP_HEIGHT_UP, // Max upward jump
      maxVerticalGap: this.MAX_FALL_HEIGHT, // Max downward jump/fall
      enemyProbability: 0.2 + Math.min(0.3, this.levelNumber * 0.02),
      crateProbability: 0.15 + Math.min(0.2, this.levelNumber * 0.01),
      requiredCoins,
    };
  }

  /**
   * Creates the player at the starting position.
   */
  private createPlayerStart(startPos: PlacementPosition): void {
    this.player = new Player(
      this.scene,
      startPos.x - 50,
      startPos.y - 50 - this.PLATFORM_DISPLAY_HEIGHT / 2
    );
  }

  /**
   * Calculates the position for the next platform, ensuring solvability.
   */
  private calculateNextPlatformPosition(
    currentPos: PlacementPosition,
    platformLength: number,
    lastPlatform: Platform | null,
    params: PlatformGenerationParams
  ): PlacementPosition {
    let nextX = currentPos.x;
    let nextY = currentPos.y;
    const estimatedHalfWidth = (platformLength * 16) / 2; // Use segment width (16px)

    if (lastPlatform) {
      const lastPlatformBounds = lastPlatform.getBounds();
      let horizontalGap = this.prng.nextInt(
        params.minHorizontalGap,
        params.maxHorizontalGap + 1
      );
      let verticalGap = this.prng.nextInt(
        params.minVerticalGap,
        params.maxVerticalGap + 1
      );

      // Basic Solvability Adjustment (Clamp gaps to player jump limits)
      horizontalGap = Math.min(horizontalGap, this.MAX_JUMP_DISTANCE_X); // Ensure horizontal gap is jumpable
      if (verticalGap < 0) {
        // Jumping upwards
        verticalGap = Math.max(verticalGap, -this.MAX_JUMP_HEIGHT_UP);
      }

      nextX = lastPlatformBounds.right + horizontalGap + estimatedHalfWidth;
      nextY = lastPlatform.y + verticalGap; // Calculate Y relative to the last platform's center
    }

    return { x: nextX, y: nextY };
  }

  /**
   * Creates a single platform instance.
   */
  private createPlatform(
    pos: PlacementPosition,
    length: number,
    index: number
  ): Platform {
    const platform = new Platform(
      this.scene,
      pos.x,
      pos.y,
      length,
      `p-${index}`
    );
    this.platforms.push(platform);

    // Log platform creation details
    const bounds = platform.getBounds();
    console.log(
      `Created platform ${index}: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(
        2
      )}, length=${length}, bottomY=${bounds.bottom.toFixed(2)}`
    );

    return platform;
  }

  /**
   * Places coins, enemies, and crates on a given platform.
   * Returns the number of coins placed on this platform.
   */
  private populatePlatform(
    platform: Platform,
    params: PlatformGenerationParams,
    enemyPlacementIntent: boolean, // Renamed for clarity
    isLastPlatform: boolean
  ): number {
    const bounds = platform.getBounds();
    const platformWidth = bounds.width;
    const platformTopY = bounds.top;
    let coinsPlaced = 0;
    let enemyWasActuallyPlaced = false; // Track if enemy spawn succeeded

    // --- Enemy Placement ---
    // Only place enemies if intent is true AND it's not the last platform
    if (enemyPlacementIntent && !isLastPlatform) {
      const enemyX = platform.x; // Center of the platform
      const enemyY = platformTopY - this.ENEMY_HEIGHT / 2;
      const enemy = new Enemy(this.scene, enemyX, enemyY);
      this.enemies.push(enemy);
      enemyWasActuallyPlaced = true;
    }

    // --- Coin Placement (Refined) ---
    const maxCoinsPossible = Math.floor(platformWidth / this.MIN_COIN_SPACING);
    if (maxCoinsPossible > 0) {
      const targetCoins = this.prng.nextInt(1, maxCoinsPossible + 1); // Min 1 coin if space allows
      const numCoins = Math.max(1, targetCoins); // Ensure at least 1 if possible
      const evenSpacing = platformWidth / (numCoins + 1);

      for (let j = 0; j < numCoins; j++) {
        const coinX = bounds.left + evenSpacing * (j + 1);
        const coinY = platformTopY - this.COIN_HEIGHT / 2;
        const coin = new Coin(this.scene, coinX, coinY);
        this.coins.push(coin); // Add to tracked coins
        coinsPlaced++;
      }
    }

    // --- Crate Placement ---
    // Only place crates if NO enemy was placed on this platform
    if (!enemyWasActuallyPlaced && this.prng.next() < params.crateProbability) {
      const crateX = this.prng.nextInt(bounds.left + 32, bounds.right - 32);
      let crate: CrateBig | CrateSmall;
      if (this.prng.next() < 0.5) {
        crate = new CrateSmall(
          this.scene,
          crateX,
          platformTopY - this.CRATE_SMALL_HEIGHT / 2
        );
      } else {
        crate = new CrateBig(
          this.scene,
          crateX,
          platformTopY - this.CRATE_BIG_HEIGHT / 2
        );
      }
      this.crates.push(crate); // Add to tracked crates
    }

    return coinsPlaced;
  }

  /**
   * Creates the finish point on the last platform.
   */
  private createFinishPoint(lastPlatform: Platform | null): void {
    if (!lastPlatform) return;
    const lastPlatformBounds = lastPlatform.getBounds();
    // Place finish X at the right edge of the last platform
    const finishX = lastPlatformBounds.right - 16;
    // Place finish Y 100px above the top surface of the last platform
    const finishY = lastPlatformBounds.top - 60; // Increased from 50
    new Finish(this.scene, finishX, finishY);
  }

  /**
   * Calculates and stores the overall min/max X and lowest Y bounds of all platforms.
   * Should be called after all platforms have been generated.
   */
  private calculateOverallBounds(): void {
    if (this.platforms.length === 0) {
      this.levelMinX = 0;
      this.levelMaxX = 1000; // Default if no platforms
      this.levelLowestY = WORLD_HEIGHT - 100; // Default Y
      console.warn(
        "LevelGenerator: No platforms generated, using default bounds."
      );
      return;
    }

    // Initialize with the first platform's bounds
    const firstBounds = this.platforms[0].getBounds();
    this.levelMinX = firstBounds.left;
    this.levelMaxX = firstBounds.right;
    this.levelLowestY = firstBounds.bottom;

    // Loop through the rest to find true min/max/lowest
    for (let i = 1; i < this.platforms.length; i++) {
      const bounds = this.platforms[i].getBounds();
      this.levelMinX = Math.min(this.levelMinX, bounds.left);
      this.levelMaxX = Math.max(this.levelMaxX, bounds.right);
      this.levelLowestY = Math.max(this.levelLowestY, bounds.bottom); // Max Y is lowest point
    }

    console.log(
      `Calculated Overall Bounds: minX=${this.levelMinX.toFixed(
        2
      )}, maxX=${this.levelMaxX.toFixed(
        2
      )}, lowestY=${this.levelLowestY.toFixed(2)}`
    );
  }

  /**
   * Returns the list of generated enemies.
   */
  getEnemies(): Enemy[] {
    return this.enemies;
  }

  /**
   * Returns the array of generated platforms.
   */
  getPlatforms(): Platform[] {
    return this.platforms;
  }

  /**
   * Returns the array of generated Coin instances.
   */
  getCoins(): Coin[] {
    return this.coins;
  }

  /**
   * Returns the array of generated Crate instances.
   */
  getCrates(): (CrateBig | CrateSmall)[] {
    return this.crates;
  }

  /**
   * Returns the calculated overall bounds of the generated level.
   * Call this *after* generateLevel().
   */
  getOverallLevelBounds(): { minX: number; maxX: number; lowestY: number } {
    return {
      minX: this.levelMinX,
      maxX: this.levelMaxX,
      lowestY: this.levelLowestY,
    };
  }
}
