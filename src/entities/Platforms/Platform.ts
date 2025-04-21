import { PHYSICS, PHYSICS_ENTITIES } from "../../lib/constants";
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

    // rip the platform data from the physics json
    const platformData =
      scene.cache.json.get(PHYSICS)[PHYSICS_ENTITIES.PLATFORM];
    // get the collision filter from the platform data
    const { collisionFilter } = platformData;

    // set the properties of the platform to match the physics json
    this.setStatic(platformData.isStatic);
    this.setCollisionCategory(collisionFilter.category);
    this.setCollisionGroup(collisionFilter.group);
    this.setCollidesWith(collisionFilter.mask);

    scene.add.existing(this);
  }
}
