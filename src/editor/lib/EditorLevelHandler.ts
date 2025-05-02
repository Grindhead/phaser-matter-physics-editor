import { LevelDataManager } from "./LevelData";
import { EditorEntityManager } from "./EditorEntityManager";

export class EditorLevelHandler {
  private entityManager: EditorEntityManager;

  constructor(entityManager: EditorEntityManager) {
    this.entityManager = entityManager;
  }

  public saveLevel(): void {
    const filename = prompt("Enter level filename:", "level.json");
    if (filename) {
      LevelDataManager.saveToFile(this.entityManager.getLevelData(), filename);
    }
  }

  public clearLevel(): void {
    this.entityManager.clearEntities();
  }

  public handleFileLoad(file: File): void {
    LevelDataManager.loadFromFile(file)
      .then((levelData) => {
        this.clearLevel();
        this.entityManager.setLevelData(levelData);
        this.entityManager.populateEntitiesFromLevelData();
      })
      .catch((error) => {
        console.error("Error loading level:", error);
        alert("Error loading level file.");
      });
  }
}
