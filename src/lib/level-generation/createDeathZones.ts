import { Platform } from "../../entities/Platforms/Platform";

/**
 * Creates multiple death zone sensors below platforms, ensuring horizontal continuity.
 *
 * Each sensor is placed 500px below its corresponding platform and is extended
 * horizontally to meet the sensors of adjacent platforms.
 *
 * @param scene The Phaser scene.
 * @param platforms An array of Platform objects in the level.
 */
export const createDeathZones = (
  scene: Phaser.Scene,
  platforms: Platform[]
): void => {
  if (!platforms || platforms.length === 0) {
    console.warn("No platforms provided to createDeathZones.");
    return;
  }

  // Sort platforms by their starting x-coordinate
  const sortedPlatforms = [...platforms].sort((a, b) => a.x - b.x);

  sortedPlatforms.forEach((platform, index) => {
    const platformStartY = platform.y;
    const platformStartX = platform.x;
    const platformEndX = platform.x + platform.width;

    let sensorStartX: number;
    let sensorEndX: number;

    // Determine Start X for the sensor
    if (index === 0) {
      // First platform: Start 500px before the platform
      sensorStartX = platformStartX - 500;
    } else {
      // Subsequent platforms: Start exactly where the previous platform ended
      const prevPlatform = sortedPlatforms[index - 1];
      sensorStartX = prevPlatform.x + prevPlatform.width;
    }

    // Determine End X for the sensor
    if (index === sortedPlatforms.length - 1) {
      // Last platform: End 500px after the platform
      sensorEndX = platformEndX + 500;
    } else {
      // Intermediate platforms: End exactly where the current platform ends.
      // The next sensor will start from here, covering the gap.
      sensorEndX = platformEndX;
    }

    // Calculate the width and center X for the sensor
    const sensorWidth = sensorEndX - sensorStartX;

    // Only create a sensor if the calculated width is positive
    if (sensorWidth > 0) {
      const sensorCenterX = sensorStartX + sensorWidth / 2;
      createFallSensor(scene, platformStartY, sensorCenterX, sensorWidth);
    } else {
      // Log if a sensor is skipped due to non-positive width (e.g., platform overlap)
      // console.warn(`Skipping death zone for platform index ${index} due to zero/negative width: ${sensorWidth}`);
    }
  });
};

/**
 * Creates a fall sensor (death zone) at the specified position.
 *
 * @param platformTopY The Y coordinate of the top edge of the platform above this sensor.
 * @param centerX The calculated center X coordinate for the sensor.
 * @param width The calculated width for the sensor.
 */
const createFallSensor = (
  scene: Phaser.Scene,
  platformTopY: number, // Renamed for clarity based on usage
  centerX: number,
  width: number
): void => {
  const sensorHeight = 100;
  const offsetBelowPlatform = 500;
  // Calculate the sensor's center Y position based on the platform above it
  const yPosition = platformTopY + offsetBelowPlatform + sensorHeight / 2;

  // Ensure minimum width to prevent zero or negative width sensors
  const effectiveWidth = Math.max(width, 1);

  scene.matter.add.rectangle(centerX, yPosition, effectiveWidth, sensorHeight, {
    isSensor: true,
    isStatic: true,
    label: "fallSensor",
    collisionFilter: {
      group: 0,
      category: 16,
      mask: 23,
    },
  });
};
