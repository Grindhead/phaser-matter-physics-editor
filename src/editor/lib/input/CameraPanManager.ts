import { Scene } from "phaser";
import Phaser from "phaser";
import { EditorEventBus } from "../EditorEventBus";
import { EditorGrid } from "../EditorGrid";

/**
 * Manages camera panning functionality in the editor
 */
export class CameraPanManager {
  private scene: Scene;
  private eventBus: EditorEventBus;
  private spaceKey: Phaser.Input.Keyboard.Key;
  private isPanning: boolean = false;
  private panLastX: number = 0;
  private panLastY: number = 0;
  private grid: EditorGrid;

  constructor(scene: Scene, grid: EditorGrid) {
    this.scene = scene;
    this.grid = grid;
    this.eventBus = EditorEventBus.getInstance();

    // Setup spacebar-driven pan: hold SPACE and drag to move grid
    this.spaceKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    this.setupInputHandlers();
  }

  /**
   * Setup input handlers for panning
   */
  private setupInputHandlers(): void {
    // Handle pointer down
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && this.spaceKey.isDown) {
        this.startPanning(pointer.x, pointer.y);
      }
    });

    // Handle pointer move
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isPanning && pointer.leftButtonDown()) {
        this.updatePanPosition(pointer.x, pointer.y);
      }
    });

    // Handle pointer up
    this.scene.input.on("pointerup", () => {
      if (this.isPanning) {
        this.stopPanning();
      }
    });

    // Handle Spacebar press for cursor change
    this.spaceKey.on("down", () => {
      if (!this.isPanning) {
        this.scene.input.setDefaultCursor("grab");
      }
    });

    // Handle Spacebar release for cursor change
    this.spaceKey.on("up", () => {
      if (!this.isPanning) {
        this.scene.input.setDefaultCursor("default");
      }
    });
  }

  /**
   * Start the panning operation
   */
  private startPanning(x: number, y: number): void {
    this.isPanning = true;
    this.panLastX = x;
    this.panLastY = y;

    // Update the registry flag to prevent other input operations
    this.scene.registry.set("isCameraPanning", true);
    this.scene.input.setDefaultCursor("grabbing");
  }

  /**
   * Update the camera position during panning
   */
  private updatePanPosition(x: number, y: number): void {
    const dx = x - this.panLastX;
    const dy = y - this.panLastY;

    // Move the camera
    this.scene.cameras.main.scrollX -= dx / this.scene.cameras.main.zoom;
    this.scene.cameras.main.scrollY -= dy / this.scene.cameras.main.zoom;

    // Update last position
    this.panLastX = x;
    this.panLastY = y;

    // Update the grid
    this.grid.resize();
  }

  /**
   * Stop the panning operation
   */
  private stopPanning(): void {
    this.isPanning = false;

    // Update the registry flag
    this.scene.registry.set("isCameraPanning", false);

    // Set cursor based on space key state
    if (this.spaceKey.isDown) {
      this.scene.input.setDefaultCursor("grab");
    } else {
      this.scene.input.setDefaultCursor("default");
    }
  }

  /**
   * Check if camera is currently panning
   */
  public isPanningActive(): boolean {
    return this.isPanning;
  }
}
