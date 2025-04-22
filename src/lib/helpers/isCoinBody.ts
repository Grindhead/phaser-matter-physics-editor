/**
 * Checks if the body is the coins's physics body.
 * @param body - Matter body to check.
 * @returns True if it's the coins body.
 */
export const isCoinBody = (body: MatterJS.BodyType): boolean => {
  return body.label === "coin";
};
