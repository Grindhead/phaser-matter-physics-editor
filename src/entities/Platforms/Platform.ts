import {
  PHYSICS,
  PHYSICS_ENTITIES,
  TILE_HEIGHT,
  TILE_WIDTH,
} from "../../lib/constants";
import { buildPlatform } from "../../lib/level-generation/platformBuilder";

export interface PlatformInterface {
  scene: Phaser.Scene;
  x: number;
  y: number;
  segmentCount: number;
  id: string;
  isVertical: boolean;
  segmentWidth?: number;
}

export class Platform
  extends Phaser.Physics.Matter.Sprite
  implements PlatformInterface
{
  public segmentCount: number;
  public isVertical: boolean;
  public id: string;
  public hasCrate: boolean = false;
  public hasEnemy: boolean = false;
  public segmentWidth: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    segmentCount: number,
    id: string,
    isVertical: boolean = false,
    segmentWidth: number = 32 // Default to 32 if not provided
  ) {
    // 1. Build the visual texture first (returns/caches texture with 'id')
    buildPlatform(scene, segmentCount, id, isVertical, segmentWidth);

    super(scene.matter.world, x, y, id, undefined, { isStatic: true });

    // Store the id and segment width
    this.id = id;
    this.segmentWidth = segmentWidth;

    // 3. Calculate correct physics body dimensions based on segment count, orientation, and width
    const bodyWidth = isVertical ? segmentWidth : segmentWidth * segmentCount;
    const bodyHeight = isVertical ? segmentWidth * segmentCount : segmentWidth;

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
    this.segmentCount = segmentCount;
    this.isVertical = isVertical;

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Gets the bounds of the platform as a rectangle
   * @param output Optional rectangle to store the result in
   * @returns A Phaser.Geom.Rectangle representing the bounds of this platform
   */
  getBounds<O extends Phaser.Geom.Rectangle>(output?: O): O {
    // Get the current world position of the platform
    const x = this.x;
    const y = this.y;

    // Calculate width and height based on segment count, orientation, and width
    const width = this.isVertical
      ? this.segmentWidth
      : this.segmentWidth * this.segmentCount;
    const height = this.isVertical
      ? this.segmentWidth * this.segmentCount
      : this.segmentWidth;

    // Calculate the top-left corner of the platform (considering the platform is centered)
    const left = x - width / 2;
    const top = y - height / 2;

    // Use the provided output rectangle or create a new one
    const bounds =
      output || (new Phaser.Geom.Rectangle(left, top, width, height) as O);

    // If bounds was provided, set its properties
    if (output) {
      bounds.setTo(left, top, width, height);
    }

    return bounds;
  }

  /**
   * Sets the tint color of this platform
   * @param tint The tint color to apply
   * @returns this (for chaining)
   */
  setTint(tint: number): this {
    // Apply tint to the sprite
    super.setTint(tint);
    return this;
  }

  /**
   * Clears the tint effect from this platform
   * @returns this (for chaining)
   */
  clearTint(): this {
    // Clear the tint (reset to white)
    super.clearTint();
    return this;
  }
}
