import { Platform } from "../../entities/Platforms/Platform";

/**
 * Checks if the body is a valid ground type (platform or crate).
 * Excludes vertical platforms from being considered ground for standard jumping.
 * @param body - Matter body to check.
 * @returns True if it's a ground body.
 */
export const isGroundBody = (body: MatterJS.BodyType): boolean => {
  const label = body.label?.toLowerCase() ?? "";

  // Check if it's a vertical platform first
  if (
    label === "platform" &&
    body.gameObject instanceof Platform &&
    body.gameObject.isVertical
  ) {
    return false; // Vertical walls are not standard ground
  }

  // Check against regular ground labels
  return ["platform", "crate-big", "crate-small"].includes(label);
};
