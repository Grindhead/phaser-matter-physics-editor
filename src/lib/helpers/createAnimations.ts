import { TEXTURE_ATLAS } from "../constants";
import { PLAYER_ANIMATIONS } from "../../entities/Player/playerAnimations";
import { FINISH_ANIMATIONS } from "../../entities/Finish/finishAnimations";
import { COIN_ANIMATIONS } from "../../entities/Coin/coinAnimations";
import { FX_ANIMATIONS } from "../../entities/fx-land/fxAnimations";
import { BARREL_ANIMATIONS } from "../../entities/Barrel/barrelAnimations";
import { AnimationDefinition, EntityAnimations } from "../types";

export const setupAnimations = (game: Phaser.Scene): void => {
  // Create animations using the correct atlas key
  createAnimations(game.anims, TEXTURE_ATLAS, PLAYER_ANIMATIONS);
  createAnimations(game.anims, TEXTURE_ATLAS, COIN_ANIMATIONS);
  createAnimations(game.anims, TEXTURE_ATLAS, FINISH_ANIMATIONS);
  createAnimations(game.anims, TEXTURE_ATLAS, FX_ANIMATIONS);
  createAnimations(game.anims, TEXTURE_ATLAS, BARREL_ANIMATIONS);
};

/**
 * Creates animations for an entity and handles chaining automatically.
 * Supports both multi-frame and single-frame animations.
 * @param {Phaser.GameObjects.Sprite} entity - The game entity (sprite) to which animations are attached.
 * @param {Phaser.Animations.AnimationManager} anims - The AnimationManager instance from Phaser.
 * @param {string} atlasKey - The key of the sprite atlas.
 * @param {EntityAnimations<T>} animations - The animations configuration for the entity.
 */
export function createAnimations<T extends string>(
  anims: Phaser.Animations.AnimationManager,
  atlasKey: string,
  animations: EntityAnimations<T>
): void {
  (Object.entries(animations) as [T, AnimationDefinition][]).forEach(
    ([key, config]) => {
      // Skip creation if animation already exists
      if (anims.exists(key)) {
        return;
      }

      const isSingleFrame = config.frames <= 1;

      if (isSingleFrame) {
        anims.create({
          key,
          frames: [
            { key: atlasKey, frame: `${config.prefix}.png` }, // Append .png for single frame
          ],
          repeat: 0,
        });
      } else {
        anims.create({
          key,
          frames: anims.generateFrameNames(atlasKey, {
            prefix: config.prefix,
            start: 1,
            end: config.frames,
            zeroPad: 4,
            suffix: ".png",
          }),
          repeat: config.loop,
          frameRate: config.frameRate,
        });
      }
    }
  );
}
