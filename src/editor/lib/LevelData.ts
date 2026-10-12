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
/** Upper bound for platform segment counts accepted from level files. */
export const MAX_PLATFORM_SEGMENTS = 100;

export class LevelDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LevelDataError";
  }
}

export type LevelParseResult =
  | { ok: true; data: LevelData }
  | { ok: false; error: string };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const fail = (path: string, problem: string): never => {
  throw new LevelDataError(`Invalid level data at "${path}": ${problem}`);
};

const readObject = (value: unknown, path: string): Record<string, unknown> =>
  isPlainObject(value) ? value : fail(path, "expected an object");

const readFinite = (obj: Record<string, unknown>, key: string, path: string) => {
  const value = obj[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${path}.${key}`, "expected a finite number");
  }
  return value as number;
};

const readArray = (
  root: Record<string, unknown>,
  key: string
): unknown[] => {
  const value = root[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : fail(key, "expected an array");
};

const readPosition = (value: unknown, path: string) => {
  const obj = readObject(value, path);
  return {
    obj,
    x: readFinite(obj, "x", path),
    y: readFinite(obj, "y", path),
  };
};

const readOptionalPosition = (value: unknown, path: string) => {
  if (value === undefined || value === null) return null;
  const { x, y } = readPosition(value, path);
  return { x, y };
};

/**
 * Validates an untrusted parsed level object and returns a clean LevelData.
 * Throws LevelDataError describing the first problem found.
 */
export function validateLevel(raw: unknown): LevelData {
  const root = readObject(raw, "<root>");

  const platforms = readArray(root, "platforms").map((item, i) => {
    const path = `platforms[${i}]`;
    const { obj, x, y } = readPosition(item, path);
    const segmentCount = obj.segmentCount;
    if (
      typeof segmentCount !== "number" ||
      !Number.isInteger(segmentCount) ||
      segmentCount < 1 ||
      segmentCount > MAX_PLATFORM_SEGMENTS
    ) {
      fail(
        `${path}.segmentCount`,
        `expected an integer between 1 and ${MAX_PLATFORM_SEGMENTS}`
      );
    }
    if (obj.isVertical !== undefined && typeof obj.isVertical !== "boolean") {
      fail(`${path}.isVertical`, "expected a boolean");
    }
    if (obj.id !== undefined && typeof obj.id !== "string") {
      fail(`${path}.id`, "expected a string");
    }
    return {
      id: (obj.id as string | undefined) ?? `platform-${i}`,
      x,
      y,
      segmentCount: segmentCount as number,
      isVertical: (obj.isVertical as boolean | undefined) ?? false,
    };
  });

  const enemies = readArray(root, "enemies").map((item, i) => {
    const path = `enemies[${i}]`;
    const { obj, x, y } = readPosition(item, path);
    if (obj.type !== "enemy-large" && obj.type !== "enemy-small") {
      fail(`${path}.type`, 'expected "enemy-large" or "enemy-small"');
    }
    return { x, y, type: obj.type as "enemy-large" | "enemy-small" };
  });

  const barrels = readArray(root, "barrels").map((item, i) => {
    const { x, y } = readPosition(item, `barrels[${i}]`);
    return { x, y };
  });

  const crates = readArray(root, "crates").map((item, i) => {
    const path = `crates[${i}]`;
    const { obj, x, y } = readPosition(item, path);
    const type = obj.type ?? "small";
    if (type !== "small" && type !== "big") {
      fail(`${path}.type`, 'expected "small" or "big"');
    }
    return { x, y, type: type as "small" | "big" };
  });

  return {
    platforms,
    enemies,
    barrels,
    crates,
    finishLine: readOptionalPosition(root.finishLine, "finishLine"),
    player: readOptionalPosition(root.player, "player"),
  };
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
   * Parse and validate a level JSON string without side effects.
   * Returns either the validated level data or a human-readable error.
   * Missing collections are treated as empty, so `{}` is a valid empty level.
   */
  static parse(jsonString: string): LevelParseResult {
    let raw: unknown;
    try {
      raw = JSON.parse(jsonString);
    } catch (error) {
      return {
        ok: false,
        error: `File is not valid JSON (${(error as Error).message}).`,
      };
    }

    try {
      return { ok: true, data: validateLevel(raw) };
    } catch (error) {
      if (error instanceof LevelDataError) {
        return { ok: false, error: error.message };
      }
      throw error;
    }
  }

  /**
   * Deserialize JSON string to level data.
   * @throws LevelDataError when the JSON is malformed or fails validation.
   */
  static deserialize(jsonString: string): LevelData {
    const result = this.parse(jsonString);
    if (!result.ok) {
      throw new LevelDataError(result.error);
    }
    return result.data;
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
