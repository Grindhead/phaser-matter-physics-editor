import type { BarrelInterface } from "../../entities/Barrel/Barrel";
import type { CrateInterface } from "../../entities/Crate/Crate";
import type { EnemyInterface } from "../../entities/Enemies/EnemyBase";
import type { FinishLineInterface } from "../../entities/Finish/Finish";
import type { PlatformInterface } from "../../entities/Platforms/Platform";
import type { PlayerInterface } from "../../entities/Player/Player";

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
        segmentWidth: p.segmentWidth,
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
    const data: unknown = JSON.parse(jsonString);
    if (!isObject(data)) throw new Error("Level must be a JSON object");
    const array = (value: unknown, field: string): unknown[] => {
      if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
      return value;
    };
    return {
      platforms: array(data.platforms, "platforms").map(parsePlatform),
      enemies: array(data.enemies, "enemies").map(parseEnemy),
      barrels: array(data.barrels, "barrels").map(parsePosition),
      crates: array(data.crates, "crates").map(parseCrate),
      finishLine: data.finishLine === null ? null : parsePosition(data.finishLine),
      player: data.player === null || data.player === undefined ? null : parsePosition(data.player),
    };
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
          const jsonString = event.target?.result;
          if (typeof jsonString !== "string") throw new Error("Failed to read level text");
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parsePosition(value: unknown): PlayerInterface {
  if (!isObject(value) || typeof value.x !== "number" || !Number.isFinite(value.x) || typeof value.y !== "number" || !Number.isFinite(value.y)) throw new Error("Entity positions must be finite numbers");
  return {x: value.x, y: value.y};
}
function parsePlatform(value: unknown): PlatformInterface {
  const position = parsePosition(value);
  if (!isObject(value) || typeof value.id !== "string" || !value.id || typeof value.segmentCount !== "number" || !Number.isInteger(value.segmentCount) || value.segmentCount < 1 || value.segmentCount > 1000 || typeof value.isVertical !== "boolean") throw new Error("Invalid platform properties or segment count");
  const platform: PlatformInterface = {...position, id: value.id, segmentCount: value.segmentCount, isVertical: value.isVertical};
  if (value.segmentWidth !== undefined) {
    if (typeof value.segmentWidth !== "number" || !Number.isFinite(value.segmentWidth) || value.segmentWidth <= 0) throw new Error("Invalid platform segment width");
    platform.segmentWidth = value.segmentWidth;
  }
  return platform;
}
function parseEnemy(value: unknown): EnemyInterface {
  const position = parsePosition(value);
  if (!isObject(value) || (value.type !== "enemy-large" && value.type !== "enemy-small")) throw new Error("Invalid enemy type");
  return {...position, type: value.type};
}
function parseCrate(value: unknown): CrateInterface {
  const position = parsePosition(value);
  if (!isObject(value) || (value.type !== "small" && value.type !== "big")) throw new Error("Invalid crate type");
  return {...position, type: value.type};
}
