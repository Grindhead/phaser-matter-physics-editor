import {
  PLATFORM_ANIMATION_KEYS,
  PLATFORM_ANIMATIONS,
} from "../../entities/Platforms/platformAnimations";
import { TEXTURE_ATLAS } from "../constants";

// Tile dimensions
const TILE_WIDTH = 26;
const TILE_HEIGHT = 24;

/**
 * Builds a platform with the given parameters and reuses existing textures if available.
 * @param scene The Phaser.Scene to use for creating the platform.
 * @param tileCount The number of tiles to build the platform.
 * @param key The key used to reference the texture in the cache.
 * @param isVertical Optional parameter indicating if the platform should be built for vertical orientation.
 * @returns The RenderTexture representing the platform.
 */
export const buildPlatform = (
  scene: Phaser.Scene,
  tileCount: number,
  key: string,
  isVertical: boolean = false
): Phaser.GameObjects.RenderTexture => {
  // Check if the texture already exists in the texture manager
  if (scene.textures.exists(key)) {
    // If it exists, create a new RenderTexture using the cached texture
    const renderTexture = scene.make.renderTexture(
      {
        width: isVertical ? TILE_HEIGHT : TILE_WIDTH * tileCount,
        height: isVertical ? TILE_WIDTH * tileCount : TILE_HEIGHT,
      },
      false
    );

    // Draw the existing texture onto the new RenderTexture
    renderTexture.draw(key, 0, 0);

    return renderTexture;
  } else {
    // If it doesn't exist, create it and return the texture
    return createTextureFromContainer(scene, tileCount, key, isVertical);
  }
};

/**
 * Creates a RenderTexture from a container of platform elements.
 * @param scene The Phaser.Scene to use for creating the platform texture.
 * @param tileCount The number of tiles to build the platform.
 * @param key The key used to store the texture.
 * @param isVertical Whether the platform should be built for vertical orientation.
 * @returns The created RenderTexture.
 */
function createTextureFromContainer(
  scene: Phaser.Scene,
  tileCount: number,
  key: string,
  isVertical: boolean = false
): Phaser.GameObjects.RenderTexture {
  // Using scene.make instead of adding to the scene
  const container = scene.make.container({ x: 0, y: 0, add: false });

  const totalWidth = TILE_WIDTH * tileCount;
  const totalHeight = TILE_HEIGHT;

  // Create platform parts
  const leftPlatform = scene.make.image({
    key: TEXTURE_ATLAS,
    frame: PLATFORM_ANIMATIONS[PLATFORM_ANIMATION_KEYS.LEFT].prefix,
    x: TILE_WIDTH / 2,
    y: TILE_HEIGHT / 2,
    add: false,
  });

  const middlePlatform = scene.make.tileSprite({
    key: TEXTURE_ATLAS,
    frame: PLATFORM_ANIMATIONS[PLATFORM_ANIMATION_KEYS.MIDDLE].prefix,
    x: (TILE_WIDTH * tileCount) / 2,
    y: TILE_HEIGHT / 2 + 1.5,
    width: TILE_WIDTH * (tileCount - 2),
    height: TILE_HEIGHT,
    add: false,
  });

  const rightPlatform = scene.make.image({
    key: TEXTURE_ATLAS,
    frame: PLATFORM_ANIMATIONS[PLATFORM_ANIMATION_KEYS.RIGHT].prefix,
    x: totalWidth - TILE_WIDTH / 2,
    y: TILE_HEIGHT / 2,
    add: false,
  });

  // Add parts to the container
  container.add([leftPlatform, middlePlatform, rightPlatform]);

  // Create RenderTexture with appropriate dimensions based on orientation
  const renderTexture = scene.make.renderTexture(
    {
      width: isVertical ? totalHeight : totalWidth,
      height: isVertical ? totalWidth : totalHeight,
    },
    false
  );

  if (isVertical) {
    // For vertical platforms, we rotate the container before drawing
    container.setRotation(Math.PI / 2); // 90 degrees in radians
    container.setPosition(totalHeight, 0); // Adjust position to keep it in frame
  }

  renderTexture.draw(container);

  // Save the RenderTexture as a texture in the scene cache
  renderTexture.saveTexture(key);

  // Destroy the container after saving the texture
  container.destroy();

  return renderTexture;
}
