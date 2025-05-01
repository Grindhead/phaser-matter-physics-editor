import { Scene } from "phaser";

// Import the item placement helpers
import {
  populatePlatformWithCoins,
  placeItemsOnPlatforms,
} from "./itemPlacementHelper";
import { Platform } from "../../entities/Platforms/Platform";
import { Coin } from "../../entities/Coin/Coin";
import { EnemyLarge } from "../../entities/Enemies/EnemyLarge";
import { CrateBig } from "../../entities/CrateBig/CrateBig";
import { CrateSmall } from "../../entities/CrateSmall/CrateSmall";
import { Barrel } from "../../entities/Barrel/Barrel";
import { Player } from "../../entities/Player/Player";
import {
  BARREL_HEIGHT,
  BARREL_WIDTH,
  LevelGenerationParams,
  MAX_FALL_HEIGHT,
  MAX_JUMP_DISTANCE_X,
  MAX_JUMP_HEIGHT_UP,
  MIN_ABS_VERTICAL_GAP,
  PLATFORM_SEGMENT_WIDTH,
} from "./LevelGenerationConfig";
import { WORLD_HEIGHT } from "../constants";
import { setTotalCoinsInLevel } from "../helpers/coinManager";
import { Finish } from "../../entities/Finish/Finish";
import { EnemySmall } from "../../entities/Enemies/EnemySmall";
import { getLevel } from "../helpers/levelManager";

// Simple Pseudo-Random Number Generator (PRNG) using Mulberry32 algorithm
// Provides deterministic random numbers based on an initial seed.
export class SimplePRNG {
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
  barrelProbability: number;
  requiredCoins: number;
  targetEnemies: number;
  targetCrates: number;
  targetBarrels: number;
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
  private enemies: (EnemyLarge | EnemySmall)[] = [];
  private crates: (CrateBig | CrateSmall)[] = [];
  private barrels: Barrel[] = [];
  private player: Player;

  // Calculated bounds after generation
  private levelMinX: number = 0;
  private levelMaxX: number = 0;
  private levelLowestY: number = 0;

  // --- Keep PLATFORM_DISPLAY_HEIGHT if still used directly for player offset
  private readonly PLATFORM_DISPLAY_HEIGHT = 32; // Or import if moved

