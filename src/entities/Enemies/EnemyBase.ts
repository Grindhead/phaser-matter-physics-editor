// EnemyBase.ts
import { isGroundBody } from "../../lib/helpers/isGroundBody";
import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";

// Define a type representing the values of PHYSICS_ENTITIES
type PhysicsEntityKey =
  (typeof PHYSICS_ENTITIES)[keyof typeof PHYSICS_ENTITIES];

interface EnemyConfig {
  shapeKey: PhysicsEntityKey;
  animKey: string;
  scale?: number;
}

export abstract class EnemyBase extends Phaser.Physics.Matter.Sprite {
  private speed: number;
  private direction: 1 | -1 = 1;
  private platformBounds?: { left: number; right: number };

  // Shared cache by ground‐body ID
  private static platformCache = new Map<
    number,
    { left: number; right: number }
  >();

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    { shapeKey, animKey, scale = 1 }: EnemyConfig
  ) {
    const shapes = scene.cache.json.get(PHYSICS);
    super(scene.matter.world, x, y, TEXTURE_ATLAS, animKey, {
      shape: shapes[shapeKey],
    });

    this.speed = Phaser.Math.Between(1, 1.3);
    if (scale !== 1) this.setScale(scale);

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
