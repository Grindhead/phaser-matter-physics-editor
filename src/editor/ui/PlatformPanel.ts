import { Scene } from "phaser";

export interface PlatformPanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onConfigChange: (config: any) => void;
  onPlaceButtonClick: () => void;
  initialConfig?: {
    isVertical?: boolean;
    segmentCount?: number;
    segmentWidth?: number;
  };
}

export class PlatformPanel {
  scene: Scene;
  container: Phaser.GameObjects.Container;
  config: {
    isVertical: boolean;
    segmentCount: number;
    segmentWidth: number;
  };
  orientationText: Phaser.GameObjects.Text;
  segmentCountText: Phaser.GameObjects.Text;
  segmentWidthText: Phaser.GameObjects.Text;
  onConfigChange: (config: any) => void;
  onPlaceButtonClick: () => void;
  visible: boolean = false;

  constructor(scene: Scene, options: PlatformPanelConfig) {
    this.scene = scene;
    // Default values
    this.config = {
      isVertical: false,
      segmentCount: 3, // Default segment count
      segmentWidth: 32, // Default segment width (matches TILE_WIDTH)
    };

    // Apply initial config if provided
    if (options.initialConfig) {
      console.log("PlatformPanel using initialConfig:", options.initialConfig);
      this.config = {
        ...this.config,
        ...options.initialConfig,
      };
    }

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
    this.container = scene.add.container(options.x, options.y);

    // Create background with better shadowing - make it shorter since we're removing width controls
    const panelHeight = 250; // Reduced from 300
    const panelBg = scene.add.rectangle(
      0,
      0,
      options.width,
      panelHeight,
      0x333333,
      0.95
    );
    panelBg.setOrigin(0, 0);
    panelBg.setStrokeStyle(3, 0x6688ff); // Brighter more visible border
    this.container.add(panelBg);

    // Add drop shadow effect
    const shadow = scene.add.rectangle(
      4,
      4,
      options.width,
      panelHeight,
      0x000000,
      0.3
    );
    shadow.setOrigin(0, 0);
    this.container.add(shadow);
    this.container.bringToTop(panelBg);

    // Create components with better styling
    this.createHeader(options.width);
    this.createTitle(options.width);
    this.createOrientationControls(options.width);
    this.createSegmentCountControls(options.width);
    this.createPlaceButton(options.width);

    // Set panel to be fixed to camera and ensure it's above everything
    this.container.setScrollFactor(0);
    this.container.setDepth(9999); // Extremely high depth to ensure visibility above all other elements

    // Explicitly set visibility
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

  private createHeader(width: number): void {
    // Create header bar - with a more prominent color
    const header = this.scene.add.rectangle(0, 0, width, 30, 0x4466cc);
    header.setOrigin(0, 0);
    header.setStrokeStyle(1, 0x88aaff);
    this.container.add(header);

    // Add close button to header
    const closeButton = this.scene.add.rectangle(
      width - 20,
      15,
      16,
      16,
      0xaa0000
    );
    closeButton.setOrigin(0.5);
    closeButton
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        closeButton.setFillStyle(0xff0000);
      })
      .on("pointerout", () => {
        closeButton.setFillStyle(0xaa0000);
      })
      .on("pointerdown", () => {
        this.hide();
        // Remove any overlay as well
        const overlay = this.scene.children.getByName("platformModeOverlay");
        if (overlay) {
          overlay.destroy();
        }
      });

