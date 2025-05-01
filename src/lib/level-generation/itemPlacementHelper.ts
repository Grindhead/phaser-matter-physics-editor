import { Scene } from "phaser";
import { SimplePRNG } from "./LevelGenerator";
import { Platform } from "../../entities/Platforms/Platform";
import {
  BARREL_HEIGHT,
  BARREL_WIDTH,
  COIN_HEIGHT,
  CRATE_BIG_HEIGHT,
  CRATE_SMALL_HEIGHT,
  ENEMY_HEIGHT,
  LevelGenerationParams,
  MIN_COIN_SPACING,
  MIN_PLATFORM_LENGTH_WITH_ENEMY,
} from "../interfaces/LevelGenerationConfig";
import { Coin } from "../../entities/Coin/Coin";
import { EnemyLarge } from "../../entities/Enemies/EnemyLarge";
import { CrateBig } from "../../entities/CrateBig/CrateBig";
import { CrateSmall } from "../../entities/CrateSmall/CrateSmall";
import { Barrel } from "../../entities/Barrel/Barrel";
import { WORLD_HEIGHT } from "../constants";
import { EnemySmall } from "../../entities/Enemies/EnemySmall";

/**
 * Populates a given platform with coins based on spacing constraints.
 * Returns the number of coins added.
 */
export function populatePlatformWithCoins(
  scene: Scene,
  platform: Platform,
  prng: SimplePRNG,
  coinsArray: Coin[]
): number {
  const bounds = platform.getBounds();
  const platformWidth = bounds.width;
  let coinsAdded = 0;

  const maxPossibleCoins = Math.floor(platformWidth / MIN_COIN_SPACING);
  const targetCoinsForPlatform = prng.nextInt(0, maxPossibleCoins + 1);

  if (targetCoinsForPlatform > 0) {
    const startOffset =
      (platformWidth - (targetCoinsForPlatform - 1) * MIN_COIN_SPACING) / 2;
    const placeY = bounds.top - COIN_HEIGHT / 2 - 5;

    for (let i = 0; i < targetCoinsForPlatform; i++) {
      const placeX = bounds.left + startOffset + i * MIN_COIN_SPACING;
      const centerBuffer = 16;
      if (Math.abs(placeX - bounds.centerX) < centerBuffer) {
        continue;
      }
      const coin = new Coin(scene, placeX, placeY);
      coinsArray.push(coin);
      coinsAdded++;
    }
  }
  return coinsAdded;
}

/**
 * Places enemies, crates, and barrels onto a shuffled list of eligible platforms.
 * Ensures items are not placed on the same platform.
 */
