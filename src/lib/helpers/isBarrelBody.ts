import { PHYSICS_ENTITIES } from "../constants";

/**
 * Checks if a Matter body belongs to a Barrel instance.
 *
 * @param body - The Matter body to check.
 * @returns True if the body is part of a Barrel, false otherwise.
 */
export function isBarrelBody(body: MatterJS.BodyType): boolean {
  // Check if the body's label matches the Barrel entity label
  // and if the gameObject associated with the body is an instance of Barrel
  return body.label === PHYSICS_ENTITIES.BARREL;
}
