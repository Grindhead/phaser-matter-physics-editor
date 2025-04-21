import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { KEYS } from "../../lib/keys";
import { PLAYER_ANIMATION_KEYS, PLAYER_ANIMATIONS } from "./playerAnimations";

const JUMP_VELOCITY = -5;
const WALK_VELOCITY = 3;

export class Player extends Phaser.Physics.Matter.Sprite {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);

    super(
      scene.matter.world,
      x,
      y,
      TEXTURE_ATLAS,
      PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.IDLE].prefix + "0001.png",
      {
        shape: shapes[PHYSICS_ENTITIES.DUCK_IDLE],
      }
    );

    this.setFixedRotation();
    scene.add.existing(this);
    this.setupControls();
  }

  private setupControls() {
    const isDesktop = this.scene.sys.game.device.os.desktop;
    if (isDesktop) {
      this.cursors = this.scene.input.keyboard?.createCursorKeys();
      this.wasd = this.scene.input.keyboard?.addKeys("W,A,S,D") as Record<
        string,
        Phaser.Input.Keyboard.Key
      >;
    } else {
      this.createMobileControls();
    }
  }

  private createMobileControls() {}

  update(): void {
    if (!this.cursors || !this.wasd) return;

    const left = this.cursors.left?.isDown || this.wasd.A?.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D?.isDown;
    const up = this.cursors.up?.isDown || this.wasd.W?.isDown;

    if (left) {
      this.setVelocityX(-WALK_VELOCITY);
    } else if (right) {
      this.setVelocityX(WALK_VELOCITY);
    } else {
      this.setVelocityX(0);
    }

    if (up) {
      this.setVelocityY(JUMP_VELOCITY);
    }
  }
}
