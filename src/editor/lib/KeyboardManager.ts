import { Scene } from "phaser";
import { EditorEventBus } from "./EditorEventBus";
import { EditorEvents } from "./EditorEventTypes";

/**
 * Manages keyboard shortcuts and input in the editor
 */
export class KeyboardManager {
  private scene: Scene;
  private eventBus: EditorEventBus;
  private deleteKey: Phaser.Input.Keyboard.Key;
  private backspaceKey: Phaser.Input.Keyboard.Key;
  private zKey: Phaser.Input.Keyboard.Key;
  private yKey: Phaser.Input.Keyboard.Key;
  private ctrlKey: Phaser.Input.Keyboard.Key;
  private sKey: Phaser.Input.Keyboard.Key;
  private oKey: Phaser.Input.Keyboard.Key;
  private escapeKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Scene) {
    this.scene = scene;
    this.eventBus = EditorEventBus.getInstance();

    // Set up keyboard keys
    this.deleteKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.DELETE
    );
    this.backspaceKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.BACKSPACE
    );
    this.zKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.Z
    );
    this.yKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.Y
    );
    this.ctrlKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.CTRL
    );
    this.sKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.S
    );
    this.oKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.O
    );
    this.escapeKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    // Set up event handlers
    this.setupKeyboardHandlers();
  }

  /**
   * Sets up keyboard event handlers
   */
  private setupKeyboardHandlers(): void {
    // Delete/Backspace key handler - Remove selected entity
    this.deleteKey.on("down", this.handleDeleteKey, this);
    this.backspaceKey.on("down", this.handleDeleteKey, this);

    // Escape key handler - Deselect current entity and exit placement mode
    this.escapeKey.on("down", this.handleEscapeKey, this);

    // Ctrl+S handler - Save level
    this.sKey.on("down", () => {
      if (this.ctrlKey.isDown) {
        // Prevent browser's save dialog from appearing
        this.scene.input.keyboard!.preventDefault = true;

        // Emit save event
        this.eventBus.emit(EditorEvents.SAVE);
      }
    });

    // Ctrl+O handler - Open level
    this.oKey.on("down", () => {
      if (this.ctrlKey.isDown) {
        // Prevent browser's open dialog from appearing
        this.scene.input.keyboard!.preventDefault = true;

        // Emit load event
        this.eventBus.emit(EditorEvents.LOAD);
      }
    });

    // Ctrl+Z handler - Undo (if implemented)
    this.zKey.on("down", () => {
      if (this.ctrlKey.isDown) {
        console.log("Undo operation - Not implemented yet");
        // this.eventBus.emit(EditorEvents.UNDO);
      }
    });

    // Ctrl+Y handler - Redo (if implemented)
    this.yKey.on("down", () => {
      if (this.ctrlKey.isDown) {
        console.log("Redo operation - Not implemented yet");
        // this.eventBus.emit(EditorEvents.REDO);
      }
    });
  }

  /**
   * Handles delete/backspace key press
   * @param event The keyboard event
   */
  private handleDeleteKey(event: KeyboardEvent): void {
    // Prevent default behavior (e.g., browser back on backspace)
    event.preventDefault();

    // Get the selected entity
    const selectedEntity = this.scene.registry.get("selectedEntity");

    // If an entity is selected, emit remove entity event
    if (selectedEntity) {
      this.eventBus.emit(EditorEvents.REMOVE_ENTITY, selectedEntity);
    }
  }

  /**
   * Handles escape key press
   */
  private handleEscapeKey(): void {
    // Check if in placement mode
    const isPlacementModeActive = this.scene.registry.get(
      "isPlacementModeActive"
    );

    if (isPlacementModeActive) {
      // Exit placement mode
      this.scene.registry.set("isPlacementModeActive", false);
      this.eventBus.emit(EditorEvents.PALETTE_SELECTION_CLEARED);
    } else {
      // Deselect current entity
      const selectedEntity = this.scene.registry.get("selectedEntity");
      if (selectedEntity) {
        this.eventBus.emit(EditorEvents.ENTITY_DESELECTED, selectedEntity);
        this.scene.registry.set("selectedEntity", null);
      }
    }
  }

  /**
   * Clean up all event listeners
   */
  public destroy(): void {
    // Remove all key listeners
    this.deleteKey.removeAllListeners();
    this.backspaceKey.removeAllListeners();
    this.zKey.removeAllListeners();
    this.yKey.removeAllListeners();
    this.ctrlKey.removeAllListeners();
    this.sKey.removeAllListeners();
    this.oKey.removeAllListeners();
    this.escapeKey.removeAllListeners();
  }
}
