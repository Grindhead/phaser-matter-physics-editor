import { Scene } from "phaser";

export interface PlatformPanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onConfigChange: (config: {
    isVertical: boolean;
    segmentCount: number;
  }) => void;
  onPlaceButtonClick: () => void;
  initialConfig?: {
    isVertical?: boolean;
    segmentCount?: number;
  };
}

export class PlatformPanel {
  scene: Scene;
  container: Phaser.GameObjects.Container;
  config: {
    isVertical: boolean;
    segmentCount: number;
  };
  orientationText: Phaser.GameObjects.Text;
  segmentCountText: Phaser.GameObjects.Text;
  onConfigChange: (config: {
    isVertical: boolean;
    segmentCount: number;
  }) => void;
  onPlaceButtonClick: () => void;
  visible: boolean = false;
  private background: Phaser.GameObjects.Rectangle;
  private controls: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Scene, options: PlatformPanelConfig) {
    this.scene = scene;
    // Default values
    this.config = {
      isVertical: options.initialConfig?.isVertical ?? false,
      segmentCount: options.initialConfig?.segmentCount ?? 3,
    };

    this.onConfigChange = options.onConfigChange;
    this.onPlaceButtonClick = options.onPlaceButtonClick;

    console.log(
      "PlatformPanel constructor called, creating container at",
      options.x,
      options.y,
      "with config:",
      this.config
    );

    // Create container
    this.container = scene.add.container(options.x, options.y).setDepth(9999);

    // --- New UI Creation Start ---
    const padding = 15;
    const width = options.width;

    // Main Background (will be resized later)
    this.background = scene.add.rectangle(0, 0, width, 240, 0x1a2e4a, 1);
    this.background.setOrigin(0, 0);
    this.background.setStrokeStyle(2, 0x0d1726);
    this.container.add(this.background);

    // Title Bar
    const titleBarHeight = 30;
    const titleBar = scene.add
      .rectangle(0, 0, width, titleBarHeight, 0x2a549a)
      .setOrigin(0, 0);
    this.container.add(titleBar);

    // Title Text (Centered in title bar)
    const title = scene.add
      .text(width / 2, titleBarHeight / 2, "Platform Configuration", {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);
    this.container.add(title);

    // Close Button
    const closeButton = scene.add
      .text(width - padding - 5, titleBarHeight / 2, "X", {
        fontSize: "18px",
        color: "#ff6666",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.hide();
    });
    this.container.add(closeButton);

    // Create Controls (using adapted method)
    const finalHeight = this.createControls(
      padding,
      width,
      titleBarHeight + padding
    );

    // Adjust background height based on content
    this.background.setSize(width, finalHeight);
    // --- New UI Creation End ---

    this.background.setInteractive();
    this.background.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
    });

    this.container.setScrollFactor(0);

    this.container.setVisible(false);
    this.visible = false;

    console.log(
      "PlatformPanel initialized, container visible:",
      this.container.visible,
      "depth:",
      this.container.depth
    );

    // Add to scene display list
    scene.add.existing(this.container);
  }

  private createControls(
    padding: number,
    width: number,
    yStart: number
  ): number {
    let currentY = yStart;
    const controlSpacing = 25;
    const labelInputSpacing = 10;

    // --- Orientation ---
    const orientationLabel = this.scene.add.text(
      padding,
      currentY,
      "Orientation:",
      {
        fontSize: "14px",
        color: "#ffffff",
      }
    );
    this.controls.push(orientationLabel);
    this.container.add(orientationLabel);

    currentY += orientationLabel.height + labelInputSpacing;

    const dropdownWidth = width - padding * 2;
    const dropdownHeight = 30;
    const dropdownBg = this.scene.add
      .rectangle(padding, currentY, dropdownWidth, dropdownHeight, 0x2a549a)
      .setOrigin(0, 0);
    this.controls.push(dropdownBg);
    this.container.add(dropdownBg);

    this.orientationText = this.scene.add
      .text(
        padding + 10,
        currentY + dropdownHeight / 2,
        this.config.isVertical ? "Vertical" : "Horizontal",
        {
          fontSize: "14px",
          color: "#ffffff",
        }
      )
      .setOrigin(0, 0.5);
    this.controls.push(this.orientationText);
    this.container.add(this.orientationText);

    const dropdownArrow = this.scene.add
      .text(padding + dropdownWidth - 15, currentY + dropdownHeight / 2, "▼", {
        fontSize: "12px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5);
    this.controls.push(dropdownArrow);
    this.container.add(dropdownArrow);

    dropdownBg.setInteractive({ useHandCursor: true });
    dropdownBg.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      this.config.isVertical = !this.config.isVertical;
      this.orientationText.setText(
        this.config.isVertical ? "Vertical" : "Horizontal"
      );
      this.onConfigChange(this.config);
    });

    currentY += dropdownHeight + controlSpacing;

    // --- Segments ---
    const segmentLabel = this.scene.add.text(padding, currentY, "Segments:", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.controls.push(segmentLabel);
    this.container.add(segmentLabel);

    currentY += segmentLabel.height + labelInputSpacing;

    const segmentStepper = this.createNumberStepper(
      padding,
      currentY,
      width - padding * 2,
      this.config.segmentCount,
      1,
      10,
      (value) => {
        this.config.segmentCount = value;
        this.onConfigChange(this.config);
      }
    );
    this.controls.push(segmentStepper);
    this.container.add(segmentStepper);

    currentY += 30 + controlSpacing;

    // --- Place Button ---
    const placeButton = this.createActionButton(
      padding,
      currentY,
      width - padding * 2,
      "Place Platform",
      () => {
        this.onPlaceButtonClick();
      }
    );
    this.controls.push(placeButton);
    this.container.add(placeButton);

    currentY += 40;

    return currentY + padding;
  }

  private createNumberStepper(
    x: number,
    y: number,
    width: number,
    initialValue: number,
    min: number,
    max: number,
    onChange: (value: number) => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const height = 30;
    const buttonWidth = 30;
    const valueBgWidth = width - buttonWidth * 2;

    const minusBg = this.scene.add
      .rectangle(0, 0, buttonWidth, height, 0x2a549a)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x1a2e4a);
    container.add(minusBg);

    const minusSymbol = this.scene.add
      .text(buttonWidth / 2, height / 2, "-", {
        fontSize: "20px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);
    container.add(minusSymbol);

    const valueBg = this.scene.add
      .rectangle(buttonWidth, 0, valueBgWidth, height, 0x1a2e4a)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x1a2e4a);
    container.add(valueBg);

    this.segmentCountText = this.scene.add
      .text(
        buttonWidth + valueBgWidth / 2,
        height / 2,
        initialValue.toString(),
        {
          fontSize: "16px",
          color: "#ffffff",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5, 0.5);
    container.add(this.segmentCountText);

    const plusBg = this.scene.add
      .rectangle(buttonWidth + valueBgWidth, 0, buttonWidth, height, 0x2a549a)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x1a2e4a);
    container.add(plusBg);

    const plusSymbol = this.scene.add
      .text(width - buttonWidth / 2, height / 2, "+", {
        fontSize: "20px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);
    container.add(plusSymbol);

    minusBg.setInteractive({ useHandCursor: true });
    minusBg.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      const currentValue = parseInt(this.segmentCountText.text, 10);
      const newValue = Math.max(min, currentValue - 1);
      if (newValue !== currentValue) {
        this.segmentCountText.setText(newValue.toString());
        onChange(newValue);
      }
    });

    plusBg.setInteractive({ useHandCursor: true });
    plusBg.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      const currentValue = parseInt(this.segmentCountText.text, 10);
      const newValue = Math.min(max, currentValue + 1);
      if (newValue !== currentValue) {
        this.segmentCountText.setText(newValue.toString());
        onChange(newValue);
      }
    });

    return container;
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const height = 40;

    const background = this.scene.add
      .rectangle(0, 0, width, height, 0x1f9e54)
      .setOrigin(0, 0);
    background.setStrokeStyle(2, 0x115a30);
    container.add(background);

    const text = this.scene.add.text(width / 2, height / 2, label, {
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    background.setInteractive({ useHandCursor: true });
    background.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      onClick();
    });
    background.on("pointerover", () => background.setFillStyle(0x28c76f));
    background.on("pointerout", () => background.setFillStyle(0x1f9e54));

    return container;
  }

  show(): void {
    console.log(
      "PlatformPanel.show() called. Current visibility:",
      this.container.visible
    );

    this.updateUIFromConfig();

    this.container.setVisible(true);
    this.visible = true;
    console.log(
      "PlatformPanel shown. Container visible:",
      this.container.visible
    );

    console.log("Panel position:", this.container.x, this.container.y);
  }

  hide(): void {
    console.log("PlatformPanel.hide() called");
    this.container.setVisible(false);
    this.visible = false;
  }

  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  getConfig(): any {
    return { ...this.config };
  }

  updateConfig(config: { isVertical: boolean; segmentCount: number }): void {
    const oldConfig = { ...this.config };
    this.config = {
      ...this.config,
      isVertical: config.isVertical,
      segmentCount: config.segmentCount,
    };

    console.log("PlatformPanel.updateConfig called:", this.config);

    this.updateUIFromConfig();

    if (
      oldConfig.isVertical !== this.config.isVertical ||
      oldConfig.segmentCount !== this.config.segmentCount
    ) {
      console.log("Panel config updated externally.");
    }
  }

  private updateUIFromConfig(): void {
    if (this.orientationText) {
      this.orientationText.setText(
        this.config.isVertical ? "Vertical" : "Horizontal"
      );
    }
    if (this.segmentCountText) {
      this.segmentCountText.setText(this.config.segmentCount.toString());
    }
    console.log("Panel UI updated from config:", this.config);
  }

  updatePosition(x: number, y: number): void {
    this.container.setPosition(x, y);
    console.log(`PlatformPanel position updated to: ${x}, ${y}`);
  }
}
