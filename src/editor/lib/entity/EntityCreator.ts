import { Scene } from "phaser";
import { EditorEntity } from "../../ui/Inspector";
import {
  Platform,
  PlatformInterface,
} from "../../../entities/Platforms/Platform";
import { EnemyInterface } from "../../../entities/Enemies/EnemyBase";
import { EnemyLarge } from "../../../entities/Enemies/EnemyLarge";
import { EnemySmall } from "../../../entities/Enemies/EnemySmall";
import { Barrel, BarrelInterface } from "../../../entities/Barrel/Barrel";
import { Finish, FinishLineInterface } from "../../../entities/Finish/Finish";
import { Crate, CrateInterface } from "../../../entities/Crate/Crate";
import { TILE_WIDTH, TILE_HEIGHT } from "../../../lib/constants";

/**
 * Factory responsible for creating editor entities
 */
export class EntityCreator {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Creates an entity based on the provided type
   */
  public createEntity(
    type: string,
    x: number,
    y: number,
    config?: any
  ): EditorEntity | null {
    // Snap position to grid
    const snappedX = Math.floor(x / TILE_WIDTH) * TILE_WIDTH + TILE_WIDTH / 2;
    const snappedY =
      Math.floor(y / TILE_HEIGHT) * TILE_HEIGHT + TILE_HEIGHT / 2;

    switch (type) {
      case "platform":
        return this.createPlatform(snappedX, snappedY, config);
      case "enemy-large":
        return this.createLargeEnemy(snappedX, snappedY);
      case "enemy-small":
        return this.createSmallEnemy(snappedX, snappedY);
      case "crate-small":
        return this.createCrate(snappedX, snappedY, "small");
      case "crate-big":
        return this.createCrate(snappedX, snappedY, "big");
      case "barrel":
        return this.createBarrel(snappedX, snappedY);
      case "finish-line":
        return this.createFinishLine(snappedX, snappedY);
      default:
        console.warn(`Unknown entity type: ${type}`);
        return null;
    }
  }

  /**
   * Creates a platform entity
   */
  private createPlatform(x: number, y: number, config?: any): EditorEntity {
    // Extract platform config
    const segmentCount = config?.segmentCount || 3;
    const isVertical = config?.isVertical || false;
    const segmentWidth = config?.segmentWidth || 32;
    const id =
      config?.id ||
      `platform-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create platform instance with the correct constructor pattern
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

    // Create entity
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
      } as PlatformInterface,
    };

    return entity;
  }

  /**
   * Creates a large enemy entity
   */
  private createLargeEnemy(x: number, y: number): EditorEntity {
    const id = `enemy-large-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create enemy instance with the correct constructor pattern
    const enemy = new EnemyLarge(this.scene, x, y);
    enemy.setData("id", id);
    enemy.setData("isEditor", true);
    enemy.setData("type", "enemy-large");

    // Create entity
    const entity: EditorEntity = {
      type: "enemy-large",
      x,
      y,
      gameObject: enemy,
      data: {
        id,
        type: "enemy-large",
        x,
        y,
        scene: this.scene,
      } as unknown as EnemyInterface,
    };

    return entity;
  }

  /**
   * Creates a small enemy entity
   */
  private createSmallEnemy(x: number, y: number): EditorEntity {
    const id = `enemy-small-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create enemy instance with the correct constructor pattern
    const enemy = new EnemySmall(this.scene, x, y);
    enemy.setData("id", id);
    enemy.setData("isEditor", true);
    enemy.setData("type", "enemy-small");

    // Create entity
    const entity: EditorEntity = {
      type: "enemy-small",
      x,
      y,
      gameObject: enemy,
      data: {
        id,
        type: "enemy-small",
        x,
        y,
        scene: this.scene,
      } as unknown as EnemyInterface,
    };

    return entity;
  }

  /**
   * Creates a crate entity
   */
  private createCrate(
    x: number,
    y: number,
    crateType: "small" | "big"
  ): EditorEntity {
    const id = `crate-${crateType}-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    // Create crate instance with the correct constructor pattern
    const crate = new Crate(this.scene, x, y, crateType);
    crate.setData("id", id);
    crate.setData("isEditor", true);

    // Create entity
    const entity: EditorEntity = {
      type: `crate-${crateType}`,
      x,
      y,
      gameObject: crate,
      data: {
        id,
        type: crateType,
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
    const id = `barrel-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create barrel instance with the correct constructor pattern
    const barrel = new Barrel(this.scene, x, y);
    barrel.setData("id", id);
    barrel.setData("isEditor", true);

    // Create entity
    const entity: EditorEntity = {
      type: "barrel",
      x,
      y,
      gameObject: barrel,
      data: {
        id,
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
    const id = `finish-line-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create finish line instance with the correct constructor pattern
    const finishLine = new Finish(this.scene, x, y);
    finishLine.setData("id", id);
    finishLine.setData("isEditor", true);

    // Create entity
    const entity: EditorEntity = {
      type: "finish-line",
      x,
      y,
      gameObject: finishLine,
      data: {
        id,
        type: "finish",
        x,
        y,
        scene: this.scene,
      } as FinishLineInterface,
    };

    return entity;
  }
}
