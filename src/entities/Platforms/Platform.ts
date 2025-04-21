import { ENTITIES, TEXTURE_ATLAS } from "../../lib/constants";
import {
  PLATFORM_ANIMATIONS,
  PLATFORM_ANIMATION_KEYS,
} from "./platformAnimations";

export class Platform extends Phaser.Physics.Matter.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(
      scene.matter.world,
      x,
      y,
      TEXTURE_ATLAS,
      PLATFORM_ANIMATIONS[PLATFORM_ANIMATION_KEYS.LEFT].prefix,
      {
        ignoreGravity: true,
      }
    );
    this.name = ENTITIES.PLATFORM;
    scene.add.existing(this);
  }
}
