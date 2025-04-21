import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { PLAYER_ANIMATION_KEYS, PLAYER_ANIMATIONS } from "./playerAnimations";

const JUMP_VELOCITY = -8;
const WALK_VELOCITY = 3;

export class Player extends Phaser.Physics.Matter.Sprite {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<string, Phaser.Input.Keyboard.Key>;
  private isGrounded = false;

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

    this.scene.matter.world.on(
      "collisionstart",
      this.handleCollisionStart,
      this
    );
    this.scene.matter.world.on("collisionend", this.handleCollisionEnd, this);

    this.setFixedRotation();
    this.setupControls();
    this.createAnimations();

    this.playIdleAnimation();

    scene.add.existing(this);
  }

  private createAnimations() {
    this.anims.create({
      key: PLAYER_ANIMATION_KEYS.IDLE,
      frames: this.anims.generateFrameNames(TEXTURE_ATLAS, {
        prefix: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.IDLE].prefix,
        end: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.IDLE].frames,
        zeroPad: 4,
        suffix: ".png",
      }),
      repeat: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.IDLE].loop,
    });
  }

  private setupControls() {
    const isDesktop = this.scene.sys.game.device.os.desktop;
    if (isDesktop) {
      this.cursors = this.scene.input.keyboard?.createCursorKeys();
      this.wasd = this.scene.input.keyboard?.addKeys("W,A,D") as Record<
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

    if (
      (up && this.isGrounded) ||
      (up && Math.abs(this.getVelocity().y) < 0.001)
    ) {
      this.setVelocityY(JUMP_VELOCITY);
    }
  }

  /**
   * Handles the collision start event
   * @param event
   */

  private handleCollisionStart(
    event: Phaser.Physics.Matter.Events.CollisionStartEvent
  ) {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;

      if (this.isPlayerBody(bodyA) && this.isGroundBody(bodyB)) {
        if (!this.isGrounded) {
          this.playIdleAnimation();
        }

        this.isGrounded = true;
      } else if (this.isPlayerBody(bodyB) && this.isGroundBody(bodyA)) {
        if (!this.isGrounded) {
          this.playIdleAnimation();
        }

        this.isGrounded = true;
      }
    }
  }

  private playIdleAnimation() {
    this.play(PLAYER_ANIMATION_KEYS.IDLE);
  }

  private playJumpAnimation() {
    this.play(PLAYER_ANIMATION_KEYS.JUMP);
  }

  /**
   * Handles the collision end event
   * @param event
   */

  private handleCollisionEnd(
    event: Phaser.Physics.Matter.Events.CollisionEndEvent
  ) {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;

      if (this.isPlayerBody(bodyA) && this.isGroundBody(bodyB)) {
        this.isGrounded = false;
      } else if (this.isPlayerBody(bodyB) && this.isGroundBody(bodyA)) {
        this.isGrounded = false;
      }
    }
  }

  /**
   * Checks if the body is the player's body
   * @param body
   * @returns
   */

  private isPlayerBody(body: MatterJS.BodyType): boolean {
    return body.label === "duck"; // Assumes duck-body is the root body
  }

  /**
   * Checks if the body is a ground body
   * @param body
   * @returns
   */

  private isGroundBody(body: MatterJS.BodyType): boolean {
    const label = body.label?.toLowerCase() ?? "";

    return ["platform", "crate-big", "crate-small"].includes(label);
  }
}
