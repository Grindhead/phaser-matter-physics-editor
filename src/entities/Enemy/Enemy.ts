import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { ENEMY_ANIMATION_KEYS, ENEMY_ANIMATIONS } from "./enemyAnimations";

export class Enemy extends Phaser.Physics.Matter.Sprite {
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
  }
}
