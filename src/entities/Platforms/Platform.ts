import {
  PHYSICS,
  PHYSICS_ENTITIES,
  TILE_HEIGHT,
  TILE_WIDTH,
} from "../../lib/constants";
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
    width: number, // 'width' here represents segment count
    id: string,
    isVertical: boolean = false
  ) {
    // 1. Build the visual texture first (returns/caches texture with 'id')
    buildPlatform(scene, width, id, isVertical);

    // 2. Call super() first with basic config (or none if default is okay).
    // We use the texture 'id' created/cached by buildPlatform.
    // Let Matter create a temporary body.
    super(scene.matter.world, x, y, id, undefined, { isStatic: true });

    // 3. Calculate correct physics body dimensions based on segment count and orientation
    const bodyWidth = isVertical ? TILE_HEIGHT : TILE_WIDTH * width;
    const bodyHeight = isVertical ? TILE_WIDTH * width : TILE_HEIGHT;

    // 4. Retrieve collision filter data from physics.json
    const platformData =
      scene.cache.json.get(PHYSICS)[PHYSICS_ENTITIES.PLATFORM];
    const { collisionFilter } = platformData;

    // 5. Create the precise Matter.js rectangle body
    const platformBody = scene.matter.bodies.rectangle(
      0, // Use 0, 0 for local position relative to the sprite center
      0,
      bodyWidth,
      bodyHeight,
      {
        label: "platform",
        isStatic: true, // Ensure static is set on the body itself
        collisionFilter: {
          category: collisionFilter.category,
          group: collisionFilter.group,
          mask: collisionFilter.mask,
        },
      }
    );

    // 6. Replace the temporary body with the correctly sized one
    this.setExistingBody(platformBody);

    // 7. Set position *after* setting the body
    // (super() already set initial position, but reaffirming might be needed
    // depending on how setExistingBody interacts with sprite position)
    this.setPosition(x, y);

    // Store segment count and vertical status
    this.segmentCount = width;
    this.isVertical = isVertical;

    // 8. Apply visual rotation AFTER setting the body if vertical
    if (isVertical) {
      this.setAngle(90);
    }

    // Add to scene
    scene.add.existing(this);
  }
}
