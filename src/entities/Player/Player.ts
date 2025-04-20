import { ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { PLAYER_ANIMATION_KEYS, PLAYER_ANIMATIONS } from "./playerAnimations";

export class Player extends Phaser.Physics.Matter.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);

    super(
      scene.matter.world,
      x,
      y,
      TEXTURE_ATLAS,
      PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.IDLE].prefix + "0001.png",
      {
        shape: shapes[ENTITIES.PLAYER],
      }
    );
    this.name = ENTITIES.PLAYER;
    scene.add.existing(this);
  }
}
