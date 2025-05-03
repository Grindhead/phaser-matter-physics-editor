import { Scene } from "phaser";
import { PlatformPanel } from "../ui/PlatformPanel";
import { Platform } from "../../entities/Platforms/Platform";

export class PlatformTool {
  private scene: Scene;
  private panel: PlatformPanel;
  private platformConfig: any = {
    isVertical: false,
    segmentCount: 3,
    segmentWidth: 32,
  };
  private onPlacePlatform: (platform: Platform) => void;
  private onRemovePlatform: (platform: Platform) => void;
  private placementPreview: Phaser.GameObjects.Rectangle | null = null;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private escKey: Phaser.Input.Keyboard.Key;
  private isActivating: boolean = false;

  constructor(
    scene: Scene,
    onPlacePlatform: (platform: Platform) => void,
    onRemovePlatform: (platform: Platform) => void = () => {}
  ) {
    this.scene = scene;
    this.onPlacePlatform = onPlacePlatform;
    this.onRemovePlatform = onRemovePlatform;

    // Create the platform configuration panel
    this.panel = new PlatformPanel(this.scene, {
      x: Math.max(10, (scene.cameras.main.width - 300) / 2),
      y: Math.max(10, (scene.cameras.main.height - 250) / 2),
      width: 300,
      height: 250,
      initialConfig: this.platformConfig,
      onConfigChange: (config) => {
        console.log("PlatformTool: received config change:", config);

        // Store old config for comparison
        const oldConfig = { ...this.platformConfig };

        // Update with new values but keep segmentWidth fixed
        this.platformConfig = {
          ...this.platformConfig,
          isVertical: config.isVertical,
          segmentCount: config.segmentCount,
          // segmentWidth is intentionally not updated
        };

        console.log("PlatformTool: updated config:", this.platformConfig);

        // Log changes to important values
        if (oldConfig.segmentCount !== this.platformConfig.segmentCount) {
          console.log(
            `PlatformTool: segment count changed: ${oldConfig.segmentCount} → ${this.platformConfig.segmentCount}`
          );
        }

        // Update the preview if it exists
        if (this.placementPreview) {
          this.updatePlacementPreview();
        }
      },
      onPlaceButtonClick: () => {
        console.log("PlatformTool: place button clicked");

        // Hide the panel immediately - this should happen before preview creation
        if (this.panel) {
          this.panel.hide();
        }

        // Remove blocking rectangle on the panel to allow clicks through
        const blockingRect = this.scene.children.getByName(
          "platformPanelBlockingRect"
        );
        if (blockingRect) {
          blockingRect.destroy();
        }

        // Short delay to allow panel to hide fully
        this.scene.time.delayedCall(50, () => {
          // If there's no preview yet, create it now
          if (!this.placementPreview) {
            this.createPlacementPreview();
            console.log(
              "PlatformTool: preview created, follow cursor to position platform"
            );
          }

          // The overlay should remain visible to dim the background
          // while placing the platform
          if (this.overlay) {
            this.scene.children.bringToTop(this.overlay);
            if (this.placementPreview) {
              this.scene.children.bringToTop(this.placementPreview);
            }
          }
        });
      },
    });

    // Setup pointer move event
    this.scene.input.on("pointermove", this.onPointerMove, this);

    // Setup pointer down event
    this.scene.input.on("pointerdown", this.onPointerDown, this);

    // Setup ESC key to cancel
    if (this.scene.input.keyboard) {
      this.escKey = this.scene.input.keyboard.addKey("ESC");
      this.escKey.on("down", this.deactivate, this);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    // Only check if we have a preview - we don't need the panel to be visible anymore
    if (!this.placementPreview) return;

    const worldPoint = this.scene.cameras.main.getWorldPoint(
      pointer.x,
      pointer.y
    );
    this.updatePreviewPosition(worldPoint.x, worldPoint.y);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    // Skip if not a left mouse button click
    if (pointer.button !== 0) return;

    // Only handle this click if we have a placement preview
    // This ensures we don't interfere with panel interactions
    if (!this.placementPreview) return;

    // Get the world position
    const worldPoint = this.scene.cameras.main.getWorldPoint(
      pointer.x,
      pointer.y
    );

    // Update the preview position
    this.updatePreviewPosition(worldPoint.x, worldPoint.y);

    // Place the platform at this position
    this.placePlatform();
  }

  activate(): void {
    console.log("PlatformTool.activate() called");

    // Prevent multiple activations
    if (this.isActivating) {
      console.log("PlatformTool activation already in progress");
      return;
    }

    this.isActivating = true;

    if (!this.panel) {
      console.error("Cannot activate platform tool: panel is null");
      this.isActivating = false;
      return;
    }

    // Ensure clean state by running full deactivate (will hide any existing panels)
    this.deactivate();

    // Reset config to default values
    this.resetConfig();

    // Create the overlay for background dimming - use the current camera dimensions
    const cameraWidth = this.scene.cameras.main.width;
    const cameraHeight = this.scene.cameras.main.height;

    this.overlay = this.scene.add.rectangle(
      0,
      0,
      cameraWidth,
      cameraHeight,
      0x000000,
      0.2
    );
    this.overlay.setOrigin(0, 0);
    this.overlay.setScrollFactor(0);
    this.overlay.setDepth(800); // Lower depth than panel
    this.overlay.setName("platformModeOverlay");

    // Make overlay interactive to prevent clicks from reaching the scene
    // But only for clicks outside the panel area
    this.overlay.setInteractive({ useHandCursor: false });

    // Set panel position to center of screen
    const centerX = Math.max(10, (cameraWidth - 300) / 2);
    const centerY = Math.max(10, (cameraHeight - 300) / 2);
    this.panel.updatePosition(centerX, centerY);

    // Show the panel immediately
    console.log("Showing platform panel");
    this.panel.show();

    // Ensure good Z-ordering - overlay must be below panel
    if (this.overlay && this.overlay.scene) {
      this.scene.children.bringToTop(this.overlay);
    }

    if (this.panel.container) {
      this.panel.container.setVisible(true);
      this.panel.container.setDepth(2500); // Ensure panel is above overlay
      this.scene.children.bringToTop(this.panel.container);
    }

    // Print some helpful messages
    console.log(
      "Platform Tool: 1) Configure the platform orientation and segment count"
    );
    console.log("Platform Tool: 2) Click 'Place Platform' button when ready");
    console.log(
      "Platform Tool: 3) Click in the scene to position and place the platform"
    );

    // Clear activation flag after panel is shown
    this.isActivating = false;
  }

  deactivate(): void {
    console.log("PlatformTool.deactivate() called");
    this.isActivating = false;

    // Hide the panel if it exists
    if (this.panel) {
      this.panel.hide();
    }

    // Destroy the placement preview if it exists
    this.destroyPlacementPreview();

    // Destroy the overlay if it exists
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
      console.log("PlatformTool: Overlay destroyed");
    }

    // IMPORTANT: Remove specific listeners added by this tool?
    // Currently, the listeners are added globally in the constructor.
    // If this tool should ONLY handle input when active, these listeners
    // should be added in activate() and removed here.
    // For now, we assume they are meant to be global for the scene
    // but this might be incorrect.
    console.log(
      "PlatformTool: Deactivation complete (Note: Global listeners potentially remain)"
    );
  }

