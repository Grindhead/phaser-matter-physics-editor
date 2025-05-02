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

      // Create the entity instance at the button position
      const entityX = padding + buttonHeight / 2;
      const entityY = buttonHeight / 2;

      switch (entity.type) {
        case "player":
          entityInstance = new Player(this.scene, entityX, entityY);
          break;
        case "platform":
          entityInstance = new Platform(
            this.scene,
            entityX,
            entityY,
            entity.entityConfig.segmentCount,
            entity.entityConfig.id,
            entity.entityConfig.isVertical
          );
          break;
        case "enemy-large":
          entityInstance = new EnemyLarge(this.scene, entityX, entityY);
          break;
        case "enemy-small":
          entityInstance = new EnemySmall(this.scene, entityX, entityY);
          break;
        case "crate-small":
        case "crate-big":
          entityInstance = new Crate(
            this.scene,
            entityX,
            entityY,
            entity.entityConfig.type
          );
          break;
        case "barrel":
          entityInstance = new Barrel(this.scene, entityX, entityY);
          // Use idle animation for barrel

          break;
        case "finish-line":
          entityInstance = new Finish(this.scene, entityX, entityY);
          break;
      }

      this.scene.add.existing(entityInstance!);
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
