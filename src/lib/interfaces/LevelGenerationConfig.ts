export interface LevelGenerationParams {
  minPlatforms: number;
  maxPlatforms: number;
  minPlatformLength: number;
  maxPlatformLength: number;
  minHorizontalGap: number;
  maxHorizontalGap: number;
  minVerticalGap: number;
  maxVerticalGap: number;
  enemyProbability: number; // Retain for calculation, even if placement uses targets
  crateProbability: number; // Retain for calculation, even if placement uses targets
  barrelProbability: number; // Retain for calculation, even if placement uses targets
  requiredCoins: number; // Might be useful later
  targetEnemies: number;
  targetCrates: number;
  targetBarrels: number;
}

// --- Configuration Constants ---
// Estimated player jump capabilities
export const MAX_JUMP_DISTANCE_X = 150; // TEMPORARILY REDUCED from 200 for testing bridge barrels
export const MAX_JUMP_HEIGHT_UP = 120;
export const MAX_FALL_HEIGHT = 400;

// Entity heights/dimensions for placement calculations
export const COIN_HEIGHT = 28;
export const ENEMY_HEIGHT = 40;
export const CRATE_SMALL_HEIGHT = 32;
export const CRATE_BIG_HEIGHT = 64;
export const BARREL_HEIGHT = 48;
export const BARREL_WIDTH = 40;
export const PLATFORM_DISPLAY_HEIGHT = 32; // May not be needed directly here but good for context

// Generation constraints
export const MIN_PLATFORM_LENGTH_WITH_ENEMY = 6;
export const MIN_COIN_SPACING = 80;
export const MIN_ABS_VERTICAL_GAP = 20;

// Platform segment width (pixels)
export const PLATFORM_SEGMENT_WIDTH = 32;
