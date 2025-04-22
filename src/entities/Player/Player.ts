import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import {
  createAnimationChain,
  createAnimations,
} from "../../lib/helpers/createAnimations";
import { isGroundBody } from "../../lib/helpers/isGroundBody";
import { isPlayerBody } from "../../lib/helpers/isPlayerBody";
import { PLAYER_ANIMATION_KEYS, PLAYER_ANIMATIONS } from "./playerAnimations";

const JUMP_VELOCITY = -8;
const WALK_VELOCITY = 3;
const FALL_DELAY_MS = 150;

export class Player extends Phaser.Physics.Matter.Sprite {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<string, Phaser.Input.Keyboard.Key>;
  private isGrounded = false;
  private groundContacts = new Set<MatterJS.BodyType>();
  private currentAnimKey = "";
  private jumpInProgress = false;
  private lastJumpTime = 0;
  private isAlive = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const shapes = scene.cache.json.get(PHYSICS);

    super(
      scene.matter.world,
      x,
      y,
      TEXTURE_ATLAS,
      PLAYER_ANIMATIONS[PLAYER_ANIMATION_KEYS.DUCK_IDLE].prefix + "0001.png",
      {
        shape: shapes[PHYSICS_ENTITIES.DUCK_IDLE],
      }
    );

    scene.matter.world.on("collisionstart", this.handleCollisionStart, this);
    scene.matter.world.on("collisionend", this.handleCollisionEnd, this);

    this.setFixedRotation();
    this.setupControls();
    this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_IDLE, true);

    this.isAlive = true;

    createAnimationChain(this, PLAYER_ANIMATIONS);

    scene.add.existing(this);
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

  update(_time: number, _delta: number): void {
    if (!this.isAlive) {
      return;
    }

    if (!this.cursors || !this.wasd) return;

    const left = this.cursors.left?.isDown || this.wasd.A?.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D?.isDown;
    const up = this.cursors.up?.isDown || this.wasd.W?.isDown;

    let targetVelocityX = 0;
    if (left) {
      targetVelocityX = -WALK_VELOCITY;
      this.flipX = true;
    } else if (right) {
      targetVelocityX = WALK_VELOCITY;
      this.flipX = false;
    }
    this.setVelocityX(targetVelocityX);

    // Jump
    if (up && this.isGrounded && !this.jumpInProgress) {
      this.setVelocityY(JUMP_VELOCITY);
      this.jumpInProgress = true;
      this.lastJumpTime = this.scene.time.now;
      this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_JUMP, true);
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (!this.isGrounded) {
          this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_FALL, true);
        }
      });
      return;
    }

    // In air
    if (!this.isGrounded && !this.jumpInProgress) {
      if (
        this.currentAnimKey !== PLAYER_ANIMATION_KEYS.DUCK_FALL &&
        this.scene.time.now - this.lastJumpTime > FALL_DELAY_MS
      ) {
        this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_FALL);
      }
      return;
    }

    // On ground
    if (this.isGrounded && !this.jumpInProgress) {
      if (left || right) {
        this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_RUN);
      } else {
        this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_IDLE);
      }
    }
  }

  private playAnimation(key: string, force = false) {
    if (this.currentAnimKey === key) {
      if (force) this.anims.stop();
      else return;
    }
    this.play(key);
    this.currentAnimKey = key;
  }

  private handleCollisionStart(
    event: Phaser.Physics.Matter.Events.CollisionStartEvent
  ) {
    for (const { bodyA, bodyB } of event.pairs) {
      if (isPlayerBody(bodyA) && isGroundBody(bodyB)) {
        this.groundContacts.add(bodyB);
      } else if (isPlayerBody(bodyB) && isGroundBody(bodyA)) {
        this.groundContacts.add(bodyA);
      }
    }

    const wasGrounded = this.isGrounded;
    this.isGrounded = this.groundContacts.size > 0;

    if (this.isGrounded && !wasGrounded) {
      this.jumpInProgress = false;
    }
  }

  private handleCollisionEnd(
    event: Phaser.Physics.Matter.Events.CollisionEndEvent
  ) {
    for (const { bodyA, bodyB } of event.pairs) {
      if (isPlayerBody(bodyA) && isGroundBody(bodyB)) {
        this.groundContacts.delete(bodyB);
      } else if (isPlayerBody(bodyB) && isGroundBody(bodyA)) {
        this.groundContacts.delete(bodyA);
      }
    }

    this.isGrounded = this.groundContacts.size > 0;
  }

  public kill() {
    this.isAlive = false;
    this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_DEAD);
    this.setVelocityX(0);
    this.setVelocityY(0);
    this.setStatic(true);
  }
}
