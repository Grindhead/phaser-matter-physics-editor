import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { createAnimations } from "../../lib/helpers/createAnimations";
import { COIN_ANIMATION_KEYS, COIN_ANIMATIONS } from "./coinAnimations";

export class Coin extends Phaser.Physics.Matter.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);
    super(
      scene.matter.world,
      x,
      y,
      TEXTURE_ATLAS,
      COIN_ANIMATIONS[COIN_ANIMATION_KEYS.COIN_IDLE].prefix + "0001.png",
      {
        shape: shapes[PHYSICS_ENTITIES.COIN],
        isStatic: true,
        isSensor: true,
      }
    );

    createAnimations(
      this,
      this.anims.animationManager,
      TEXTURE_ATLAS,
      COIN_ANIMATIONS
    );

    this.play(COIN_ANIMATION_KEYS.COIN_IDLE);

    scene.add.existing(this);
  }

  public collect() {
    this.play(COIN_ANIMATION_KEYS.COIN_COLLECT);
    this.scene.matter.world.remove(this);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.anims.currentAnim?.key === COIN_ANIMATION_KEYS.COIN_COLLECT) {
        this.destroy(true);
      }
    });
  }
}
