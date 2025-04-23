/**
 * Checks if the body is the enemies physics body.
 * @param body - Matter body to check.
 * @returns True if it's the enemies body.
 */
export const isEnemyBody = (body: MatterJS.BodyType): boolean => {
  return body.label === "enemy";
};
