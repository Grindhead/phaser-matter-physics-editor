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
    this.uiManager = new EditorUIManager(
      this,
      (type: string, config?: any) => {
        console.log(`EditorUIScene: Entity select callback for type: ${type}`);
        editorScene.events.emit("UI_ENTITY_SELECT", type, config);
      },
      (entity: EditorEntity, property: string, value: any) => {
        console.log(`EditorUIScene: Property change callback for ${property}`);
        editorScene.events.emit("UI_PROPERTY_CHANGE", entity, property, value);
      },
      () => {
        console.log("EditorUIScene: Save callback");
        editorScene.events.emit("UI_SAVE");
      },
      () => {
        console.log("EditorUIScene: Load callback");
        editorScene.events.emit("UI_LOAD");
      },
      () => {
        console.log("EditorUIScene: Clear callback");
        editorScene.events.emit("UI_CLEAR");
      },
      (entity: EditorEntity) => {
        console.log("EditorUIScene: Remove entity callback");
        editorScene.events.emit("UI_REMOVE_ENTITY", entity);
      }
    );
    this.uiManager.setupFileInput((file: File) => {
      editorScene.events.emit("UI_FILE_LOAD", file);
    });

    // Emit event to signal UI Manager is ready
    this.events.emit("uiManagerReady", this.uiManager);

    // Bring this UI scene to the top after a short delay -- No longer needed, launch order handles it
    // this.time.delayedCall(10, () => {
    //   this.scene.bringToTop();
    // });
  }

  /**
   * Returns the file input element used for loading levels
   */
  public getFileInput(): HTMLInputElement | null {
    return this.uiManager.getFileInput();
  }
}
