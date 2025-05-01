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
  CRATE_BIG_HEIGHT,
  CRATE_SMALL_HEIGHT,
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

  // Debugging
  private debugGraphics: Phaser.GameObjects.Graphics | null = null;
  private isDebugActive: boolean = false;

  // Calculated bounds after generation
  private levelMinX: number = 0;
  private levelMaxX: number = 0;
  private levelLowestY: number = 0;

  // --- Keep PLATFORM_DISPLAY_HEIGHT if still used directly for player offset
  private readonly PLATFORM_DISPLAY_HEIGHT = 32; // Or import if moved

  private bridgeBarrelRanges: { start: number; end: number }[] = []; // Track bridge barrel horizontal ranges

  constructor(
    scene: Scene,
    debugGraphics: Phaser.GameObjects.Graphics | null,
    isDebugActive: boolean
  ) {
    this.scene = scene;
    this.debugGraphics = debugGraphics;
    this.isDebugActive = isDebugActive;
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
    // Store all platforms with their positions for later wall and crate placement
    const platformPositions: { platform: Platform; x: number; y: number }[] =
      [];

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
    platformPositions.push({
      platform: startPlatform,
      x: currentPlatformX,
      y: currentPlatformY,
    });
    // Don't add start platform to item placement list

    // Loop to generate the remaining platforms (or barrels or vertical walls)
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

      // Remove random vertical wall placement and focus on wall placement after all platforms
      const shouldPlaceVerticalWall = false;

      let placeBridgeBarrel = false;
      let barrelX = 0;
      let barrelY = 0;
      let newBarrelRange: { start: number; end: number } | null = null;

      // --- Barrel Substitution Logic --- START
      // Only consider placing a bridge barrel if it's NOT the very last segment before the finish
      // And not placing a vertical wall
      if (
        dX > params.maxHorizontalGap &&
        i < numPlatforms - 1 &&
        !shouldPlaceVerticalWall
      ) {
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
        }
      }

      // --- Placement Decision ---
      if (shouldPlaceVerticalWall) {
        // No longer randomly placing vertical walls mid-generation
      } else if (placeBridgeBarrel) {
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
        platformPositions.push({ platform, x: nextX, y: nextY });
        currentPlatformX = nextX; // Update position based on the newly placed platform
        currentPlatformY = nextY;
      }
    }

    // After all platforms are placed, add vertical walls at the end of platforms
    // that lead to higher platforms
    console.log(
      `Generated ${platformPositions.length} platforms, checking for wall placement...`
    );
    this.addVerticalWallsAtPlatformEdges(platformPositions);

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
    }

    // Place Enemies using the helper
    this.placeEnemies(finalItemPlacementPlatforms, params);

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
  ): { nextX: number; nextY: number; dX: number } {
    let currentX = currentPos.x;
    let currentY = currentPos.y;
    let dX = 0;

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
      let dY = this.prng.nextInt(
        params.minVerticalGap,
        params.maxVerticalGap + 1
      );

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
    }

    // Return calculated potential position AND the potentially large dX
    return { nextX: currentX, nextY: currentY, dX };
  }

  /**
   * Creates a single platform instance.
   */
  private createPlatform(
    pos: PlacementPosition,
    length: number,
    index: number,
    isVertical: boolean = false
  ): Platform {
    // Determine platform type based on index
    let platformType = "middle";
    if (index === 0) {
      platformType = "start";
    } else if (index === -1) {
      platformType = "end";
    }

    // Generate a unique key based on type, length and orientation for texture caching
    const orientationSuffix = isVertical ? "-vertical" : "";
    const platformKey = `platform-${platformType}-${length}${orientationSuffix}`;

    const platform = new Platform(
      this.scene,
      pos.x,
      pos.y,
      length,
      platformKey,
      isVertical // Pass the isVertical flag to the Platform constructor
    );
    this.platforms.push(platform);
    return platform;
  }

  /**
   * Creates a vertical wall at a specified position.
   * @param pos The position to place the vertical wall
   * @param height The height of the wall in segments
   * @returns The created Platform instance representing the wall
   */
  private createVerticalWall(pos: PlacementPosition, height: number): Platform {
    // Create a vertical platform with the specified height
    // Use a regular index (-2 to differentiate from end platforms)
    return this.createPlatform(pos, height, -2, true);
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

  /**
   * Places vertical walls at the end of platforms that lead to higher platforms
   * @param platformPositions Array of platforms with their positions
   */
  private addVerticalWallsAtPlatformEdges(
    platformPositions: { platform: Platform; x: number; y: number }[]
  ): void {
    // Sort platforms by x position
    const sortedPlatforms = [...platformPositions].sort((a, b) => a.x - b.x);

    // Track all wall positions for crate placement
    const wallPositions: {
      wallX: number;
      wallY: number;
      wallHeight: number;
      platformBelow: Platform;
      wall: Platform;
    }[] = [];

    console.log(
      `Processing ${sortedPlatforms.length} platforms for wall placement`
    );

    // First check if any platforms have significant height differences (removed for clarity)
    // Forcing test wall removed

    // Only process platform pairs where we can potentially place walls
    for (let i = 0; i < sortedPlatforms.length - 1; i++) {
      const currentPlatform = sortedPlatforms[i].platform;
      const nextPlatform = sortedPlatforms[i + 1].platform;

      // Skip if either platform is vertical (avoid placing walls next to walls)
      if (currentPlatform.isVertical || nextPlatform.isVertical) {
        console.log(`Skipping pair ${i} - one platform is already vertical`);
        continue;
      }

      const currentBounds = currentPlatform.getBounds();
      const nextBounds = nextPlatform.getBounds();

      // Calculate the horizontal gap between platforms
      const gap = nextBounds.left - currentBounds.right;

      // In Phaser, lower Y values are higher on screen
      // So nextBounds.top < currentBounds.top means the next platform is higher
      const heightDifference = nextBounds.top - currentBounds.top;

      console.log(
        `Platform pair ${i}: gap=${gap}, heightDiff=${heightDifference}, MAX_JUMP_HEIGHT_UP=${MAX_JUMP_HEIGHT_UP}`
      );

      // Only place a wall if there is significant height difference and reasonable gap
      // heightDifference < 0 means the next platform is higher (smaller Y value is higher in Phaser)
      // Increase the allowed horizontal gap for wall placement
      if (
        heightDifference < -MAX_JUMP_HEIGHT_UP * 0.7 &&
        gap > 20 &&
        gap < MAX_JUMP_DISTANCE_X * 1.5
      ) {
        // Calculate wall height based on the absolute height difference
        const absHeightDiff = Math.abs(heightDifference);
        const wallHeight =
          Math.ceil(absHeightDiff / PLATFORM_SEGMENT_WIDTH) + 2; // Add 2 segments for safety

        // Place the wall at the end of the current platform
        const wallX = currentBounds.right + 20; // Place 20px from edge

        // Calculate optimal wall position:
        // Bottom of wall should be at current platform height,
        // Top of wall should reach slightly above next platform
        const wallTotalHeight = wallHeight * PLATFORM_SEGMENT_WIDTH;

        // Center of wall should be at: current platform top - (wall height/2)
        // This positions the bottom of the wall at the current platform level
        const wallY = currentBounds.top - wallTotalHeight / 2;

        console.log(
          `Placing wall at platform ${i}: heightDiff=${heightDifference}, wallHeight=${wallHeight}, wallX=${wallX}, wallY=${wallY}`
        );

        // Create the wall and make sure it's used
        const wall = this.createVerticalWall(
          { x: wallX, y: wallY },
          wallHeight
        );

        // Store this wall position for crate placement
        wallPositions.push({
          wallX,
          wallY,
          wallHeight,
          platformBelow: currentPlatform, // The platform below the wall
          wall, // Store a reference to the actual wall object as well
        });

        // Draw debug visualization only if debug is active
        if (this.isDebugActive && this.debugGraphics) {
          const graphics = this.debugGraphics;
          graphics.lineStyle(4, 0xff0000, 1); // Red for walls
          graphics.strokeRect(
            wallX - 5,
            wallY - wallTotalHeight / 2,
            10,
            wallTotalHeight
          );
        }
      } else {
        console.log(
          `Not placing wall between platforms ${i} and ${
            i + 1
          }: conditions not met`
        );
      }
    }

    console.log(
      `Finished wall placement. Placed ${wallPositions.length} walls.`
    );

    // Now place crates strategically near walls
    this.placeStrategicCratesNearWalls(wallPositions);
  }

  /**
   * Places crates specifically to help players jump up to walls
   * @param wallPositions Array of wall positions and their associated platforms
   */
  private placeStrategicCratesNearWalls(
    wallPositions: {
      wallX: number;
      wallY: number;
      wallHeight: number;
      platformBelow: Platform;
      wall: Platform;
    }[]
  ): void {
    // If no walls, no need for crates
    if (wallPositions.length === 0) {
      console.log("No walls to place crates near");
      return;
    }

    console.log(`Placing crates near ${wallPositions.length} walls`);

    // Track platforms that have crates placed on them
    const platformsWithCrates = new Set<Platform>();
    let cratesPlacedCount = 0; // Keep track of actual crates placed

    for (let i = 0; i < wallPositions.length; i++) {
      const wallPos = wallPositions[i];
      const platform = wallPos.platformBelow;

      // Skip if platform already has a crate (redundant check now, but safe)
      if (platformsWithCrates.has(platform)) {
        console.log(
          `Skipping wall ${i} check - platform already assigned a crate`
        );
        continue;
      }

      const platformBounds = platform.getBounds();
      const platformTopY = platformBounds.top;

      // Calculate wall's physical top edge Y coordinate
      // Wall Y is the center, height is in segments
      const wallPhysicalHeight = wallPos.wallHeight * PLATFORM_SEGMENT_WIDTH;
      const wallTopY = wallPos.wallY - wallPhysicalHeight / 2;

      // Calculate the vertical distance the player needs to jump
      // Player starts on platformTopY and needs to reach wallTopY (or slightly above)
      // Smaller Y is higher, so a higher wall means a smaller wallTopY
      // Required jump = StartY - EndY
      const requiredVerticalJump = platformTopY - wallTopY;

      console.log(
        `Wall ${i}: PlatformTopY=${platformTopY.toFixed(
          2
        )}, WallTopY=${wallTopY.toFixed(
          2
        )}, RequiredJump=${requiredVerticalJump.toFixed(2)}`
      );
      console.log(
        `  - MaxJump=${MAX_JUMP_HEIGHT_UP}, +SmallCrate=${(
          MAX_JUMP_HEIGHT_UP + CRATE_SMALL_HEIGHT
        ).toFixed(2)}, +BigCrate=${(
          MAX_JUMP_HEIGHT_UP + CRATE_BIG_HEIGHT
        ).toFixed(2)}`
      );
      console.log(
        `  - Wall object: ${
          wallPos.wall.isVertical ? "Vertical" : "Horizontal"
        }`
      );

      let crateToPlace: CrateSmall | CrateBig | null = null;
      let placeX = 0;
      let placeY = 0;
      let crateHeight = 0;

      // Determine if a crate is needed and which type
      if (requiredVerticalJump <= MAX_JUMP_HEIGHT_UP) {
        // No crate needed, player can make the jump
        console.log(`  - Crate not needed for wall ${i}.`);
      } else if (
        requiredVerticalJump <=
        MAX_JUMP_HEIGHT_UP + CRATE_SMALL_HEIGHT
      ) {
        // Small crate is sufficient
        console.log(`  - Small crate needed for wall ${i}.`);
        crateHeight = CRATE_SMALL_HEIGHT;
        placeX = Math.min(platformBounds.right - 40, wallPos.wallX - 30);
        placeY = platformBounds.top - crateHeight / 2;
        crateToPlace = new CrateSmall(this.scene, placeX, placeY);
      } else if (
        requiredVerticalJump <=
        MAX_JUMP_HEIGHT_UP + CRATE_BIG_HEIGHT
      ) {
        // Big crate is needed
        console.log(`  - Big crate needed for wall ${i}.`);
        crateHeight = CRATE_BIG_HEIGHT;
        placeX = Math.min(platformBounds.right - 40, wallPos.wallX - 30);
        placeY = platformBounds.top - crateHeight / 2;
        crateToPlace = new CrateBig(this.scene, placeX, placeY);
      } else {
        // Wall is too high even with a big crate - place big crate anyway?
        // Or potentially log an error/warning about impossible jump
        console.warn(
          `  - Wall ${i} might be too high (${requiredVerticalJump.toFixed(
            2
          )}) even with a big crate! Placing big crate.`
        );
        crateHeight = CRATE_BIG_HEIGHT;
        placeX = Math.min(platformBounds.right - 40, wallPos.wallX - 30);
        placeY = platformBounds.top - crateHeight / 2;
        crateToPlace = new CrateBig(this.scene, placeX, placeY);
      }

      // If a crate needs to be placed
      if (crateToPlace) {
        this.crates.push(crateToPlace);
        platformsWithCrates.add(platform); // Mark platform as having a crate
        cratesPlacedCount++; // Increment count of placed crates

        // Draw debug visualization only if debug is active
        if (this.isDebugActive && this.debugGraphics) {
          const graphics = this.debugGraphics;
          graphics.lineStyle(4, 0x00ff00, 1); // Green for crates
          // Use calculated crateHeight for visualization size
          graphics.strokeRect(
            placeX - crateHeight / 2, // Center the rect
            placeY - crateHeight / 2,
            crateHeight,
            crateHeight
          );
        }
      }
    }

    // Report on crate placement
    console.log(`Placed ${cratesPlacedCount} crates near walls`); // Use actual count
  }

  /**
   * Places enemies on platforms
   */
  private placeEnemies(
    eligiblePlatforms: Platform[],
    params: LevelGenerationParams
  ): void {
    // Use the existing placeItemsOnPlatforms function for enemies
    placeItemsOnPlatforms(
      this.scene,
      eligiblePlatforms,
      this.prng,
      params,
      this.levelNumber,
      this.enemies
    );
  }
}