  private createPlacementPreview(): void {
    // First remove any existing preview
    this.destroyPlacementPreview();

    // Calculate dimensions based on config
    const segmentWidth = this.platformConfig.segmentWidth || 32;
    const width = this.platformConfig.isVertical
      ? segmentWidth
      : segmentWidth * this.platformConfig.segmentCount;
    const height = this.platformConfig.isVertical
      ? segmentWidth * this.platformConfig.segmentCount
      : segmentWidth;

    // Create preview rectangle with a clearly visible color
    this.placementPreview = this.scene.add.rectangle(
      0,
      0,
      width,
      height,
      0x00ff88,
      0.6
    );
    this.placementPreview.setStrokeStyle(3, 0x00ff00);
    this.placementPreview.setDepth(950); // Above overlay but below UI
    this.placementPreview.setName("platformPreview");

    // Get the current mouse position and place the preview there immediately
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(
      pointer.x,
      pointer.y
    );
    this.updatePreviewPosition(worldPoint.x, worldPoint.y);

    console.log("Platform preview created at", worldPoint.x, worldPoint.y);
  }

  private updatePlacementPreview(): void {
    if (!this.placementPreview) return;

    // Update dimensions based on current config
    const segmentWidth = this.platformConfig.segmentWidth || 32;
    const width = this.platformConfig.isVertical
      ? segmentWidth
      : segmentWidth * this.platformConfig.segmentCount;
    const height = this.platformConfig.isVertical
      ? segmentWidth * this.platformConfig.segmentCount
      : segmentWidth;
    this.placementPreview.width = width;
    this.placementPreview.height = height;
  }

