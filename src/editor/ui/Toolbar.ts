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
  private activeButton: string | null = null;

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

    // Make background interactive, but disable hits during entity drag
    this.background.setInteractive({
      hitAreaCallback: (
        hitArea: any,
        x: number,
        y: number,
        gameObject: Phaser.GameObjects.Rectangle
      ): boolean => {
        const isDragging = this.scene.registry.get("isDraggingEntity");
        const isPlacing = this.scene.registry.get("isPlacementModeActive");
        if (isDragging || isPlacing) {
          return false; // Ignore hits during drag or placement mode
        }
        // Use default rectangle hit test
        return Phaser.Geom.Rectangle.Contains(gameObject.getBounds(), x, y);
      },
      useHandCursor: false,
    });

    this.container.add(this.background);

    // Create buttons
    this.createButtons(buttons, config.padding || 10);

    // Set toolbar to be fixed to camera
    this.container.setScrollFactor(0);
    this.container.setDepth(9000); // Very high depth to ensure it's above other UI elements

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

      // Store original color on the background object for later retrieval
      buttonBg.setData("originalBgColor", bgColor);

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
      buttonBg.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        // Stop event propagation to prevent clicks from reaching elements below
        pointer.event.stopPropagation();

        // Visual feedback
        buttonBg.setFillStyle(style.hoverColor || 0x666666);

        // Store the active button
        this.activeButton = button.id;

        // Use setTimeout to ensure click handling happens outside of the current event loop
        setTimeout(() => {
          // Call the onClick handler
          button.onClick();
        }, 10);
      });

      buttonBg.on("pointerover", () => {
        buttonBg.setFillStyle(hoverColor);
      });

      buttonBg.on("pointerout", () => {
        // Only reset if this isn't the active button
        if (this.activeButton !== button.id) {
          buttonBg.setFillStyle(
            buttonBg.getData("originalBgColor") || 0x444444
          ); // Use stored color
        }
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

  public clearActiveButton(): void {
    if (this.activeButton && this.buttons[this.activeButton]) {
      const buttonContainer = this.buttons[this.activeButton];
      const buttonBg = buttonContainer.list.find(
        (item) => item instanceof Phaser.GameObjects.Rectangle
      ) as Phaser.GameObjects.Rectangle | undefined;

      if (buttonBg) {
        const originalBgColor = buttonBg.getData("originalBgColor") || 0x444444; // Retrieve stored color
        console.log(
          `[Toolbar] Clearing active button state for: ${this.activeButton}`
        );
        buttonBg.setFillStyle(originalBgColor);
      }
    }
    this.activeButton = null;
  }
}
