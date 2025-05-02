import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import {
  CRATE_BIG_ANIMATION_KEYS,
  CRATE_BIG_ANIMATIONS,
} from "./crateBigAnimations";
import {
  CRATE_SMALL_ANIMATION_KEYS,
  CRATE_SMALL_ANIMATIONS,
} from "./crateSmallAnimations";

export interface CrateInterface {
  scene: Phaser.Scene;
  x: number;
  y: number;
  type: "small" | "big";
}

export class Crate
  extends Phaser.Physics.Matter.Sprite
  implements CrateInterface
{
  public type: "small" | "big";

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: "small" | "big"
  ) {
    const shapes = scene.cache.json.get(PHYSICS);

    const physicsShape =
      type === "big"
        ? PHYSICS_ENTITIES.CRATE_BIG
        : PHYSICS_ENTITIES.CRATE_SMALL;

    const bigAnimation =
      CRATE_BIG_ANIMATIONS[CRATE_BIG_ANIMATION_KEYS.CRATE_BIG_IDLE];

    const smallAnimation =
      CRATE_SMALL_ANIMATIONS[CRATE_SMALL_ANIMATION_KEYS.CRATE_SMALL_IDLE];

    const animation = type === "big" ? bigAnimation : smallAnimation;

    super(scene.matter.world, x, y, TEXTURE_ATLAS, animation.prefix, {
      shape: shapes[physicsShape],
    });

    this.type = type;
    scene.add.existing(this);
  }
}
