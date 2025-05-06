import { Scene } from "phaser";
import { EditorEntity } from "../ui/Inspector";
import { Platform, PlatformInterface } from "../../entities/Platforms/Platform";
import { EditorEventBus } from "./EditorEventBus";
import { EditorEvents } from "./EditorEventTypes";
import { LevelData } from "./LevelData";
import { EnemyInterface } from "../../entities/Enemies/EnemyBase";
import { BarrelInterface } from "../../entities/Barrel/Barrel";
import { CrateInterface } from "../../entities/Crate/Crate";
import { FinishLineInterface } from "../../entities/Finish/Finish";
import { SerializedPlatform } from "./SerializedPlatform";

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
    if (!entity || !entity.data) {
      console.warn(
        `Cannot update property ${property} on entity ${entity?.type}: entity or entity.data is missing.`
      );
      return;
    }

    // --- Modify entity.data directly ---
    let oldValue: any = undefined;
    let propertyChanged = false;

    // Use type guards to safely access properties
    if (entity.type === "platform") {
      const platformData = entity.data as PlatformInterface;
      if (property in platformData) {
        oldValue = platformData[property as keyof PlatformInterface];
        if (oldValue !== value) {
          (platformData as any)[property] = value;
          propertyChanged = true;
          console.log(
            `[EntityUpdater] Updated platform ${property} from ${oldValue} to ${value}`
          );
        }
      }
    } else if (entity.type.startsWith("enemy-")) {
      const enemyData = entity.data as EnemyInterface;
      if (property in enemyData) {
        oldValue = enemyData[property as keyof EnemyInterface];
        if (oldValue !== value) {
          (enemyData as any)[property] = value;
          propertyChanged = true;
        }
      }
    } else if (entity.type.startsWith("crate-")) {
      const crateData = entity.data as CrateInterface;
      if (property in crateData) {
        oldValue = crateData[property as keyof CrateInterface];
        if (oldValue !== value) {
          (crateData as any)[property] = value;
          propertyChanged = true;
        }
      }
    } else if (entity.type === "barrel") {
      const barrelData = entity.data as BarrelInterface;
      if (property in barrelData) {
        oldValue = barrelData[property as keyof BarrelInterface];
        if (oldValue !== value) {
          (barrelData as any)[property] = value;
          propertyChanged = true;
        }
      }
    } else if (entity.type === "finish-line") {
      const finishData = entity.data as FinishLineInterface;
      if (property in finishData) {
        oldValue = finishData[property as keyof FinishLineInterface];
        if (oldValue !== value) {
          (finishData as any)[property] = value;
          propertyChanged = true;
        }
      }
    }
    // Add other entity types as needed

    if (!propertyChanged) {
      console.log(
        `[EntityUpdater] Property ${property} value unchanged or property not found on entity.data.`
      );
      return; // Skip if value didn't change or property doesn't exist on data
    }

    // --- End Modify entity.data ---

    // Special handling for platforms that require recreation
    if (
      entity.type === "platform" &&
      (property === "segmentCount" ||
        property === "isVertical" ||
        property === "segmentWidth")
    ) {
      console.log(
        `[EntityUpdater] Platform property ${property} changed, recreating GameObject.`
      );
      this.updatePlatform(entity); // Recreate the platform GameObject
    }

    // Update level data persistence
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

    // Type guard for platform data
    if (
      !entity.data ||
      typeof (entity.data as PlatformInterface).id === "undefined" ||
      typeof (entity.data as PlatformInterface).segmentCount === "undefined"
    ) {
      console.error(
        "Cannot update platform: Invalid entity.data for platform",
        entity
      );
      return;
    }
    const platformData = entity.data as PlatformInterface;

    // Destroy the old platform
    platform.destroy();

    // Create a new platform with updated properties using the correct constructor signature
    const newPlatform = new Platform(
      this.scene,
      entity.x, // Use current entity position
      entity.y,
      platformData.segmentCount, // Use data from entity.data
      platformData.id,
      platformData.isVertical,
      platformData.segmentWidth // Assuming segmentWidth is also in PlatformInterface/data
    );

    // Update the entity reference
    entity.gameObject = newPlatform;
    // Optionally update entity.data if needed, though it might be redundant if it reflects the newPlatform
    // entity.data = { ...platformData, x: entity.x, y: entity.y };
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
      case "player":
        // Player position is handled separately in level data
        console.debug(
          "Player position updated in editor (not saved in level data)"
        );
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
    // Use PlatformInterface for type safety when accessing entity.data
    if (
      !entity.data ||
      typeof (entity.data as PlatformInterface).id !== "string"
    ) {
      console.error(
        "Cannot update platform in level data: Invalid entity.data for platform",
        entity
      );
      return;
    }
    const platformData = entity.data as PlatformInterface;
    const platformId = platformData.id;

    // Find the platform index in the level data array
    const platformIndex = this.levelData.platforms.findIndex(
      (p) => p.id === platformId
    );

    // Create the object matching the *serialized* format
    const serializedData: SerializedPlatform = {
      id: platformId,
      x: entity.x,
      y: entity.y,
      segmentCount: platformData.segmentCount || 3,
      isVertical: platformData.isVertical || false,
    };

    if (platformIndex !== -1) {
      // Update existing platform data in the array
      this.levelData.platforms[platformIndex] = serializedData;
    } else {
      // Add new platform data to the array
      this.levelData.platforms.push(serializedData);
    }
  }

  /**
   * Updates an enemy entity in the level data
   */
  private updateEnemyInLevelData(entity: EditorEntity): void {
    // Type guard for enemy data - Check type property, as ID might not exist on interface
    if (
      !entity.data ||
      typeof (entity.data as EnemyInterface).type !== "string"
    ) {
      console.error(
        "Cannot update enemy in level data: Invalid entity.data for enemy",
        entity
      );
      return;
    }
    const enemyData = entity.data as EnemyInterface;
    const enemyType = entity.type; // Use entity.type which should be 'enemy-large' or 'enemy-small'

    // Find the enemy in the level data - Assume position is unique enough for now if ID is missing
    // A better approach would be to ensure consistent IDs
    const enemyIndex = this.levelData.enemies.findIndex(
      (e) => e.x === enemyData.x && e.y === enemyData.y
    );

    if (enemyIndex !== -1) {
      // Update existing enemy
      this.levelData.enemies[enemyIndex].x = entity.x;
      this.levelData.enemies[enemyIndex].y = entity.y;
      this.levelData.enemies[enemyIndex].type = enemyType; // Assign 'enemy-large' or 'enemy-small'
    } else {
      // Add new enemy
      this.levelData.enemies.push({
        // id: enemyId, // ID might not exist on interface
        x: entity.x,
        y: entity.y,
        type: enemyType, // Assign 'enemy-large' or 'enemy-small'
      });
    }
  }

  /**
   * Updates a barrel entity in the level data
   */
  private updateBarrelInLevelData(entity: EditorEntity): void {
    // Type guard for barrel data - Check x/y, as ID might not exist
    if (
      !entity.data ||
      typeof (entity.data as BarrelInterface).x !== "number" ||
      typeof (entity.data as BarrelInterface).y !== "number"
    ) {
      console.error(
        "Cannot update barrel in level data: Invalid entity.data for barrel",
        entity
      );
      return;
    }
    const barrelData = entity.data as BarrelInterface;

    // Find the barrel in the level data - Assume position is unique enough for now if ID is missing
    const barrelIndex = this.levelData.barrels.findIndex(
      (b) => b.x === barrelData.x && b.y === barrelData.y
    );

    if (barrelIndex !== -1) {
      // Update existing barrel
      this.levelData.barrels[barrelIndex].x = entity.x;
      this.levelData.barrels[barrelIndex].y = entity.y;
    } else {
      // Add new barrel
      this.levelData.barrels.push({
        // id: barrelId, // ID might not exist on interface
        x: entity.x,
        y: entity.y,
      });
    }
  }

  /**
   * Updates a finish line entity in the level data
   */
  private updateFinishLineInLevelData(entity: EditorEntity): void {
    // Type guard for finish line data
    if (
      !entity.data ||
      typeof (entity.data as FinishLineInterface).id === "undefined"
    ) {
      console.error(
        "Cannot update finish line in level data: Invalid entity.data for finish line",
        entity
      );
      return;
    }
    const finishData = entity.data as FinishLineInterface;
    const finishId = finishData.id;

    // Since there's only one finish line, we just update or create it
    if (this.levelData.finishLine) {
      this.levelData.finishLine.x = entity.x;
      this.levelData.finishLine.y = entity.y;
      this.levelData.finishLine.id = finishId;
    } else {
      this.levelData.finishLine = {
        id: finishId,
        x: entity.x,
        y: entity.y,
      };
    }
  }

  /**
   * Updates a crate entity in the level data
   */
  private updateCrateInLevelData(entity: EditorEntity): void {
    // Type guard for crate data
    if (
      !entity.data ||
      typeof (entity.data as CrateInterface).id === "undefined" ||
      typeof (entity.data as CrateInterface).type === "undefined"
    ) {
      console.error(
        "Cannot update crate in level data: Invalid entity.data for crate",
        entity
      );
      return;
    }
    const crateData = entity.data as CrateInterface;
    const crateId = crateData.id;
    const crateType = crateData.type; // Get type from data

    // Find the crate in the level data
    const crate = this.levelData.crates.find((c) => c.id === crateId);

    if (crate) {
      // Update existing crate
      crate.x = entity.x;
      crate.y = entity.y;
      crate.type = crateType;
    } else {
      // Add new crate
      this.levelData.crates.push({
        id: crateId,
        x: entity.x,
        y: entity.y,
        type: crateType,
      });
    }
  }
}