  private bridgeBarrelRanges: { start: number; end: number }[] = []; // Track bridge barrel horizontal ranges

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Generates the entire level layout including platforms, entities, and player start/finish.
   * Returns the created Player instance.
   */
  generateLevel(): Player {
    this.levelNumber = getLevel();

    this.prng = new SimplePRNG(this.levelNumber);
    const params = LevelGenerator.calculateLevelGenerationParams(
      this.levelNumber
    );
    const numPlatforms = this.prng.nextInt(
      params.minPlatforms,
      params.maxPlatforms + 1
    );

    let currentPlatformX = 180; // Use separate X and Y tracking
    let currentPlatformY = 300;
    let totalCoins = 0;
    let lastPlatform: Platform | null = null;
    const itemPlacementPlatforms: Platform[] = [];

    this.platforms = [];
    this.enemies = [];
    this.coins = [];
    this.crates = [];
    this.barrels = [];
    this.bridgeBarrelRanges = []; // Reset for new level

    // Create player relative to initial platform position
    this.createPlayerStart({ x: currentPlatformX, y: currentPlatformY });

    // Create the starting platform explicitly
    const startPlatformLength = this.prng.nextInt(
      params.minPlatformLength,
      params.maxPlatformLength + 1
    );
    const startPlatform = this.createPlatform(
      { x: currentPlatformX, y: currentPlatformY },
      startPlatformLength,
      0
    );
    lastPlatform = startPlatform;
    // Don't add start platform to item placement list

    // Loop to generate the remaining platforms (or barrels)
    // Need numPlatforms - 1 because we created the start platform already
    for (let i = 1; i < numPlatforms; i++) {
      let platformLength = this.prng.nextInt(
        params.minPlatformLength,
        params.maxPlatformLength + 1
      );

      // Calculate potential position and gaps for the *next* platform
      const { nextX, nextY, dX } = this.calculateNextPlatformPosition(
        { x: currentPlatformX, y: currentPlatformY },
        platformLength,
        lastPlatform,
        params
      );

      let placeBridgeBarrel = false;
      let barrelX = 0;
      let barrelY = 0;
      let newBarrelRange: { start: number; end: number } | null = null;

      // --- Barrel Substitution Logic --- START
      // Only consider placing a bridge barrel if it's NOT the very last segment before the finish
      if (dX > params.maxHorizontalGap && i < numPlatforms - 1) {
        barrelX = lastPlatform.getBounds().right + dX / 2;
        newBarrelRange = {
          start: barrelX - BARREL_WIDTH / 2,
          end: barrelX + BARREL_WIDTH / 2,
        };

        let overlaps = false;
        for (const range of this.bridgeBarrelRanges) {
          // Use this.bridgeBarrelRanges
          if (
            newBarrelRange.start < range.end &&
            newBarrelRange.end > range.start
          ) {
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          // Calculate Y only if placing
          const barrelPlaceYOffset = 10;
          barrelY =
            lastPlatform.getBounds().top +
            BARREL_HEIGHT / 2 +
            barrelPlaceYOffset;
          barrelY = Math.min(barrelY, WORLD_HEIGHT - BARREL_HEIGHT / 2 - 2);

          placeBridgeBarrel = true;
        } else {
          console.warn(
            `  Overlap detected for bridge barrel at X=${barrelX.toFixed(
              0
            )}. Placing platform instead.`
          );
        }
      }

      // --- Placement Decision ---
      if (placeBridgeBarrel) {
        console.log(
          `Impossible gap detected (dX=${dX.toFixed(0)} > maxJump=${
            params.maxHorizontalGap
          }). Placing barrel.`
        );
        const bridgeBarrel = new Barrel(this.scene, barrelX, barrelY);
        this.barrels.push(bridgeBarrel);
        this.bridgeBarrelRanges.push(newBarrelRange!); // Add range to tracker

        // Adjust position for NEXT iteration
        currentPlatformX =
          barrelX +
          this.prng.nextInt(
            params.minHorizontalGap,
            params.maxHorizontalGap + 1
          );

        // Keep lastPlatform pointing to the platform *before* the barrel for next Y calculation
        // currentPlatformY is not updated here, will be recalculated next iteration relative to lastPlatform
      } else {
        // --- Normal Platform Placement (or fallback from overlapping barrel) ---
        // Check if this is the last platform
        const isLastPlatform = i === numPlatforms - 1;

        const platform = this.createPlatform(
          { x: nextX, y: nextY },
          platformLength,
          isLastPlatform ? -1 : i // Use -1 as a special index for the end platform
        );
        itemPlacementPlatforms.push(platform); // Add eligible platforms for items
        lastPlatform = platform;
        currentPlatformX = nextX; // Update position based on the newly placed platform
        currentPlatformY = nextY;
      }
    }

    // --- Post-Generation Item Placement ---
    // Create the finish point after the last platform/barrel logic
    this.createFinishPoint(lastPlatform);

    // Exclude first two platforms from item placement ONLY on level 1
    let finalItemPlacementPlatforms = [...itemPlacementPlatforms]; // Copy the list
    if (this.levelNumber === 1 && this.platforms.length >= 3) {
      // platforms[0] is the start platform (already excluded)
      // platforms[1] is the first platform after start
      // platforms[2] is the second platform after start
      const firstEligible = this.platforms[1];
      const secondEligible = this.platforms[2];
      finalItemPlacementPlatforms = finalItemPlacementPlatforms.filter(
        (p) => p !== firstEligible && p !== secondEligible
      );
      console.log(
        `Level 1: Excluding platforms at (${firstEligible?.x.toFixed(
          0
        )}, ${firstEligible?.y.toFixed(0)}) and (${secondEligible?.x.toFixed(
          0
        )}, ${secondEligible?.y.toFixed(0)}) from item placement.`
      );
    }

    // Place Enemies, Crates using the helper
    // Pass the potentially filtered list and the class member arrays
    placeItemsOnPlatforms(
      this.scene,
      finalItemPlacementPlatforms, // Use the filtered list
      this.prng,
      params,
      this.levelNumber,
      this.enemies, // Pass class member array
      this.crates // Pass class member array
    );

    this.platforms.forEach((platform) => {
      totalCoins += populatePlatformWithCoins(
        this.scene,
        platform,
        this.prng,
        this.coins
      );
    });

    this.calculateOverallBounds(); // Calculate bounds after all platforms exist

    setTotalCoinsInLevel(totalCoins); // Set the total coins for the level

    return this.player;
  }

  /**
   * Calculates parameters for level generation based on the level number.
   * Moved to a static method.
   */
  private static calculateLevelGenerationParams(
    levelNumber: number
  ): LevelGenerationParams {
    const minPlatforms = 10 + levelNumber;
    const maxPlatforms = 15 + levelNumber;
    const requiredCoins = 100;
    const enemyProbability = 0.3 + Math.min(0.3, levelNumber * 0.02);
    const crateProbability = 0.25 + Math.min(0.2, levelNumber * 0.01);
    const barrelProbability = 0.15 + Math.min(0.1, levelNumber * 0.01);

    const avgPlatformsForTargets = (minPlatforms + maxPlatforms) / 2;
    const targetEnemies = Math.floor(avgPlatformsForTargets * enemyProbability);
    const targetCrates = Math.floor(avgPlatformsForTargets * crateProbability);
    let targetBarrels = Math.floor(avgPlatformsForTargets * barrelProbability);

    // --- Ensure at least one barrel is targeted ---
    targetBarrels = Math.max(1, targetBarrels);

    // --- Calculate Minimum Required Platforms --- START
    const minimumEligiblePlatformsNeeded =
      targetEnemies + targetCrates + targetBarrels;
    // Add 2 for the mandatory start and end platforms which are ineligible for items
    const minimumTotalPlatformsNeeded = minimumEligiblePlatformsNeeded + 2;

    // Determine the final minimum platform count
    const finalMinPlatforms = Math.max(
      minPlatforms, // The original level-based minimum
      minimumTotalPlatformsNeeded // The item-based minimum
    );

    // Ensure maxPlatforms is at least the new minPlatforms
    const finalMaxPlatforms = Math.max(finalMinPlatforms, maxPlatforms);
    // --- Calculate Minimum Required Platforms --- END

    return {
      minPlatforms: finalMinPlatforms, // Use calculated final minimum
      maxPlatforms: finalMaxPlatforms, // Use calculated final maximum
      minPlatformLength: 4,
      maxPlatformLength: 12,
      minHorizontalGap: 120,
      maxHorizontalGap: MAX_JUMP_DISTANCE_X, // Use imported constant
      minVerticalGap: -MAX_JUMP_HEIGHT_UP, // Use imported constant
      maxVerticalGap: MAX_FALL_HEIGHT, // Use imported constant
      enemyProbability,
      crateProbability,
      barrelProbability,
      requiredCoins,
      targetEnemies,
      targetCrates,
      targetBarrels,
    };
  }

  /**
   * Creates the player at the starting position.
   */
  private createPlayerStart(startPos: PlacementPosition): void {
    this.player = new Player(
      this.scene,
      startPos.x,
      startPos.y - 50 - this.PLATFORM_DISPLAY_HEIGHT / 2 // Still using local/imported constant
    );
  }

  /**
   * Calculates the position for the next platform, ensuring solvability.
   */
  private calculateNextPlatformPosition(
    currentPos: PlacementPosition, // Represents the center of the platform being calculated
    platformLength: number,
    lastPlatform: Platform | null, // The platform we are generating *from*
    params: PlatformGenerationParams
  ): { nextX: number; nextY: number; dX: number; dY: number } {
    let currentX = currentPos.x;
    let currentY = currentPos.y;
    let dX = 0;
    let dY = 0;

    if (lastPlatform) {
      const lastPlatformBounds = lastPlatform.getBounds();
      const estimatedHalfWidth = (platformLength * PLATFORM_SEGMENT_WIDTH) / 2;

      // Generate the HORIZONTAL gap first (edge to edge)
      // Allow generating gaps potentially larger than maxHorizontalGap
      const maxPossibleGap = params.maxHorizontalGap * 1.2; // Allow 20% overshoot
      dX = this.prng.nextInt(
        params.minHorizontalGap,
        maxPossibleGap + 1 // Generate up to the overshoot limit
      );

      // Generate the VERTICAL gap (center to center)
      dY = this.prng.nextInt(params.minVerticalGap, params.maxVerticalGap + 1);

      // --- Ensure Minimum Absolute Vertical Gap --- (Keep this)
      if (Math.abs(dY) < MIN_ABS_VERTICAL_GAP) {
        dY = dY >= 0 ? MIN_ABS_VERTICAL_GAP : -MIN_ABS_VERTICAL_GAP;
        dY = Phaser.Math.Clamp(
          dY,
          params.minVerticalGap,
          params.maxVerticalGap
        );
      }

      // Calculate the potential center X of the next platform based on generated dX
      currentX = lastPlatformBounds.right + dX + estimatedHalfWidth;
      // Calculate the potential center Y of the next platform relative to the last
      currentY = lastPlatform.y + dY;

      // Clamp Y position to prevent going too high or low relative to world (Keep this)
      const minY = 100; // Prevent platforms too close to the top edge
      const maxY = WORLD_HEIGHT - 100; // Prevent platforms too close to the bottom
      currentY = Phaser.Math.Clamp(currentY, minY, maxY);
      // Recalculate dY based on clamped Y for accurate reporting if needed
      dY = currentY - lastPlatform.y;
    }

    // Return calculated potential position AND the potentially large dX
    return { nextX: currentX, nextY: currentY, dX, dY };
  }

  /**
   * Creates a single platform instance.
   */
  private createPlatform(
    pos: PlacementPosition,
    length: number,
    index: number
  ): Platform {
    // Determine platform type based on index
    let platformType = "middle";
    if (index === 0) {
      platformType = "start";
    } else if (index === -1) {
      platformType = "end";
    }

    // Generate a unique key based on type and length for texture caching
    const platformKey = `platform-${platformType}-${length}`;

    const platform = new Platform(
      this.scene,
      pos.x,
      pos.y,
      length,
      platformKey // Use the unique key
    );
    this.platforms.push(platform);
    return platform;
  }

  /**
   * Creates the finish point on the last platform.
   */
  private createFinishPoint(lastPlatform: Platform | null): void {
    if (!lastPlatform) return;
    const lastPlatformBounds = lastPlatform.getBounds();
    // Place finish X at the right edge of the last platform
    const finishX = lastPlatformBounds.right - 40;
    const finishY = lastPlatformBounds.top - 60;
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
  }

  /**
   * Returns the list of generated enemies.
   */
  getEnemies(): (EnemyLarge | EnemySmall)[] {
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
   * Removes a specific coin instance from the internal list.
   * @param coinToRemove The Coin instance to remove.
   */
  removeCoin(coinToRemove: Coin): void {
    this.coins = this.coins.filter((coin) => coin !== coinToRemove);
  }

  /**
   * Returns the array of generated Crate instances.
   */
  getCrates(): (CrateBig | CrateSmall)[] {
    return this.crates;
  }

  /**
   * Returns the array of generated Barrel instances.
   */
  getBarrels(): Barrel[] {
    return this.barrels;
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
