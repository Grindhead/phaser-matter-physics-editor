import { Scene } from "phaser";
import { TEXTURE_ATLAS, PHYSICS_ENTITIES } from "../../lib/constants";
import { Platform } from "../../entities/Platforms/Platform";
import { EnemySmall } from "../../entities/Enemies/EnemySmall";
import { Crate } from "../../entities/Crate/Crate";
import { Barrel } from "../../entities/Barrel/Barrel";
import { Finish } from "../../entities/Finish/Finish";
import { EnemyBase } from "../../entities/Enemies/EnemyBase";
import { Player } from "../../entities/Player/Player";

// Import a concrete Enemy class for large enemy
import { EnemyLarge } from "../../entities/Enemies/EnemyLarge";

// Import animation keys
import { BARREL_ANIMATION_KEYS } from "../../entities/Barrel/barrelAnimations";
import { FINISH_ANIMATION_KEYS } from "../../entities/Finish/finishAnimations";
import { PLAYER_ANIMATION_KEYS } from "../../entities/Player/playerAnimations";

export interface PaletteConfig {
  x: number;
  y: number;
  width: number;
  padding?: number;
  background?: {
    color: number;
    alpha?: number;
  };
}

export interface EntityButton {
  type: string;
  entityClass:
    | typeof Platform
    | typeof EnemyBase
    | typeof EnemySmall
    | typeof EnemyLarge
    | typeof Crate
    | typeof Barrel
    | typeof Finish
    | typeof Player;
  entityConfig: any;
  displayName: string;
}

export class Palette {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private buttons: { [key: string]: Phaser.GameObjects.Container } = {};
  private selectedButton: string | null = null;
  private onSelectCallback: (type: string) => void;
  private entities: EntityButton[] = [];

  constructor(
    scene: Scene,
    config: PaletteConfig,
    onSelect: (type: string) => void
  ) {
    this.scene = scene;
    this.onSelectCallback = onSelect;

    // Setup entity definitions
    this.entities = [
      {
        type: "player",
        entityClass: Player,
        entityConfig: {},
        displayName: "Player",
      },
      {
        type: "platform",
        entityClass: Platform,
        entityConfig: {
          segmentCount: 3,
          id: "palette-platform",
          isVertical: false,
        },
        displayName: "Platform",
      },
      {
        type: "enemy-large",
        entityClass: EnemyLarge,
        entityConfig: {},
        displayName: "Large Enemy",
      },
      {
        type: "enemy-small",
        entityClass: EnemySmall,
        entityConfig: {},
        displayName: "Small Enemy",
      },
      {
        type: "crate-small",
        entityClass: Crate,
        entityConfig: {
          type: "small",
        },
        displayName: "Small Crate",
      },
      {
        type: "crate-big",
        entityClass: Crate,
        entityConfig: {
          type: "big",
        },
        displayName: "Big Crate",
      },
      {
        type: "barrel",
        entityClass: Barrel,
        entityConfig: {},
        displayName: "Barrel",
      },
      {
        type: "finish-line",
        entityClass: Finish,
        entityConfig: {},
        displayName: "Finish Line",
      },
    ];

    // Create container
    this.container = scene.add.container(config.x, config.y);

    // Create background
    const bg = config.background || { color: 0x222222, alpha: 0.8 };
    this.background = scene.add.rectangle(
      0,
      0,
      config.width,
      this.calculateHeight(config),
      bg.color,
      bg.alpha || 0.8
    );
    this.background.setOrigin(0, 0);
    this.container.add(this.background);

    // Create entity buttons
    this.createButtons(config);

    // Set palette to be fixed to camera
    this.container.setScrollFactor(0);

    // Add to scene display list
    scene.add.existing(this.container);
  }

  private calculateHeight(config: PaletteConfig): number {
    const padding = config.padding || 10;
    const buttonHeight = 50;
    return (buttonHeight + padding) * this.entities.length + padding;
  }

