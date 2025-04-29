import {
  PHYSICS_ENTITIES,
  PHYSICS,
  TEXTURE_ATLAS,
  BARREL_ROTATION_SPEED,
} from "../../lib/constants";
import { BARREL_ANIMATION_KEYS } from "./barrelAnimations";

export class Barrel extends Phaser.Physics.Matter.Sprite {
  public isEntered: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);
    super(scene.matter.world, x, y, TEXTURE_ATLAS, undefined, {
      shape: shapes[PHYSICS_ENTITIES.BARREL],
      isStatic: true,
      isSensor: true,
    });

    this.angle = -90;
    this.setOrigin(0.5, 0.5);
    this.play(BARREL_ANIMATION_KEYS.BARREL_IDLE);

    scene.add.existing(this);
  }

  public update(): void {
    if (this.isEntered) {
      this.angle += BARREL_ROTATION_SPEED;
    }
  }

  public enter() {
    console.log("[Barrel] Enter called, isEntered = true");

    this.play(BARREL_ANIMATION_KEYS.BARREL_ENTER);
    this.isEntered = true;
  }

  public launch() {
    if (!this.isEntered) {
      console.log("[Barrel] Launch called, but isEntered = false");
      return;
    }

    this.play(BARREL_ANIMATION_KEYS.BARREL_LAUNCH);
    this.isEntered = false;
    console.log("[Barrel] Launch called, isEntered = false");
  }
}
