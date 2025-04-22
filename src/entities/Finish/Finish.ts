import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { createAnimations } from "../../lib/helpers/createAnimations";
import { FINISH_ANIMATION_KEYS, FINISH_ANIMATIONS } from "./finishAnimations";

export class Finish extends Phaser.Physics.Matter.Sprite {
  private isActivated: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);
    super(
      scene.matter.world,
      x,
      y,
      TEXTURE_ATLAS,
      FINISH_ANIMATIONS[FINISH_ANIMATION_KEYS.FINISH_IDLE].prefix,
      {
        shape: shapes[PHYSICS_ENTITIES.FINISH],
        isStatic: true,
        isSensor: true,
      }
    );

    createAnimations(
      this,
      this.anims.animationManager,
      TEXTURE_ATLAS,
      FINISH_ANIMATIONS
    );

    scene.add.existing(this);
  }

  public activate() {
    if (this.isActivated) {
      return;
    }

    this.play(FINISH_ANIMATION_KEYS.FINISH_ACTIVATED);
    this.isActivated = true;
  }
}
