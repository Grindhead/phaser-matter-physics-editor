import { isGroundBody } from "../../lib/helpers/isGroundBody";
import { PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";

export interface EnemyInterface {
  x: number;
  y: number;
  scale?: number;
  type: "enemy-large" | "enemy-small";
}

export abstract class EnemyBase
  extends Phaser.Physics.Matter.Sprite
  implements EnemyInterface
{
  private speed: number;
  private direction: 1 | -1 = 1;
  private platformBounds?: { left: number; right: number };
  public type: "enemy-large" | "enemy-small";
  public shapeKey: string;
  public animKey: string;

  // Shared cache by ground‐body ID
  private static platformCache = new Map<
    number,
    { left: number; right: number }
  >();

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    shapeKey: string,
    animKey: string,
    scale = 1,
    type: "enemy-large" | "enemy-small"
  ) {
    const shapes = scene.cache.json.get(PHYSICS);
    super(scene.matter.world, x, y, TEXTURE_ATLAS, animKey, {
      shape: shapes[shapeKey],
    });

    this.shapeKey = shapeKey;
    this.animKey = animKey;
    this.speed = Phaser.Math.Between(1, 1.3);
    if (scale !== 1) this.setScale(scale);
    this.type = type;

    scene.add.existing(this);
    scene.matter.world.on("collisionstart", this.handleCollisionStart, this);
    this.setFixedRotation();
  }

  handleGameOver() {
    this.setVelocity(0, 0);
  }

  update() {
    if (!this.platformBounds) return;
    this.setVelocity(this.speed * this.direction, 0);

    const { left, right } = this.getBounds();
    const { left: boundLeft, right: boundRight } = this.platformBounds;

    if (right >= boundRight && this.direction === 1) {
      this.direction = -1;
    } else if (left <= boundLeft && this.direction === -1) {
      this.direction = 1;
    }
  }

  /**
   * Gets the bounds of the enemy as a rectangle
   * @param output Optional rectangle to store the result in
   * @returns A Phaser.Geom.Rectangle representing the bounds of this enemy
   */
  getBounds<O extends Phaser.Geom.Rectangle>(output?: O): O {
    // Get the current world position of the enemy
    const x = this.x;
    const y = this.y;

    // Get the display width and height, accounting for scale
    const width = this.displayWidth;
    const height = this.displayHeight;

    // Calculate the top-left corner
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
   * Sets the tint color of this enemy
   * @param tint The tint color to apply
   * @returns this (for chaining)
   */
  setTint(tint: number): this {
    // Apply tint to the sprite
    super.setTint(tint);
    return this;
  }

  /**
   * Clears the tint effect from this enemy
   * @returns this (for chaining)
   */
  clearTint(): this {
    // Clear the tint (reset to white)
    super.clearTint();
    return this;
  }

  private handleCollisionStart(
    event: Phaser.Physics.Matter.Events.CollisionStartEvent
  ) {
    if (this.platformBounds) return;

    const body = this.body as MatterJS.BodyType;
    const ids = body.parts.map((p) => p.id);
    if (!ids.includes(body.id)) ids.push(body.id);

    for (const { bodyA, bodyB } of event.pairs) {
      let enemyPart: MatterJS.BodyType | null = null;
      let ground: MatterJS.BodyType | null = null;

      if (ids.includes(bodyA.id) && isGroundBody(bodyB)) {
        enemyPart = bodyA;
        ground = bodyB;
      } else if (ids.includes(bodyB.id) && isGroundBody(bodyA)) {
        enemyPart = bodyB;
        ground = bodyA;
      }

      if (enemyPart && ground) {
        const gid = ground.id;
        const cached = EnemyBase.platformCache.get(gid);
        if (cached) {
          this.platformBounds = cached;
        } else {
          const { min, max } = ground.bounds;
          const bounds = { left: min.x, right: max.x };
          EnemyBase.platformCache.set(gid, bounds);
          this.platformBounds = bounds;
        }
        this.scene.matter.world.off(
          "collisionstart",
          this.handleCollisionStart,
          this
        );
        break;
      }
    }
  }
}
