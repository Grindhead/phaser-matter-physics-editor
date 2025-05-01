/**
 * Level generation parameters for the specific level number.
 * These will adjust difficulty of the level.
 */
export interface LevelGenerationParams {
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

// --- Configuration Constants ---
// Estimated player jump capabilities
export const MAX_JUMP_DISTANCE_X = 300; // Maximum horizontal distance player can jump
export const MAX_JUMP_HEIGHT_UP = 170; // Maximum jump height
export const MAX_FALL_HEIGHT = 250; // Maximum safe fall height

// Entity heights/dimensions for placement calculations
export const COIN_HEIGHT = 28;
export const ENEMY_SMALL_HEIGHT = 40;
export const ENEMY_LARGE_HEIGHT = 94;
export const CRATE_SMALL_HEIGHT = 32;
export const CRATE_BIG_HEIGHT = 64;
export const BARREL_HEIGHT = 100;
export const BARREL_WIDTH = 70;
export const PLATFORM_DISPLAY_HEIGHT = 32; // May not be needed directly here but good for context

// Generation constraints
export const MIN_PLATFORM_LENGTH_WITH_ENEMY = 12; // Enemies only on platforms with 12 segments or more
export const MIN_COIN_SPACING = 80;
export const MIN_ABS_VERTICAL_GAP = 40;

// Platform segment width (pixels)
export const PLATFORM_SEGMENT_WIDTH = 32;

// Level generation adjustments
export const LEVEL_LENGTH_MULTIPLIER = 1.5; // Increase level length by 50%
export const ENEMY_DENSITY_MULTIPLIER = 1.6; // Increase enemy density by 60%
