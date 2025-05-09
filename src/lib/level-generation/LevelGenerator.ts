import { Scene } from "phaser";
import { populatePlatformWithCoins } from "./itemPlacementHelper";
import { Platform } from "../../entities/Platforms/Platform";
import { Coin } from "../../entities/Coin/Coin";
import { setTotalCoinsInLevel } from "../helpers/coinManager";
import { LoadedEntity } from "../../lib/types";

// Interface for entities loaded from JSON that affect coin placement (for LevelCoinPlacer)
// export interface LoadedEntity {  // REMOVE THIS DEFINITION
//   x: number;
//   y: number;
//   type: string;
//   getBounds(): Phaser.Geom.Rectangle;
// }

/**
 * Handles coin placement on platforms for a level loaded from JSON data.
 */
export class LevelCoinPlacer {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Places coins on the provided platforms, avoiding areas with specified entities.
   * @param loadedPlatforms An array of Platform instances already loaded from JSON.
   * @param loadedEntities An array of other entities (like enemies, crates) already loaded from JSON.
   * @returns An array of the created Coin instances.
   */
  public placeCoinsOnLoadedLevel(
    loadedPlatforms: Platform[],
    loadedEntities: LoadedEntity[]
  ): Coin[] {
    const placedCoins: Coin[] = [];
    let totalCoinsInLevel = 0;

    if (!loadedPlatforms || loadedPlatforms.length === 0) {
      setTotalCoinsInLevel(0);
      return [];
    }

    const initialPlatform = loadedPlatforms[0];
    const finalPlatform = loadedPlatforms[loadedPlatforms.length - 1];

    loadedPlatforms.forEach((platform) => {
      const hasBlockingEntity = this.platformHasBlockingEntity(
        platform,
        loadedEntities
      );

      totalCoinsInLevel += populatePlatformWithCoins(
        this.scene,
        platform,
        null,
        placedCoins,
        !hasBlockingEntity,
        platform === initialPlatform,
        platform === finalPlatform
      );
    });

    setTotalCoinsInLevel(totalCoinsInLevel);
    return placedCoins;
  }

  private platformHasBlockingEntity(
    platform: Platform,
    loadedEntities: LoadedEntity[]
  ): boolean {
    const platformBounds = platform.getBounds();
    for (const entity of loadedEntities) {
      if (
        entity.type.startsWith("enemy-") ||
        entity.type.startsWith("crate-")
      ) {
        const entityBounds = entity.getBounds();
        const verticallyAligned =
          Math.abs(entityBounds.bottom - platformBounds.top) < 5;
        const horizontallyOverlapping =
          entityBounds.right > platformBounds.left &&
          entityBounds.left < platformBounds.right;
        if (verticallyAligned && horizontallyOverlapping) {
          return true;
        }
      }
    }
    return false;
  }
}

// Imports specifically for the (old) LevelGenerator class:
import { Barrel } from "../../entities/Barrel/Barrel";
import { Player } from "../../entities/Player/Player";
import { EnemyLarge as OldEnemyLarge } from "../../entities/Enemies/EnemyLarge";
import { EnemySmall as OldEnemySmall } from "../../entities/Enemies/EnemySmall";
import { Crate as OldCrate } from "../../entities/Crate/Crate";

/**
 * OLD class for procedural generation, to be refactored/removed.
 * (Formerly handled procedural generation of game levels.)
 */
export class LevelGenerator {
  private scene: Scene;
  private levelNumber: number;
  private platforms: Platform[]; // Platform is also imported by LevelCoinPlacer.
  private coins: Coin[]; // Coin is also imported by LevelCoinPlacer.
  private enemies: (OldEnemyLarge | OldEnemySmall)[] = [];
  private crates: OldCrate[] = [];
  private barrels: Barrel[] = [];
  private player: Player;
  private debugGraphics: Phaser.GameObjects.Graphics | null = null;
  private isDebugActive: boolean = false;
  private readonly PLATFORM_DISPLAY_HEIGHT = 32;

  constructor(
    scene: Scene,
    debugGraphics: Phaser.GameObjects.Graphics | null,
    isDebugActive: boolean
  ) {
    this.scene = scene;
    this.debugGraphics = debugGraphics;
    this.isDebugActive = isDebugActive;
  }

  /**
   * Generates the entire level layout including platforms, entities, and player start/finish.
   * Returns the created Player instance.
   * --- THIS METHOD WILL BE REPURPOSED ---
   * --- Its current body is removed. ---
   */
  generateLevel(): Player {
    console.warn(
      "generateLevel() - procedural logic removed, needs refactor for coin placement."
    );
    if (this.player) {
      return this.player;
    } else {
      throw new Error(
        "Player instance not available in LevelGenerator.generateLevel. Level structure must be loaded first."
      );
    }
  }

