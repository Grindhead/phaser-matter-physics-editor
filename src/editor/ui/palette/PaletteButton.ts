import { Scene } from "phaser";
import { EntityButton } from "./types";
import { EntityFactory } from "./EntityFactory";

export class PaletteButton {
  scene: Scene;
  container: Phaser.GameObjects.Container;
  entity: EntityButton;
  buttonWidth: number;
  buttonHeight: number;
  onSelect: (type: string, generate: boolean) => void;
  private isSelected: boolean = false;

  constructor(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    entity: EntityButton,
    onSelect: (type: string, generate: boolean) => void
  ) {
    this.scene = scene;
    this.entity = entity;
    this.onSelect = onSelect;

    // Calculate button height
    const baseHeight = 50;
    const heightFactor = entity.heightFactor || 1.0;
    this.buttonHeight = baseHeight * heightFactor;
    this.buttonWidth = width;

    // Create button container
    this.container = this.scene.add.container(x, y);

    // Create button background
    const buttonBg = this.scene.add.rectangle(
      0,
      0,
      this.buttonWidth,
      this.buttonHeight,
      0x444444
    );
    buttonBg.setOrigin(0, 0);
    this.container.add(buttonBg);

    // Create entity instance for display
    this.addEntityPreview();

    // Add text label
    this.addLabel();

    // Make button interactive
    this.setupInteractivity(buttonBg);
  }

  private addEntityPreview(): void {
    // Position calculation for entity preview
    const iconX = this.buttonWidth / 6;
    const iconY = this.buttonHeight / 2;

    // Create entity instance
    const entityInstance = EntityFactory.createEntityInstance(
      this.scene,
      this.entity.type,
      this.entity.entityConfig
    );

    // Set scale
    const scale = this.entity.scale || 0.7;
    entityInstance.setScale(scale);

    // Position entity
    entityInstance.setPosition(iconX, iconY);

    // Add to container with proper depth
    entityInstance.setDepth(1);
    this.container.add(entityInstance);
  }

  private addLabel(): void {
    const label = this.scene.add.text(
      this.buttonWidth - this.buttonWidth / 3,
      this.buttonHeight / 2,
      this.entity.displayName,
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      }
    );
    label.setOrigin(0.5);
    this.container.add(label);
  }

  private setupInteractivity(buttonBg: Phaser.GameObjects.Rectangle): void {
    buttonBg
      .setInteractive()
      .on("pointerover", () => {
        if (!this.isSelected) {
          buttonBg.setFillStyle(0x666666);
        }
      })
      .on("pointerout", () => {
        if (!this.isSelected) {
          buttonBg.setFillStyle(0x444444);
        } else {
          buttonBg.setFillStyle(0x88aaff);
        }
      })
      .on(
        "pointerdown",
        (
          pointer: Phaser.Input.Pointer,
          localX: number,
          localY: number,
          event: Phaser.Types.Input.EventData
        ) => {
          // Prevent click from propagating to scene handlers
          if (event && typeof event.stopPropagation === "function") {
            event.stopPropagation();
          }
          if (this.entity.needsConfiguration) {
            this.onSelect(this.entity.type, false);
          } else {
            this.onSelect(this.entity.type, true);
          }
        }
      );
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected;
    const buttonBg = this.container.getAt(0) as Phaser.GameObjects.Rectangle;
    buttonBg.setFillStyle(selected ? 0x88aaff : 0x444444);
  }

  updateEntityDisplay(config: any): void {
    EntityFactory.updateEntityDisplay(
      this.scene,
      this.entity.type,
      this.container,
      config
    );
  }
}
