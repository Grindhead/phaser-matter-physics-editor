import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { PLAYER_ANIMATION_KEYS, PLAYER_ANIMATIONS } from "./playerAnimations";

const JUMP_VELOCITY = -8;
const WALK_VELOCITY = 3;

/**
 * Represents the player entity in the game.
 * Handles physics, movement, animations, and input (keyboard or mobile).
 */
export class Player extends Phaser.Physics.Matter.Sprite {
  /**
   * Keyboard cursor controls (arrow keys).
   */
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  /**
   * WASD keys for movement.
   */
  private wasd?: Record<string, Phaser.Input.Keyboard.Key>;

  /**
   * Whether the player is currently touching the ground.
   */
  private isGrounded = false;

  /**
   * Creates a new player instance.
   * @param scene - The current Phaser scene.
   * @param x - The x coordinate to spawn the player at.
   * @param y - The y coordinate to spawn the player at.
   */
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

  /**
   * Defines and creates all player-related animations.
   */
  private createAnimations() {
    this.anims.create({
      key: PLAYER_ANIMATION_KEYS.IDLE,
      frames: this.anims.generateFrameNames(TEXTURE_ATLAS, {
        prefix: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.IDLE].prefix,
        end: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.IDLE].frames,
        zeroPad: 4,
        suffix: ".png",
        start: 1,
      }),
      repeat: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.IDLE].loop,
    });

    this.anims.create({
      key: PLAYER_ANIMATION_KEYS.JUMP,
      frames: this.anims.generateFrameNames(TEXTURE_ATLAS, {
        prefix: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.JUMP].prefix,
        end: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.JUMP].frames,
        zeroPad: 4,
        suffix: ".png",
        start: 1,
      }),
      repeat: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.JUMP].loop,
    });

    this.anims.create({
      key: PLAYER_ANIMATION_KEYS.RUN,
      frames: this.anims.generateFrameNames(TEXTURE_ATLAS, {
        prefix: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.RUN].prefix,
        end: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.RUN].frames,
        zeroPad: 4,
        suffix: ".png",
        start: 1,
      }),
      repeat: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.RUN].loop,
    });

    this.anims.create({
      key: PLAYER_ANIMATION_KEYS.FALL,
      frames: this.anims.generateFrameNames(TEXTURE_ATLAS, {
        prefix: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.FALL].prefix,
        end: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.FALL].frames,
        start: 1,
        zeroPad: 4,
        suffix: ".png",
      }),
      repeat: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.FALL].loop,
    });

    this.anims.create({
      key: PLAYER_ANIMATION_KEYS.DEAD,
      frames: this.anims.generateFrameNames(TEXTURE_ATLAS, {
        prefix: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.DEAD].prefix,
        end: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.DEAD].frames,
        zeroPad: 4,
        suffix: ".png",
        start: 1,
      }),
      repeat: PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.DEAD].loop,
    });
  }

  /**
   * Sets up player input controls (desktop or mobile).
   */
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

  /**
   * Placeholder for mobile control initialization.
   */
  private createMobileControls() {}

  /**
   * Main update loop. Handles movement and jumping.
   */
  update(): void {
    if (!this.cursors || !this.wasd) return;

    const left = this.cursors.left?.isDown || this.wasd.A?.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D?.isDown;
    const up = this.cursors.up?.isDown || this.wasd.W?.isDown;

    if (left) {
      this.playRunAnimation();
      this.setVelocityX(-WALK_VELOCITY);
    } else if (right) {
      this.playRunAnimation();
      this.setVelocityX(WALK_VELOCITY);
    } else {
      this.playIdleAnimation();
      this.setVelocityX(0);
    }

    if (
      (up && this.isGrounded) ||
      (up && Math.abs(this.getVelocity().y) < 0.001)
    ) {
      this.setVelocityY(JUMP_VELOCITY);
      this.playJumpAnimation();
    }
  }

  /**
   * Checks if the player is grounded and moving horizontally.
   * @returns True if moving on the platform.
   */
  private isMovingOnPlatform(): boolean {
    return this.isGrounded && Math.abs(this.getVelocity().x) > 0;
  }

  /**
   * Handles collision start event.
   * Used to detect ground contact.
   * @param event - Matter collision event.
   */
  private handleCollisionStart(
    event: Phaser.Physics.Matter.Events.CollisionStartEvent
  ) {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;

      if (this.isPlayerBody(bodyA) && this.isGroundBody(bodyB)) {
        this.playIdleAnimation();
        this.isGrounded = true;
      } else if (this.isPlayerBody(bodyB) && this.isGroundBody(bodyA)) {
        this.playIdleAnimation();
        this.isGrounded = true;
      }
    }
  }

  /**
   * Plays the idle animation if the player is grounded and not moving.
   */
  private playIdleAnimation() {
    if (!this.isGrounded) return;
    if (this.isMovingOnPlatform()) return;
    if (this.anims.currentAnim?.key === PLAYER_ANIMATION_KEYS.IDLE) return;

    this.play(PLAYER_ANIMATION_KEYS.IDLE);
  }

  /**
   * Plays the jump animation, then triggers the fall animation when complete.
   */
  private playJumpAnimation() {
    this.play(PLAYER_ANIMATION_KEYS.JUMP);

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.playFallAnimation();
    });
  }

  /**
   * Plays the falling animation.
   */
  private playFallAnimation() {
    if (this.anims.currentAnim?.key === PLAYER_ANIMATION_KEYS.FALL) return;
    this.play(PLAYER_ANIMATION_KEYS.FALL);
  }

  /**
   * Plays the run animation if grounded and moving.
   */
  private playRunAnimation() {
    if (!this.isGrounded) return;
    if (!this.isMovingOnPlatform()) return;
    if (this.anims.currentAnim?.key === PLAYER_ANIMATION_KEYS.RUN) return;

    this.play(PLAYER_ANIMATION_KEYS.RUN);
  }

  /**
   * Handles collision end event.
   * Used to detect when the player is no longer grounded.
   * @param event - Matter collision event.
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
   * Checks if the body is the player's physics body.
   * @param body - Matter body to check.
   * @returns True if it's the player body.
   */
  private isPlayerBody(body: MatterJS.BodyType): boolean {
    return body.label === "duck"; // Assumes duck-body is the root body
  }

  /**
   * Checks if the body is a valid ground type (platform or crate).
   * @param body - Matter body to check.
   * @returns True if it's a ground body.
   */
  private isGroundBody(body: MatterJS.BodyType): boolean {
    const label = body.label?.toLowerCase() ?? "";

    return ["platform", "crate-big", "crate-small"].includes(label);
  }
}
