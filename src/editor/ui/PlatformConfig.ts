import { Scene } from "phaser";

export interface PlatformConfigData {
  segmentCount: number;
  isVertical: boolean;
}

export interface PlatformConfigOptions {
  x: number;
  y: number;
  width: number;
  background?: {
    color: number;
    alpha?: number;
  };
  padding?: number;
  onPlace: (config: PlatformConfigData) => void;
}

export class PlatformConfig {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private config: PlatformConfigData = { segmentCount: 3, isVertical: false };
  private onPlace: (config: PlatformConfigData) => void;
  private controls: Phaser.GameObjects.GameObject[] = [];
  private title: Phaser.GameObjects.Text;
  private segmentValueText: Phaser.GameObjects.Text;

  constructor(scene: Scene, options: PlatformConfigOptions) {
    this.scene = scene;
    this.onPlace = options.onPlace;

    this.container = scene.add.container(options.x, options.y).setDepth(1001);

    const bg = options.background || { color: 0x1a2e4a, alpha: 1 };
    const padding = options.padding || 15;
    this.background = scene.add.rectangle(
      0,
      0,
      options.width,
      240,
      bg.color,
      bg.alpha || 1
    );
    this.background.setOrigin(0, 0);
    this.background.setStrokeStyle(2, 0x0d1726);
    this.container.add(this.background);

    const titleBarHeight = 30;
    const titleBar = scene.add
      .rectangle(0, 0, options.width, titleBarHeight, 0x2a549a)
      .setOrigin(0, 0);
    this.container.add(titleBar);

    this.title = scene.add.text(
      options.width / 2,
      titleBarHeight / 2,
      "Platform Configuration",
      {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    );
    this.title.setOrigin(0.5, 0.5);
    this.container.add(this.title);

    const closeButton = scene.add
      .text(options.width - padding - 5, padding / 2 + 2, "X", {
        fontSize: "18px",
        color: "#ff6666",
      })
      .setOrigin(1, 0.5);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on("pointerdown", () => this.hide());
    this.container.add(closeButton);

    this.createControls(padding, options.width, titleBarHeight + padding);

    this.container.setScrollFactor(0);
    this.container.setVisible(false);

    scene.add.existing(this.container);
  }

  private createControls(padding: number, width: number, yStart: number): void {
    let currentY = yStart;
    const controlSpacing = 25;
    const labelInputSpacing = 10;

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

    const orientationText = this.scene.add
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
    this.controls.push(orientationText);
    this.container.add(orientationText);

    const dropdownArrow = this.scene.add
      .text(padding + dropdownWidth - 15, currentY + dropdownHeight / 2, "▼", {
        fontSize: "12px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5);
    this.controls.push(dropdownArrow);
    this.container.add(dropdownArrow);

    dropdownBg.setInteractive({ useHandCursor: true });
    dropdownBg.on("pointerdown", () => {
      this.config.isVertical = !this.config.isVertical;
      orientationText.setText(
        this.config.isVertical ? "Vertical" : "Horizontal"
      );
    });

    currentY += dropdownHeight + controlSpacing;

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
      }
    );
    this.controls.push(segmentStepper);
    this.container.add(segmentStepper);

    currentY += 40 + controlSpacing;

    const placeButton = this.createActionButton(
      padding,
      currentY,
      width - padding * 2,
      "Place Platform",
      () => {
        this.onPlace(this.config);
        this.hide();
      }
    );
    this.controls.push(placeButton);
    this.container.add(placeButton);

    const finalHeight = currentY + 40 + padding;
    this.background.setSize(width, finalHeight);
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

    this.segmentValueText = this.scene.add
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
    container.add(this.segmentValueText);

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
    minusBg.on("pointerdown", () => {
      const currentValue = parseInt(this.segmentValueText.text, 10);
      const newValue = Math.max(min, currentValue - 1);
      if (newValue !== currentValue) {
        this.segmentValueText.setText(newValue.toString());
        onChange(newValue);
      }
    });

    plusBg.setInteractive({ useHandCursor: true });
    plusBg.on("pointerdown", () => {
      const currentValue = parseInt(this.segmentValueText.text, 10);
      const newValue = Math.min(max, currentValue + 1);
      if (newValue !== currentValue) {
        this.segmentValueText.setText(newValue.toString());
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
    background.on("pointerdown", onClick);
    background.on("pointerover", () => background.setFillStyle(0x28c76f));
    background.on("pointerout", () => background.setFillStyle(0x1f9e54));

    return container;
  }

  show(initialConfig?: PlatformConfigData): void {
    if (initialConfig) {
      this.setConfig(initialConfig);
    } else {
      this.setConfig({ segmentCount: 3, isVertical: false });
    }
    this.container.setVisible(true);
    this.container.setActive(true);
  }

  hide(): void {
    this.container.setVisible(false);
    this.container.setActive(false);
  }

  updatePositionForResize(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  getConfig(): PlatformConfigData {
    return { ...this.config };
  }

  setConfig(config: Partial<PlatformConfigData>): void {
    let changed = false;
    if (
      config.segmentCount !== undefined &&
      config.segmentCount !== this.config.segmentCount
    ) {
      this.config.segmentCount = Math.max(1, Math.min(10, config.segmentCount));
      if (this.segmentValueText) {
        this.segmentValueText.setText(this.config.segmentCount.toString());
      }
      changed = true;
    }
    if (
      config.isVertical !== undefined &&
      config.isVertical !== this.config.isVertical
    ) {
      this.config.isVertical = config.isVertical;
      const orientationText = this.container.list.find(
        (go) =>
          (go.type === "Text" &&
            (go as Phaser.GameObjects.Text).text.includes("Horizontal")) ||
          (go as Phaser.GameObjects.Text).text.includes("Vertical")
      ) as Phaser.GameObjects.Text;
      if (orientationText) {
        orientationText.setText(
          this.config.isVertical ? "Vertical" : "Horizontal"
        );
      }
      changed = true;
    }
  }
}
