import { Scene } from "phaser";
import { EditorUIManager } from "./EditorUIManager";
import { EditorEntity } from "../ui/Inspector";
import { EditorEntityManager } from "./EditorEntityManager";

export class EditorEventHandler {
  private scene: Scene;
  private entityManager: EditorEntityManager;
  private uiManager: EditorUIManager;

  constructor(
    scene: Scene,
    entityManager: EditorEntityManager,
    uiManager: EditorUIManager
  ) {
    this.scene = scene;
    this.entityManager = entityManager;
    this.uiManager = uiManager;

    this.setupResizeEvents();
  }

  private setupResizeEvents(): void {
    // Update UI positions on resize
    this.scene.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      this.uiManager.handleResize(gameSize);
    });
  }

  public handleEntityTypeSelection(type: string): void {
    this.entityManager.setSelectedEntityType(type);

    // If an entity is currently selected, deselect it
    if (this.entityManager.getSelectedEntity()) {
      this.entityManager.selectEntity(null);
    }
  }

  public handlePropertyChange(
    entity: EditorEntity,
    property: string,
    value: any
  ): void {
    this.entityManager.updateEntityProperty(entity, property, value);
  }
}
