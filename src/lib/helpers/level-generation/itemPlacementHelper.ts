import { Scene } from "phaser";
import { Platform } from "../../../entities/Platforms/Platform";
import { Coin } from "../../../entities/Coin/Coin";
import { Enemy } from "../../../entities/Enemy/Enemy";
import { CrateBig } from "../../../entities/CrateBig/CrateBig";
import { CrateSmall } from "../../../entities/CrateSmall/CrateSmall";
import { Barrel } from "../../../entities/Barrel/Barrel";
import { SimplePRNG } from "../../LevelGenerator"; // Assuming PRNG is still exported or moved
import {
  LevelGenerationParams,
  MIN_COIN_SPACING,
  COIN_HEIGHT,
  MIN_PLATFORM_LENGTH_WITH_ENEMY,
  ENEMY_HEIGHT,
  CRATE_BIG_HEIGHT,
  CRATE_SMALL_HEIGHT,
  BARREL_HEIGHT,
} from "../../interfaces/LevelGenerationConfig";

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
  enemiesArray: Enemy[],
  cratesArray: (CrateBig | CrateSmall)[],
  barrelsArray: Barrel[]
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
  const targetBarrels = params.targetBarrels; // Guaranteed >= 1

  const totalPlatformsNeeded = targetEnemies + targetCrates + targetBarrels;

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
  let barrelsPlaced = 0;

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
      const enemy = new Enemy(scene, placeX, placeY);
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

  // --- Place Barrels ---
  for (
    let i = 0;
    i < placementPool.length && barrelsPlaced < targetBarrels;
    i++
  ) {
    if (usedPlatformIndices.has(i)) continue; // Skip if already used

    const platform = placementPool[i];
    const bounds = platform.getBounds();
    const placeX = bounds.centerX;
    const placeY = bounds.top - BARREL_HEIGHT / 2;
    const barrel = new Barrel(scene, placeX, placeY);
    barrelsArray.push(barrel);
    barrelsPlaced++;
    usedPlatformIndices.add(i); // Mark platform as used
  }
}
