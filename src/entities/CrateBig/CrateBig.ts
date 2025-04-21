import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import {
  CRATE_BIG_ANIMATION_KEYS,
  CRATE_BIG_ANIMATIONS,
} from "./crateBigAnimations";

export class CrateBig extends Phaser.Physics.Matter.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);
    super(
      scene.matter.world,
      x,
      y,
      TEXTURE_ATLAS,
      CRATE_BIG_ANIMATIONS[CRATE_BIG_ANIMATION_KEYS.IDLE].prefix,
      {
        shape: shapes[PHYSICS_ENTITIES.CRATE_BIG],
      }
    );

    scene.add.existing(this);
  }
}
