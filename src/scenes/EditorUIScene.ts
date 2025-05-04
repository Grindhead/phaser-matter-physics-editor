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
        editorScene.events.emit("ENTITY_SELECT", type, config);
      },
      (entity: EditorEntity, property: string, value: any) => {
        editorScene.events.emit("PROPERTY_CHANGE", entity, property, value);
      },
      () => {
        editorScene.events.emit("SAVE");
      },
      () => {
        editorScene.events.emit("LOAD");
      },
      () => {
        editorScene.events.emit("CLEAR");
      },
      (entity: EditorEntity) => {
        editorScene.events.emit("REMOVE_ENTITY", entity);
      }
    );
    this.uiManager.setupFileInput((file: File) => {
      editorScene.events.emit("FILE_LOAD", file);
    });
  }
}
