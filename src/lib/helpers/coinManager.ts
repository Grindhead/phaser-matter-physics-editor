// coinsManager.ts
let coins: number = 0;

/**
 * Returns the current coin count
 */
export const getCoins = (): number => {
  return coins;
};

/**
 * Increments the coin count by the specified amount
 * @param amount - Number of coins to add (default: 1)
 */
export const addCoins = (amount: number = 1): void => {
  coins += amount;
};

/**
 * Sets the coin count to a specific value
 * @param value - New coin count value
 */
export const setCoins = (value: number): void => {
  coins = value;
};

/**
 * Resets the coin count to zero
 */
export const resetCoins = (): void => {
  coins = 0;
};
