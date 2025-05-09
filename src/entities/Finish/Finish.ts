import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { FINISH_ANIMATION_KEYS, FINISH_ANIMATIONS } from "./finishAnimations";

export interface FinishLineInterface {
  x: number;
  y: number;
}
export class Finish
  extends Phaser.Physics.Matter.Sprite
  implements FinishLineInterface
{
  private isActivated: boolean = false;
  public type: string = "finish";

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);

    super(
      scene.matter.world,
      x,
      y,
      TEXTURE_ATLAS,
      FINISH_ANIMATIONS[FINISH_ANIMATION_KEYS.FINISH_IDLE].prefix + ".png",
      {
        shape: shapes[PHYSICS_ENTITIES.FINISH],
        isStatic: true,
        isSensor: true,
      }
    );

    this.setOrigin(0.3, 0.5);
    this.setDepth(5);

    scene.add.existing(this);
  }

  public activate() {
    if (this.isActivated) {
      return;
    }

    this.play(FINISH_ANIMATION_KEYS.FINISH_ACTIVATED);

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.play(FINISH_ANIMATION_KEYS.FINISH_ACTIVE);
    });

    this.isActivated = true;
  }
}
