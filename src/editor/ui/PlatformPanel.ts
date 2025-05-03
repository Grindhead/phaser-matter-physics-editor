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
  private blockingRect: Phaser.GameObjects.Rectangle | null = null;

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

    // Make the container interactive to capture events at the container level
    // This helps prevent clicks from being captured by underlying elements
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, options.width, 250),
      Phaser.Geom.Rectangle.Contains
    );

    // Create background with soft rounded corners effect
    const panelHeight = 250; // Reduced from 300

    // Create shadow first (beneath the panel)
    const shadow = scene.add.rectangle(
      6,
      6,
      options.width,
      panelHeight,
      0x000000,
      0.4
    );
    shadow.setOrigin(0, 0);
    this.container.add(shadow);

    // Main panel background with gradient-like effect
    const panelBg = scene.add.rectangle(
      0,
      0,
      options.width,
      panelHeight,
      0x1a2a5a,
      0.95
    );
    panelBg.setOrigin(0, 0);
    panelBg.setStrokeStyle(2, 0x4477cc);
    this.container.add(panelBg);

    // Create a subtle highlight effect at the top
    const highlight = scene.add.rectangle(
      2,
      2,
      options.width - 4,
      20,
      0x5588ee,
      0.2
    );
    highlight.setOrigin(0, 0);
    this.container.add(highlight);

    // Create a blocking rectangle to prevent clicks bleeding through to objects behind
    // This prevents the panel from closing unexpectedly when clicking on its background
    panelBg.setInteractive({ useHandCursor: false });
    panelBg.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Stop event propagation to prevent clicks from reaching objects behind
      pointer.event.stopPropagation();
    });

    // Create components with improved styling
    this.createHeader(options.width);
    this.createTitle(options.width);
    this.createOrientationControls(options.width);
    this.createSegmentCountControls(options.width);
    this.createPlaceButton(options.width);

    // Set panel to be fixed to camera and ensure it's above everything
    this.container.setScrollFactor(0);
    this.container.setDepth(9999);

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
    // Create header bar with gradient-like effect
    const header = this.scene.add.rectangle(0, 0, width, 30, 0x4466cc);
    header.setOrigin(0, 0);
    header.setInteractive({ useHandCursor: false });
    header.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Stop event propagation
      pointer.event.stopPropagation();
    });
    this.container.add(header);

    // Add close button to header
    const closeButton = this.scene.add.circle(width - 15, 15, 10, 0xff3333);
    closeButton.setOrigin(0.5);
    closeButton
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        closeButton.setFillStyle(0xff5555);
      })
      .on("pointerout", () => {
        closeButton.setFillStyle(0xff3333);
      })
      .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        // Stop event propagation
        pointer.event.stopPropagation();
        this.hide();
        // Remove any overlay as well
        const overlay = this.scene.children.getByName("platformModeOverlay");
        if (overlay) {
          overlay.destroy();
        }
      });

    // Add X to close button
    const closeX = this.scene.add.text(width - 15, 15, "×", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#FFFFFF",
      fontStyle: "bold",
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
    // Label with cleaner positioning
    const orientationLabel = this.scene.add.text(
      width / 2,
      50,
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

    const dropdownY = 80;

    // Create a more stylish button-like control
    const dropdownBg = this.scene.add.rectangle(
      width / 2,
      dropdownY,
      180,
      40,
      0x2a3a6a
    );
    dropdownBg.setOrigin(0.5, 0.5);
    dropdownBg.setStrokeStyle(1, 0x5577cc);
    dropdownBg.setInteractive({ useHandCursor: true });
    this.container.add(dropdownBg);

    // Text with improved styling
    this.orientationText = this.scene.add.text(
      width / 2,
      dropdownY,
      this.config.isVertical ? "Vertical" : "Horizontal",
      {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#FFFFFF",
        fontStyle: "bold",
      }
    );
    this.orientationText.setOrigin(0.5, 0.5);
    this.container.add(this.orientationText);

    // Add subtle indicators to show it's clickable
    const indicator = this.scene.add.text(width / 2 + 70, dropdownY, "↓", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#88aaff",
    });
    indicator.setOrigin(0.5, 0.5);
    this.container.add(indicator);

    // Add interactivity to the indicator and text to ensure clicks register
    this.orientationText.setInteractive({ useHandCursor: true });
    indicator.setInteractive({ useHandCursor: true });

    // Make dropdown components interactive with improved visual feedback
    const toggleOrientation = () => {
      // Toggle the orientation
      this.config.isVertical = !this.config.isVertical;
      this.orientationText.setText(
        this.config.isVertical ? "Vertical" : "Horizontal"
      );
      this.onConfigChange(this.config);

      // Visual feedback for click
      dropdownBg.setFillStyle(0x4a5a8a);

      // Schedule reset of visual state
      this.scene.time.delayedCall(100, () => {
        dropdownBg.setFillStyle(0x3a4a7a);
      });
    };

    dropdownBg
      .on("pointerover", () => {
        dropdownBg.setFillStyle(0x3a4a7a);
        dropdownBg.setStrokeStyle(2, 0x7799ee);
      })
      .on("pointerout", () => {
        dropdownBg.setFillStyle(0x2a3a6a);
        dropdownBg.setStrokeStyle(1, 0x5577cc);
      })
      .on("pointerdown", toggleOrientation);

    // Add click handlers to other components too for better click coverage
    this.orientationText.on("pointerdown", toggleOrientation);
    indicator.on("pointerdown", toggleOrientation);
  }

  private createSegmentCountControls(width: number): void {
    // Label for segment count with improved positioning
    const segmentLabel = this.scene.add.text(width / 2, 130, "Segments:", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#FFFFFF",
      fontStyle: "bold",
    });
    segmentLabel.setOrigin(0.5, 0);
    this.container.add(segmentLabel);

    const controlsY = 160;
    const buttonSize = 36;
    const spacing = 55;

    // Create a stylish number display
    const countBg = this.scene.add.rectangle(
      width / 2,
      controlsY,
      buttonSize,
      buttonSize,
      0x2a3a6a
    );
    countBg.setOrigin(0.5, 0.5);
    countBg.setStrokeStyle(1, 0x5577cc);
    this.container.add(countBg);

    // Create text for segment count
    this.segmentCountText = this.scene.add.text(
      width / 2,
      controlsY,
      this.config.segmentCount.toString(),
      {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#FFFFFF",
        fontStyle: "bold",
      }
    );
    this.segmentCountText.setOrigin(0.5, 0.5);
    this.container.add(this.segmentCountText);

    // Create minus button with improved styling
    const minusButton = this.scene.add.rectangle(
      width / 2 - spacing,
      controlsY,
      buttonSize,
      buttonSize,
      0x3a4a7a
    );
    minusButton.setOrigin(0.5, 0.5);
    minusButton.setStrokeStyle(1, 0x5577cc);
    minusButton.setInteractive({ useHandCursor: true });
    this.container.add(minusButton);

    // Add minus text
    const minusText = this.scene.add.text(width / 2 - spacing, controlsY, "-", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#FFFFFF",
      fontStyle: "bold",
    });
    minusText.setOrigin(0.5, 0.5);
    this.container.add(minusText);
    minusText.setInteractive({ useHandCursor: true });

    // Create plus button with improved styling
    const plusButton = this.scene.add.rectangle(
      width / 2 + spacing,
      controlsY,
      buttonSize,
      buttonSize,
      0x3a4a7a
    );
    plusButton.setOrigin(0.5, 0.5);
    plusButton.setStrokeStyle(1, 0x5577cc);
    plusButton.setInteractive({ useHandCursor: true });
    this.container.add(plusButton);

    // Add plus text
    const plusText = this.scene.add.text(width / 2 + spacing, controlsY, "+", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#FFFFFF",
      fontStyle: "bold",
    });
    plusText.setOrigin(0.5, 0.5);
    this.container.add(plusText);
    plusText.setInteractive({ useHandCursor: true });

    // Function to decrement segment count
    const decrementCount = () => {
      // Prevent going below 1 segment
      if (this.config.segmentCount > 1) {
        this.config.segmentCount--;
        this.segmentCountText.setText(this.config.segmentCount.toString());
        this.onConfigChange(this.config);
      }

      // Visual feedback
      minusButton.setFillStyle(0x2a3a6a);
      this.scene.time.delayedCall(100, () => {
        minusButton.setFillStyle(0x3a4a7a);
      });
    };

    // Function to increment segment count
    const incrementCount = () => {
      // Prevent going above 10 segments
      if (this.config.segmentCount < 10) {
        this.config.segmentCount++;
        this.segmentCountText.setText(this.config.segmentCount.toString());
        this.onConfigChange(this.config);
      }

      // Visual feedback
      plusButton.setFillStyle(0x2a3a6a);
      this.scene.time.delayedCall(100, () => {
        plusButton.setFillStyle(0x3a4a7a);
      });
    };

    // Make buttons interactive with improved visual feedback
    minusButton
      .on("pointerover", () => {
        minusButton.setFillStyle(0x4a5a8a);
      })
      .on("pointerout", () => {
        minusButton.setFillStyle(0x3a4a7a);
      })
      .on("pointerdown", decrementCount);

    // Also make the text interactive for better click coverage
    minusText.on("pointerdown", decrementCount);

    plusButton
      .on("pointerover", () => {
        plusButton.setFillStyle(0x4a5a8a);
      })
      .on("pointerout", () => {
        plusButton.setFillStyle(0x3a4a7a);
      })
      .on("pointerdown", incrementCount);

    // Also make the text interactive for better click coverage
    plusText.on("pointerdown", incrementCount);
  }

  private createPlaceButton(width: number): void {
    const buttonY = 210;
    const buttonHeight = 50;

    // Create a bright, attention-grabbing button
    const placeButtonBg = this.scene.add.rectangle(
      width / 2,
      buttonY,
      200,
      buttonHeight,
      0x00aa44
    );
    placeButtonBg.setOrigin(0.5, 0);
    placeButtonBg.setStrokeStyle(2, 0x00cc55);
    placeButtonBg.setInteractive({ useHandCursor: true });
    this.container.add(placeButtonBg);

    // Add gradient-like highlight effect
    const buttonHighlight = this.scene.add.rectangle(
      width / 2,
      buttonY + 2,
      196,
      10,
      0x00dd66,
      0.3
    );
    buttonHighlight.setOrigin(0.5, 0);
    this.container.add(buttonHighlight);

    // Add text with shadow effect
    const placeText = this.scene.add.text(
      width / 2,
      buttonY + buttonHeight / 2,
      "Place Platform",
      {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#FFFFFF",
        fontStyle: "bold",
      }
    );
    placeText.setOrigin(0.5, 0.5);
    placeText.setShadow(1, 1, "#000000", 1);
    placeText.setInteractive({ useHandCursor: true });
    this.container.add(placeText);

    // Function to handle place button click
    const handlePlaceClick = () => {
      // Visual feedback on click
      placeButtonBg.setFillStyle(0x009944);

      // Set a small delay to prevent immediate processing of other clicks
      this.scene.time.delayedCall(100, () => {
        console.log("Place Platform button clicked");
        this.onPlaceButtonClick();
      });
    };

    // Make both the button and text interactive for better click coverage
    placeButtonBg
      .on("pointerover", () => {
        placeButtonBg.setFillStyle(0x00bb55);
        placeButtonBg.setStrokeStyle(2, 0x00ee66);
      })
      .on("pointerout", () => {
        placeButtonBg.setFillStyle(0x00aa44);
        placeButtonBg.setStrokeStyle(2, 0x00cc55);
      })
      .on("pointerdown", handlePlaceClick);

    // Add click handler to text too
    placeText.on("pointerdown", handlePlaceClick);
  }

  show(): void {
    if (!this.container) {
      console.error("Cannot show platform panel: container is null");
      return;
    }

    // Don't do anything if already visible
    if (this.visible) {
      console.log("PlatformPanel is already visible, ignoring show() call");
      return;
    }

    console.log("PlatformPanel.show() called");

    // Create a blocking rectangle to prevent clicks from going through the panel
    if (!this.blockingRect) {
      this.blockingRect = this.scene.add.rectangle(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0x000000,
        0.001 // Almost invisible
      );
      this.blockingRect.setScrollFactor(0);
      this.blockingRect.setDepth(900); // Lower depth so it's below the panel
      this.blockingRect.setName("platformPanelBlockingRect"); // Add a name for easy reference
      this.blockingRect.setInteractive();

      // Only block clicks outside of the panel's area
      this.blockingRect.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        const panelBounds = this.container.getBounds();
        // Check if the click is outside the panel area
        if (
          !Phaser.Geom.Rectangle.Contains(panelBounds, pointer.x, pointer.y)
        ) {
          // Stop propagation only for clicks outside the panel
          pointer.event.stopPropagation();
          console.log("Blocked click outside panel area");
        }
      });
    }

    // Set container to interactive again when showing it
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, this.container.width, 250),
      Phaser.Geom.Rectangle.Contains
    );

    // Set visibility before starting animation
    this.container.setVisible(true);
    this.visible = true;

    // Ensure correct z-ordering
    if (this.blockingRect) {
      this.scene.children.bringToTop(this.blockingRect);
    }

    // Make sure our container is on top of the blocking rectangle
    this.scene.children.bringToTop(this.container);
    this.container.setDepth(1000); // Higher than blocking rectangle

    // Add animation
    this.container.setScale(0.95);
    this.container.setAlpha(0.9);
    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 150,
      ease: "Power2",
    });
  }

  hide(): void {
    console.log("PlatformPanel.hide() called");

    // Don't do anything if already hidden
    if (!this.visible) {
      console.log("PlatformPanel is already hidden, ignoring hide() call");
      return;
    }

    // Remove the blocking rectangle if it exists
    if (this.blockingRect) {
      this.blockingRect.destroy();
      this.blockingRect = null;
    }

    if (this.container) {
      // Make container non-interactive when hiding
      this.container.disableInteractive();

      // Add a fade-out animation
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        scale: 0.95,
        duration: 150,
        ease: "Power2",
        onComplete: () => {
          if (this.container) {
            this.container.setVisible(false);
            this.container.setAlpha(1);
            this.container.setScale(1);
          }
          this.visible = false;
        },
      });
    } else {
      this.visible = false;
    }
  }

  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  getConfig(): any {
    return this.config;
  }

  updateConfig(config: any): void {
    console.log("PlatformPanel.updateConfig called with:", config);

    // Update config with new values safely
    if (config.isVertical !== undefined) {
      this.config.isVertical = config.isVertical;
      if (this.orientationText) {
        this.orientationText.setText(
          config.isVertical ? "Vertical" : "Horizontal"
        );
      }
    }

    if (config.segmentCount !== undefined) {
      this.config.segmentCount = config.segmentCount;
      if (this.segmentCountText) {
        this.segmentCountText.setText(config.segmentCount.toString());
      }
    }

    if (config.segmentWidth !== undefined) {
      this.config.segmentWidth = config.segmentWidth;
      if (this.segmentWidthText) {
        this.segmentWidthText.setText(config.segmentWidth.toString());
      }
    }

    console.log("PlatformPanel config updated to:", this.config);
  }

  updatePosition(x: number, y: number): void {
    if (this.container) {
      this.container.setPosition(x, y);
      console.log("Platform panel position updated to", x, y);
    }
  }
}
