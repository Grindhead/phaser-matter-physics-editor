/**
 * Checks if the body is the player's physics body.
 * @param body - Matter body to check.
 * @returns True if it's the player body.
 */
export const isPlayerBody = (body: MatterJS.BodyType): boolean => {
  return body.label === "duck"; // Assumes duck-body is the root body
};
