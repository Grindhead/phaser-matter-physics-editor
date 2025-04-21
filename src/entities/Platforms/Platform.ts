import { ENTITIES } from "../../lib/constants";
import { buildPlatform } from "../../lib/helpers/platformBuilder";

export class Platform extends Phaser.Physics.Matter.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    id: string
  ) {
    buildPlatform(scene, width, id);

    super(scene.matter.world, x, y, id);

    this.setStatic(true);
    this.setIgnoreGravity(true);

    this.name = ENTITIES.PLATFORM;
    scene.add.existing(this);
  }
}
