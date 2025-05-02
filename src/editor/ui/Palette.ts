import { Scene } from "phaser";
import { Platform } from "../../entities/Platforms/Platform";
import { EnemySmall } from "../../entities/Enemies/EnemySmall";
import { Crate } from "../../entities/Crate/Crate";
import { Barrel } from "../../entities/Barrel/Barrel";
import { Finish } from "../../entities/Finish/Finish";
import { EnemyBase } from "../../entities/Enemies/EnemyBase";
import { Player } from "../../entities/Player/Player";

// Import a concrete Enemy class for large enemy
import { EnemyLarge } from "../../entities/Enemies/EnemyLarge";

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
  scale?: number;
  heightFactor?: number;
  offsetX?: number;
  offsetY?: number;
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

    // Setup entity definitions with production-ready values
    this.entities = [
      {
        type: "player",
        entityClass: Player,
        entityConfig: {},
        displayName: "Player",
        scale: 0.6,
        heightFactor: 1.1,
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
        scale: 0.5,
        heightFactor: 0.8,
      },
      {
        type: "enemy-large",
        entityClass: EnemyLarge,
        entityConfig: {},
        displayName: "Large Enemy",
        scale: 0.5,
        heightFactor: 1.2,
      },
      {
        type: "enemy-small",
        entityClass: EnemySmall,
        entityConfig: {},
        displayName: "Small Enemy",
        scale: 0.5,
        heightFactor: 1.0,
      },
      {
        type: "crate-small",
        entityClass: Crate,
        entityConfig: {
          type: "small",
        },
        displayName: "Small Crate",
        scale: 0.5,
        heightFactor: 0.9,
      },
      {
        type: "crate-big",
        entityClass: Crate,
        entityConfig: {
          type: "big",
        },
        displayName: "Big Crate",
        scale: 0.5,
        heightFactor: 1.1,
      },
      {
        type: "barrel",
        entityClass: Barrel,
        entityConfig: {},
        displayName: "Barrel",
        scale: 0.65,
        heightFactor: 1.0,
      },
      {
        type: "finish-line",
        entityClass: Finish,
        entityConfig: {},
        displayName: "Finish Line",
        scale: 0.45,
        heightFactor: 1.0,
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
    let totalHeight = padding;

    // Calculate the sum of all button heights with padding
    this.entities.forEach((entity) => {
      const baseHeight = 50;
      const heightFactor = entity.heightFactor || 1.0;
      const buttonHeight = baseHeight * heightFactor;
      totalHeight += buttonHeight + padding;
    });

    return totalHeight;
  }

  private createButtons(config: PaletteConfig): void {
    const padding = config.padding || 10;
    const buttonWidth = config.width - padding * 2;
    let currentY = padding;

    this.entities.forEach((entity) => {
      // Calculate dynamic button height based on entity type
      const baseHeight = 50;
      const heightFactor = entity.heightFactor || 1.0;
      const buttonHeight = baseHeight * heightFactor;

      // Create button container
      const buttonContainer = this.scene.add.container(padding, currentY);

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

      // Position calculation for entity preview
      const iconX = buttonWidth / 5; // Position at 1/5 of button width instead of 1/4
      const iconY = buttonHeight / 2; // Center vertically

      // Create entity instance for display in the palette
      let entityInstance:
        | Platform
        | EnemySmall
        | EnemyLarge
        | Crate
        | Barrel
        | Finish
        | Player;

      switch (entity.type) {
        case "player":
          entityInstance = new Player(this.scene, 0, 0);
          break;
        case "platform":
          entityInstance = new Platform(
            this.scene,
            0,
            0,
            entity.entityConfig.segmentCount,
            entity.entityConfig.id,
            entity.entityConfig.isVertical
          );
          break;
        case "enemy-large":
          entityInstance = new EnemyLarge(this.scene, 0, 0);
          break;
        case "enemy-small":
          entityInstance = new EnemySmall(this.scene, 0, 0);
          break;
        case "crate-small":
          entityInstance = new Crate(
            this.scene,
            0,
            0,
            entity.entityConfig.type
          );
          break;
        case "crate-big":
          entityInstance = new Crate(
            this.scene,
            0,
            0,
            entity.entityConfig.type
          );
          break;
        case "barrel":
          entityInstance = new Barrel(this.scene, 0, 0);
          break;
        case "finish-line":
          entityInstance = new Finish(this.scene, 0, 0);
          break;
        default:
          // Provide a default to satisfy TypeScript
          entityInstance = new Player(this.scene, 0, 0);
          break;
      }

      // Set scale from entity definition
      const scale = entity.scale || 0.7;
      entityInstance.setScale(scale);

      // Position entity correctly within the button
      entityInstance.setPosition(iconX, iconY);

      // Add the entity to the button container
      entityInstance.setDepth(1);
      buttonContainer.add(entityInstance);

      // Create button text
      const text = this.scene.add.text(
        buttonWidth * 0.35,
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

      // Update currentY for next button
      currentY += buttonHeight + padding;
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
