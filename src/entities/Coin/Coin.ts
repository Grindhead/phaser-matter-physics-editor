import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { COIN_ANIMATION_KEYS, COIN_ANIMATIONS } from "./coinAnimations";

export class Coin extends Phaser.Physics.Matter.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);
    super(
      scene.matter.world,
      x,
      y,
      TEXTURE_ATLAS,
      COIN_ANIMATIONS[COIN_ANIMATION_KEYS.IDLE].prefix + "0001.png",
      {
        shape: shapes[PHYSICS_ENTITIES.COIN],
        isStatic: true,
        isSensor: true,
      }
    );

    scene.add.existing(this);
  }
}
