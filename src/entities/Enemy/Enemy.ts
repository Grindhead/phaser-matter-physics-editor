import { isGroundBody } from "./../../lib/helpers/isGroundBody";
import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { ENEMY_ANIMATION_KEYS, ENEMY_ANIMATIONS } from "./enemyAnimations";

export class Enemy extends Phaser.Physics.Matter.Sprite {
  private speed = 2;
  private direction: 1 | -1 = 1;
  private platformBounds?: { left: number; right: number };

  // 🧠 Shared platform bounds cache
  private static platformCache = new Map<
    number,
    { left: number; right: number }
  >();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);
    super(
      scene.matter.world,
      x,
      y,
      TEXTURE_ATLAS,
      ENEMY_ANIMATIONS[ENEMY_ANIMATION_KEYS.ENEMY_IDLE].prefix,
      {
        shape: shapes[PHYSICS_ENTITIES.ENEMY],
      }
    );

    scene.add.existing(this);
    scene.matter.world.on("collisionstart", this.handleCollisionStart, this);

    this.setFixedRotation();
  }

  handleGameOver(): void {
    // this.setVelocity(0, 0);
  }

  update(): void {
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
  ): void {
    if (this.platformBounds) return;

    const thisBody = this.body as MatterJS.BodyType;
    const thisBodyId = thisBody.id; // Parent Body ID (e.g., 25)

    // Get all relevant body IDs for this enemy (parent + parts)
    // Note: `thisBody.parts[0]` is usually the parent body itself.
    const enemyBodyIds = thisBody.parts
      ? thisBody.parts.map((p) => p.id)
      : [thisBodyId];
    // Ensure parent ID is included even if parts array might be structured differently
    if (!enemyBodyIds.includes(thisBodyId)) {
      enemyBodyIds.push(thisBodyId);
    }

    for (const { bodyA, bodyB } of event.pairs) {
      let potentialEnemyPartOrParent: MatterJS.BodyType | null = null;
      let potentialGround: MatterJS.BodyType | null = null;

      // Check if bodyA is part of *this* enemy AND bodyB is ground
      if (enemyBodyIds.includes(bodyA.id) && isGroundBody(bodyB)) {
        potentialEnemyPartOrParent = bodyA; // The actual colliding part/parent
        potentialGround = bodyB;
      }
      // Check if bodyB is part of *this* enemy AND bodyA is ground
      else if (enemyBodyIds.includes(bodyB.id) && isGroundBody(bodyA)) {
        potentialEnemyPartOrParent = bodyB; // The actual colliding part/parent
        potentialGround = bodyA;
      }

      // If we found a valid pair involving *this* enemy instance (parent or part) and a ground body
      if (potentialEnemyPartOrParent && potentialGround) {
        // Platform found - Cache bounds using the Ground Body ID
        const groundBodyId = potentialGround.id;
        const cached = Enemy.platformCache.get(groundBodyId);
        if (cached) {
          this.platformBounds = cached;
        } else {
          const { min, max } = potentialGround.bounds;
          const bounds = { left: min.x, right: max.x };
          Enemy.platformCache.set(groundBodyId, bounds);
          this.platformBounds = bounds;
        }
        // Unregister listener and exit loop
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
