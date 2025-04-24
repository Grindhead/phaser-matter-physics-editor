/**
 * Checks if the body is a valid ground type (platform or crate).
 * @param body - Matter body to check.
 * @returns True if it's a ground body.
 */
export const isGroundBody = (body: MatterJS.BodyType): boolean => {
  const label = body.label?.toLowerCase() ?? "";

  return ["platform", "crate-big", "crate-small"].includes(label);
};
