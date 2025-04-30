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
 * @returns The RenderTexture representing the platform.
 */
export const buildPlatform = (
  scene: Phaser.Scene,
  tileCount: number,
  key: string
): Phaser.GameObjects.RenderTexture => {
  // Check if the texture already exists in the texture manager
  if (scene.textures.exists(key)) {
    // If it exists, create a new RenderTexture using the cached texture
    const renderTexture = scene.make.renderTexture(
      {
        width: TILE_WIDTH * tileCount,
        height: TILE_HEIGHT,
      },
      false
    );

    // Draw the existing texture onto the new RenderTexture
    renderTexture.draw(key, 0, 0);

    return renderTexture;
  } else {
    // If it doesn't exist, create it and return the texture
    return createTextureFromContainer(scene, tileCount, key);
  }
};

/**
 * Creates a RenderTexture from a container of platform elements.
 * @param scene The Phaser.Scene to use for creating the platform texture.
 * @param tileCount The number of tiles to build the platform.
 * @param key The key used to store the texture.
 * @returns The created RenderTexture.
 */
function createTextureFromContainer(
  scene: Phaser.Scene,
  tileCount: number,
  key: string
): Phaser.GameObjects.RenderTexture {
  // Using scene.make instead of adding to the scene
  const container = scene.make.container({ x: 0, y: 0, add: false });

  const totalWidth = TILE_WIDTH * tileCount;

  // Create platform parts as before
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

  // Create RenderTexture from the container
  const renderTexture = scene.make.renderTexture(
    {
      width: totalWidth,
      height: TILE_HEIGHT,
    },
    false
  );

  renderTexture.draw(container);

  // Save the RenderTexture as a texture in the scene cache
  renderTexture.saveTexture(key);

  // Destroy the container after saving the texture
  container.destroy();

  return renderTexture;
}
