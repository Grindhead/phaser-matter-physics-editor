// EnemyLarge.ts
import { EnemyBase } from "./EnemyBase";
import { ENEMY_ANIMATION_KEYS, ENEMY_ANIMATIONS } from "./enemyAnimations";
import { PHYSICS_ENTITIES } from "../../lib/constants";

export class EnemyLarge extends EnemyBase {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      shapeKey: PHYSICS_ENTITIES.ENEMY,
      animKey: ENEMY_ANIMATIONS[ENEMY_ANIMATION_KEYS.ENEMY_IDLE].prefix,
      scale: 1,
    });
  }
}
