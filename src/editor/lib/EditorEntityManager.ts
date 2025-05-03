import { Scene } from "phaser";
import { TILE_WIDTH, TILE_HEIGHT } from "../../lib/constants";
import { EditorEntity } from "../ui/Inspector";
import { LevelData, LevelDataManager } from "./LevelData";
import { Platform, PlatformInterface } from "../../entities/Platforms/Platform";
import { EnemyInterface } from "../../entities/Enemies/EnemyBase";
import { EnemyLarge } from "../../entities/Enemies/EnemyLarge";
import { EnemySmall } from "../../entities/Enemies/EnemySmall";
import { CrateInterface } from "../../entities/Crate/Crate";
import { BarrelInterface } from "../../entities/Barrel/Barrel";
import { FinishLineInterface } from "../../entities/Finish/Finish";
import { Barrel } from "../../entities/Barrel/Barrel";
import { Finish } from "../../entities/Finish/Finish";
import { Crate } from "../../entities/Crate/Crate";

export class EditorEntityManager {
  private scene: Scene;
  private levelData: LevelData;
  private entities: EditorEntity[] = [];
  private selectedEntityType: string | null = null;
  private selectedEntity: EditorEntity | null = null;
  private isEntityDragging: boolean = false;
  private newEntityDragging: boolean = false;
  private _platformConfig: any = {};

  constructor(scene: Scene) {
    this.scene = scene;
    this.levelData = LevelDataManager.createEmpty();

    // Setup input handlers for entity selection and dragging
    this.setupInputHandlers();
    // Setup keyboard handlers
    this.setupKeyboardHandlers();
  }

