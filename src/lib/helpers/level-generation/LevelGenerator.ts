import { Scene } from "phaser";
import { Player } from "../../../entities/Player/Player";
import { Enemy } from "../../../entities/Enemy/Enemy";
import { Coin } from "../../../entities/Coin/Coin";
import {
  Platform,
  // PlatformSegment, // Removed unused import
} from "../../../entities/Platforms/Platform";
import { CrateBig } from "../../../entities/CrateBig/CrateBig";
import { CrateSmall } from "../../../entities/CrateSmall/CrateSmall";
import { Finish } from "../../../entities/Finish/Finish";
import { Barrel } from "../../../entities/Barrel/Barrel";
import { WORLD_HEIGHT } from "../../constants";
import { setTotalCoinsInLevel } from "../coinManager"; // Added import
// Import the new configuration interface and constants
import {
  LevelGenerationParams,
  MAX_JUMP_DISTANCE_X,
  MAX_JUMP_HEIGHT_UP,
  MAX_FALL_HEIGHT,
  MIN_ABS_VERTICAL_GAP,
  PLATFORM_SEGMENT_WIDTH,
  BARREL_HEIGHT,
  BARREL_WIDTH, // Ensure BARREL_WIDTH is imported
} from "../../interfaces/LevelGenerationConfig";
// Import the item placement helpers
import {
  populatePlatformWithCoins,
  placeItemsOnPlatforms,
  placeBarrelsBetweenPlatforms,
} from "./itemPlacementHelper";

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
  private enemies: Enemy[] = [];
  private crates: (CrateBig | CrateSmall)[] = [];
  private barrels: Barrel[] = [];
  private player: Player;

  // Calculated bounds after generation
  private levelMinX: number = 0;
  private levelMaxX: number = 0;
  private levelLowestY: number = 0;

  // --- Configuration Constants Moved to LevelGenerationConfig.ts ---
  // Remove constants previously defined here

  // --- Keep PLATFORM_DISPLAY_HEIGHT if still used directly for player offset
  private readonly PLATFORM_DISPLAY_HEIGHT = 32; // Or import if moved

  private bridgeBarrelRanges: { start: number; end: number }[] = []; // Track bridge barrel horizontal ranges

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
      const { nextX, nextY, dX, dY } = this.calculateNextPlatformPosition(
        { x: currentPlatformX, y: currentPlatformY },
        platformLength,
        lastPlatform,
        params
      );

      let placeBridgeBarrel = false;
      let barrelX = 0;
      let barrelY = 0;
      let newBarrelRange: { start: number; end: number } | null = null;
      let skipPlatformPlacement = false;

      // --- Barrel Substitution Logic --- START
      if (dX > params.maxHorizontalGap) {
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
          skipPlatformPlacement = true; // Set flag to skip platform
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
        console.log(
          `  Placed barrel at (${barrelX.toFixed(0)}, ${barrelY.toFixed(
            0
          )}). Next platform target X: ${currentPlatformX.toFixed(0)}`
        );
        // Keep lastPlatform pointing to the platform *before* the barrel for next Y calculation
        // currentPlatformY is not updated here, will be recalculated next iteration relative to lastPlatform
      } else {
        // --- Normal Platform Placement (or fallback from overlapping barrel) ---
        const platform = this.createPlatform(
          { x: nextX, y: nextY },
          platformLength,
          i
        );

        totalCoins += populatePlatformWithCoins(
          this.scene,
          platform,
          this.prng,
          this.coins
        );

        itemPlacementPlatforms.push(platform);

        // Update tracking variables for next iteration
        lastPlatform = platform;
        currentPlatformX = nextX;
        currentPlatformY = nextY;
      }
    } // End of platform generation loop

    // Filter out the very last platform from item placement eligibility
    const finalItemPlacementPlatforms = itemPlacementPlatforms.filter(
      (p) => p !== lastPlatform
    );

    // --- Item Placement Logic (Use Helper) ---
    console.log(
      "Platforms available for item placement:",
      finalItemPlacementPlatforms.length
    ); // DEBUG LOG
    placeItemsOnPlatforms(
      this.scene,
      finalItemPlacementPlatforms,
      this.prng,
      params,
      this.enemies, // Pass the arrays to be populated
      this.crates
    );

    // --- Place Barrels Between Platforms --- (Temporarily Disabled for Debugging)
    /*
    placeBarrelsBetweenPlatforms(
      this.scene,
      this.platforms, // Pass the full list of platforms
      this.prng,
      params.targetBarrels,
      this.barrels // Pass the barrels array to be populated
    );
    */

    this.createFinishPoint(lastPlatform);
    this.calculateOverallBounds(); // Calculate bounds after all platforms exist

    console.log(
      `Level generated with ${this.platforms.length} platforms, ${this.enemies.length} enemies, ${this.crates.length} crates, ${this.barrels.length} barrels, ${totalCoins} coins.`
    );

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

    // Calculate target counts based on probabilities and average platform count
    // Use average platform count for estimation
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
    // Return gaps too
    // Represents the CENTER of the platform being calculated
    let currentX = currentPos.x;
    let currentY = currentPos.y;
    let dX = 0; // Horizontal gap from last platform right edge to next platform left edge
    let dY = 0; // Vertical gap (center-to-center)

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
      // --- End Minimum Absolute Vertical Gap ---

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
    } else {
      // Should not happen if starting platform is created first
      console.error(
        "calculateNextPlatformPosition called without lastPlatform!"
      );
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
    const platform = new Platform(
      this.scene,
      pos.x,
      pos.y,
      length,
      index === 0 ? "start" : index === length - 1 ? "end" : "middle" // Simplified type for example
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
    // Place finish Y 100px above the top surface of the last platform
    const finishY = lastPlatformBounds.top - 110; // Increased from 50
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
