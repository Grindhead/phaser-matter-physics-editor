import { Scene } from "phaser";
import { EditorEntity } from "../ui/Inspector";
import { Platform } from "../../entities/Platforms/Platform";
import { EditorEventBus } from "./EditorEventBus";
import { EditorEvents } from "./EditorEventTypes";
import { LevelData } from "./LevelData";

/**
 * Responsible for updating entity properties in the editor
 */
export class EntityUpdater {
  private scene: Scene;
  private eventBus: EditorEventBus;
  private levelData: LevelData;

  constructor(scene: Scene, levelData: LevelData) {
    this.scene = scene;
    this.eventBus = EditorEventBus.getInstance();
    this.levelData = levelData;
  }

  /**
   * Updates the level data with the current state
   * @param levelData The level data to update
   */
  public setLevelData(levelData: LevelData): void {
    this.levelData = levelData;
  }

  /**
   * Updates an entity's property
   * @param entity The entity to update
   * @param property The property name to update
   * @param value The new value for the property
   */
  public updateEntityProperty(
    entity: EditorEntity,
    property: string,
    value: any
  ): void {
    if (!entity || !entity.properties || !(property in entity.properties)) {
      console.warn(
        `Cannot update property ${property} on entity ${entity?.type}`
      );
      return;
    }

    const oldValue = entity.properties[property].value;

    // Skip if the value hasn't changed
    if (oldValue === value) return;

    // Update the property in the entity
    entity.properties[property].value = value;

    // Special handling for platforms
    if (
      entity.type === "platform" &&
      (property === "segmentCount" || property === "isVertical")
    ) {
      this.updatePlatform(entity);
    }

    // Update level data
    this.updateEntityInLevelData(entity);

    // Emit event for property change
    this.eventBus.emit(EditorEvents.ENTITY_UPDATED, {
      entity,
      property,
      oldValue,
      newValue: value,
    });
  }

  /**
   * Updates a platform entity based on its current properties
   * @param entity The platform entity to update
   */
  private updatePlatform(entity: EditorEntity): void {
    const platform = entity.gameObject as Platform;
    if (!platform) return;

    const { x, y } = entity;
    const segmentCount = entity.properties["segmentCount"]?.value || 3;
    const isVertical = entity.properties["isVertical"]?.value || false;

    // Store the platform's current position and properties
    const platformData = {
      x,
      y,
      segmentCount,
      isVertical,
      id: platform.id,
    };

    // Destroy the old platform
    platform.destroy();

    // Create a new platform with updated properties
    const newPlatform = new Platform(this.scene, platformData);

    // Update the entity reference
    entity.gameObject = newPlatform;
  }

  /**
   * Updates entity position in both the entity object and the game object
   * @param entity The entity to update
   * @param x The new x position
   * @param y The new y position
   */
  public updateEntityPosition(
    entity: EditorEntity,
    x: number,
    y: number
  ): void {
    if (!entity || !entity.gameObject) return;

    // Update entity position
    entity.x = x;
    entity.y = y;

    // Update the game object position based on its type
    const gameObject = entity.gameObject as any;
    if (typeof gameObject.setPosition === "function") {
      gameObject.setPosition(x, y);
    }

    // Update the entity in level data
    this.updateEntityInLevelData(entity);
  }

  /**
   * Updates the level data with the current entity state
   * @param entity The entity to update in the level data
   */
  public updateEntityInLevelData(entity: EditorEntity): void {
    if (!entity || !this.levelData) return;

    // Different handling based on entity type
    switch (entity.type) {
      case "platform":
        this.updatePlatformInLevelData(entity);
        break;
      case "enemy-large":
      case "enemy-small":
        this.updateEnemyInLevelData(entity);
        break;
      case "barrel":
        this.updateBarrelInLevelData(entity);
        break;
      case "finish-line":
        this.updateFinishLineInLevelData(entity);
        break;
      case "crate-small":
      case "crate-big":
        this.updateCrateInLevelData(entity);
        break;
      default:
        console.warn(
          `Unknown entity type for level data update: ${entity.type}`
        );
    }
  }

  /**
   * Updates a platform entity in the level data
   */
  private updatePlatformInLevelData(entity: EditorEntity): void {
    // Find the platform in the level data
    const platform = this.levelData.platforms.find((p) => p.id === entity.id);

    if (platform) {
      // Update existing platform
      platform.x = entity.x;
      platform.y = entity.y;
      platform.segmentCount = entity.properties["segmentCount"]?.value || 3;
      platform.isVertical = entity.properties["isVertical"]?.value || false;
    } else {
      // Add new platform
      this.levelData.platforms.push({
        id: entity.id,
        x: entity.x,
        y: entity.y,
        segmentCount: entity.properties["segmentCount"]?.value || 3,
        isVertical: entity.properties["isVertical"]?.value || false,
      });
    }
  }

  /**
   * Updates an enemy entity in the level data
   */
  private updateEnemyInLevelData(entity: EditorEntity): void {
    const enemyType = entity.type === "enemy-large" ? "large" : "small";

    // Find the enemy in the level data
    const enemy = this.levelData.enemies.find((e) => e.id === entity.id);

    if (enemy) {
      // Update existing enemy
      enemy.x = entity.x;
      enemy.y = entity.y;
      enemy.type = enemyType;
    } else {
      // Add new enemy
      this.levelData.enemies.push({
        id: entity.id,
        x: entity.x,
        y: entity.y,
        type: enemyType,
      });
    }
  }

  /**
   * Updates a barrel entity in the level data
   */
  private updateBarrelInLevelData(entity: EditorEntity): void {
    // Find the barrel in the level data
    const barrel = this.levelData.barrels.find((b) => b.id === entity.id);

    if (barrel) {
      // Update existing barrel
      barrel.x = entity.x;
      barrel.y = entity.y;
    } else {
      // Add new barrel
      this.levelData.barrels.push({
        id: entity.id,
        x: entity.x,
        y: entity.y,
      });
    }
  }

  /**
   * Updates a finish line entity in the level data
   */
  private updateFinishLineInLevelData(entity: EditorEntity): void {
    // Since there's only one finish line, we just update or create it
    if (this.levelData.finishLine) {
      this.levelData.finishLine.x = entity.x;
      this.levelData.finishLine.y = entity.y;
      this.levelData.finishLine.id = entity.id;
    } else {
      this.levelData.finishLine = {
        id: entity.id,
        x: entity.x,
        y: entity.y,
      };
    }
  }

  /**
   * Updates a crate entity in the level data
   */
  private updateCrateInLevelData(entity: EditorEntity): void {
    const crateType = entity.type === "crate-small" ? "small" : "big";

    // Find the crate in the level data
    const crate = this.levelData.crates.find((c) => c.id === entity.id);

    if (crate) {
      // Update existing crate
      crate.x = entity.x;
      crate.y = entity.y;
      crate.type = crateType;
    } else {
      // Add new crate
      this.levelData.crates.push({
        id: entity.id,
        x: entity.x,
        y: entity.y,
        type: crateType,
      });
    }
  }
}
