// LevelManager.ts
let level: number = 0;

/**
 * Returns the current level count
 */
export const getLevel = (): number => {
  return level;
};

/**
 * Increments the level count by the specified amount
 * @param amount - Number of Level to add (default: 1)
 */
export const addLevel = (amount: number = 1): void => {
  level += amount;
};

/**
 * Sets the level count to a specific value
 * @param value - New level count value
 */
export const setLevel = (value: number): void => {
  level = value;
};

/**
 * Resets the level count to zero
 */
export const resetLevel = (): void => {
  level = 0;
};