export function placeItemsOnPlatforms(
  scene: Scene,
  eligiblePlatforms: Platform[],
  prng: SimplePRNG,
  params: LevelGenerationParams,
  levelNumber: number,
  enemiesArray: (EnemyLarge | EnemySmall)[],
  cratesArray: (CrateBig | CrateSmall)[]
  // barrelsArray: Barrel[] // REMOVED
): void {
  if (eligiblePlatforms.length === 0) return;

  // Fisher-Yates (aka Knuth) Shuffle algorithm (requires prng)
  const shuffleArray = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = prng.nextInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const shuffledPlatforms = shuffleArray([...eligiblePlatforms]);

  const targetEnemies = params.targetEnemies;
  const targetCrates = params.targetCrates;

  const totalPlatformsNeeded = targetEnemies + targetCrates;

  // Create a pool of platforms reserved for item placement
  // Slice ensures we don't try to reserve more platforms than available
  const placementPool = shuffledPlatforms.slice(
    0,
    Math.min(totalPlatformsNeeded, shuffledPlatforms.length)
  );

  // Keep track of which platforms in the pool have been used
  const usedPlatformIndices = new Set<number>();

  let enemiesPlaced = 0;
  let cratesPlaced = 0;

  // --- Place Enemies ---
  for (
    let i = 0;
    i < placementPool.length && enemiesPlaced < targetEnemies;
    i++
  ) {
    if (usedPlatformIndices.has(i)) continue; // Skip if already used

    const platform = placementPool[i];
    if (platform.segmentCount >= MIN_PLATFORM_LENGTH_WITH_ENEMY) {
      const bounds = platform.getBounds();
      const placeX = bounds.centerX;
      const placeY = bounds.top - ENEMY_HEIGHT / 2 - 14;

      // Determine enemy type
      let enemy: EnemyLarge | EnemySmall;
      if (levelNumber === 1 && enemiesPlaced < 3) {
        // Always small for the first 3 on level 1
        enemy = new EnemySmall(scene, placeX, placeY);
      } else {
        // Randomly choose between small and large for others
        if (prng.next() < 0.5) {
          enemy = new EnemySmall(scene, placeX, placeY);
        } else {
          enemy = new EnemyLarge(scene, placeX, placeY);
        }
      }

      enemiesArray.push(enemy);
      enemiesPlaced++;
      usedPlatformIndices.add(i); // Mark platform as used
    }
    // Note: We don't automatically use the platform if too short
  }

  // --- Place Crates ---
  for (
    let i = 0;
    i < placementPool.length && cratesPlaced < targetCrates;
    i++
  ) {
    if (usedPlatformIndices.has(i)) continue; // Skip if already used

    const platform = placementPool[i];
    const bounds = platform.getBounds();
    const placeX = bounds.centerX;
    const isBigCrate = prng.next() < 0.5;
    const crateHeight = isBigCrate ? CRATE_BIG_HEIGHT : CRATE_SMALL_HEIGHT;
    const placeY = bounds.top - crateHeight / 2;
    const crate = isBigCrate
      ? new CrateBig(scene, placeX, placeY)
      : new CrateSmall(scene, placeX, placeY);
    cratesArray.push(crate);
    cratesPlaced++;
    usedPlatformIndices.add(i); // Mark platform as used
  }
}

/**
 * Places barrels on the ground in the gaps *between* platforms.
 * Attempts to place the target number of barrels, avoiding overlaps.
 */
