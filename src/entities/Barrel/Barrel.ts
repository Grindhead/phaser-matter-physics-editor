import {
  PHYSICS_ENTITIES,
  PHYSICS,
  TEXTURE_ATLAS,
  BARREL_ROTATION_SPEED,
  BARREL_LAUNCH_SPEED,
} from "../../lib/constants";
import { BARREL_ANIMATION_KEYS } from "./barrelAnimations";

// Import Matter JS library type explicitly if needed, or access via scene.matter.matter
// import * as MatterJS from "matter-js";

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
    this.setOrigin(0.22, 0.5); // Set visual origin correctly

    this.play(BARREL_ANIMATION_KEYS.BARREL_IDLE);

    scene.add.existing(this);
  }

  public update(): void {
    if (this.isEntered) {
      this.angle += BARREL_ROTATION_SPEED;
    }
  }

  public enter() {
    this.play(BARREL_ANIMATION_KEYS.BARREL_ENTER);
    this.isEntered = true;
  }

  public launch(): Phaser.Math.Vector2 | null {
    if (!this.isEntered) {
      return null;
    }

    this.play(BARREL_ANIMATION_KEYS.BARREL_LAUNCH);
    this.isEntered = false;

    const launchAngleRadians = Phaser.Math.DegToRad(this.angle);
    const launchVector = new Phaser.Math.Vector2(
      Math.cos(launchAngleRadians) * BARREL_LAUNCH_SPEED,
      Math.sin(launchAngleRadians) * BARREL_LAUNCH_SPEED
    );

    return launchVector;
  }
}
