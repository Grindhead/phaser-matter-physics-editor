import { ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { FINISH_ANIMATION_KEYS, FINISH_ANIMATIONS } from "./finishAnimations";

export class Finish extends Phaser.Physics.Matter.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);
    super(
      scene.matter.world,
      x,
      y,
      TEXTURE_ATLAS,
      FINISH_ANIMATIONS[FINISH_ANIMATION_KEYS.IDLE].prefix + "0001.png",
      {
        shape: shapes[ENTITIES.COIN],
        isStatic: true,
        isSensor: true,
      }
    );
    this.name = ENTITIES.COIN;
    scene.add.existing(this);
  }
}
