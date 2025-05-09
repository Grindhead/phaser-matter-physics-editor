import { Scene } from "phaser";
import { EditorEntity } from "../ui/Inspector";
import { Platform, PlatformInterface } from "../../entities/Platforms/Platform";
import { EnemyInterface } from "../../entities/Enemies/EnemyBase";
import { EnemyLarge } from "../../entities/Enemies/EnemyLarge";
import { EnemySmall } from "../../entities/Enemies/EnemySmall";
import { Barrel, BarrelInterface } from "../../entities/Barrel/Barrel";
import { Finish, FinishLineInterface } from "../../entities/Finish/Finish";
import { Crate, CrateInterface } from "../../entities/Crate/Crate";
import { Player } from "../../entities/Player/Player";
import { TILE_WIDTH, TILE_HEIGHT } from "../../lib/constants";

/**
 * Factory class responsible for creating different types of editor entities
 */
export class EntityCreator {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Creates an entity of the specified type at the given position
   *
   * @param type The type of entity to create
   * @param x The x position in world coordinates
   * @param y The y position in world coordinates
   * @param config Optional configuration for the entity
   * @returns The created entity or null if the type is invalid
   */
  public createEntity(
    type: string,
    x: number,
    y: number,
    config?: any
  ): EditorEntity | null {
    // Calculate snapped position for grid alignment
    const snappedX = Math.floor(x / TILE_WIDTH) * TILE_WIDTH + TILE_WIDTH / 2;
    const snappedY =
      Math.floor(y / TILE_HEIGHT) * TILE_HEIGHT + TILE_HEIGHT / 2;

    // Create the appropriate entity based on type
    switch (type) {
      case "platform":
        return this.createPlatform(snappedX, snappedY, config);
      case "enemy-large":
        return this.createEnemy(snappedX, snappedY, "large");
      case "enemy-small":
        return this.createEnemy(snappedX, snappedY, "small");
      case "barrel":
        return this.createBarrel(snappedX, snappedY);
      case "finish-line":
        return this.createFinishLine(snappedX, snappedY);
      case "crate-small":
        return this.createCrate(snappedX, snappedY, "small");
      case "crate-big":
        return this.createCrate(snappedX, snappedY, "big");
      case "player":
        return this.createPlayer(snappedX, snappedY);
      default:
        console.warn(`EntityCreator: Unknown entity type: ${type}`);
        return null;
    }
  }

  /**
   * Creates a platform entity
   */
  private createPlatform(x: number, y: number, config?: any): EditorEntity {
    const segmentCount = config?.segmentCount || 3;
    const isVertical = config?.isVertical || false;
    const segmentWidth = config?.segmentWidth || 32;
    const id = config?.id || `platform-${Date.now()}`;

    // Create the platform game object
    const platform = new Platform(
      this.scene,
      x,
      y,
      segmentCount,
      id,
      isVertical,
      segmentWidth
    );

    // Mark as editor entity
    platform.setData("isEditor", true);

    // Create and return the editor entity wrapper
    const entity: EditorEntity = {
      type: "platform",
      x,
      y,
      gameObject: platform,
      data: {
        id,
        segmentCount,
        isVertical,
        x,
        y,
        scene: this.scene,
        type: "platform",
      } as PlatformInterface,
    };

    return entity;
  }

  /**
   * Creates an enemy entity (large or small)
   */
  private createEnemy(
    x: number,
    y: number,
    type: "large" | "small"
  ): EditorEntity {
    // Create the appropriate enemy type
    const enemyType = type === "large" ? "enemy-large" : "enemy-small";
    const id = `${enemyType}-${Date.now()}`;

    let enemy;
    if (type === "large") {
      enemy = new EnemyLarge(this.scene, x, y);
    } else {
      enemy = new EnemySmall(this.scene, x, y);
    }

    // Set enemy data
    enemy.setData("id", id);
    enemy.setData("type", enemyType);
    enemy.setData("isEditor", true);

    // Create and return the editor entity wrapper
    const entity: EditorEntity = {
      type: enemyType,
      x,
      y,
      gameObject: enemy,
      data: {
        id,
        type: enemyType,
        x,
        y,
        scene: this.scene,
      } as EnemyInterface,
    };

    return entity;
  }

  /**
   * Creates a crate entity (small or big)
   */
  private createCrate(
    x: number,
    y: number,
    type: "small" | "big"
  ): EditorEntity {
    const crateType = `crate-${type}`;

    // Create the crate game object
    const crate = new Crate(this.scene, x, y, type);

    // Set crate data
    crate.setData("id", `${crateType}-${Date.now()}`);
    crate.setData("isEditor", true);

    // Create and return the editor entity wrapper
    const entity: EditorEntity = {
      type: crateType,
      x,
      y,
      gameObject: crate,
      data: {
        id: crate.getData("id"),
        type,
        x,
        y,
        scene: this.scene,
      } as CrateInterface,
    };

    return entity;
  }

  /**
   * Creates a barrel entity
   */
  private createBarrel(x: number, y: number): EditorEntity {
    // Create the barrel game object
    const barrel = new Barrel(this.scene, x, y);

    // Set barrel data
    barrel.setData("id", `barrel-${Date.now()}`);
    barrel.setData("isEditor", true);

    // Create and return the editor entity wrapper
    const entity: EditorEntity = {
      type: "barrel",
      x,
      y,
      gameObject: barrel,
      data: {
        id: barrel.getData("id"),
        type: "barrel",
        x,
        y,
        scene: this.scene,
      } as BarrelInterface,
    };

    return entity;
  }

  /**
   * Creates a finish line entity
   */
  private createFinishLine(x: number, y: number): EditorEntity {
    // Create the finish line game object
    const finishLine = new Finish(this.scene, x, y);

    // Set finish line data
    finishLine.setData("id", `finish-line-${Date.now()}`);
    finishLine.setData("isEditor", true);

    // Create and return the editor entity wrapper
    const entity: EditorEntity = {
      type: "finish-line",
      x,
      y,
      gameObject: finishLine,
      data: {
        id: finishLine.getData("id"),
        type: "finish",
        x,
        y,
        scene: this.scene,
      } as FinishLineInterface,
    };

    return entity;
  }

  /**
   * Creates a player entity
   */
  private createPlayer(x: number, y: number): EditorEntity {
    const id = `player-${Date.now()}`;

    // Create the player game object
    const player = new Player(this.scene, x, y);
    player.setData("id", id);
    player.setData("isEditor", true);

    // Create entity
    const entity: EditorEntity = {
      type: "player",
      x,
      y,
      gameObject: player,
      data: {
        id,
        type: "player",
        x,
        y,
        scene: this.scene,
      } as any,
    };

    return entity;
  }
}
