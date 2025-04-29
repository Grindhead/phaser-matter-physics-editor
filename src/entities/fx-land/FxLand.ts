import { TEXTURE_ATLAS } from "../../lib/constants";
import { FX_ANIMATIONS, FX_LAND_ANIMATION_KEYS } from "./fxAnimations";

export class FXLand extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(
      scene,
      x,
      y,
      TEXTURE_ATLAS,
      FX_ANIMATIONS[FX_LAND_ANIMATION_KEYS.FX_LAND].prefix + "0001.png"
    );

    this.setScale(0.3);

    this.play(FX_LAND_ANIMATION_KEYS.FX_LAND);

    scene.add.existing(this);

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.anims.currentAnim?.key === FX_LAND_ANIMATION_KEYS.FX_LAND) {
        this.destroy(true);
      }
    });
  }
}
