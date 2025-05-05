import { Scene } from "phaser";
import Phaser from "phaser";
import { EditorEventBus } from "../EditorEventBus";
import { EditorEvents } from "../EditorEventTypes";

/**
 * Manages keyboard shortcuts and input for the editor
 */
export class KeyboardManager {
  private scene: Scene;
  private eventBus: EditorEventBus;
  private deleteKey: Phaser.Input.Keyboard.Key;
  private escapeKey: Phaser.Input.Keyboard.Key;
  private ctrlKey: Phaser.Input.Keyboard.Key;
  private sKey: Phaser.Input.Keyboard.Key;
  private lKey: Phaser.Input.Keyboard.Key;
  private zKey: Phaser.Input.Keyboard.Key;
  private yKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Scene) {
    this.scene = scene;
    this.eventBus = EditorEventBus.getInstance();

    // Register keys
    this.deleteKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.DELETE
    );
    this.escapeKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );
    this.ctrlKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.CTRL
    );
    this.sKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.S
    );
    this.lKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.L
    );
    this.zKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.Z
    );
    this.yKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.Y
    );

    // Setup event handlers
    this.setupKeyHandlers();
  }

  /**
   * Setup keyboard event handlers
   */
  private setupKeyHandlers(): void {
    // DELETE key - remove selected entity
    this.deleteKey.on("down", () => {
      const selectedEntity = this.scene.registry.get("selectedEntity");
      if (selectedEntity) {
        this.eventBus.removeEntity(selectedEntity);
      }
    });

    // ESC key - deselect current entity
    this.escapeKey.on("down", () => {
      const isPlacementModeActive = this.scene.registry.get(
        "isPlacementModeActive"
      );
      const selectedEntity = this.scene.registry.get("selectedEntity");

      if (isPlacementModeActive) {
        // First cancel placement mode
        this.scene.registry.set("isPlacementModeActive", false);
        this.eventBus.emit(EditorEvents.ENTITY_SELECT, null);
      } else if (selectedEntity) {
        // Then deselect entity if one is selected
        this.eventBus.entityDeselected();
        this.scene.registry.set("selectedEntity", null);
      }
    });

    // CTRL+S - save level
    this.scene.input.keyboard!.on("keydown-S", (event: KeyboardEvent) => {
      if (this.ctrlKey.isDown) {
        event.preventDefault();
        this.eventBus.save();
      }
    });

    // CTRL+L - load level
    this.scene.input.keyboard!.on("keydown-L", (event: KeyboardEvent) => {
      if (this.ctrlKey.isDown) {
        event.preventDefault();
        this.eventBus.load();
      }
    });

    // CTRL+Z - undo (for future implementation)
    this.scene.input.keyboard!.on("keydown-Z", (event: KeyboardEvent) => {
      if (this.ctrlKey.isDown) {
        event.preventDefault();
        // This will be implemented in the future
        console.log("Undo operation requested (not implemented)");
      }
    });

    // CTRL+Y - redo (for future implementation)
    this.scene.input.keyboard!.on("keydown-Y", (event: KeyboardEvent) => {
      if (this.ctrlKey.isDown) {
        event.preventDefault();
        // This will be implemented in the future
        console.log("Redo operation requested (not implemented)");
      }
    });
  }

  /**
   * Check if ctrl key is currently pressed
   */
  public isCtrlPressed(): boolean {
    return this.ctrlKey.isDown;
  }

  /**
   * Cleans up event listeners when this manager is no longer needed
   */
  public destroy(): void {
    this.deleteKey.removeAllListeners();
    this.escapeKey.removeAllListeners();

    // Remove key down events
    this.scene.input.keyboard!.off("keydown-S");
    this.scene.input.keyboard!.off("keydown-L");
    this.scene.input.keyboard!.off("keydown-Z");
    this.scene.input.keyboard!.off("keydown-Y");
  }
}