  private createButtons(config: PaletteConfig): void {
    const padding = config.padding || 10;
    const buttonWidth = config.width - padding * 2;
    const buttonHeight = 50;

    // Create a temporary Matter.js world container for palette entities
    // so they don't interact with the main world
    const tempContainer = this.scene.add.container(0, 0);
    tempContainer.setVisible(false);

    this.entities.forEach((entity, index) => {
      // Create button container
      const buttonContainer = this.scene.add.container(
        padding,
        padding + index * (buttonHeight + padding)
      );

      // Create button background
      const buttonBg = this.scene.add.rectangle(
        0,
        0,
        buttonWidth,
        buttonHeight,
        0x444444
      );
      buttonBg.setOrigin(0, 0);
      buttonContainer.add(buttonBg);

      // Create entity instance for display in the palette
      let entityInstance;

      try {
        // Create entity at position -1000, -1000 (off-screen)
        // We'll only use it for visual purposes in the palette
        switch (entity.type) {
          case "player":
            entityInstance = new Player(this.scene, -1000, -1000);

            // For palette preview, ensure we're showing the idle frame
            entityInstance.setFrame("player/idle/duck-idle-0001.png");
            break;
          case "platform":
            entityInstance = new Platform(
              this.scene,
              -1000,
              -1000,
              entity.entityConfig.segmentCount,
              entity.entityConfig.id,
              entity.entityConfig.isVertical
            );
            break;
          case "enemy-large":
            entityInstance = new EnemyLarge(this.scene, -1000, -1000);
            break;
          case "enemy-small":
            entityInstance = new EnemySmall(this.scene, -1000, -1000);
            break;
          case "crate-small":
          case "crate-big":
            entityInstance = new Crate(
              this.scene,
              -1000,
              -1000,
              entity.entityConfig.type
            );
            break;
          case "barrel":
            try {
              entityInstance = new Barrel(this.scene, -1000, -1000);

              // Set proper angle for barrel preview
              entityInstance.angle = -90;

              // For palette preview, don't try to play animations
              // Just use a static frame instead
              entityInstance.setFrame("barrel/barrel.png");
            } catch (error) {
              console.error("Failed to create barrel:", error);
              entityInstance = null;
            }
            break;
          case "finish-line":
            try {
              entityInstance = new Finish(this.scene, -1000, -1000);

              // For palette preview, don't try to play animations
              // Just use a static frame instead
              entityInstance.setFrame("finish/finish-line.png");
            } catch (error) {
              console.error("Failed to create finish:", error);
              entityInstance = null;
            }
            break;
        }

        // Only create sprite if we successfully created an entity instance
        if (entityInstance) {
          // Create a sprite copy of the entity to use in the palette
          // This avoids physics issues with the actual entity
          const entitySprite = this.scene.add.sprite(
            padding + buttonHeight / 2,
            buttonHeight / 2,
            entityInstance.texture.key,
            entityInstance.frame.name
          );

          // Copy rotation/angle for entities that need it (like barrels)
          if (entity.type === "barrel") {
            entitySprite.angle = entityInstance.angle;
          }

          // Preserve special origins (like barrels)
          if (entity.type === "barrel") {
            entitySprite.setOrigin(0.22, 0.5);
          } else if (entity.type === "finish-line") {
            entitySprite.setOrigin(0.3, 0.5);
          }

          // Scale the sprite to fit the button
          const scale =
            (buttonHeight - 10) /
            Math.max(entitySprite.width, entitySprite.height);
          entitySprite.setScale(scale);

          // Add to button container
          buttonContainer.add(entitySprite);

          // Remove the actual entity instance as we don't need it anymore
          entityInstance.destroy();
        } else {
          throw new Error(
            `Failed to create entity instance for ${entity.type}`
          );
        }
      } catch (error) {
        console.error(`Failed to create entity ${entity.type}:`, error);

        // Fallback to using an image if entity creation fails
        const icon = this.scene.add.image(
          padding + buttonHeight / 2,
          buttonHeight / 2,
          TEXTURE_ATLAS,
          entity.type.includes("platform")
            ? "platform/platform-middle.png"
            : entity.type.includes("enemy-large")
            ? "enemy/enemy.png"
            : entity.type.includes("enemy-small")
            ? "enemy/enemy-small.png"
            : entity.type.includes("crate-small")
            ? "crates/crate-small.png"
            : entity.type.includes("crate-big")
            ? "crates/crate-big.png"
            : entity.type.includes("barrel")
            ? "barrel/barrel.png"
            : entity.type.includes("player")
            ? "player/idle/duck-idle-0001.png"
            : "finish/finish-line.png"
        );
        icon.setScale((buttonHeight - 10) / Math.max(icon.width, icon.height));
        buttonContainer.add(icon);
      }

      // Create button text
      const text = this.scene.add.text(
        padding + buttonHeight,
        buttonHeight / 2,
        entity.displayName,
        {
          fontSize: "16px",
          color: "#ffffff",
        }
      );
      text.setOrigin(0, 0.5);
      buttonContainer.add(text);

      // Make button interactive
      buttonBg.setInteractive({ useHandCursor: true });

      // Add event listeners
      buttonBg.on("pointerdown", () => {
        this.selectButton(entity.type);
      });

      buttonBg.on("pointerover", () => {
        buttonBg.setFillStyle(0x666666);
      });

      buttonBg.on("pointerout", () => {
        if (this.selectedButton !== entity.type) {
          buttonBg.setFillStyle(0x444444);
        }
      });

      // Add to container and store reference
      this.container.add(buttonContainer);
      this.buttons[entity.type] = buttonContainer;
    });
  }

  selectButton(type: string): void {
    // Don't do anything if this button is already selected
    if (this.selectedButton === type) {
      return;
    }

    // Deselect previous button
    if (this.selectedButton) {
      const prevButton = this.buttons[this.selectedButton];
      if (prevButton) {
        (prevButton.getAt(0) as Phaser.GameObjects.Rectangle).setFillStyle(
          0x444444
        );
      }
    }

    // Select new button
    this.selectedButton = type;
    const button = this.buttons[type];
    if (button) {
      (button.getAt(0) as Phaser.GameObjects.Rectangle).setFillStyle(0x88aaff);
    }

    // Call callback
    this.onSelectCallback(type);
  }

  /**
   * Clears the currently selected button
   */
  clearSelection(): void {
    // Deselect current button
    if (this.selectedButton) {
      const button = this.buttons[this.selectedButton];
      if (button) {
        (button.getAt(0) as Phaser.GameObjects.Rectangle).setFillStyle(
          0x444444
        );
      }
      this.selectedButton = null;
    }
  }

  getSelectedType(): string | null {
    return this.selectedButton;
  }

  updatePositionForResize(): void {
    // Update position when the window is resized
    this.container.setPosition(10, 10);
  }
}
