/**
 * Checks if the body is the fall physics body.
 * @param body - Matter body to check.
 * @returns True if it's the fall sensor body.
 */
export const isFallSensorBody = (body: MatterJS.BodyType): boolean => {
  return body.label === "fallSensor";
};