export function placeBarrelsBetweenPlatforms(
  scene: Scene,
  platforms: Platform[], // Requires the full list of platforms
  prng: SimplePRNG,
  targetBarrels: number,
  barrelsArray: Barrel[] // Array to populate
): void {
  if (platforms.length < 2 || targetBarrels <= 0) {
    console.warn(
      "LevelGenerator: Not enough platforms or target barrels for gap placement."
    );
    return; // Need at least two platforms for a gap
  }

  // Define a buffer to prevent placing barrels directly under platform edges
  const EDGE_BUFFER = BARREL_WIDTH * 1.5; // Prevent placement within 1.5 barrel widths of the edge

  // Sort platforms by their X position to process gaps sequentially
  const sortedPlatforms = [...platforms].sort((a, b) => a.x - b.x);

  const availableGaps: {
    startX: number;
    endX: number;
    platformATop: number;
    platformBTop: number;
  }[] = [];

  // Identify gaps between platforms
  for (let i = 0; i < sortedPlatforms.length - 1; i++) {
    const platformA = sortedPlatforms[i];
    const platformB = sortedPlatforms[i + 1];
    const boundsA = platformA.getBounds();
    const boundsB = platformB.getBounds();

    const gapStart = boundsA.right;
    const gapEnd = boundsB.left;
    const gapWidth = gapEnd - gapStart;

    // Ensure there's enough horizontal space for at least one barrel,
    // AND the edge buffers on both sides.
    if (gapWidth >= BARREL_WIDTH + 2 * EDGE_BUFFER) {
      availableGaps.push({
        startX: gapStart,
        endX: gapEnd,
        platformATop: boundsA.top,
        platformBTop: boundsB.top,
      });
    }
  }

  if (availableGaps.length === 0) {
    console.warn(
      "LevelGenerator: No suitable gaps wide enough found between platforms for barrels (considering edge buffers)."
    );
    return; // No gaps wide enough
  }

  // Keep track of occupied horizontal ranges on the ground
  const occupiedRanges: { start: number; end: number }[] = [];

  let barrelsPlaced = 0;
  const potentialPlacementAttempts = availableGaps.length * 5; // Limit attempts
  let attempts = 0;

  while (
    barrelsPlaced < targetBarrels &&
    attempts < potentialPlacementAttempts
  ) {
    attempts++;
    // Choose a random gap from the ones wide enough for buffers
    const gapIndex = prng.nextInt(0, availableGaps.length);
    const selectedGap = availableGaps[gapIndex];

    // Calculate the placement range within the gap, EXCLUDING edge buffers
    // The barrel's center point should be placed within this range.
    const minPlaceX = selectedGap.startX + EDGE_BUFFER + BARREL_WIDTH / 2;
    const maxPlaceX = selectedGap.endX - EDGE_BUFFER - BARREL_WIDTH / 2;

    // Since we filtered availableGaps, minPlaceX should always be < maxPlaceX
    // (unless BARREL_WIDTH is zero or negative, which is an error)
    if (minPlaceX >= maxPlaceX) {
      console.error(
        "LevelGenerator: Invalid placement range calculated even after filtering gaps. Check BARREL_WIDTH and EDGE_BUFFER."
      );
      continue; // Skip this attempt
    }

    // Place within the preferred range (between edge buffers)
    const placeX = prng.nextInt(minPlaceX, maxPlaceX + 1);
    const barrelRange = {
      start: placeX - BARREL_WIDTH / 2,
      end: placeX + BARREL_WIDTH / 2,
    };

    // Try to place the barrel, considering overlaps
    const placedSuccessfully = placeBarrelIfPossible(
      scene,
      placeX,
      selectedGap,
      occupiedRanges,
      barrelsArray,
      barrelRange
    );

    // CORRECTED: Only increment if placement was successful
    if (placedSuccessfully) {
      barrelsPlaced++;
    }
  } // End of while loop

  if (barrelsPlaced < targetBarrels) {
    console.warn(
      `LevelGenerator: Could only place ${barrelsPlaced}/${targetBarrels} barrels due to space/overlap constraints.`
    );
  }
}

// Helper function to encapsulate barrel placement check and instantiation
function placeBarrelIfPossible(
  scene: Scene,
  placeX: number,
  selectedGap: { platformATop: number; platformBTop: number },
  occupiedRanges: { start: number; end: number }[],
  barrelsArray: Barrel[],
  barrelRange: { start: number; end: number }
): boolean {
  // --- Calculate Dynamic Y Position --- START
  const lowerPlatformTop = Math.max(
    selectedGap.platformATop,
    selectedGap.platformBTop
  );
  let placeY = lowerPlatformTop + BARREL_HEIGHT / 2 + 10; // Place center 10px below lower platform's top
  // Clamp Y to prevent falling through world floor
  placeY = Math.min(placeY, WORLD_HEIGHT - BARREL_HEIGHT / 2 - 2);
  // --- Calculate Dynamic Y Position --- END

  // Check for overlap with already placed barrels (horizontal only for now)
  let overlaps = false;
  for (const range of occupiedRanges) {
    // Check if new range overlaps existing range (simple AABB overlap check)
    if (barrelRange.start < range.end && barrelRange.end > range.start) {
      overlaps = true;
      break;
    }
  }

  if (!overlaps) {
    // Place the barrel
    const barrel = new Barrel(scene, placeX, placeY); // Use dynamic placeY
    barrelsArray.push(barrel);
    occupiedRanges.push(barrelRange); // Mark this range as occupied
    return true; // Barrel placed successfully

    // Optional: Remove or shrink the gap to prevent placing more barrels too close?
    // For now, we just rely on the overlap check.
  }
  return false; // Barrel could not be placed due to overlap
}
