import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { createAnimationChain } from "../../lib/helpers/createAnimations";
import { isGroundBody } from "../../lib/helpers/isGroundBody";
import { isPlayerBody } from "../../lib/helpers/isPlayerBody";
import { FXLand } from "../fx-land/FxLand";
import { Barrel } from "../Barrel/Barrel";
import { PLAYER_ANIMATION_KEYS, PLAYER_ANIMATIONS } from "./playerAnimations";

const JUMP_VELOCITY = -9;
const WALK_VELOCITY = 3;
const FALL_DELAY_MS = 150;
const BARREL_LAUNCH_VELOCITY = 12;
const BARREL_EXIT_COOLDOWN_MS = 200;

export class Player extends Phaser.Physics.Matter.Sprite {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<string, Phaser.Input.Keyboard.Key>;
  private isGrounded = false;
  private groundContacts = new Set<MatterJS.BodyType>();
  private currentAnimKey = "";
  private jumpInProgress = false;
  private lastJumpTime = 0;
  private isAlive = true;
  private isLevelComplete = false;
  private justLanded = false;
  public recentlyExitedBarrel: boolean = false;
  public isInBarrel = false;
  private currentBarrel: Barrel | null = null;

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
    this.isInBarrel = false;
    this.currentBarrel = null;
    this.recentlyExitedBarrel = false;

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

  update(): void {
    if (!this.isAlive) {
      return;
    }

    if (this.isInBarrel && this.currentBarrel) {
      this.handleInBarrelState();
      return;
    }

    if (!this.cursors || !this.wasd) return;

    const left = this.cursors.left?.isDown || this.wasd.A?.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D?.isDown;
    const up = this.cursors.up?.isDown || this.wasd.W?.isDown;

    if (!this.isLevelComplete) {
      let targetVelocityX = 0;
      if (left) {
        targetVelocityX = -WALK_VELOCITY;
        this.flipX = true;
      } else if (right) {
        targetVelocityX = WALK_VELOCITY;
        this.flipX = false;
      }
      if (!this.recentlyExitedBarrel) {
        this.setVelocityX(targetVelocityX);
      }

      if (up && this.isGrounded && !this.isInBarrel) {
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
    }

    if (!this.isGrounded) {
      if (!this.jumpInProgress) {
        if (
          this.currentAnimKey !== PLAYER_ANIMATION_KEYS.DUCK_FALL &&
          this.scene.time.now - this.lastJumpTime > FALL_DELAY_MS
        ) {
          this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_FALL);
        }
      }
    } else if (this.isGrounded && !this.jumpInProgress) {
      if (this.justLanded) {
        const left = this.cursors?.left?.isDown || this.wasd?.A?.isDown;
        const right = this.cursors?.right?.isDown || this.wasd?.D?.isDown;

        if (!left && !right) {
          this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_IDLE, false);
        } else {
          this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_RUN);
        }
        this.justLanded = false;
      } else {
        if (this.isLevelComplete) {
          this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_IDLE, false);
        } else {
          if (this.body && Math.abs(this.body.velocity.x) > 0.1) {
            this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_RUN);
          } else {
            this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_IDLE, false);
          }
        }
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
      this.justLanded = true;

      new FXLand(this.scene, this.x, this.getBounds().bottom);
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

  private handleInBarrelState(): void {
    if (!this.currentBarrel) return;

    this.setPosition(this.currentBarrel.x, this.currentBarrel.y);
    this.setVelocity(0, 0);

    const up = this.cursors?.up?.isDown || this.wasd?.W?.isDown;
    if (up) {
      this.currentBarrel.launch();
      this.exitBarrel();
    }
  }

  public enterBarrel(barrel: Barrel): void {
    if (this.isInBarrel || !this.body) return;

    this.isInBarrel = true;
    this.currentBarrel = barrel;
    this.isGrounded = false;
    this.jumpInProgress = false;

    this.setStatic(true);
    this.setVisible(false);

    this.currentBarrel.enter();
  }

  private exitBarrel(): void {
    console.log("[Player] exitBarrel called");
    if (!this.isInBarrel || !this.currentBarrel || !this.body) return;

    if (this.recentlyExitedBarrel) return;

    const launchAngle = this.currentBarrel.angle;

    this.isInBarrel = false;
    this.currentBarrel = null;
    this.setStatic(false);
    this.setVisible(true);

    const launchVector = Phaser.Math.Vector2.RIGHT.clone()
      .rotate(Phaser.Math.DegToRad(launchAngle))
      .scale(BARREL_LAUNCH_VELOCITY);

    console.log(
      `[Player] Barrel Angle: ${launchAngle}, Radian: ${Phaser.Math.DegToRad(
        launchAngle
      ).toFixed(3)}`
    );

    this.setVelocity(launchVector.x, launchVector.y);
    this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_FALL, true);

    this.recentlyExitedBarrel = true;
    this.scene.time.delayedCall(BARREL_EXIT_COOLDOWN_MS, () => {
      this.recentlyExitedBarrel = false;
      console.log("[Player] Barrel exit cooldown finished.");
    });
  }

  public finishLevel() {
    this.isLevelComplete = true;
    this.setVelocityX(0);
    if (this.isInBarrel) {
      this.exitBarrel();
    }
  }

  public kill() {
    this.isAlive = false;
    if (this.isInBarrel) {
      this.exitBarrel();
    }
    this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_DEAD);
    this.setVelocityX(0);
    this.setVelocityY(0);
    this.setStatic(true);
  }
}