  private updatePreviewPosition(x: number, y: number): void {
    if (!this.placementPreview) return;
    this.placementPreview.setPosition(x, y);
  }

  private destroyPlacementPreview(): void {
    if (this.placementPreview) {
      this.placementPreview.destroy();
      this.placementPreview = null;
    }
  }

  private placePlatform(): void {
    if (!this.placementPreview) return;

    // Get the current position
    const x = this.placementPreview.x;
    const y = this.placementPreview.y;

    // Create a unique ID for the platform
    const platformId = `platform-${Date.now()}`;

    console.log("Creating platform with config:", {
      segmentCount: this.platformConfig.segmentCount,
      isVertical: this.platformConfig.isVertical,
      segmentWidth: this.platformConfig.segmentWidth,
      id: platformId,
      position: { x, y },
    });

    // Create the actual platform
    const platform = new Platform(
      this.scene,
      x,
      y,
      this.platformConfig.segmentCount,
      platformId,
      this.platformConfig.isVertical,
      this.platformConfig.segmentWidth
    );

    // Make the platform interactive so it can be selected
    platform.setInteractive();

    // If physics is enabled, disable collisions in editor mode
    if (platform.body) {
      (platform.body as MatterJS.BodyType).collisionFilter.group = -1;
    }

    console.log("Platform created:", platform);

    // Call the callback with the created platform
    this.onPlacePlatform(platform);

    // Deactivate after placement
    this.deactivate();
  }

  /**
   * Removes a platform from the scene
   */
  public removePlatform(platform: Platform): void {
    if (!platform) return;

    // Call the removal callback if it exists
    if (this.onRemovePlatform) {
      this.onRemovePlatform(platform);
    }
  }

  getPanel(): PlatformPanel {
    return this.panel;
  }

  updatePanelPosition(): void {
    // Update panel position when window is resized
    this.panel.updatePosition(
      Math.max(10, (this.scene.cameras.main.width - 300) / 2),
      Math.max(10, (this.scene.cameras.main.height - 250) / 2)
    );

    // Also update overlay if it exists
    if (this.overlay) {
      this.overlay.setSize(
        this.scene.cameras.main.width,
        this.scene.cameras.main.height
      );
    }
  }

  cleanup(): void {
    // Clean up event listeners when tool is disposed
    this.scene.input.off("pointermove", this.onPointerMove, this);
    this.scene.input.off("pointerdown", this.onPointerDown, this);

    if (this.escKey) {
      this.escKey.off("down", this.deactivate, this);
    }

    this.deactivate();
  }

  // Add this new method to reset configuration
  private resetConfig(): void {
    // Reset platform configuration to default values
    this.platformConfig = {
      isVertical: false,
      segmentCount: 3,
      segmentWidth: 32, // Fixed width that won't change
    };

    // Update panel with reset config
    if (this.panel) {
      this.panel.updateConfig(this.platformConfig);
    }

    console.log("Platform config reset to defaults:", this.platformConfig);
  }
}
