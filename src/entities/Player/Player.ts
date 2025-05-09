import { PHYSICS_ENTITIES, PHYSICS, TEXTURE_ATLAS } from "../../lib/constants";
import { isGroundBody } from "../../lib/helpers/isGroundBody";
import { isPlayerBody } from "../../lib/helpers/isPlayerBody";
import { FXLand } from "../fx-land/FxLand";
import { Barrel } from "../Barrel/Barrel";
import { PLAYER_ANIMATION_KEYS, PLAYER_ANIMATIONS } from "./playerAnimations";
import { Platform } from "../Platforms/Platform";

const JUMP_VELOCITY = -12;
const WALK_VELOCITY = 3;
const BARREL_LAUNCH_VELOCITY = 14;
const EDGE_DETECTION_DISTANCE = 15; // Distance from edge to trigger wobble
const VERTICAL_COLLISION_NORMAL_THRESHOLD = 0.8; // Min Y normal component to count as top/bottom collision

export interface PlayerInterface {
  x: number;
  y: number;
}

export class Player
  extends Phaser.Physics.Matter.Sprite
  implements PlayerInterface
{
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<string, Phaser.Input.Keyboard.Key>;
  private isGrounded = false;
  private groundContacts = new Set<MatterJS.BodyType>();
  private currentAnimKey = "";
  private isAlive = true;
  private isLevelComplete = false;
  private currentBarrel: Barrel | null = null;
  public recentlyExitedBarrel: boolean = false;
  public canEnterBarrels: boolean = true;
  public isInBarrel = false;
  public upIsDown = false;
  public rightIsDown = false;
  public leftIsDown = false;
  public isPlayingLandAnimation = false;
  private isNearEdge = false;
  private isNearLeftEdge = false;
  private isNearRightEdge = false;
  private currentPlatformBounds: { left: number; right: number } | null = null;
  private coinCollectionTimer?: Phaser.Time.TimerEvent;
  private coinCollectedDuringLanding = false; // Track coin collection during landing
  private landingAnimationEventEmitted = false; // Track if landing animation complete event was emitted

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

    // Set player depth to 10 to ensure it renders in front of the finish line (depth 5)
    this.setDepth(10);

    this.isAlive = true;
    this.isInBarrel = false;
    this.currentBarrel = null;
    this.recentlyExitedBarrel = false;
    this.canEnterBarrels = true;
    this.isPlayingLandAnimation = false;
    this.isNearEdge = false;
    this.isNearLeftEdge = false;
    this.isNearRightEdge = false;
    this.currentPlatformBounds = null;
    this.coinCollectedDuringLanding = false;
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
    }
  }

  update(): void {
    if (!this.isAlive) {
      return;
    }

    // Add a small threshold for velocity to prevent flipping when colliding with walls
    const velocityThreshold = 0.1;
    if (this.getVelocity().x < -velocityThreshold) {
      this.flipX = true;
    } else if (this.getVelocity().x > velocityThreshold) {
      this.flipX = false;
    }

    // Skip animation changes if we're playing the landing animation
    if (this.isPlayingLandAnimation && this.isLevelComplete) {
      return;
    }

    if (this.isInBarrel) {
      this.handleInBarrelState();
      return;
    }

    // Check if player is near edge when grounded
    if (this.isGrounded) {
      this.checkIfNearEdge();
    } else {
      this.isNearEdge = false;
      this.isNearLeftEdge = false;
      this.isNearRightEdge = false;
    }

    // Combine keyboard and mobile inputs
    const isMobileEnvironment = this.scene.sys.game.device.input.touch;
    if (!isMobileEnvironment) {
      this.leftIsDown =
        this.cursors!.left.isDown || this.wasd!.A.isDown || false;
      this.rightIsDown =
        this.cursors!.right.isDown || this.wasd!.D.isDown || false;
      this.upIsDown = this.cursors!.up.isDown || this.wasd!.W.isDown || false;
    }

    if (
      !this.isLevelComplete &&
      this.anims.currentAnim?.key !== PLAYER_ANIMATION_KEYS.DUCK_BLAST
    ) {
      if (this.leftIsDown) {
        this.setVelocity(-WALK_VELOCITY, this.body!.velocity.y);
      }
      if (this.rightIsDown) {
        this.setVelocity(WALK_VELOCITY, this.body!.velocity.y);
      }

      if (this.isGrounded && !this.leftIsDown && !this.rightIsDown) {
        this.setVelocity(0, 0); // Stop horizontal movement when idle on ground
      }
      // --- Modified Jump Logic --- START
      if (this.upIsDown && !this.isInBarrel && this.isGrounded) {
        // Standard ground jump
        this.setVelocityY(JUMP_VELOCITY);
        this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_JUMP, true);
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          if (!this.isGrounded) {
            this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_FALL, true);
          }
        });
        return; // Exit update after jump
      }
      // --- Modified Jump Logic --- END
    }

    // Prioritize running animation when player is moving and level is not complete
    if (
      this.isGrounded &&
      (this.leftIsDown || this.rightIsDown) &&
      !this.isLevelComplete
    ) {
      this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_RUN);
      return;
    }

    if (
      !this.isGrounded &&
      this.currentAnimKey !== PLAYER_ANIMATION_KEYS.DUCK_JUMP &&
      this.currentAnimKey !== PLAYER_ANIMATION_KEYS.DUCK_BLAST
    ) {
      this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_FALL);
    } else if (this.isGrounded) {
      if (
        this.isNearEdge &&
        !this.leftIsDown &&
        !this.rightIsDown &&
        !this.isLevelComplete
      ) {
        // Play wobble animation when near edge and not moving
        this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_WOBBLE);

        // Set flipX based on which edge the player is near
        // If near left edge, face left (toward the drop-off) - flipX = true
        // If near right edge, face right (toward the drop-off) - flipX = false
        if (this.isNearLeftEdge && !this.isNearRightEdge) {
          this.flipX = true; // Face left at left edge
        } else if (this.isNearRightEdge && !this.isNearLeftEdge) {
          this.flipX = false; // Face right at right edge
        }
        // If near both edges (small platform), keep current orientation
      } else if (
        !this.leftIsDown &&
        !this.rightIsDown &&
        this.currentAnimKey !== PLAYER_ANIMATION_KEYS.DUCK_LAND
      ) {
        if (!this.isLevelComplete) {
          this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_IDLE, false);
        }
      }
    }
  }

  private checkIfNearEdge(): void {
    if (!this.isGrounded || this.groundContacts.size === 0) {
      this.isNearEdge = false;
      this.isNearLeftEdge = false;
      this.isNearRightEdge = false;
      return;
    }

    // Get current platform bounds from the ground contact
    if (!this.currentPlatformBounds && this.groundContacts.size > 0) {
      // Get the first ground contact
      const groundBody = Array.from(this.groundContacts)[0];
      if (groundBody && groundBody.bounds) {
        const { min, max } = groundBody.bounds;
        this.currentPlatformBounds = { left: min.x, right: max.x };
      }
    }

    if (this.currentPlatformBounds) {
      const playerCenter = this.x;
      const distanceToLeftEdge = Math.abs(
        playerCenter - this.currentPlatformBounds.left
      );
      const distanceToRightEdge = Math.abs(
        this.currentPlatformBounds.right - playerCenter
      );

      // Track which specific edge the player is near
      this.isNearLeftEdge = distanceToLeftEdge < EDGE_DETECTION_DISTANCE;
      this.isNearRightEdge = distanceToRightEdge < EDGE_DETECTION_DISTANCE;

      // Near any edge
      this.isNearEdge = this.isNearLeftEdge || this.isNearRightEdge;
    } else {
      this.isNearEdge = false;
      this.isNearLeftEdge = false;
      this.isNearRightEdge = false;
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
    this.isGrounded = false; // Reset grounded state, check contacts below

    // Check if we're landing before processing collisions
    const wasGroundedBefore = this.groundContacts.size > 0;

    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;
      // Use processCollision to handle different body types
      if (isPlayerBody(bodyA)) {
        this.processCollision(bodyB, pair, true); // true for start
      } else if (isPlayerBody(bodyB)) {
        this.processCollision(bodyA, pair, true); // true for start
      }
    }

    // Update final state based on contacts found
    this.isGrounded = this.groundContacts.size > 0;

    // Check if this is a landing event (was not grounded, now is grounded)
    const isLandingEvent = !wasGroundedBefore && this.isGrounded;

    // Reset platform bounds only if landing on new ground
    if (isLandingEvent) {
      this.currentPlatformBounds = null;

      // Only create FXLand effect if the coin wasn't collected during THIS landing
      // We use our landing flag to track this specific landing event
      if (!this.coinCollectedDuringLanding) {
        // Play landing effect
        new FXLand(this.scene, this.x, this.getBounds().bottom);
      }

      // Play landing animation after barrel jump, level completion, or when falling from a height
      if (
        !this.isPlayingLandAnimation &&
        (this.recentlyExitedBarrel || this.isLevelComplete) &&
        !this.coinCollectedDuringLanding // Only check coins collected during THIS landing
      ) {
        this.isPlayingLandAnimation = true;
        this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_LAND, true);
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          this.isPlayingLandAnimation = false;
          // If level is complete, keep the final frame of DUCK_LAND animation and emit completion
          if (this.isLevelComplete) {
            if (!this.landingAnimationEventEmitted) {
              this.landingAnimationEventEmitted = true;
              this.emit("landingAnimationComplete");
            }
          } else if (this.isGrounded) {
            if (this.leftIsDown || this.rightIsDown) {
              this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_RUN);
            } else {
              this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_IDLE);
            }
          }
        });

        // Reset the barrel exit flag after landing animation starts
        if (this.recentlyExitedBarrel) {
          this.recentlyExitedBarrel = false;
        }
      }

      // Reset coin collection during landing flag after handling the landing
      this.coinCollectedDuringLanding = false;
    }
  }

  private handleCollisionEnd(
    event: Phaser.Physics.Matter.Events.CollisionEndEvent
  ) {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;
      // Use processCollision to handle different body types
      if (isPlayerBody(bodyA)) {
        this.processCollision(bodyB, pair, false); // false for end
      } else if (isPlayerBody(bodyB)) {
        this.processCollision(bodyA, pair, false); // false for end
      }
    }
    // Re-evaluate final state after removing contacts
    this.isGrounded = this.groundContacts.size > 0;

    // If no longer grounded, clear platform bounds
    if (!this.isGrounded) {
      this.currentPlatformBounds = null;
    }
  }

  // Re-introduced and modified collision processing logic
  private processCollision(
    otherBody: MatterJS.BodyType,
    pair: Phaser.Types.Physics.Matter.MatterCollisionPair,
    isStart: boolean // true for collisionstart, false for collisionend
  ): void {
    // Check for standard ground collision (uses the modified isGroundBody which excludes vertical walls)
    if (isGroundBody(otherBody)) {
      if (isStart) {
        this.groundContacts.add(otherBody);
      } else {
        this.groundContacts.delete(otherBody);
      }
    }
    // Check specifically for vertical walls to handle top landings
    else if (
      otherBody.gameObject &&
      otherBody.gameObject instanceof Platform &&
      otherBody.gameObject.isVertical
    ) {
      // Check collision normal - Is it a top/bottom collision?
      // Normal Y close to -1 means landing on top
      // Normal Y close to 1 means hitting bottom (not ground)
      if (
        pair.collision &&
        pair.collision.normal.y < -VERTICAL_COLLISION_NORMAL_THRESHOLD
      ) {
        // Collision is on the top surface of the vertical wall
        if (isStart) {
          this.groundContacts.add(otherBody); // Treat wall top as ground
        } else {
          this.groundContacts.delete(otherBody);
        }
      } else {
        // Collision is on the side or bottom of the vertical wall - NOT ground
        // Do nothing here, don't add to groundContacts
      }
    }
  }

  private handleInBarrelState(): void {
    if (!this.currentBarrel) return;

    this.setPosition(this.currentBarrel.x, this.currentBarrel.y);
    this.setVelocity(0, 0);

    const up =
      this.cursors?.up?.isDown || this.wasd?.W?.isDown || this.upIsDown;
    if (up) {
      this.currentBarrel.launch();
      this.exitBarrel();
    }
  }

  public enterBarrel(barrel: Barrel): void {
    if (this.isInBarrel || !this.body || !this.canEnterBarrels) return;

    this.isInBarrel = true;
    this.currentBarrel = barrel;
    this.isGrounded = false;
    this.isNearEdge = false;
    this.isNearLeftEdge = false;
    this.isNearRightEdge = false;
    this.currentPlatformBounds = null;

    this.setStatic(true);
    this.setVisible(false);

    this.currentBarrel.enter();
  }

  private exitBarrel(): void {
    console.log("[Player] exitBarrel called");
    if (!this.isInBarrel || !this.currentBarrel || !this.body) return;

    const launchAngle = this.currentBarrel.angle;

    this.isInBarrel = false;
    this.currentBarrel = null;
    this.setStatic(false);
    this.setVisible(true);

    const launchVector = Phaser.Math.Vector2.RIGHT.clone()
      .rotate(Phaser.Math.DegToRad(launchAngle))
      .scale(BARREL_LAUNCH_VELOCITY);

    this.setVelocity(launchVector.x, launchVector.y);

    // Set flipX based on horizontal direction
    this.flipX = launchVector.x < 0;

    this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_BLAST, true);

    // Normalize the angle to prevent upside-down animations
    const normalizedAngle = ((launchAngle % 360) + 360) % 360;
    const isUpsideDown = normalizedAngle > 90 && normalizedAngle < 270;

    if (isUpsideDown) {
      // Use an adjusted angle that gives same visual direction but right-side up
      this.setRotation(Phaser.Math.DegToRad(launchAngle + 180));
    } else {
      this.setRotation(Phaser.Math.DegToRad(launchAngle));
    }

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_FALL, false);
      // Reset rotation and flip when animation ends
      this.setRotation(0);
      this.setFlipY(false);
    });

    // Set flag for landing animation but prevent re-entry for a short time
    this.recentlyExitedBarrel = true;
    this.canEnterBarrels = false;

    // Allow re-entering barrels after a short delay
    this.scene.time.delayedCall(300, () => {
      this.canEnterBarrels = true;
    });
  }

  public finishLevel() {
    this.isLevelComplete = true;
    this.landingAnimationEventEmitted = false;
    this.setVelocityX(0);
    if (this.isInBarrel) {
      this.exitBarrel();
    }

    // If already grounded, initiate cool landing animation
    if (
      this.isGrounded &&
      !this.isPlayingLandAnimation &&
      !this.coinCollectedDuringLanding
    ) {
      this.isPlayingLandAnimation = true;
      // Use regular landing animation until cool landing animation assets are available
      this.playAnimation(PLAYER_ANIMATION_KEYS.DUCK_LAND, true);
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.isPlayingLandAnimation = false;
        // Keep the final frame of the landing animation
        if (!this.landingAnimationEventEmitted) {
          this.landingAnimationEventEmitted = true;
          this.emit("landingAnimationComplete");
        }
      });
    } else if (!this.isGrounded) {
      // Player is in the air, wait for them to land first
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (this.isGrounded && this.isPlayingLandAnimation) {
          // Wait for landing animation to complete
          this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            if (!this.landingAnimationEventEmitted) {
              this.landingAnimationEventEmitted = true;
              this.emit("landingAnimationComplete");
            }
          });
        } else {
          // If we somehow didn't get a landing animation, still continue
          if (!this.landingAnimationEventEmitted) {
            this.landingAnimationEventEmitted = true;
            this.emit("landingAnimationComplete");
          }
        }
      });
    } else {
      // Edge case: already grounded but something prevented landing animation
      this.scene.time.delayedCall(100, () => {
        if (!this.landingAnimationEventEmitted) {
          this.landingAnimationEventEmitted = true;
          this.emit("landingAnimationComplete");
        }
      });
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

  /**
   * Indicates that the player has just collected a coin.
   * Will flag that a coin was collected during landing if this happens during a landing.
   * The flag automatically resets after the landing is processed.
   */
  public setRecentCoinCollection(): void {
    // Set flag for coin collection during landing
    // If the player has landed or is in the process of landing,
    // flag that a coin was collected during this landing event
    if (!this.isGrounded && this.groundContacts.size > 0) {
      this.coinCollectedDuringLanding = true;
    }

    // Clear any existing reset timer
    if (this.coinCollectionTimer) {
      this.scene.time.removeEvent(this.coinCollectionTimer);
    }
  }
}