    // Add X to close button
    const closeX = this.scene.add.text(width - 20, 15, "✕", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#FFFFFF",
    });
    closeX.setOrigin(0.5);

    this.container.add(closeButton);
    this.container.add(closeX);
  }

  private createTitle(width: number): void {
    const title = this.scene.add.text(width / 2, 15, "Platform Configuration", {
      fontFamily: "Arial",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#FFFFFF",
    });
    title.setOrigin(0.5, 0.5);
    this.container.add(title);
  }

  private createOrientationControls(width: number): void {
    // Label - centered above the dropdown
    const orientationLabel = this.scene.add.text(
      width / 2,
      55, // Adjusted position
      "Orientation:",
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#FFFFFF",
        fontStyle: "bold",
      }
    );
    orientationLabel.setOrigin(0.5, 0);
    this.container.add(orientationLabel);

    const dropdownY = 85; // Adjusted position

    // Dropdown
    const dropdownBg = this.scene.add.rectangle(
      width / 2,
      dropdownY,
      160, // Wider dropdown
      36, // Taller dropdown
      0x3d3d3d
    );
    dropdownBg.setOrigin(0.5, 0.5);
    dropdownBg.setStrokeStyle(2, 0x666666);
    dropdownBg.setInteractive({ useHandCursor: true });
    this.container.add(dropdownBg);

    // Text
    this.orientationText = this.scene.add.text(
      width / 2,
      dropdownY,
      this.config.isVertical ? "Vertical" : "Horizontal",
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#FFFFFF",
        fontStyle: "bold",
      }
    );
    this.orientationText.setOrigin(0.5, 0.5);
    this.container.add(this.orientationText);

    // Make dropdown interactive
    dropdownBg
      .on("pointerover", () => {
        dropdownBg.setFillStyle(0x555555);
        dropdownBg.setStrokeStyle(2, 0x888888);
      })
      .on("pointerout", () => {
        dropdownBg.setFillStyle(0x3d3d3d);
        dropdownBg.setStrokeStyle(2, 0x666666);
      })
      .on("pointerdown", () => {
        this.config.isVertical = !this.config.isVertical;
        this.orientationText.setText(
          this.config.isVertical ? "Vertical" : "Horizontal"
        );
        this.onConfigChange(this.config);
      });
  }

  private createSegmentCountControls(width: number): void {
    // Label for segment count
    const segmentLabel = this.scene.add.text(
      width / 2,
      125, // Adjusted position
      "Segments:",
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#FFFFFF",
        fontStyle: "bold",
      }
    );
    segmentLabel.setOrigin(0.5, 0);
    this.container.add(segmentLabel);

    // Create minus button
    const minusButton = this.scene.add.rectangle(
      width / 2 - 60,
      155, // Adjusted position
      40, // Slightly larger button
      40,
      0x3d3d3d
    );
    minusButton.setOrigin(0.5);
    minusButton.setStrokeStyle(3, 0x666666); // Thicker border
    minusButton.setInteractive({ useHandCursor: true });
    // Set a larger hit area
    if (minusButton.input) {
      minusButton.input.hitArea.setTo(-5, -5, 50, 50);
    }
    this.container.add(minusButton);

    const minusText = this.scene.add.text(width / 2 - 60, 155, "-", {
      fontFamily: "Arial",
      fontSize: "28px", // Larger font
      color: "#FFFFFF",
      fontStyle: "bold",
    });
    minusText.setOrigin(0.5);
    this.container.add(minusText);

    // Create segment count display
    const countBg = this.scene.add.rectangle(width / 2, 155, 60, 40, 0x444444);
    countBg.setOrigin(0.5);
    countBg.setStrokeStyle(2, 0x666666);
    this.container.add(countBg);

    this.segmentCountText = this.scene.add.text(
      width / 2,
      155,
      this.config.segmentCount.toString(),
      {
        fontFamily: "Arial",
        fontSize: "22px", // Larger font
        color: "#FFFFFF",
        fontStyle: "bold",
      }
    );
    this.segmentCountText.setOrigin(0.5);
    this.container.add(this.segmentCountText);

    // Create plus button
    const plusButton = this.scene.add.rectangle(
      width / 2 + 60,
      155,
      40, // Slightly larger button
      40,
      0x3d3d3d
    );
    plusButton.setOrigin(0.5);
    plusButton.setStrokeStyle(3, 0x666666); // Thicker border
    plusButton.setInteractive({ useHandCursor: true });
    // Set a larger hit area
    if (plusButton.input) {
      plusButton.input.hitArea.setTo(-5, -5, 50, 50);
    }
    this.container.add(plusButton);

    const plusText = this.scene.add.text(width / 2 + 60, 155, "+", {
      fontFamily: "Arial",
      fontSize: "28px", // Larger font
      color: "#FFFFFF",
      fontStyle: "bold",
    });
    plusText.setOrigin(0.5);
    this.container.add(plusText);

    // Add interactivity to minus button
    minusButton
      .on("pointerover", () => {
        minusButton.setFillStyle(0x555555);
        minusButton.setStrokeStyle(3, 0x888888); // Thicker border on hover
        console.log("Pointer over segment count minus button");
      })
      .on("pointerout", () => {
        minusButton.setFillStyle(0x3d3d3d);
        minusButton.setStrokeStyle(3, 0x666666); // Thicker border
      })
      .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        console.log(
          "Segment count minus button clicked at",
          pointer.x,
          pointer.y
        );
        if (this.config.segmentCount > 1) {
          this.config.segmentCount--;
          this.segmentCountText.setText(this.config.segmentCount.toString());
          this.onConfigChange(this.config);
          console.log("Segment count decreased to:", this.config.segmentCount);

          // Visual feedback
          minusButton.setFillStyle(0x777777);
          this.scene.time.delayedCall(100, () => {
            minusButton.setFillStyle(0x555555);
          });
        }
      });

    // Add interactivity to plus button
    plusButton
      .on("pointerover", () => {
        plusButton.setFillStyle(0x555555);
        plusButton.setStrokeStyle(3, 0x888888); // Thicker border on hover
        console.log("Pointer over segment count plus button");
      })
      .on("pointerout", () => {
        plusButton.setFillStyle(0x3d3d3d);
        plusButton.setStrokeStyle(3, 0x666666); // Thicker border
      })
      .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        console.log(
          "Segment count plus button clicked at",
          pointer.x,
          pointer.y
        );
        if (this.config.segmentCount < 10) {
          this.config.segmentCount++;
          this.segmentCountText.setText(this.config.segmentCount.toString());
          this.onConfigChange(this.config);
          console.log("Segment count increased to:", this.config.segmentCount);

          // Visual feedback
          plusButton.setFillStyle(0x777777);
          this.scene.time.delayedCall(100, () => {
            plusButton.setFillStyle(0x555555);
          });
        }
      });
  }

  private createPlaceButton(width: number): void {
    // Move button up since we removed width controls
    const placeBtnY = 195; // Adjusted position to match where segment count ends

    // Button background
    const placeBtn = this.scene.add.rectangle(
      width / 2,
      placeBtnY,
      220, // Wider button
      54, // Taller button
      0x00aa00
    );
    placeBtn.setOrigin(0.5);
    placeBtn.setStrokeStyle(4, 0x00cc00); // Thicker border
    placeBtn.setInteractive({ useHandCursor: true });

    // Add a shadow for depth
    const shadow = this.scene.add.rectangle(
      width / 2 + 3,
      placeBtnY + 3,
      220,
      54,
      0x000000,
      0.3
    );
    shadow.setOrigin(0.5);
    this.container.add(shadow);
    this.container.add(placeBtn);

    // Button text
    const placeBtnText = this.scene.add.text(
      width / 2,
      placeBtnY,
      "Place Platform",
      {
        fontFamily: "Arial",
        fontSize: "24px", // Larger font
        fontStyle: "bold",
        color: "#FFFFFF",
      }
    );
    placeBtnText.setOrigin(0.5);
    this.container.add(placeBtnText);

    // Add interactivity
    placeBtn
      .on("pointerover", () => {
        placeBtn.setFillStyle(0x00cc00);
        placeBtn.setStrokeStyle(4, 0x00ff00); // Thicker border
      })
      .on("pointerout", () => {
        placeBtn.setFillStyle(0x00aa00);
        placeBtn.setStrokeStyle(4, 0x00cc00); // Thicker border
      })
      .on("pointerdown", () => {
        // Visual feedback on click
        placeBtn.setFillStyle(0x00dd00);
        this.scene.time.delayedCall(100, () => {
          placeBtn.setFillStyle(0x00cc00);
          this.onPlaceButtonClick();
        });
      });
  }

  show(): void {
    console.log("PlatformPanel.show() called");
    if (this.container) {
      console.log("Setting container to visible...");
      this.container.setVisible(true);

      // Force bring to top
      this.container.setDepth(2500);

      // Make sure panel is positioned within viewport bounds
      // First check if container is outside the visible area
      const camera = this.scene.cameras.main;
      if (
        this.container.x < 10 ||
        this.container.y < 10 ||
        this.container.x + 300 > camera.width ||
        this.container.y + 300 > camera.height
      ) {
        // Reposition to center
        this.container.setPosition(
          Math.max(10, (camera.width - 300) / 2),
          Math.max(10, (camera.height - 300) / 2)
        );
        console.log("Repositioned container to center");
      }

      // Make sure panel is on top of all other UI
      if (this.container.scene) {
        console.log("Bringing container to top...");
        this.container.scene.children.bringToTop(this.container);
      }

      // Ensure all children are interactive
      this.container.list.forEach((child) => {
        if (
          child instanceof Phaser.GameObjects.Rectangle ||
          child instanceof Phaser.GameObjects.Text
        ) {
          if (child.input && child.input.enabled) {
            console.log("Child is interactive:", child);
          }
        }
      });

      // Apply a slight scaling animation for visual feedback
      this.scene.tweens.add({
        targets: this.container,
        scaleX: { from: 0.95, to: 1 },
        scaleY: { from: 0.95, to: 1 },
        duration: 150,
        ease: "Power2",
      });

      // Force a re-render to ensure visibility
      this.scene.time.delayedCall(10, () => {
        if (this.container) {
          this.container.setVisible(true);
          this.scene.children.bringToTop(this.container);
        }
      });
    } else {
      console.error("Cannot show panel: container is null");
    }
    this.visible = true;
    console.log("PlatformPanel visible flag set to:", this.visible);
  }

  hide(): void {
    console.log("PlatformPanel.hide() called");
    if (this.container) {
      this.container.setVisible(false);

      // Don't remove the overlay when just hiding the panel
      // Only remove the close button overlay click handler
      const overlay = this.scene.children.getByName("platformModeOverlay");
      if (overlay && overlay instanceof Phaser.GameObjects.Rectangle) {
        // Just make sure it's not interfering with input
        overlay.setDepth(10); // Lower depth to ensure preview is above it
      }
    } else {
      console.error("Cannot hide panel: container is null");
    }
    this.visible = false;
    console.log("PlatformPanel visible flag set to:", this.visible);
  }

  toggle(): void {
    this.visible = !this.visible;
    if (this.container) {
      this.container.setVisible(this.visible);

      if (this.visible && this.container.scene) {
        this.container.scene.children.bringToTop(this.container);
      }
    }
  }

  getConfig(): any {
    return { ...this.config };
  }

  updateConfig(config: any): void {
    console.log("Updating platform config from:", this.config, "to:", config);
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...config };
    this.orientationText.setText(
      this.config.isVertical ? "Vertical" : "Horizontal"
    );
    if (this.segmentCountText) {
      this.segmentCountText.setText(this.config.segmentCount.toString());
    }
    // We no longer update segmentWidthText since it's removed

    console.log("Platform config updated. New config:", this.config);

    // Log significant changes
    if (oldConfig.segmentCount !== this.config.segmentCount) {
      console.log(
        `Segment count changed: ${oldConfig.segmentCount} → ${this.config.segmentCount}`
      );
    }
    if (oldConfig.isVertical !== this.config.isVertical) {
      console.log(
        `Orientation changed: ${
          oldConfig.isVertical ? "Vertical" : "Horizontal"
        } → ${this.config.isVertical ? "Vertical" : "Horizontal"}`
      );
    }
    // No need to log width changes anymore
  }

  updatePosition(x: number, y: number): void {
    if (this.container) {
      this.container.setPosition(x, y);
    }
  }
}
