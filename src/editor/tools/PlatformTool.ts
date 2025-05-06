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
  private onPlacementConfigured: (config: any) => void;
  private placementPreview: Phaser.GameObjects.Rectangle | null = null;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private escKey: Phaser.Input.Keyboard.Key;
  private isActivating: boolean = false;

  constructor(scene: Scene, onPlacementConfigured: (config: any) => void) {
    this.scene = scene;
    this.onPlacementConfigured = onPlacementConfigured;

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

        // Hide the panel immediately
        if (this.panel) {
          this.panel.hide();
        }

        // Remove blocking rectangle if it exists
        const blockingRect = this.scene.children.getByName(
          "platformPanelBlockingRect"
        );
        if (blockingRect) {
          blockingRect.destroy();
        }

        // --- NEW LOGIC ---
        console.log(
          "PlatformTool: Signaling placement configured with:",
          this.platformConfig
        );
        // Signal that configuration is done and placement mode should activate
        this.onPlacementConfigured(this.platformConfig);
        // Deactivate the tool's UI elements (overlay)
        this.deactivate();
        // --- END NEW LOGIC ---
      },
    });

    // Setup ESC key to cancel
    if (this.scene.input.keyboard) {
      this.escKey = this.scene.input.keyboard.addKey("ESC");
      this.escKey.on("down", this.deactivate, this);
    }
  }

  activate(): void {
    console.log("[PlatformTool] activate() called");

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
    console.log("[PlatformTool] Showing platform panel...");
    this.panel.show();
    console.log(
      "[PlatformTool] After panel.show(). Panel container visibility:",
      this.panel.container?.visible
    );

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
    // Removing the listeners we commented out earlier
    // this.scene.input.off("pointermove", this.onPointerMove, this);
    // this.scene.input.off("pointerdown", this.onPointerDown, this);

    console.log("PlatformTool: Deactivation complete");
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
    // this.scene.input.off("pointermove", this.onPointerMove, this);
    // this.scene.input.off("pointerdown", this.onPointerDown, this);

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
