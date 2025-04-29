import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { BARREL_ANIMATION_KEYS, BARREL_ANIMATIONS } from "./barrelAnimations";

export class Barrel extends Phaser.Physics.Matter.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);
    super(scene.matter.world, x, y, TEXTURE_ATLAS, undefined, {
      shape: shapes[PHYSICS_ENTITIES.BARREL],
      isStatic: true,
      isSensor: true,
    });

    this.play(BARREL_ANIMATION_KEYS.BARREL_IDLE);

    scene.add.existing(this);
  }

  public enter() {
    this.play(BARREL_ANIMATION_KEYS.BARREL_ENTER);
  }

  public launch() {
    this.play(BARREL_ANIMATION_KEYS.BARREL_LAUNCH);
  }
}
