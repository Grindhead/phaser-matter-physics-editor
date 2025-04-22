import Phaser from "phaser";
import type { AnimationDefinition, EntityAnimations } from "../../lib/types";

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
      const isSingleFrame = config.frames <= 1;

      if (isSingleFrame) {
        anims.create({
          key,
          frames: [
            { key: atlasKey, frame: config.prefix }, // Full image path for single frame
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
          frameRate: 30,
        });
      }
    }
  );
}

export const createAnimationChain = <T extends string>(
  entity: Phaser.GameObjects.Sprite,
  animations: EntityAnimations<T>
) => {
  (Object.entries(animations) as [T, AnimationDefinition][]).forEach(
    ([key, config]) => {
      if (config.nextAnimation) {
        const nextAnim = config.nextAnimation;

        entity.on(
          Phaser.Animations.Events.ANIMATION_COMPLETE,
          (animation: Phaser.Types.Animations.Animation) => {
            if (animation.key === key) {
              entity.play(nextAnim);
            }
          }
        );
      }
    }
  );
};
