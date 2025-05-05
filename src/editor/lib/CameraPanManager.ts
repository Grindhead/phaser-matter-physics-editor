import { Scene } from "phaser";
import { EditorEventBus } from "./EditorEventBus";
import { EditorEvents } from "./EditorEventTypes";

/**
 * Manages camera panning functionality in the editor
 */
export class CameraPanManager {
  private scene: Scene;
  private eventBus: EditorEventBus;
  private isPanning: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private spaceKey: Phaser.Input.Keyboard.Key;
  private uiBounds?: Phaser.Geom.Rectangle;

  constructor(scene: Scene) {
    this.scene = scene;
    this.eventBus = EditorEventBus.getInstance();

    // Set up the space key for panning activation
    this.spaceKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // Set up input handlers
    this.setupInputHandlers();
  }

  /**
   * Sets UI bounds to avoid camera pan interactions in UI areas
   * @param bounds The rectangle defining UI bounds
   */
  public setUIBounds(bounds: Phaser.Geom.Rectangle): void {
    this.uiBounds = bounds;
  }

  /**
   * Sets up input handlers for camera panning
   */
  private setupInputHandlers(): void {
    // Set up pointer down handler for starting panning
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Only start panning if left button is down and space is held
      if (pointer.leftButtonDown() && this.spaceKey.isDown) {
        // Skip if click is over UI elements
        if (this.uiBounds && this.uiBounds.contains(pointer.x, pointer.y)) {
          return;
        }

        // Start panning
        this.isPanning = true;
        this.lastX = pointer.x;
        this.lastY = pointer.y;

        // Emit pan start event
        this.eventBus.emit(EditorEvents.CAMERA_PAN_START, {
          x: pointer.x,
          y: pointer.y,
        });
      }
    });

    // Set up pointer move handler for panning
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isPanning && pointer.leftButtonDown()) {
        // Calculate distance moved
        const dx = pointer.x - this.lastX;
        const dy = pointer.y - this.lastY;

        // Move camera opposite to pointer movement
        this.scene.cameras.main.scrollX -= dx / this.scene.cameras.main.zoom;
        this.scene.cameras.main.scrollY -= dy / this.scene.cameras.main.zoom;

        // Update last position
        this.lastX = pointer.x;
        this.lastY = pointer.y;

        // Emit pan event
        this.eventBus.emit(EditorEvents.CAMERA_PAN, {
          x: pointer.x,
          y: pointer.y,
          dx,
          dy,
        });
      }
    });

    // Set up pointer up and pointer out handlers to stop panning
    this.scene.input.on("pointerup", this.stopPanning, this);
    this.scene.input.on("pointerout", this.stopPanning, this);

    // Set up space key up handler to stop panning
    this.spaceKey.on("up", () => {
      if (this.isPanning) {
        this.stopPanning();
      }
    });
  }

  /**
   * Stops the panning operation
   */
  private stopPanning(): void {
    if (this.isPanning) {
      this.isPanning = false;

      // Emit pan end event
      this.eventBus.emit(EditorEvents.CAMERA_PAN_END);
    }
  }

  /**
   * Manually centers the camera on a specific point
   * @param x The x coordinate to center on
   * @param y The y coordinate to center on
   */
  public centerCameraOn(x: number, y: number): void {
    this.scene.cameras.main.centerOn(x, y);
  }

  /**
   * Sets the camera zoom level
   * @param zoom The zoom level to set
   */
  public setZoom(zoom: number): void {
    // Clamp zoom between reasonable values
    const clampedZoom = Math.max(0.25, Math.min(3, zoom));

    // Set camera zoom
    this.scene.cameras.main.setZoom(clampedZoom);

    // Emit zoom event
    this.eventBus.emit(EditorEvents.CAMERA_ZOOM, {
      zoom: clampedZoom,
    });
  }

  /**
   * Clean up all event listeners and references
   */
  public destroy(): void {
    // Remove event listeners
    this.scene.input.off("pointerdown");
    this.scene.input.off("pointermove");
    this.scene.input.off("pointerup", this.stopPanning, this);
    this.scene.input.off("pointerout", this.stopPanning, this);

    // Remove space key handler
    this.spaceKey.removeAllListeners();
  }
}
