import { PHYSICS, PHYSICS_ENTITIES } from "../../lib/constants";
import { buildPlatform } from "../../lib/helpers/level-generation/platformBuilder";

export class Platform extends Phaser.Physics.Matter.Sprite {
  public segmentCount: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    id: string
  ) {
    buildPlatform(scene, width, id);

    // Retrieve platform data from the physics JSON
    const platformData =
      scene.cache.json.get(PHYSICS)[PHYSICS_ENTITIES.PLATFORM];
    const { collisionFilter } = platformData;

    // Define body configuration with the desired label
    const bodyConfig = {
      label: "platform",
      isStatic: platformData.isStatic,
      collisionFilter: {
        category: collisionFilter.category,
        group: collisionFilter.group,
        mask: collisionFilter.mask,
      },
    };

    // Create the Matter Sprite with the specified body configuration
    super(scene.matter.world, x, y, id, undefined, bodyConfig);

    this.segmentCount = width; // Store the width/segment count AFTER super()

    scene.add.existing(this);
  }
}
