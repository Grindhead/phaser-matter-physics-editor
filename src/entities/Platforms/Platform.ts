import { PHYSICS, PHYSICS_ENTITIES } from "../../lib/constants";
import { buildPlatform } from "../../lib/level-generation/platformBuilder";

export class Platform extends Phaser.Physics.Matter.Sprite {
  public segmentCount: number;
  public isVertical: boolean;
  public hasCrate: boolean = false;
  public hasEnemy: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    id: string,
    isVertical: boolean = false
  ) {
    buildPlatform(scene, width, id, isVertical);

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

    this.segmentCount = width; // Store the width parameter directly as segment count
    this.isVertical = isVertical;

    // Apply 90-degree rotation for vertical walls
    if (isVertical) {
      this.setAngle(90);

      // Get the current physics body
      const body = this.body as MatterJS.BodyType;

      // For vertical platforms, we need to swap width and height in the body
      // Matter.js doesn't automatically adjust the physics body when rotating sprites
      if (body) {
        // Destroy current body
        scene.matter.world.remove(body);

        // Create a new body with swapped dimensions
        const bounds = this.getBounds();
        const newWidth = bounds.height;
        const newHeight = bounds.width;

        // Create a new rectangle body
        const newBody = scene.matter.bodies.rectangle(
          x,
          y,
          newWidth,
          newHeight,
          {
            label: "platform",
            isStatic: true,
            collisionFilter: {
              category: collisionFilter.category,
              group: collisionFilter.group,
              mask: collisionFilter.mask,
            },
          }
        );

        // Set the new body
        this.setExistingBody(newBody);
      }
    }

    scene.add.existing(this);
  }
}
