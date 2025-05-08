import Phaser from "phaser";
import { EditorUIManager } from "../editor/lib/EditorUIManager";
import { EditorEntity } from "../editor/ui/Inspector";

/**
 * A separate scene for the editor UI.
 * Runs in parallel with the main EditorScene.
 */
export class EditorUIScene extends Phaser.Scene {
  private uiManager!: EditorUIManager;

  constructor() {
    super("EditorUIScene");
  }

  create(): void {
    const editorScene = this.scene.get("EditorScene") as Phaser.Scene;

    // Pass `this.events` as the event emitter to EditorUIManager
    this.uiManager = new EditorUIManager(this, this.events);

    // Listen for events from EditorUIManager and relay them to EditorScene
    this.events.on(
      "ENTITY_TYPE_SELECT_REQUEST",
      (type: string, config?: any) => {
        editorScene.events.emit("UI_ENTITY_SELECT", type, config);
      }
    );

    // Note: PROPERTY_CHANGE_REQUEST is handled directly by Inspector, no need to relay from here if not used.
    // If EditorScene needs it, a listener can be added.

    this.events.on("SAVE_REQUEST", () => {
      editorScene.events.emit("UI_SAVE");
    });

    this.events.on("LOAD_REQUEST", () => {
      editorScene.events.emit("UI_LOAD");
    });

    this.events.on("CLEAR_REQUEST", () => {
      editorScene.events.emit("UI_CLEAR");
    });

    this.events.on("REMOVE_ENTITY_REQUEST", (entity: EditorEntity) => {
      editorScene.events.emit("UI_REMOVE_ENTITY", entity);
    });

    // The setupFileInput now takes a callback that will be used by the UIManager's toolbar directly.
    // If we wanted to use an event for this too, UIManager's setupFileInput would need to change.
    // For now, keeping as is, assuming direct callback is fine for file input.
    this.uiManager.setupFileInput((file: File) => {
      editorScene.events.emit("UI_FILE_LOAD", file);
    });

    // Emit event to signal UI Manager is ready
    this.events.emit("uiManagerReady", this.uiManager);
  }

  /**
   * Returns the file input element used for loading levels
   */
  public getFileInput(): HTMLInputElement | null {
    return this.uiManager.getFileInput();
  }
}
