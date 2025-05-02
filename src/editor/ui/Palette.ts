import { Scene } from "phaser";

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
  key: string;
  displayName: string;
}

export class Palette {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private buttons: { [key: string]: Phaser.GameObjects.Container } = {};
  private selectedButton: string | null = null;
  private onSelectCallback: (type: string) => void;

  private entities: EntityButton[] = [
    { type: "platform", key: "platform", displayName: "Platform" },
    { type: "enemy-large", key: "enemy", displayName: "Large Enemy" },
    { type: "enemy-small", key: "enemy", displayName: "Small Enemy" },
    { type: "crate-small", key: "crate-small", displayName: "Small Crate" },
    { type: "crate-big", key: "crate-big", displayName: "Big Crate" },
    { type: "barrel", key: "barrel", displayName: "Barrel" },
    { type: "finish-line", key: "finish-line", displayName: "Finish Line" },
  ];

  constructor(
    scene: Scene,
    config: PaletteConfig,
    onSelect: (type: string) => void
  ) {
    this.scene = scene;
    this.onSelectCallback = onSelect;

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

      // Create button icon
      const icon = this.scene.add.image(padding, buttonHeight / 2, entity.key);
      icon.setOrigin(0, 0.5);
      icon.setDisplaySize(buttonHeight - 10, buttonHeight - 10);
      buttonContainer.add(icon);

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