  /**
   * Sets up all input handlers related to entity manipulation
   */
  private setupInputHandlers(): void {
    // Setup click handler for entity placement and selection
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Skip if not left-click or if camera is being dragged
      if (!pointer.leftButtonDown()) return;

      // If we're already dragging a new entity, ignore this click
      if (this.newEntityDragging) return;

      // Get world position (accounting for camera)
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      // Check if clicking on an existing entity for selection
      const clickedEntity = this.getEntityAtPosition(worldX, worldY);

      // If in placement mode (an entity type is selected)
      if (this.selectedEntityType) {
        if (clickedEntity) {
          // Clicking on an entity while in placement mode - select the entity
          this.selectEntity(clickedEntity);

          // Start entity dragging
          this.isEntityDragging = true;

          // Exit placement mode
          this.selectedEntityType = null;
        } else {
          // Regular click in placement mode - place the entity
          this.placeEntity(this.selectedEntityType, worldX, worldY);

          // Exit placement mode immediately after placing an entity
          // This allows for direct creation by clicking palette buttons
          this.selectedEntityType = null;
        }
      } else {
        // Not in placement mode - select or deselect entities
        if (clickedEntity) {
          // Select the entity
          this.selectEntity(clickedEntity);

          // Start entity dragging
          this.isEntityDragging = true;
        } else {
          // Clicking empty space - deselect current entity
          this.selectEntity(null);
        }
      }
    });

    // Handle entity dragging
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (
        this.isEntityDragging &&
        this.selectedEntity &&
        pointer.leftButtonDown()
      ) {
        // Get world position (accounting for camera)
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;

        // Calculate snap position
        const snappedX =
          Math.floor(worldX / TILE_WIDTH) * TILE_WIDTH + TILE_WIDTH / 2;
        const snappedY =
          Math.floor(worldY / TILE_HEIGHT) * TILE_HEIGHT + TILE_HEIGHT / 2;

        // Update entity position
        this.selectedEntity.x = snappedX;
        this.selectedEntity.y = snappedY;

        // Update visual representation based on entity type
        if (this.selectedEntity.type === "platform") {
          (this.selectedEntity.gameObject as Platform).setPosition(
            snappedX,
            snappedY
          );
        } else if (
          this.selectedEntity.type === "enemy-large" ||
          this.selectedEntity.type === "enemy-small"
        ) {
          (
            this.selectedEntity.gameObject as EnemyLarge | EnemySmall
          ).setPosition(snappedX, snappedY);
        } else if (this.selectedEntity.type === "barrel") {
          (this.selectedEntity.gameObject as Barrel).setPosition(
            snappedX,
            snappedY
          );
        } else if (this.selectedEntity.type === "finish-line") {
          (this.selectedEntity.gameObject as Finish).setPosition(
            snappedX,
            snappedY
          );
        } else if (
          this.selectedEntity.type === "crate-small" ||
          this.selectedEntity.type === "crate-big"
        ) {
          (this.selectedEntity.gameObject as Crate).setPosition(
            snappedX,
            snappedY
          );
        } else {
          (
            this.selectedEntity.gameObject as Phaser.GameObjects.Image
          ).setPosition(snappedX, snappedY);
        }

        // Update entity data
        this.updateEntityInLevelData(this.selectedEntity);
      }
    });

    // Handle end of entity dragging
    this.scene.input.on("pointerup", () => {
      if (this.isEntityDragging && this.selectedEntity) {
        // Update entity data one last time to ensure all changes are saved
        this.updateEntityInLevelData(this.selectedEntity);

        // Reset dragging state
        this.isEntityDragging = false;

        // If this was a new entity being dragged, we're done with it now
        // The specific one-time handler in createAndDragEntity will handle
        // most cases, but this is a fallback
        if (this.newEntityDragging) {
          this.newEntityDragging = false;
        }
      }
    });
  }

  /**
   * Sets up keyboard handlers for actions like deletion.
   */
  private setupKeyboardHandlers(): void {
    this.scene.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        console.log("EDITOR_ENTITY_MANAGER: Delete/Backspace key pressed.");
        event.preventDefault();
        if (this.selectedEntity) {
          console.log(
            "EDITOR_ENTITY_MANAGER: Selected entity found, attempting removal:",
            this.selectedEntity
          );
          this.removeEntity(this.selectedEntity);
        } else {
          console.log(
            "EDITOR_ENTITY_MANAGER: No entity selected, ignoring delete key."
          );
        }
      }
    });
    console.log("EDITOR_ENTITY_MANAGER: Keyboard handlers set up.");
  }

  /**
   * Places a new entity of the specified type at the given coordinates
   */
  public placeEntity(type: string, x: number, y: number): EditorEntity | null {
    // Snap to grid
    const snappedX = Math.floor(x / TILE_WIDTH) * TILE_WIDTH + TILE_WIDTH / 2;
    const snappedY =
      Math.floor(y / TILE_HEIGHT) * TILE_HEIGHT + TILE_HEIGHT / 2;

    let entity: EditorEntity | null = null;

    switch (type) {
      case "platform":
        entity = this.createPlatform(snappedX, snappedY);
        break;
      case "enemy-large":
        entity = this.createEnemy(snappedX, snappedY, "enemy-large");
        break;
      case "enemy-small":
        entity = this.createEnemy(snappedX, snappedY, "enemy-small");
        break;
      case "crate-small":
        entity = this.createCrate(snappedX, snappedY, "small");
        break;
      case "crate-big":
        entity = this.createCrate(snappedX, snappedY, "big");
        break;
      case "barrel":
        entity = this.createBarrel(snappedX, snappedY);
        break;
      case "finish-line":
        entity = this.createFinishLine(snappedX, snappedY);
        break;
    }

    if (entity) {
      this.entities.push(entity);

      // Temporarily highlight the newly placed entity
      this.temporarilyHighlightEntity(entity);
    }

    return entity;
  }

  /**
   * Creates a platform entity
   */
  private createPlatform(x: number, y: number): EditorEntity {
    // Create platform data with configuration provided by the platform tool
    const platformData: PlatformInterface = {
      scene: this.scene,
      x,
      y,
      segmentCount: this._platformConfig?.segmentCount || 3,
      id:
        this._platformConfig?.id ||
        `platform-${this.levelData.platforms.length}`,
      isVertical: this._platformConfig?.isVertical || false,
    };

    // Add to level data
    this.levelData.platforms.push(platformData);

    // Create actual platform instance with physics disabled
    const platform = new Platform(
      this.scene,
      x,
      y,
      platformData.segmentCount, // Use configured segment count
      platformData.id,
      platformData.isVertical
    );

    // Disable physics collisions in editor mode
    if (platform.body) {
      (platform.body as MatterJS.BodyType).collisionFilter.group = -1;
    }

    // Ensure it's interactive for selection and dragging
    platform.setInteractive();

    // Return entity
    return {
      type: "platform",
      x: x,
      y: y,
      gameObject: platform,
      data: platformData,
    };
  }

  /**
   * Creates an enemy entity
   */
  private createEnemy(
    x: number,
    y: number,
    type: EnemyInterface["type"]
  ): EditorEntity {
    const enemyData: EnemyInterface = {
      x,
      y,
      type,
    };

    // Add to level data
    this.levelData.enemies.push(enemyData);

    // Create actual enemy instance
    let enemyInstance: EnemyLarge | EnemySmall;
    if (type === "enemy-large") {
      enemyInstance = new EnemyLarge(this.scene, x, y);
    } else {
      enemyInstance = new EnemySmall(this.scene, x, y);
    }

    // Disable physics collisions in editor mode
    if (enemyInstance.body) {
      (enemyInstance.body as MatterJS.BodyType).collisionFilter.group = -1;
    }

    // Ensure it's interactive for selection
    enemyInstance.setInteractive();

    // Return entity
    return {
      type: type,
      x,
      y,
      gameObject: enemyInstance,
      data: enemyData,
    };
  }

  /**
   * Creates a crate entity
   */
  private createCrate(
    x: number,
    y: number,
    type: "small" | "big"
  ): EditorEntity {
    const crateData: CrateInterface = {
      scene: this.scene,
      x,
      y,
      type,
    };

    // Add to level data
    this.levelData.crates.push(crateData);

    // Create actual crate instance
    const crate = new Crate(this.scene, x, y, type);

    // Disable physics collisions in editor mode
    if (crate.body) {
      (crate.body as MatterJS.BodyType).collisionFilter.group = -1;
    }

    // Ensure it's interactive for selection
    crate.setInteractive();

    // Return entity
    return {
      type: `crate-${type}`,
      x,
      y,
      gameObject: crate,
      data: crateData,
    };
  }

  /**
   * Creates a barrel entity
   */
  private createBarrel(x: number, y: number): EditorEntity {
    const barrelData: BarrelInterface = {
      scene: this.scene,
      x,
      y,
      type: "barrel",
    };

    // Add to level data
    this.levelData.barrels.push(barrelData);

    // Create actual barrel instance
    const barrel = new Barrel(this.scene, x, y);

    // Disable physics collisions in editor mode
    if (barrel.body) {
      (barrel.body as MatterJS.BodyType).collisionFilter.group = -1;
    }

    // Ensure it's interactive for selection
    barrel.setInteractive();

    // Return entity
    return {
      type: "barrel",
      x,
      y,
      gameObject: barrel,
      data: barrelData,
    };
  }

  /**
   * Creates a finish line entity
   */
  private createFinishLine(x: number, y: number): EditorEntity {
    const finishLineData: FinishLineInterface = {
      scene: this.scene,
      x,
      y,
      type: "finish-line",
    };

    // Handle case where a finish line already exists
    if (this.levelData.finishLine) {
      // Remove existing finish line
      const existingIndex = this.entities.findIndex(
        (e) => e.type === "finish-line"
      );
      if (existingIndex >= 0) {
        const existingEntity = this.entities[existingIndex];
        existingEntity.gameObject.destroy();
        this.entities.splice(existingIndex, 1);
      }
    }

    // Set as the new finish line
    this.levelData.finishLine = finishLineData;

    // Create actual finish line instance
    const finish = new Finish(this.scene, x, y);

    // Disable physics collisions in editor mode
    if (finish.body) {
      (finish.body as MatterJS.BodyType).collisionFilter.group = -1;
    }

    // Ensure it's interactive for selection
    finish.setInteractive();

    // Return entity
    return {
      type: "finish-line",
      x,
      y,
      gameObject: finish,
      data: finishLineData,
    };
  }

  /**
   * Gets the entity at the specified position
   */
  private getEntityAtPosition(x: number, y: number): EditorEntity | null {
    // Check if position is within any entity's bounds
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      const gameObject = entity.gameObject;

      if (entity.type === "platform") {
        // For platforms, we need to check the platform body bounds
        const platform = gameObject as Platform;
        const bounds = platform.getBounds();
        if (bounds.contains(x, y)) {
          return entity;
        }
      } else if (
        entity.type === "enemy-large" ||
        entity.type === "enemy-small"
      ) {
        // For enemies, check their bounds
        const enemy = gameObject as EnemyLarge | EnemySmall;
        const bounds = enemy.getBounds();
        if (bounds.contains(x, y)) {
          return entity;
        }
      } else if (entity.type === "barrel") {
        // For barrels
        const barrel = gameObject as Barrel;
        const bounds = barrel.getBounds();
        if (bounds.contains(x, y)) {
          return entity;
        }
      } else if (entity.type === "finish-line") {
        // For finish line
        const finish = gameObject as Finish;
        const bounds = finish.getBounds();
        if (bounds.contains(x, y)) {
          return entity;
        }
      } else if (entity.type === "crate-small" || entity.type === "crate-big") {
        // For crates
        const crate = gameObject as Crate;
        const bounds = crate.getBounds();
        if (bounds.contains(x, y)) {
          return entity;
        }
      } else {
        // For other entities using images
        const image = gameObject as Phaser.GameObjects.Image;
        const bounds = image.getBounds();
        if (bounds.contains(x, y)) {
          return entity;
        }
      }
    }

    return null;
  }

  /**
   * Temporarily highlights an entity without selecting it (for visual feedback)
   */
  private temporarilyHighlightEntity(entity: EditorEntity): void {
    // Apply highlight tint
    if (entity.type === "platform") {
      const platform = entity.gameObject as Platform;
      platform.setTint(0x00ffff);

      // Clear tint after a short delay
      this.scene.time.delayedCall(300, () => {
        platform.clearTint();
      });
    } else if (entity.type === "enemy-large" || entity.type === "enemy-small") {
      const enemy = entity.gameObject as EnemyLarge | EnemySmall;
      enemy.setTint(0x00ffff);

      // Clear tint after a short delay
      this.scene.time.delayedCall(300, () => {
        enemy.clearTint();
      });
    } else if (entity.type === "barrel") {
      const barrel = entity.gameObject as Barrel;
      barrel.setTint(0x00ffff);

      // Clear tint after a short delay
      this.scene.time.delayedCall(300, () => {
        barrel.clearTint();
      });
    } else if (entity.type === "finish-line") {
      const finish = entity.gameObject as Finish;
      finish.setTint(0x00ffff);

      // Clear tint after a short delay
      this.scene.time.delayedCall(300, () => {
        finish.clearTint();
      });
    } else if (entity.type === "crate-small" || entity.type === "crate-big") {
      const crate = entity.gameObject as Crate;
      crate.setTint(0x00ffff);

      // Clear tint after a short delay
      this.scene.time.delayedCall(300, () => {
        crate.clearTint();
      });
    } else {
      const image = entity.gameObject as Phaser.GameObjects.Image;
      image.setTint(0x00ffff);

      // Clear tint after a short delay
      this.scene.time.delayedCall(300, () => {
        image.clearTint();
      });
    }
  }

  /**
   * Selects an entity and updates the inspector
   */
  public selectEntity(entity: EditorEntity | null): void {
    // Deselect previously selected entity
    if (this.selectedEntity) {
      if (this.selectedEntity.type === "platform") {
        // For platforms, we use setTint directly on the platform sprite
        const platform = this.selectedEntity.gameObject as Platform;
        platform.clearTint();
      } else if (
        this.selectedEntity.type === "enemy-large" ||
        this.selectedEntity.type === "enemy-small"
      ) {
        // For enemies, clear tint
        const enemy = this.selectedEntity.gameObject as EnemyLarge | EnemySmall;
        enemy.clearTint();
      } else if (this.selectedEntity.type === "barrel") {
        const barrel = this.selectedEntity.gameObject as Barrel;
        barrel.clearTint();
      } else if (this.selectedEntity.type === "finish-line") {
        const finish = this.selectedEntity.gameObject as Finish;
        finish.clearTint();
      } else if (
        this.selectedEntity.type === "crate-small" ||
        this.selectedEntity.type === "crate-big"
      ) {
        const crate = this.selectedEntity.gameObject as Crate;
        crate.clearTint();
      } else {
        // For other entities using images
        (
          this.selectedEntity.gameObject as Phaser.GameObjects.Image
        ).clearTint();
      }
    }

    this.selectedEntity = entity;

    // Highlight newly selected entity
    if (entity) {
      if (entity.type === "platform") {
        // For platforms, we use setTint directly on the platform sprite
        const platform = entity.gameObject as Platform;
        platform.setTint(0x00ffff);
      } else if (
        entity.type === "enemy-large" ||
        entity.type === "enemy-small"
      ) {
        // For enemies, set tint
        const enemy = entity.gameObject as EnemyLarge | EnemySmall;
        enemy.setTint(0x00ffff);
      } else if (entity.type === "barrel") {
        const barrel = entity.gameObject as Barrel;
        barrel.setTint(0x00ffff);
      } else if (entity.type === "finish-line") {
        const finish = entity.gameObject as Finish;
        finish.setTint(0x00ffff);
      } else if (entity.type === "crate-small" || entity.type === "crate-big") {
        const crate = entity.gameObject as Crate;
        crate.setTint(0x00ffff);
      } else {
        // For other entities using images
        (entity.gameObject as Phaser.GameObjects.Image).setTint(0x00ffff);
      }
    }
  }

  /**
   * Updates an entity property
   */
  public updateEntityProperty(
    entity: EditorEntity,
    property: string,
    value: any
  ): void {
    if (!entity) return;

    switch (property) {
      case "position":
        // Handle position updates
        const { x, y } = value;
        this.updateEntityPosition(entity, x, y);
        break;
      case "id":
        if (entity.type === "platform") {
          // Get the platform data and original platform object
          const platformData = entity.data as PlatformInterface;
          const platform = entity.gameObject as Platform;

          // Update the ID in both the data and the platform object
          platformData.id = value;
          platform.id = value;

          this.updateEntityInLevelData(entity);
        }
        break;
      case "orientation":
        if (entity.type === "platform") {
          // Get the platform data and original platform object
          const platformData = entity.data as PlatformInterface;
          const oldPlatform = entity.gameObject as Platform;

          // Update the orientation property in the data
          platformData.isVertical = value; // Value is already boolean (true/false)

          // Store position
          const { x, y } = oldPlatform;

          // Destroy old platform
          oldPlatform.destroy();

          // Create new platform with updated orientation
          const newPlatform = new Platform(
            this.scene,
            x,
            y,
            3, // Fixed segment count
            `platform-${Date.now()}`, // Ensure unique ID
            platformData.isVertical // Pass the updated boolean value
          );

          // Disable physics collisions in editor mode
          if (newPlatform.body) {
            (newPlatform.body as MatterJS.BodyType).collisionFilter.group = -1;
          }

          // Update entity reference
          entity.gameObject = newPlatform;

          // Select the new platform
          this.selectEntity(entity);

          this.updateEntityInLevelData(entity);
        }
        break;
      case "enemyType":
        // Handle enemy type changes (if needed - currently enemies are recreated on type change)
        if (entity.type === "enemy-large" || entity.type === "enemy-small") {
          // Get enemy data and current position
          const enemyData = entity.data as EnemyInterface;
          const oldEnemy = entity.gameObject as EnemyLarge | EnemySmall;
          const { x, y } = oldEnemy;

          // Update enemy type in data
          enemyData.type = value;

          // Destroy old enemy
          oldEnemy.destroy();

          // Create new enemy with updated type
          let newEnemy: EnemyLarge | EnemySmall;
          if (value === "enemy-large") {
            newEnemy = new EnemyLarge(this.scene, x, y);
          } else {
            newEnemy = new EnemySmall(this.scene, x, y);
          }

          // Disable physics collisions in editor mode
          if (newEnemy.body) {
            (newEnemy.body as MatterJS.BodyType).collisionFilter.group = -1;
          }

          // Ensure it's interactive for selection
          newEnemy.setInteractive();

          // Update entity reference
          entity.gameObject = newEnemy;
          entity.type = value;

          // Select the new enemy
          this.selectEntity(entity);

          this.updateEntityInLevelData(entity);
        }
        break;
    }
  }

  /**
   * Updates entity data in the level data structure
   */
  private updateEntityInLevelData(entity: EditorEntity) {
    if (!entity) return;

    switch (entity.type) {
      case "platform":
        const platformIndex = this.levelData.platforms.findIndex(
          (p) => p === entity.data
        );
        if (platformIndex >= 0) {
          const platformData = entity.data as PlatformInterface;
          this.levelData.platforms[platformIndex] = {
            ...platformData,
            x: entity.x,
            y: entity.y,
          };
        }
        break;
      case "enemy-large":
      case "enemy-small":
        const enemyIndex = this.levelData.enemies.findIndex(
          (e) => e === entity.data
        );
        if (enemyIndex >= 0) {
          const enemyData = entity.data as EnemyInterface;
          this.levelData.enemies[enemyIndex] = {
            ...enemyData,
            x: entity.x,
            y: entity.y,
          };
        }
        break;
      case "barrel":
        const barrelIndex = this.levelData.barrels.findIndex(
          (b) => b === entity.data
        );
        if (barrelIndex >= 0) {
          this.levelData.barrels[barrelIndex] = {
            scene: this.scene,
            x: entity.x,
            y: entity.y,
            type: "barrel",
          };
        }
        break;
      case "crate-small":
      case "crate-big":
        const crateIndex = this.levelData.crates.findIndex(
          (c) => c === entity.data
        );
        if (crateIndex >= 0) {
          const crateData = entity.data as CrateInterface;
          this.levelData.crates[crateIndex] = {
            ...crateData,
            x: entity.x,
            y: entity.y,
          };
        }
        break;
      case "finish-line":
        if (this.levelData.finishLine === entity.data) {
          this.levelData.finishLine = {
            scene: this.scene,
            x: entity.x,
            y: entity.y,
            type: "finish-line",
          };
        }
        break;
    }
  }

  /**
   * Populates entities from level data
   */
  public populateEntitiesFromLevelData(): void {
    // Create platform entities
    this.levelData.platforms.forEach((platformData) => {
      // Create actual platform instance using the Platform class
      const platform = new Platform(
        this.scene,
        platformData.x,
        platformData.y,
        3, // Fixed segment count
        `platform-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
        platformData.isVertical // Use the loaded isVertical value
      );

      // Disable physics collisions in editor mode
      if (platform.body) {
        (platform.body as MatterJS.BodyType).collisionFilter.group = -1;
      }

      this.entities.push({
        type: "platform",
        x: platformData.x,
        y: platformData.y,
        gameObject: platform,
        data: platformData,
      });
    });

    // Create enemy entities
    this.levelData.enemies.forEach((enemyData) => {
      let enemyInstance: EnemyLarge | EnemySmall;
      if (enemyData.type === "enemy-large") {
        enemyInstance = new EnemyLarge(this.scene, enemyData.x, enemyData.y);
      } else {
        enemyInstance = new EnemySmall(this.scene, enemyData.x, enemyData.y);
      }

      // Disable physics collisions in editor mode
      if (enemyInstance.body) {
        (enemyInstance.body as MatterJS.BodyType).collisionFilter.group = -1;
      }

      // Ensure it's interactive for selection
      enemyInstance.setInteractive();

      this.entities.push({
        type: enemyData.type, // Use the specific type from data
        x: enemyData.x,
        y: enemyData.y,
        gameObject: enemyInstance,
        data: enemyData,
      });
    });

    // Create barrel entities
    this.levelData.barrels.forEach((barrelData) => {
      const barrel = new Barrel(this.scene, barrelData.x, barrelData.y);

      // Disable physics collisions in editor mode
      if (barrel.body) {
        (barrel.body as MatterJS.BodyType).collisionFilter.group = -1;
      }

      // Ensure it's interactive for selection
      barrel.setInteractive();

      this.entities.push({
        type: "barrel",
        x: barrelData.x,
        y: barrelData.y,
        gameObject: barrel,
        data: barrelData,
      });
    });

    // Create crate entities
    this.levelData.crates.forEach((crateData) => {
      const crate = new Crate(
        this.scene,
        crateData.x,
        crateData.y,
        crateData.type
      );

      // Disable physics collisions in editor mode
      if (crate.body) {
        (crate.body as MatterJS.BodyType).collisionFilter.group = -1;
      }

      // Ensure it's interactive for selection
      crate.setInteractive();

      this.entities.push({
        type: `crate-${crateData.type}`,
        x: crateData.x,
        y: crateData.y,
        gameObject: crate,
        data: crateData,
      });
    });

    // Create finish line entity if it exists
    if (this.levelData.finishLine) {
      const finishLineData = this.levelData.finishLine;
      const finish = new Finish(this.scene, finishLineData.x, finishLineData.y);

      // Disable physics collisions in editor mode
      if (finish.body) {
        (finish.body as MatterJS.BodyType).collisionFilter.group = -1;
      }

      // Ensure it's interactive for selection
      finish.setInteractive();

      this.entities.push({
        type: "finish-line",
        x: finishLineData.x,
        y: finishLineData.y,
        gameObject: finish,
        data: finishLineData,
      });
    }
  }

  /**
   * Clears all entities
   */
  public clearEntities(): void {
    // Destroy all entity game objects
    this.entities.forEach((entity) => {
      entity.gameObject.destroy();
    });

    // Clear arrays
    this.entities = [];
    this.levelData = LevelDataManager.createEmpty();

    // Deselect any selected entity
    this.selectEntity(null);
  }

  /**
   * Gets the current level data
   */
  public getLevelData(): LevelData {
    return this.levelData;
  }

  /**
   * Sets the level data
   */
  public setLevelData(levelData: LevelData): void {
    this.levelData = levelData;
  }

  /**
   * Gets the selected entity
   */
  public getSelectedEntity(): EditorEntity | null {
    return this.selectedEntity;
  }

  /**
   * Sets the currently selected entity type from the palette
   */
  public setSelectedEntityType(type: string | null, config?: any): void {
    console.log(
      "EditorEntityManager.setSelectedEntityType called:",
      type,
      config
    );

    // Store platform configuration if provided
    if (type === "platform" && config) {
      console.log("Setting platform config:", config);
      this._platformConfig = { ...config };

      // If x and y coordinates are provided in the config, create the platform immediately
      if (config.x !== undefined && config.y !== undefined) {
        console.log("Creating platform at", config.x, config.y);

        // Create the platform
        const entity = this.placeEntity(type, config.x, config.y);

        // Update selection
        this.selectEntity(entity);

        // Clear the selected entity type since we've created the entity
        this.selectedEntityType = null;

        return;
      }
    }

    // Normal handling for other types
    this.selectedEntityType = type;

    // Clear any currently selected entity
    this.selectEntity(null);
  }

  /**
   * Immediately creates an entity of the specified type and attaches it to the cursor
   * for dragging until mouse up
   */
  public createAndDragEntity(type: string): void {
    // Get current mouse position
    const pointer = this.scene.input.activePointer;
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    // Create the entity at the current mouse position
    const entity = this.placeEntity(type, worldX, worldY);

    // If entity creation succeeded
    if (entity) {
      // Select this entity
      this.selectEntity(entity);

      // Start dragging immediately
      this.isEntityDragging = true;
      this.newEntityDragging = true;

      // No need to keep the selected entity type since we've already created it
      this.selectedEntityType = null;

      // Add a one-time pointerup event to complete the placement when the user releases the mouse
      const completeHandler = () => {
        if (this.isEntityDragging && this.selectedEntity) {
          // Update entity data to ensure all changes are saved
          this.updateEntityInLevelData(this.selectedEntity);

          // Reset dragging states
          this.isEntityDragging = false;
          this.newEntityDragging = false;

          // Clean up this one-time handler
          this.scene.input.off("pointerup", completeHandler);
        }
      };

      this.scene.input.once("pointerup", completeHandler);
    }
  }

  /**
   * Update an entity's position with proper tile snapping
   */
  private updateEntityPosition(
    entity: EditorEntity,
    x: number,
    y: number
  ): void {
    // Apply grid snapping
    const snappedX = Math.floor(x / TILE_WIDTH) * TILE_WIDTH + TILE_WIDTH / 2;
    const snappedY =
      Math.floor(y / TILE_HEIGHT) * TILE_HEIGHT + TILE_HEIGHT / 2;

    // Update the entity's stored position
    entity.x = snappedX;
    entity.y = snappedY;

    // Update the game object position based on its type
    if (entity.type === "platform") {
      (entity.gameObject as Platform).setPosition(snappedX, snappedY);
    } else if (entity.type === "enemy-large" || entity.type === "enemy-small") {
      (entity.gameObject as EnemyLarge | EnemySmall).setPosition(
        snappedX,
        snappedY
      );
    } else {
      (entity.gameObject as Phaser.GameObjects.Image).setPosition(
        snappedX,
        snappedY
      );
    }

    // Update the entity in the level data
    this.updateEntityInLevelData(entity);
  }

  /**
   * Removes an entity from the entities list and level data
   */
  public removeEntity(entity: EditorEntity): void {
    if (!entity) return;

    // First remove from the entity list
    const entityIndex = this.entities.findIndex((e) => e === entity);
    if (entityIndex >= 0) {
      // Remove from the array
      this.entities.splice(entityIndex, 1);
    }

    // Then remove from level data based on entity type
    switch (entity.type) {
      case "platform":
        const platformIndex = this.levelData.platforms.findIndex(
          (p) => p === entity.data
        );
        if (platformIndex >= 0) {
          this.levelData.platforms.splice(platformIndex, 1);
        }
        break;
      case "enemy-large":
      case "enemy-small":
        const enemyIndex = this.levelData.enemies.findIndex(
          (e) => e === entity.data
        );
        if (enemyIndex >= 0) {
          this.levelData.enemies.splice(enemyIndex, 1);
        }
        break;
      case "barrel":
        const barrelIndex = this.levelData.barrels.findIndex(
          (b) => b === entity.data
        );
        if (barrelIndex >= 0) {
          this.levelData.barrels.splice(barrelIndex, 1);
        }
        break;
      case "crate-small":
      case "crate-big":
        const crateIndex = this.levelData.crates.findIndex(
          (c) => c === entity.data
        );
        if (crateIndex >= 0) {
          this.levelData.crates.splice(crateIndex, 1);
        }
        break;
      case "finish-line":
        if (this.levelData.finishLine === entity.data) {
          this.levelData.finishLine = null;
        }
        break;
    }

    // Destroy the game object
    entity.gameObject.destroy();

    // If this was the selected entity, deselect it
    if (this.selectedEntity === entity) {
      this.selectedEntity = null;
    }
  }
}
