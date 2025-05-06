import { Scene } from "phaser";
import { EditorEntity } from "../../ui/Inspector";
import { EditorEventBus } from "../EditorEventBus";
import { EditorEvents } from "../EditorEventTypes";
import { EntityCreator } from "./EntityCreator";
import { EntitySelector } from "./EntitySelector";
import { EntityDragHandler } from "./EntityDragHandler";
import { EntityUpdater } from "./EntityUpdater";
import { LevelData } from "../LevelData";
import { EntityDisplayIntegration } from "./EntityDisplayIntegration";

/**
 * Core entity manager that coordinates all entity-related operations
 */
export class EntityManager {
  private scene: Scene;
  private eventBus: EditorEventBus;
  private entities: EditorEntity[] = [];
  private selectedEntityType: string | null = null;
  private entityConfig: any = null;

  // Component managers
  private creator: EntityCreator;
  private selector: EntitySelector;
  private dragHandler: EntityDragHandler;
  private updater: EntityUpdater;
  private displayIntegration: EntityDisplayIntegration;

  constructor(scene: Scene) {
    this.scene = scene;
    this.eventBus = EditorEventBus.getInstance(scene);

    // Initialize component managers
    this.creator = new EntityCreator(scene);
    this.selector = new EntitySelector(scene);
    this.dragHandler = new EntityDragHandler(scene);
    this.updater = new EntityUpdater(scene);
    this.displayIntegration = new EntityDisplayIntegration(scene);

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Entity selection type
    this.eventBus.on(
      EditorEvents.ENTITY_SELECT,
      this.setSelectedEntityType,
      this
    );

    // Entity placement
    this.eventBus.on(EditorEvents.PLACE_ENTITY, this.handlePlaceEntity, this);

    // Entity removal
    this.eventBus.on(EditorEvents.REMOVE_ENTITY, this.removeEntity, this);

    // Level management
    this.eventBus.on(EditorEvents.LEVEL_CLEARED, this.clearEntities, this);

    // Setup input handlers
    this.setupInputHandlers();
  }

