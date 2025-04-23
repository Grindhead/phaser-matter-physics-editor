/**
 * Checks if the body is the enemies physics body.
 * @param body - Matter body to check.
 * @returns True if it's the enemies body.
 */
export const isEnemyBody = (body: MatterJS.BodyType): boolean => {
  const isMatch = body.label === "enemy";
  console.log(
    `DEBUG: isEnemyBody check: ID=${body.id}, Label=${body.label}, IsMatch=${isMatch}`
  );
  return isMatch;
};
