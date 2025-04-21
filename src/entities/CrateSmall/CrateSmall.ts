import { ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import {
  CRATE_SMALL_ANIMATION_KEYS,
  CRATE_SMALL_ANIMATIONS,
} from "./crateSmallAnimations";

export class CrateSmall extends Phaser.Physics.Matter.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);
    super(
      scene.matter.world,
      x,
      y,
      TEXTURE_ATLAS,
      CRATE_SMALL_ANIMATIONS[CRATE_SMALL_ANIMATION_KEYS.IDLE].prefix,
      {
        shape: shapes[ENTITIES.CRATE_SMALL],
      }
    );
    this.name = ENTITIES.CRATE_SMALL;
    scene.add.existing(this);
  }
}