  /**
   * Setup input handlers for entity selection
   */
  private setupInputHandlers(): void {
    // Handle click/tap for entity selection or placement
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Skip if not left-click
      if (!pointer.leftButtonDown()) return;

      // Skip if camera is panning or entity is being dragged
      if (
        this.scene.registry.get("isCameraPanning") ||
        this.scene.registry.get("isDraggingEntity")
      )
        return;

      // Skip if pointer is over UI
      const uiBounds = this.scene.registry.get(
        "uiBounds"
      ) as Phaser.Geom.Rectangle;
      if (uiBounds && uiBounds.contains(pointer.x, pointer.y)) return;

      // Get world position (accounting for camera)
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      // Check if we're in placement mode
      if (this.selectedEntityType) {
        // Place entity at the world position
        const entity = this.placeEntity(
          this.selectedEntityType,
          worldX,
          worldY,
          this.entityConfig
        );
        if (entity) {
          // Add to display - this will emit the entity placed event
          this.displayIntegration.addEntityToDisplay(entity);

          // Emit entity placed event
          this.eventBus.entityPlaced(entity);

          // Clear selected entity type
          this.setSelectedEntityType(null);
        }
      } else {
        // Try to select an entity at this position
        const entity = this.selector.getEntityAtPosition(
          this.entities,
          worldX,
          worldY
        );
        if (entity) {
          // Emit entity selected event
          this.eventBus.entitySelected(entity);
        } else {
          // Deselect current entity
          this.eventBus.entityDeselected();
        }
      }
    });
  }

  /**
   * Set the currently selected entity type
   */
  public setSelectedEntityType(type: string | null, config?: any): void {
    this.selectedEntityType = type;
    this.entityConfig = config || null;

    // Update registry
    this.scene.registry.set("isPlacementModeActive", !!type);

    // If entity type is cleared, deselect current entity
    if (!type) {
      this.eventBus.entityDeselected();
    }
  }

  /**
   * Handle place entity event
   */
  private handlePlaceEntity(data: {
    type: string;
    x: number;
    y: number;
    config?: any;
  }): void {
    const { type, x, y, config } = data;

    // Place the entity
    const entity = this.placeEntity(type, x, y, config);
    if (entity) {
      // Add to display
      this.displayIntegration.addEntityToDisplay(entity);

      // Emit entity placed event
      this.eventBus.entityPlaced(entity);
    }
  }

  /**
   * Place an entity at the specified position
   */
  public placeEntity(
    type: string,
    x: number,
    y: number,
    config?: any
  ): EditorEntity | null {
    // Create entity using creator component
    const entity = this.creator.createEntity(type, x, y, config);
    if (!entity) return null;

    // Explicitly add the entity to the display scene
    this.scene.events.emit(
      "ADD_ENTITY_TO_DISPLAY",
      entity.gameObject,
      entity.type
    );

    // Add to entities list
    this.entities.push(entity);

    // Return the created entity
    return entity;
  }

  /**
   * Remove an entity
   */
  public removeEntity(entity: EditorEntity): void {
    // Find index of entity
    const index = this.entities.findIndex((e) => e === entity);
    if (index === -1) return;

    // Remove from entities list
    this.entities.splice(index, 1);

    // Destroy game object
    const gameObject = entity.gameObject;
    if (gameObject && "destroy" in gameObject) {
      (gameObject as any).destroy();
    }

    // If this was the selected entity, deselect it
    if (this.selector.getSelectedEntity() === entity) {
      this.eventBus.entityDeselected();
    }

    // Emit entity removed event
    this.eventBus.entityRemoved(entity.type, this.getEntityId(entity));
  }

  /**
   * Get a unique identifier for an entity
   */
  private getEntityId(entity: EditorEntity): string {
    // Try to get ID from data if it exists
    if (entity.data && "id" in entity.data) {
      return (entity.data as any).id;
    }

    // Fallback to type and position
    return `${entity.type}-${entity.x}-${entity.y}`;
  }

  /**
   * Clear all entities
   */
  public clearEntities(): void {
    // Destroy all game objects
    for (const entity of this.entities) {
      const gameObject = entity.gameObject;
      if (gameObject && "destroy" in gameObject) {
        (gameObject as any).destroy();
      }
    }

    // Clear entities list
    this.entities = [];

    // Deselect current entity
    this.eventBus.entityDeselected();
  }

  /**
   * Get entity list
   */
  public getEntities(): EditorEntity[] {
    return this.entities;
  }

  /**
   * Get entities of a specific type
   */
  public getEntitiesByType(type: string): EditorEntity[] {
    return this.entities.filter((entity) => entity.type === type);
  }

  /**
   * Get entity by ID
   */
  public getEntityById(id: string): EditorEntity | undefined {
    return this.entities.find(
      (entity) =>
        entity.data && "id" in entity.data && (entity.data as any).id === id
    );
  }

  /**
   * Convert entities to level data format
   */
  public toLevelData(): any {
    // Create output structure
    const platforms: any[] = [];
    const enemies: any[] = [];
    const barrels: any[] = [];
    const crates: any[] = [];
    let finishLine: any = null;

    // Process each entity
    for (const entity of this.entities) {
      const { type, x, y, data } = entity;

      switch (type) {
        case "platform":
          platforms.push({
            x,
            y,
            segmentCount: (data as any).segmentCount || 3,
            isVertical: !!(data as any).isVertical,
          });
          break;
        case "enemy-large":
          enemies.push({
            x,
            y,
            type: "enemy-large",
          });
          break;
        case "enemy-small":
          enemies.push({
            x,
            y,
            type: "enemy-small",
          });
          break;
        case "barrel":
          barrels.push({
            x,
            y,
          });
          break;
        case "crate-small":
          crates.push({
            x,
            y,
            type: "small",
          });
          break;
        case "crate-big":
          crates.push({
            x,
            y,
            type: "big",
          });
          break;
        case "finish-line":
          finishLine = {
            x,
            y,
          };
          break;
      }
    }

    // Return level data structure
    return {
      platforms,
      enemies,
      barrels,
      crates,
      finishLine,
    };
  }

  /**
   * Populate entities from level data
   */
  public fromLevelData(levelData: any): void {
    // Clear existing entities
    this.clearEntities();

    // Create platforms
    if (levelData.platforms && Array.isArray(levelData.platforms)) {
      for (const platform of levelData.platforms) {
        this.placeEntity("platform", platform.x, platform.y, {
          segmentCount: platform.segmentCount,
          isVertical: platform.isVertical,
        });
      }
    }

    // Create enemies
    if (levelData.enemies && Array.isArray(levelData.enemies)) {
      for (const enemy of levelData.enemies) {
        const type =
          enemy.type === "enemy-large" ? "enemy-large" : "enemy-small";
        this.placeEntity(type, enemy.x, enemy.y);
      }
    }

    // Create barrels
    if (levelData.barrels && Array.isArray(levelData.barrels)) {
      for (const barrel of levelData.barrels) {
        this.placeEntity("barrel", barrel.x, barrel.y);
      }
    }

    // Create crates
    if (levelData.crates && Array.isArray(levelData.crates)) {
      for (const crate of levelData.crates) {
        const type = crate.type === "big" ? "crate-big" : "crate-small";
        this.placeEntity(type, crate.x, crate.y);
      }
    }

    // Create finish line
    if (levelData.finishLine) {
      this.placeEntity(
        "finish-line",
        levelData.finishLine.x,
        levelData.finishLine.y
      );
    }
  }

  /**
   * Clean up resources when no longer needed
   */
  public destroy(): void {
    // Destroy component managers
    this.selector.destroy();
    this.dragHandler.destroy();
    this.updater.destroy();

    // Clean up input handlers
    this.scene.input.off("pointerdown");

    // Clean up event listeners
    this.eventBus.off(
      EditorEvents.ENTITY_SELECT,
      this.setSelectedEntityType,
      this
    );
    this.eventBus.off(EditorEvents.PLACE_ENTITY, this.handlePlaceEntity, this);
    this.eventBus.off(EditorEvents.REMOVE_ENTITY, this.removeEntity, this);
    this.eventBus.off(EditorEvents.LEVEL_CLEARED, this.clearEntities, this);

    // Clear entities
    this.clearEntities();
  }
}
