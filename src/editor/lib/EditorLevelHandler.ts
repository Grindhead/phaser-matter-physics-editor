import { LevelData, LevelDataManager } from "./LevelData";
import { EntityManager } from "./EntityManager";
import { EditorEventBus } from "./EditorEventBus";
import { EditorEvents } from "./EditorEventTypes";

/**
 * Handles level data operations like saving, loading, and clearing
 */
export class EditorLevelHandler {
  private entityManager: EntityManager;
  private eventBus: EditorEventBus;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
    this.eventBus = EditorEventBus.getInstance();
  }

  /**
   * Saves the current level data to a JSON file
   */
  public saveLevel(): void {
    try {
      // Get level data from entity manager
      const levelData = this.entityManager.getLevelData();

      // Perform the save operation
      const json = JSON.stringify(levelData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create a download link and trigger it
      const a = document.createElement("a");
      a.href = url;
      a.download = "level.json";
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      console.log("Level saved successfully");

      // Emit level saved event
      this.eventBus.emit(EditorEvents.LEVEL_SAVED);
    } catch (error) {
      console.error("Failed to save level:", error);
    }
  }

  /**
   * Clears the current level
   */
  public clearLevel(): void {
    if (
      confirm(
        "Are you sure you want to clear the level? All unsaved changes will be lost."
      )
    ) {
      try {
        // Emit level cleared event
        this.eventBus.emit(EditorEvents.LEVEL_CLEARED);
        console.log("Level cleared successfully");
      } catch (error) {
        console.error("Failed to clear level:", error);
      }
    }
  }

  /**
   * Handles loading a level from a file
   * @param file The file to load
   */
  public handleFileLoad(file: File): void {
    if (!file) {
      console.warn(
        "EditorLevelHandler.handleFileLoad called with no file or an invalid File object at startup."
      );
      return;
    }

    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          if (!json) throw new Error("Failed to read file");

          // Use LevelDataManager.deserialize for robust parsing and structure enforcement
          const levelData = LevelDataManager.deserialize(json);

          console.log(
            "EditorLevelHandler: File processed, about to emit LEVEL_LOADED with:",
            levelData
          );
          // Emit level loaded event
          this.eventBus.emit(EditorEvents.LEVEL_LOADED, levelData);

          console.log("Level loaded successfully");
        } catch (error) {
          console.error("Failed to parse level data:", error);
          alert("Failed to load level: Invalid level data format");
        }
      };

      reader.onerror = () => {
        console.error("Failed to read file");
        alert("Failed to load level: Error reading file");
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Failed to load level:", error);
      alert("Failed to load level");
    }
  }

  /**
   * Validates level data structure
   * @param data The level data to validate
   * @returns True if valid, false otherwise
   */
  private validateLevelData(data: any): boolean {
    // Basic structure validation
    if (!data) return false;

    // Check required arrays
    if (!Array.isArray(data.platforms)) return false;
    if (!Array.isArray(data.enemies)) return false;
    if (!Array.isArray(data.barrels)) return false;
    if (!Array.isArray(data.crates)) return false;

    // More detailed validation could be added here

    return true;
  }
}
