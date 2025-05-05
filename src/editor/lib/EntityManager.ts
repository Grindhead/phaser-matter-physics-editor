import { Scene } from "phaser";
import { EditorEntity } from "../ui/Inspector";
import { LevelData, LevelDataManager } from "./LevelData";
import { EditorEventBus } from "./EditorEventBus";
import { EditorEvents } from "./EditorEventTypes";
import { EntityCreator } from "./EntityCreator";
import { EntitySelector } from "./EntitySelector";
import { EntityDragHandler } from "./EntityDragHandler";
import { EntityUpdater } from "./EntityUpdater";
import { CameraPanManager } from "./CameraPanManager";
import { KeyboardManager } from "./KeyboardManager";

/**
 * Coordinates entity-related operations in the editor.
 * This is a facade that ties together specialized components.
 */
export class EntityManager {
  private scene: Scene;
  private eventBus: EditorEventBus;
  private entities: EditorEntity[] = [];
  private levelData: LevelData;
  private uiBounds?: Phaser.Geom.Rectangle;

  // Specialized components
  private creator: EntityCreator;
  private selector: EntitySelector;
  private updater: EntityUpdater;
  private dragHandler: EntityDragHandler;
  private cameraPanManager: CameraPanManager;
  private keyboardManager: KeyboardManager;

  // State tracking
  private selectedEntityType: string | null = null;

  constructor(scene: Scene) {
    this.scene = scene;

    // Initialize the event bus with the scene
    this.eventBus = EditorEventBus.getInstance();
    this.eventBus.initialize(this.scene);

    // Create an empty level data structure
    this.levelData = LevelDataManager.createEmpty();

    // Initialize specialized components
    this.creator = new EntityCreator(this.scene);
    this.updater = new EntityUpdater(this.scene, this.levelData);
    this.selector = new EntitySelector(this.scene);
    this.dragHandler = new EntityDragHandler(
      this.scene,
      this.selector,
      this.updater
    );
    this.cameraPanManager = new CameraPanManager(this.scene);
    this.keyboardManager = new KeyboardManager(this.scene);

    // Set up event listeners
    this.setupEventListeners();

    // Set up input handlers for placement
    this.setupInputHandlers();
  }

  /**
   * Sets up event listeners to coordinate between components
   */
  private setupEventListeners(): void {
    // Entity selection events - use both non-prefixed and prefixed events
    this.eventBus.on(
      EditorEvents.ENTITY_SELECT,
      this.handleEntityTypeSelection,
      this
    );
    this.eventBus.on(
      `EB_${EditorEvents.ENTITY_SELECT}`,
      this.handleEntityTypeSelection,
      this
    );
    this.eventBus.on(
      EditorEvents.ENTITY_SELECTED,
      this.handleEntitySelected,
      this
    );
    this.eventBus.on(
      `EB_${EditorEvents.ENTITY_SELECTED}`,
      this.handleEntitySelected,
      this
    );
    this.eventBus.on(
      EditorEvents.ENTITY_DESELECTED,
      this.handleEntityDeselected,
      this
    );
    this.eventBus.on(
      `EB_${EditorEvents.ENTITY_DESELECTED}`,
      this.handleEntityDeselected,
      this
    );

    // Entity manipulation events
    this.eventBus.on(EditorEvents.PLACE_ENTITY, this.handlePlaceEntity, this);
    this.eventBus.on(
      `EB_${EditorEvents.PLACE_ENTITY}`,
      this.handlePlaceEntity,
      this
    );
    this.eventBus.on(
      EditorEvents.PROPERTY_CHANGE,
      this.handlePropertyChange,
      this
    );
    this.eventBus.on(
      `EB_${EditorEvents.PROPERTY_CHANGE}`,
      this.handlePropertyChange,
      this
    );
    this.eventBus.on(EditorEvents.REMOVE_ENTITY, this.handleRemoveEntity, this);
    this.eventBus.on(
      `EB_${EditorEvents.REMOVE_ENTITY}`,
      this.handleRemoveEntity,
      this
    );

    // Level management events
    this.eventBus.on(EditorEvents.LEVEL_LOADED, this.handleLevelLoaded, this);
    this.eventBus.on(
      `EB_${EditorEvents.LEVEL_LOADED}`,
      this.handleLevelLoaded,
      this
    );
    this.eventBus.on(EditorEvents.LEVEL_CLEARED, this.handleLevelCleared, this);
    this.eventBus.on(
      `EB_${EditorEvents.LEVEL_CLEARED}`,
      this.handleLevelCleared,
      this
    );
  }

