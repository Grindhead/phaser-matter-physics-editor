import Phaser from "phaser";
import { Platform } from "../../entities/Platforms/Platform";
import { EnemyLarge } from "../../entities/Enemies/EnemyLarge";
import { EnemySmall } from "../../entities/Enemies/EnemySmall";
import { Barrel } from "../../entities/Barrel/Barrel";
import { Finish } from "../../entities/Finish/Finish";
import { Crate } from "../../entities/Crate/Crate";

export interface SerializedPlatform {
  id: string; // Keep ID if needed for future reference
  x: number;
  y: number;
  segmentCount: number;
  isVertical: boolean;
}

export interface SerializedEnemy {
  x: number;
  y: number;
  type: "enemy-large" | "enemy-small"; // Specify allowed enemy types
}

export interface SerializedCrate {
  x: number;
  y: number;
  type: "small" | "big"; // Specify allowed crate types
}

export interface SerializedBarrel {
  x: number;
  y: number;
}

export interface SerializedFinishLine {
  x: number;
  y: number;
}

export interface SerializedLevel {
  platforms?: SerializedPlatform[];
  enemies?: SerializedEnemy[];
  crates?: SerializedCrate[];
  barrels?: SerializedBarrel[];
  finishLine?: SerializedFinishLine;
}

// Define a type for the entities that can be placed and saved
// Using 'any' temporarily for broader compatibility, refine if possible
type PlaceableEntity =
  | Platform
  | EnemyLarge
  | EnemySmall
  | Barrel
  | Finish
  | Crate;
export class LevelDataManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // Updated saveLevel to accept layer lists
  saveLevel(
    platformList: PlaceableEntity[],
    entityList: PlaceableEntity[],
    filename: string = "level.json"
  ) {
    const levelData: SerializedLevel = {
      platforms: [],
      enemies: [],
      crates: [],
      barrels: [],
      finishLine: undefined, // Use undefined initially
    };

    // Combine lists and process entities
    const allEntities = [...platformList, ...entityList];

    allEntities.forEach((obj) => {
      // Use the stored entityType if available
      const entityType = (obj as any).entityType;
      const x = (obj as any).x;
      const y = (obj as any).y;

      if (!entityType || x === undefined || y === undefined) {
        console.warn("Skipping object without entityType or position:", obj);
        return;
      }

      switch (entityType) {
        case "platform":
          if (obj instanceof Platform) {
            levelData.platforms?.push({
              id: obj.id, // Assuming Platform has an id
              x: x,
              y: y,
              segmentCount: obj.segmentCount,
              isVertical: obj.isVertical,
            });
          }
          break;
        case "enemy-large":
          levelData.enemies?.push({ x: x, y: y, type: "enemy-large" });
          break;
        case "enemy-small":
          levelData.enemies?.push({ x: x, y: y, type: "enemy-small" });
          break;
        case "crate-small":
          // Assuming CrateSmall has a type property or we infer it
          levelData.crates?.push({ x: x, y: y, type: "small" });
          break;
        case "crate-big":
          // Assuming CrateBig has a type property or we infer it
          levelData.crates?.push({ x: x, y: y, type: "big" });
          break;
        case "barrel":
          levelData.barrels?.push({ x: x, y: y });
          break;
        case "finish-line":
          // Only one finish line should exist
          if (!levelData.finishLine) {
            levelData.finishLine = { x: x, y: y };
          } else {
            console.warn(
              "Multiple finish lines detected, only saving the first one."
            );
          }
          break;
        default:
          console.warn(`Unknown entity type found during save: ${entityType}`);
      }
    });

    // Clean up empty arrays
    if (levelData.platforms?.length === 0) delete levelData.platforms;
    if (levelData.enemies?.length === 0) delete levelData.enemies;
    if (levelData.crates?.length === 0) delete levelData.crates;
    if (levelData.barrels?.length === 0) delete levelData.barrels;
    if (!levelData.finishLine) delete levelData.finishLine; // Remove if still undefined

    // Trigger download
    const dataStr = JSON.stringify(levelData, null, 2); // Pretty print JSON
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", filename);
    linkElement.click();
    linkElement.remove();

    console.log(`Level saved as ${filename}`);
  }

  async loadLevel(file: File): Promise<SerializedLevel> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const levelData: SerializedLevel = JSON.parse(json);
          // TODO: Add validation logic here if needed
          console.log("Level data loaded successfully:", levelData);
          resolve(levelData);
        } catch (error) {
          console.error("Error parsing level file:", error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        reject(error);
      };
      reader.readAsText(file);
    });
  }
}
