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
  private finish?: Finish;
  private player?: Player;

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
  private readonly MIN_PLATFORM_LENGTH_WITH_ENEMY = 14;
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
    console.log(
      `Generating level ${this.levelNumber} with seed ${this.levelNumber}...`
    );

    const params = this.getLevelGenerationParams();
    const numPlatforms = this.prng.nextInt(
      params.minPlatforms,
      params.maxPlatforms + 1
    );

    let currentPos: PlacementPosition = { x: 150, y: 300 };
    let totalCoins = 0;
    let lastPlatform: Platform | null = null;

    this.createPlayerStart(currentPos);

    for (let i = 0; i < numPlatforms; i++) {
      const tryPlaceEnemy = i > 0 && this.prng.next() < params.enemyProbability;

      let minLength = params.minPlatformLength;
      if (tryPlaceEnemy) {
        minLength = Math.max(minLength, this.MIN_PLATFORM_LENGTH_WITH_ENEMY);
      }
      const maxLength = params.maxPlatformLength;
      if (minLength > maxLength) {
        console.warn(
          `Level Generator: Min length (${minLength}) with enemy constraint exceeds max length (${maxLength}). Using max length.`
        );
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
    this.checkCoinCount(totalCoins, params.requiredCoins);

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

    return platform;
  }

  /**
   * Places coins, enemies, and crates on a given platform.
   * Returns the number of coins placed on this platform.
   */
  private populatePlatform(
    platform: Platform,
    params: PlatformGenerationParams,
    enemyPlacedOnThisPlatform: boolean, // Receive enemy placement decision
    isLastPlatform: boolean // Flag for last platform
  ): number {
    const platformBounds = platform.getBounds();
    const platformSurfaceY = platformBounds.top;
    let coinsPlaced = 0;
    let enemyPlaced = false; // Note: enemyPlacedOnThisPlatform param is boolean intent, this tracks actual placement

    // Coins
    const platformWidth = platformBounds.width;
    // Calculate max coins based on minimum spacing (at least MIN_COIN_SPACING between centers,
    // which means segment width W/(N+1) >= MIN_COIN_SPACING -> N <= W/MIN_COIN_SPACING - 1)
    const maxPossibleCoins = Math.max(
      0,
      Math.floor(platformWidth / this.MIN_COIN_SPACING) - 1
    );

    if (maxPossibleCoins > 0) {
      // Only proceed if it's possible to place at least one coin
      const targetNumCoins = this.prng.nextInt(3, 7); // Original target range
      const numCoins = Math.min(targetNumCoins, maxPossibleCoins); // Cap by what fits

      if (numCoins > 0) {
        // Calculate the spacing needed to distribute numCoins evenly across the platform width.
        // This divides the platform into numCoins + 1 segments.
        const evenSpacing = platformWidth / (numCoins + 1);

        // Place the coins using the calculated even spacing
        for (let c = 0; c < numCoins; c++) {
          // Calculate X position based on the start of the platform + spacing * segment index
          const coinX = platformBounds.left + evenSpacing * (c + 1);
          const coinY = platformSurfaceY - this.COIN_HEIGHT / 2;
          this.coins.push(new Coin(this.scene, coinX, coinY));
          coinsPlaced++;
        }
      }
    }

    // Enemy (skip first platform AND last platform)
    if (enemyPlacedOnThisPlatform && !isLastPlatform) {
      const enemyX = this.prng.nextInt(
        platformBounds.left + 40,
        platformBounds.right - 40
      );
      const enemyY = platformSurfaceY - this.ENEMY_HEIGHT / 2;
      this.enemies.push(new Enemy(this.scene, enemyX, enemyY));
      enemyPlaced = true; // Set enemyPlaced flag
    }

    // Crate (skip first platform, only if no enemy)
    if (
      this.platforms.length > 1 &&
      !enemyPlaced &&
      this.prng.next() < params.crateProbability
    ) {
      const crateX = this.prng.nextInt(
        platformBounds.left + 40,
        platformBounds.right - 40
      );
      if (this.prng.next() < 0.5) {
        const crateY = platformSurfaceY - this.CRATE_BIG_HEIGHT / 2;
        this.crates.push(new CrateBig(this.scene, crateX, crateY));
      } else {
        const crateY = platformSurfaceY - this.CRATE_SMALL_HEIGHT / 2;
        this.crates.push(new CrateSmall(this.scene, crateX, crateY));
      }
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
    this.finish = new Finish(this.scene, finishX, finishY);
  }

  /**
   * Logs a warning if the required coin count wasn't met.
   */
  private checkCoinCount(totalCoins: number, requiredCoins: number): void {
    if (totalCoins < requiredCoins) {
      console.warn(
        `Level Generator: Placed ${totalCoins} coins, which is less than the target ${requiredCoins}. Consider adjusting coin placement logic or parameters.`
      );
    }
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
}
