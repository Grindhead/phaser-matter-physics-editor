import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { FINISH_ANIMATION_KEYS, FINISH_ANIMATIONS } from "./finishAnimations";

export class Finish extends Phaser.Physics.Matter.Sprite {
  private isActivated: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);

    super(scene.matter.world, x, y, TEXTURE_ATLAS, undefined, {
      shape: shapes[PHYSICS_ENTITIES.FINISH],
      isStatic: true,
      isSensor: true,
    });

    this.setOrigin(0.3, 0.5);

    // Set depth to ensure finish line renders behind player
    // Player will have a higher depth value (>5)
    this.setDepth(5);

    this.play(FINISH_ANIMATION_KEYS.FINISH_IDLE);

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
