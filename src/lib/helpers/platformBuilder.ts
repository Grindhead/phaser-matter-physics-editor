import {
  PLATFORM_ANIMATION_KEYS,
  PLATFORM_ANIMATIONS,
} from "../../entities/Platforms/platformAnimations";
import { TEXTURE_ATLAS } from "../constants";

const TILE_WIDTH = 26;
const TILE_HEIGHT = 24;

export const buildPlatform = (
  scene: Phaser.Scene,
  tileCount: number,
  id: string
): Phaser.GameObjects.RenderTexture => {
  const totalWidth = TILE_WIDTH * tileCount;

  const container = scene.make.container({ x: 0, y: 0, add: false });

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

  container.add([leftPlatform, middlePlatform, rightPlatform]);

  const texture = createTextureFromContainer(scene, container, id);

  leftPlatform.destroy(true);
  middlePlatform.destroy(true);
  rightPlatform.destroy(true);
  container.destroy(true);

  return texture;
};

function createTextureFromContainer(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  key: string
): Phaser.GameObjects.RenderTexture {
  // Create a texture from the container
  const texture = scene.make.renderTexture(
    {
      width: container.getBounds().width,
      height: container.getBounds().height,
    },
    false
  );

  // Draw the container into the texture
  texture.draw(container);

  // Generate a texture that can be used by other game objects
  texture.saveTexture(key);

  return texture;
}
