import { BarrelInterface } from "../../entities/Barrel/Barrel";
import { CrateInterface } from "../../entities/Crate/Crate";
import { EnemyInterface } from "../../entities/Enemies/EnemyBase";
import { FinishLineInterface } from "../../entities/Finish/Finish";
import { PlatformInterface } from "../../entities/Platforms/Platform";
import { PlayerInterface } from "../../entities/Player/Player";

// Serialized types without circular references like 'scene'

// Types for level data
export interface LevelData {
  platforms: PlatformInterface[];
  enemies: EnemyInterface[];
  barrels: BarrelInterface[];
  crates: CrateInterface[];
  finishLine: FinishLineInterface | null;
  player?: PlayerInterface | null; // Added player property
}
export class LevelDataManager {
  /**
   * Create a new empty level data object
   */
  static createEmpty(): LevelData {
    return {
      platforms: [],
      enemies: [],
      barrels: [],
      crates: [],
      finishLine: null,
      player: null, // Initialize player as null
    };
  }

  /**
   * Serialize level data to JSON string, removing circular references
   */
  static serialize(levelData: LevelData): string {
    // Convert level data to serializable format
    const serializedData: LevelData = {
      platforms: levelData.platforms.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        segmentCount: p.segmentCount,
        isVertical: p.isVertical,
      })),
      enemies: levelData.enemies.map((e) => ({
        x: e.x,
        y: e.y,
        type: e.type,
      })),
      barrels: levelData.barrels.map((b) => ({
        x: b.x,
        y: b.y,
      })),
      crates: levelData.crates.map((c) => ({
        x: c.x,
        y: c.y,
        type: c.type,
      })),
      finishLine: levelData.finishLine
        ? {
            x: levelData.finishLine.x,
            y: levelData.finishLine.y,
          }
        : null,
      player: levelData.player // Add player to serialized data
        ? {
            x: levelData.player.x,
            y: levelData.player.y,
          }
        : null,
    };

    return JSON.stringify(serializedData, null, 2);
  }

  /**
   * Deserialize JSON string to level data
   */
  static deserialize(jsonString: string): LevelData {
    try {
      const data = JSON.parse(jsonString) as LevelData;

      return {
        platforms: data.platforms || [],
        enemies: data.enemies || [],
        barrels: data.barrels || [],
        crates: data.crates || [],
        finishLine: data.finishLine || null,
        player: data.player || null, // Add player to deserialized data
      } as unknown as LevelData; // Type assertion since scene will be added later
    } catch (error) {
      console.error("Error deserializing level data:", error);
      return this.createEmpty();
    }
  }

  /**
   * Save level data to a file (triggers download)
   */
  static saveToFile(
    levelData: LevelData,
    filename: string = "level.json"
  ): void {
    const jsonString = this.serialize(levelData);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  /**
   * Load level data from a file (returns a Promise)
   */
  static loadFromFile(file: File): Promise<LevelData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string;
          const levelData = this.deserialize(jsonString);
          resolve(levelData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsText(file);
    });
  }
}
