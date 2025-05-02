// EnemySmall.ts
import { EnemyBase } from "./EnemyBase";
import { ENEMY_ANIMATION_KEYS, ENEMY_ANIMATIONS } from "./enemyAnimations";
import { PHYSICS_ENTITIES } from "../../lib/constants";

export class EnemySmall extends EnemyBase {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      shapeKey: PHYSICS_ENTITIES.ENEMY, // same shape
      animKey: ENEMY_ANIMATIONS[ENEMY_ANIMATION_KEYS.ENEMY_IDLE].prefix,
      type: "enemy-small",
    });

    // scale down the display (this also scales the hit-shape in Phaser Matter):
    this.setScale(0.6);
  }
}