  /**
   * Creates the player at the starting position. - Player will be created from JSON by Game.ts
   */
  private createPlayerStart(startPos: { x: number; y: number }): void {
    console.log(
      "createPlayerStart called - should be handled by JSON loading in Game.ts",
      startPos
    );
  }

  /**
   * Creates a single platform instance. - Platforms will be created from JSON by Game.ts
   */
  private createPlatform(
    pos: { x: number; y: number },
    length: number,
    index: number,
    isVertical: boolean = false
  ): Platform {
    console.log(
      "createPlatform called - should be handled by JSON loading in Game.ts",
      pos,
      length,
      index,
      isVertical
    );
    // Placeholder to satisfy return type:
    const platformKey = `platform-dummy-${length}${
      isVertical ? "-vertical" : ""
    }`;
    const dummyPlatform = new Platform(
      this.scene,
      pos.x,
      pos.y,
      length,
      platformKey,
      isVertical
    );
    // this.platforms.push(dummyPlatform); // This class won't manage the primary list of platforms anymore
    return dummyPlatform;
  }

  /**
   * Returns the list of generated enemies. - Will be sourced from Game.ts (loaded from JSON)
   */
  getEnemies(): (OldEnemyLarge | OldEnemySmall)[] {
    return this.enemies; // This list will be set externally or passed in
  }

  /**
   * Returns the array of generated platforms. - Will be sourced from Game.ts (loaded from JSON)
   */
  getPlatforms(): Platform[] {
    return this.platforms; // This list will be set externally or passed in
  }

  /**
   * Returns the array of generated Coin instances. - These are the coins placed by this class.
   */
  getCoins(): Coin[] {
    return this.coins;
  }

  /**
   * Removes a specific coin instance from the internal list.
   * @param coinToRemove The Coin instance to remove.
   */
  removeCoin(coinToRemove: Coin): void {
    this.coins = this.coins.filter((coin) => coin !== coinToRemove);
  }

  /**
   * Returns the array of generated Crate instances. - Will be sourced from Game.ts (loaded from JSON)
   */
  getCrates(): OldCrate[] {
    return this.crates; // This list will be set externally or passed in
  }

  /**
   * Returns the array of generated Barrel instances. - Will be sourced from Game.ts (loaded from JSON)
   */
  getBarrels(): Barrel[] {
    return this.barrels; // This list will be set externally or passed in
  }

  /**
   * Returns the calculated overall bounds of the generated level. - REMOVED or REPURPOSED
   */
  getOverallLevelBounds(): { minX: number; maxX: number; lowestY: number } {
    console.warn("getOverallLevelBounds called - role changed.");
    return { minX: 0, maxX: 0, lowestY: 0 }; // Placeholder
  }

  /**
   * Places vertical walls at the end of platforms that lead to higher platforms - REMOVED
   */
  // private addVerticalWallsAtPlatformEdges(...) - REMOVED

  /**
   * Places crates specifically to help players jump up to walls - REMOVED
   */
  private placeStrategicCratesNearWalls(wallPositions: any[]): void {
    console.warn(
      "placeStrategicCratesNearWalls called - procedural logic, to be removed."
    );
  }

  /**
   * Checks if a platform has an enemy on it.
   * @param platform The platform to check.
   * @returns True if an enemy exists on the platform, false otherwise.
   */
  private platformHasEnemy(platform: Platform): boolean {
    const platformBounds = platform.getBounds();

    // Check if any enemy is positioned on this platform
    for (const enemy of this.enemies) {
      const enemyBounds = enemy.getBounds();

      // If enemy's bottom is at platform's top and horizontally overlaps
      if (
        Math.abs(enemyBounds.bottom - platformBounds.top) < 2 &&
        enemyBounds.right > platformBounds.left &&
        enemyBounds.left < platformBounds.right
      ) {
        return true;
      }
    }

    return false; // Added to fix linter error
  }

  /**
   * Respawns crates at the specified positions
   * @param cratePositions - Array of positions and types for crates to respawn
   * @returns Array of created crates
   */
  respawnCrates(
    cratePositions: { x: number; y: number; type: string }[]
  ): OldCrate[] {
    // First, remove any existing crates
    this.crates.forEach((crate) => {
      if (crate && crate.body) {
        crate.destroy();
      }
    });
    this.crates = [];

    // Then create new crates at the specified positions
    cratePositions.forEach((pos) => {
      let crate: OldCrate;

      if (pos.type === "big") {
        crate = new OldCrate(this.scene, pos.x, pos.y, "big");
      } else {
        crate = new OldCrate(this.scene, pos.x, pos.y, "small");
      }

      this.crates.push(crate);
    });

    return this.crates; // Changed from 'return [];' to actual return value
  }

  private placeAdditionalRandomCrates(platforms: Platform[]): void {
    // This is procedural, to be removed. Crates will come from JSON.
    console.log(
      "placeAdditionalRandomCrates called - this is procedural and will be removed."
    );
  }
}
