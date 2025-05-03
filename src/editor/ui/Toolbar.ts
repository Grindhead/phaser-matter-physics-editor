import { Scene } from "phaser";

export interface ToolbarConfig {
  x: number;
  y: number;
  width: number;
  padding?: number;
  background?: {
    color: number;
    alpha?: number;
  };
}

export interface ToolbarButton {
  id: string;
  label: string;
  onClick: () => void;
  style?: {
    bgColor?: number;
    textColor?: string;
    hoverColor?: number;
  };
}

export class Toolbar {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private buttons: { [key: string]: Phaser.GameObjects.Container } = {};

  constructor(scene: Scene, config: ToolbarConfig, buttons: ToolbarButton[]) {
    this.scene = scene;

    // Create container
    this.container = scene.add.container(config.x, config.y);

    // Create background
    const bg = config.background || { color: 0x222222, alpha: 0.8 };
    this.background = scene.add.rectangle(
      0,
      0,
      config.width,
      50, // Fixed height for toolbar
      bg.color,
      bg.alpha || 0.8
    );
    this.background.setOrigin(0, 0);
    this.container.add(this.background);

    // Create buttons
    this.createButtons(buttons, config.padding || 10);

    // Set toolbar to be fixed to camera
    this.container.setScrollFactor(0);

    // Add to scene display list
    scene.add.existing(this.container);
  }

  private createButtons(buttons: ToolbarButton[], padding: number): void {
    let xOffset = padding;
    const buttonWidth = 80;
    const buttonHeight = 30;
    const buttonPadding = 10;

    buttons.forEach((button) => {
      // Create button container
      const buttonContainer = this.scene.add.container(xOffset, padding);

      // Get button style
      const style = button.style || {};
      const bgColor = style.bgColor || 0x444444;
      const hoverColor = style.hoverColor || 0x666666;
      const textColor = style.textColor || "#ffffff";

      // Create button background
      const buttonBg = this.scene.add.rectangle(
        0,
        0,
        buttonWidth,
        buttonHeight,
        bgColor
      );
      buttonBg.setOrigin(0, 0);
      buttonContainer.add(buttonBg);

      // Create button text
      const text = this.scene.add.text(
        buttonWidth / 2,
        buttonHeight / 2,
        button.label,
        {
          fontSize: "14px",
          color: textColor,
        }
      );
      text.setOrigin(0.5, 0.5);
      buttonContainer.add(text);

      // Make button interactive
      buttonBg.setInteractive({ useHandCursor: true });

      // Add event listeners
      buttonBg.on("pointerdown", () => {
        button.onClick();
      });

      buttonBg.on("pointerover", () => {
        buttonBg.setFillStyle(hoverColor);
      });

      buttonBg.on("pointerout", () => {
        buttonBg.setFillStyle(bgColor);
      });

      // Add to container and store reference
      this.container.add(buttonContainer);
      this.buttons[button.id] = buttonContainer;

      // Update offset for next button
      xOffset += buttonWidth + buttonPadding;
    });
  }

  updatePositionForResize(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  // Method to add a hidden file input element for loading files
  createFileInput(onChange: (file: File) => void): HTMLInputElement {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.addEventListener("change", (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        onChange(target.files[0]);
      }
    });

    return fileInput;
  }
}