  /**
   * Sets up input handlers for entity placement
   */
  private setupInputHandlers(): void {
    // Set up pointer down handler for entity placement
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Only handle left clicks
      if (!pointer.leftButtonDown()) {
        console.log("EntityManager: Input handler - Not left click, skipping");
        return;
      }

      // Skip if over UI
      if (this.uiBounds && this.uiBounds.contains(pointer.x, pointer.y)) {
        console.log("EntityManager: Input handler - Over UI bounds, skipping");
        return;
      }

      // Skip if spacebar is held (for camera panning)
      const spaceKey = this.scene.input.keyboard?.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
      if (spaceKey && spaceKey.isDown) {
        console.log("EntityManager: Input handler - Space key held, skipping");
        return;
      }

      // Check if we're in placement mode
      const isPlacementModeActive = this.scene.registry.get(
        "isPlacementModeActive"
      );
      console.log(
        `EntityManager: Input handler - Placement mode active: ${isPlacementModeActive}, Selected type: ${this.selectedEntityType}`
      );

      if (!isPlacementModeActive || !this.selectedEntityType) {
        console.log(
          "EntityManager: Input handler - Not in placement mode or no type selected, skipping"
        );
        return;
      }

      console.log(
        `EntityManager: Placing entity of type ${this.selectedEntityType} at (${pointer.worldX}, ${pointer.worldY})`
      );

      try {
        // Place entity at world position
        const entity = this.placeEntity(
          this.selectedEntityType,
          pointer.worldX,
          pointer.worldY
        );

        if (entity) {
          console.log("EntityManager: Entity created successfully");

          // Emit entity placed event
          this.eventBus.emit(EditorEvents.ENTITY_PLACED, entity);

          // Exit placement mode after successful placement
          this.selectedEntityType = null;
          this.scene.registry.set("isPlacementModeActive", false);

          // Select the entity but don't start dragging automatically
          this.selector.selectEntity(entity);
        } else {
          console.log(
            `EntityManager: Failed to create entity of type ${this.selectedEntityType}`
          );
        }
      } catch (error) {
        console.error("Error placing entity:", error);
      }
    });
  }

  /**
   * Handles entity type selection from palette
   * @param type The type of entity selected
   * @param config Optional configuration for the entity
   */
  private handleEntityTypeSelection(type: string, config?: any): void {
    console.log(`EntityManager: Entity type selected: ${type}`);
    this.selectedEntityType = type;
    this.scene.registry.set("isPlacementModeActive", true);
    console.log(`EntityManager: Placement mode activated for ${type}`);

    // Deselect any current entity
    this.selector.selectEntity(null);
  }

  /**
   * Handles entity selection
   * @param entity The selected entity
   */
  private handleEntitySelected(entity: EditorEntity): void {
    // Store the selected entity in registry for other components
    this.scene.registry.set("selectedEntity", entity);

    // Reset placement mode
    this.selectedEntityType = null;
    this.scene.registry.set("isPlacementModeActive", false);
  }

  /**
   * Handles entity deselection
   */
  private handleEntityDeselected(): void {
    // Clear the selected entity from registry
    this.scene.registry.set("selectedEntity", null);
  }

  /**
   * Handles entity placement request
   * @param data Placement data with coordinates and entity type
   */
  private handlePlaceEntity(data: {
    type: string;
    x: number;
    y: number;
    config?: any;
  }): void {
    console.log(
      `EntityManager: handlePlaceEntity called for ${data.type} at (${data.x}, ${data.y})`
    );
    const { type, x, y, config } = data;

    try {
      // Create and place the entity
      const entity = this.placeEntity(type, x, y, config);

      if (entity) {
        console.log(`EntityManager: Entity placed successfully from UI drag`);

        // Emit entity placed event
        this.eventBus.emit(EditorEvents.ENTITY_PLACED, entity);

        // Select the entity
        this.selector.selectEntity(entity);

        // Exit placement mode
        this.selectedEntityType = null;
        this.scene.registry.set("isPlacementModeActive", false);
      } else {
        console.log(`EntityManager: Failed to place entity of type ${type}`);
      }
    } catch (error) {
      console.error("Error handling place entity:", error);
    }
  }

  /**
   * Places an entity in the editor
   * @param type The type of entity to place
   * @param x The x coordinate to place at
   * @param y The y coordinate to place at
   * @param config Optional configuration
   */
  public placeEntity(
    type: string,
    x: number,
    y: number,
    config?: any
  ): EditorEntity | null {
    console.log(`EntityManager.placeEntity: Creating ${type} at ${x},${y}`);

    // Create the entity
    const entity = this.creator.createEntity(type, x, y, config);

    if (!entity) {
      console.error(
        `EntityManager.placeEntity: Failed to create entity of type ${type}`
      );
      return null;
    }

    console.log(
      `EntityManager.placeEntity: Entity created: ${entity.type} at ${entity.x},${entity.y}`
    );

    // Add to entities list
    this.entities.push(entity);

    // Update the selector's entity list
    this.selector.setEntities(this.entities);

    // Update level data
    this.updater.updateEntityInLevelData(entity);

    // Send the entity to the EntityDisplayScene
    this.scene.events.emit(
      "ADD_ENTITY_TO_DISPLAY",
      entity.gameObject,
      entity.type
    );

    return entity;
  }

  /**
   * Handles property change requests
   * @param entity The entity to update
   * @param property The property name
   * @param value The new value
   */
  private handlePropertyChange(
    entity: EditorEntity,
    property: string,
    value: any
  ): void {
    this.updater.updateEntityProperty(entity, property, value);
  }

  /**
   * Handles entity removal
   * @param entity The entity to remove
   */
  private handleRemoveEntity(entity: EditorEntity): void {
    this.removeEntity(entity);
  }

  /**
   * Removes an entity from the editor
   * @param entity The entity to remove
   */
  public removeEntity(entity: EditorEntity): void {
    if (!entity || !entity.gameObject) return;

    // Remove from entities array
    const index = this.entities.findIndex((e) => e === entity);
    if (index >= 0) {
      this.entities.splice(index, 1);

      // Update selector's entity list
      this.selector.setEntities(this.entities);

      // Remove from level data based on type
      this.removeEntityFromLevelData(entity);

      // Destroy the game object
      const gameObject = entity.gameObject as Phaser.GameObjects.GameObject;
      gameObject.destroy();

      // Emit entity removed event with entity instance instead of id
      this.eventBus.emit(EditorEvents.ENTITY_REMOVED, entity);
    }
  }

  /**
   * Removes an entity from level data
   * @param entity The entity to remove
   */
  private removeEntityFromLevelData(entity: EditorEntity): void {
    if (!entity) return;

    // Use entity reference equality for filtering instead of id
    switch (entity.type) {
      case "platform":
        this.levelData.platforms = this.levelData.platforms.filter(
          (p) => !this.isEntityMatchingData(entity, p)
        );
        break;
      case "enemy-large":
      case "enemy-small":
        this.levelData.enemies = this.levelData.enemies.filter(
          (e) => !this.isEntityMatchingData(entity, e)
        );
        break;
      case "barrel":
        this.levelData.barrels = this.levelData.barrels.filter(
          (b) => !this.isEntityMatchingData(entity, b)
        );
        break;
      case "finish-line":
        this.levelData.finishLine = null;
        break;
      case "crate-small":
      case "crate-big":
        this.levelData.crates = this.levelData.crates.filter(
          (c) => !this.isEntityMatchingData(entity, c)
        );
        break;
    }
  }

  /**
   * Helper to match entity with data object by position
   * @param entity Editor entity
   * @param data Data object with x,y coordinates
   */
  private isEntityMatchingData(entity: EditorEntity, data: any): boolean {
    // Match by position as a simple way to identify the same entity
    return entity.x === data.x && entity.y === data.y;
  }

  /**
   * Handles level loading
   * @param levelData The level data to load
   */
  private handleLevelLoaded(levelData: LevelData): void {
    // Clear existing entities
    this.clearEntities();

    // Set the new level data
    this.levelData = levelData;
    this.updater.setLevelData(levelData);

    // Create entities from level data
    this.populateEntitiesFromLevelData();
  }

  /**
   * Handles level clearing
   */
  private handleLevelCleared(): void {
    this.clearEntities();
    this.levelData = LevelDataManager.createEmpty();
    this.updater.setLevelData(this.levelData);
  }

  /**
   * Clears all entities from the editor
   */
  public clearEntities(): void {
    // Deselect current entity
    this.selector.selectEntity(null);

    // Destroy all game objects
    this.entities.forEach((entity) => {
      if (entity.gameObject) {
        (entity.gameObject as Phaser.GameObjects.GameObject).destroy();
      }
    });

    // Clear entities array
    this.entities = [];

    // Update selector
    this.selector.setEntities(this.entities);
  }

  /**
   * Populates entities from level data
   */
  private populateEntitiesFromLevelData(): void {
    // Create platforms
    this.levelData.platforms.forEach((platform) => {
      const entity = this.creator.createEntity(
        "platform",
        platform.x,
        platform.y,
        {
          segmentCount: platform.segmentCount,
          isVertical: platform.isVertical,
        }
      );

      if (entity) this.entities.push(entity);
    });

    // Create enemies
    this.levelData.enemies.forEach((enemy) => {
      // Check if type exists and use a direct string match
      const entityType = enemy.type?.includes("large")
        ? "enemy-large"
        : "enemy-small";
      const entity = this.creator.createEntity(entityType, enemy.x, enemy.y);

      if (entity) this.entities.push(entity);
    });

    // Create barrels
    this.levelData.barrels.forEach((barrel) => {
      const entity = this.creator.createEntity("barrel", barrel.x, barrel.y);

      if (entity) this.entities.push(entity);
    });

    // Create crates
    this.levelData.crates.forEach((crate) => {
      const entityType = `crate-${crate.type || "small"}`;
      const entity = this.creator.createEntity(entityType, crate.x, crate.y);

      if (entity) this.entities.push(entity);
    });

    // Create finish line if exists
    if (this.levelData.finishLine) {
      const finishLine = this.levelData.finishLine;
      const entity = this.creator.createEntity(
        "finish-line",
        finishLine.x,
        finishLine.y
      );

      if (entity) this.entities.push(entity);
    }

    // Update selector with entities
    this.selector.setEntities(this.entities);
  }

  /**
   * Sets UI bounds to avoid interaction in UI areas
   * @param bounds Rectangle defining UI bounds
   */
  public setUIBounds(bounds: Phaser.Geom.Rectangle): void {
    this.uiBounds = bounds;
    this.selector.setUIBounds(bounds);
    this.dragHandler.setUIBounds(bounds);
    this.cameraPanManager.setUIBounds(bounds);
  }

  /**
   * Gets the current level data
   */
  public getLevelData(): LevelData {
    return this.levelData;
  }

  /**
   * Gets the currently selected entity
   */
  public getSelectedEntity(): EditorEntity | null {
    return this.selector.getSelectedEntity();
  }

  /**
   * Sets the selected entity type for placement
   * @param type Entity type or null to cancel
   * @param config Optional configuration
   */
  public setSelectedEntityType(type: string | null, config?: any): void {
    this.selectedEntityType = type;

    if (type) {
      this.scene.registry.set("isPlacementModeActive", true);
    } else {
      this.scene.registry.set("isPlacementModeActive", false);
    }
  }

  /**
   * Clears the palette selection
   */
  public clearPaletteSelection(): void {
    this.selectedEntityType = null;
    this.scene.registry.set("isPlacementModeActive", false);
    // Use a string constant directly instead of accessing a missing property
    this.eventBus.emit("PALETTE_SELECTION_CLEARED");
  }

  /**
   * Clean up all components and resources
   */
  public destroy(): void {
    // Clean up all event listeners - need to remove both prefixed and non-prefixed
    this.eventBus.off(
      EditorEvents.ENTITY_SELECT,
      this.handleEntityTypeSelection,
      this
    );
    this.eventBus.off(
      `EB_${EditorEvents.ENTITY_SELECT}`,
      this.handleEntityTypeSelection,
      this
    );

    this.eventBus.off(
      EditorEvents.ENTITY_SELECTED,
      this.handleEntitySelected,
      this
    );
    this.eventBus.off(
      `EB_${EditorEvents.ENTITY_SELECTED}`,
      this.handleEntitySelected,
      this
    );

    this.eventBus.off(
      EditorEvents.ENTITY_DESELECTED,
      this.handleEntityDeselected,
      this
    );
    this.eventBus.off(
      `EB_${EditorEvents.ENTITY_DESELECTED}`,
      this.handleEntityDeselected,
      this
    );

    this.eventBus.off(EditorEvents.PLACE_ENTITY, this.handlePlaceEntity, this);
    this.eventBus.off(
      `EB_${EditorEvents.PLACE_ENTITY}`,
      this.handlePlaceEntity,
      this
    );

    this.eventBus.off(
      EditorEvents.PROPERTY_CHANGE,
      this.handlePropertyChange,
      this
    );
    this.eventBus.off(
      `EB_${EditorEvents.PROPERTY_CHANGE}`,
      this.handlePropertyChange,
      this
    );

    this.eventBus.off(
      EditorEvents.REMOVE_ENTITY,
      this.handleRemoveEntity,
      this
    );
    this.eventBus.off(
      `EB_${EditorEvents.REMOVE_ENTITY}`,
      this.handleRemoveEntity,
      this
    );

    this.eventBus.off(EditorEvents.LEVEL_LOADED, this.handleLevelLoaded, this);
    this.eventBus.off(
      `EB_${EditorEvents.LEVEL_LOADED}`,
      this.handleLevelLoaded,
      this
    );

    this.eventBus.off(
      EditorEvents.LEVEL_CLEARED,
      this.handleLevelCleared,
      this
    );
    this.eventBus.off(
      `EB_${EditorEvents.LEVEL_CLEARED}`,
      this.handleLevelCleared,
      this
    );

    // Destroy all entities
    this.clearEntities();

    // Destroy all components
    this.dragHandler.destroy();
    this.cameraPanManager.destroy();
    this.keyboardManager.destroy();
  }
}
