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
  onConfigChange: (config: PlatformConfigData) => void;
}

export class PlatformConfig {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private config: PlatformConfigData = { segmentCount: 3, isVertical: false };
  private onConfigChange: (config: PlatformConfigData) => void;
  private controls: Phaser.GameObjects.GameObject[] = [];
  private title: Phaser.GameObjects.Text;

  constructor(scene: Scene, options: PlatformConfigOptions) {
    this.scene = scene;
    this.onConfigChange = options.onConfigChange;

    // Create container
    this.container = scene.add.container(options.x, options.y);

    // Create background
    const bg = options.background || { color: 0x333333, alpha: 0.9 };
    const padding = options.padding || 10;
    this.background = scene.add.rectangle(
      0,
      0,
      options.width,
      180, // Initial height
      bg.color,
      bg.alpha || 0.9
    );
    this.background.setOrigin(0, 0);
    this.container.add(this.background);

    // Create title
    this.title = scene.add.text(padding, padding, "Platform Configuration", {
      fontSize: "16px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    this.container.add(this.title);

    // Create controls
    this.createControls(padding, options.width);

    // Set to be fixed to camera
    this.container.setScrollFactor(0);

    // Add to scene display list
    scene.add.existing(this.container);
  }

  private createControls(padding: number, width: number): void {
    let yOffset = 40;

    // Segment count label
    const segmentLabel = this.scene.add.text(padding, yOffset, "Segments:", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.controls.push(segmentLabel);
    this.container.add(segmentLabel);

    // Create segment count control with - and + buttons
    const segmentCountContainer = this.createNumberStepper(
      padding + 100,
      yOffset,
      this.config.segmentCount,
      1,
      10,
      (value) => {
        this.config.segmentCount = value;
        this.onConfigChange(this.config);
      }
    );
    this.controls.push(segmentCountContainer);
    this.container.add(segmentCountContainer);

    yOffset += 50;

    // Orientation section background
    const orientationBg = this.scene.add
      .rectangle(padding, yOffset, width - padding * 2, 70, 0x222222, 0.7)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x555555);
    this.controls.push(orientationBg);
    this.container.add(orientationBg);

    // Orientation label
    const orientationLabel = this.scene.add.text(
      padding + 10,
      yOffset + 10,
      "Orientation:",
      {
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    );
    this.controls.push(orientationLabel);
    this.container.add(orientationLabel);

    // Orientation buttons
    const horizontalBtn = this.createButton(
      padding + 50,
      yOffset + 40,
      "Horizontal",
      !this.config.isVertical,
      () => {
        this.config.isVertical = false;
        horizontalBtn.setSelected(true);
        verticalBtn.setSelected(false);
        this.onConfigChange(this.config);
      }
    );
    this.controls.push(horizontalBtn.container);
    this.container.add(horizontalBtn.container);

    const verticalBtn = this.createButton(
      padding + 170,
      yOffset + 40,
      "Vertical",
      this.config.isVertical,
      () => {
        this.config.isVertical = true;
        horizontalBtn.setSelected(false);
        verticalBtn.setSelected(true);
        this.onConfigChange(this.config);
      }
    );
    this.controls.push(verticalBtn.container);
    this.container.add(verticalBtn.container);
  }

  private createNumberStepper(
    x: number,
    y: number,
    initialValue: number,
    min: number,
    max: number,
    onChange: (value: number) => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const width = 120;
    const height = 30;

    // Background
    const background = this.scene.add.rectangle(0, 0, width, height, 0x444444);
    background.setOrigin(0, 0);
    container.add(background);

    // Minus button
    const minusBtn = this.scene.add.rectangle(5, 5, 20, 20, 0x666666);
    minusBtn.setInteractive({ useHandCursor: true });
    minusBtn.on("pointerdown", () => {
      const newValue = Math.max(min, initialValue - 1);
      if (newValue !== initialValue) {
        valueText.setText(newValue.toString());
        onChange(newValue);
      }
    });
    container.add(minusBtn);

    // Minus symbol
    const minusSymbol = this.scene.add.text(11, 3, "-", {
      fontSize: "16px",
      color: "#ffffff",
    });
    container.add(minusSymbol);

    // Value text
    const valueText = this.scene.add.text(
      width / 2,
      height / 2,
      initialValue.toString(),
      {
        fontSize: "16px",
        color: "#ffffff",
      }
    );
    valueText.setOrigin(0.5, 0.5);
    container.add(valueText);

    // Plus button
    const plusBtn = this.scene.add.rectangle(width - 25, 5, 20, 20, 0x666666);
    plusBtn.setInteractive({ useHandCursor: true });
    plusBtn.on("pointerdown", () => {
      const newValue = Math.min(max, initialValue + 1);
      if (newValue !== initialValue) {
        valueText.setText(newValue.toString());
        onChange(newValue);
      }
    });
    container.add(plusBtn);

    // Plus symbol
    const plusSymbol = this.scene.add.text(width - 19, 3, "+", {
      fontSize: "16px",
      color: "#ffffff",
    });
    container.add(plusSymbol);

    return container;
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    isSelected: boolean,
    onClick: () => void
  ) {
    const container = this.scene.add.container(x, y);
    const width = 100;
    const height = 30;

    // Background
    const background = this.scene.add.rectangle(
      0,
      0,
      width,
      height,
      isSelected ? 0x4477ff : 0x555555
    );
    background.setOrigin(0, 0);
    container.add(background);

    // Label
    const text = this.scene.add.text(width / 2, height / 2, label, {
      fontSize: "14px",
      color: "#ffffff",
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    // Make interactive
    background.setInteractive({ useHandCursor: true });
    background.on("pointerdown", onClick);

    // Add methods for selection state
    const setSelected = (selected: boolean) => {
      background.fillColor = selected ? 0x4477ff : 0x555555;
    };

    return { container, setSelected };
  }

  show(): void {
    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  updatePositionForResize(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  getConfig(): PlatformConfigData {
    return { ...this.config };
  }

  setConfig(config: Partial<PlatformConfigData>): void {
    this.config = { ...this.config, ...config };
    this.updateControls();
  }

  private updateControls(): void {
    // This would update the UI controls to match the current config
    // Not implementing the details here as it would require tracking all UI elements
  }
}
