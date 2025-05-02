import { Platform } from "../../entities/Platforms/Platform";

/**
 * Creates multiple death zone sensors at strategic positions throughout the level.
 *
 * @param levelWidth - The total width of the level
 * @param startX - The starting X coordinate of the level
 * @param endX - The ending X coordinate of the level
 * @param lowestPlatformY - The Y coordinate of the lowest platform
 */
export const createDeathZones = (
  scene: Phaser.Scene,
  platforms: Platform[]
): void => {
  // If the level is short, just create one death zone

  // For longer levels, create multiple death zones spaced throughout the level
  platforms.forEach((platform) => {
    createFallSensor(
      scene,
      platform.y,
      platform.x + platform.width / 2,
      platform.width
    );
  });
};

/**
 * Creates a fall sensor (death zone) at the specified position.
 *
 * @param lowestPlatformBottomY The Y coordinate of the bottom edge of the lowest platform.
 * @param centerX The calculated center X coordinate for the sensor.
 * @param width The calculated width for the sensor (level width + padding).
 */
const createFallSensor = (
  scene: Phaser.Scene,
  lowestPlatformBottomY: number,
  centerX: number,
  width: number
): void => {
  const sensorHeight = 100; // Increased height to 100px
  const offsetBelowPlatform = 500;
  // Calculate the sensor's center Y position
  const yPosition =
    lowestPlatformBottomY + offsetBelowPlatform + sensorHeight / 2;

  // we set the collision filter to match the platform collision filter
  // so that matterjs recognizes the fall sensor as a platform
  scene.matter.add.rectangle(
    centerX, // Use calculated center X
    yPosition,
    width, // Use calculated width
    sensorHeight, // Use updated height
    {
      isSensor: true,
      isStatic: true,
      label: "fallSensor",
      collisionFilter: {
        group: 0,
        category: 16,
        mask: 23,
      },
    }
  );
};
