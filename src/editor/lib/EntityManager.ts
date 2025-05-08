console.log("%%%%%%% EntityManager.ts FILE LOADED - VERSION Y %%%%%%%");

import { Scene } from "phaser";
import { TILE_WIDTH, TILE_HEIGHT } from "../../lib/constants"; // Ensure constants are imported
import { EditorEntity } from "../ui/Inspector";
import { LevelData, LevelDataManager } from "./LevelData";
import { EditorEventBus } from "./EditorEventBus";
import { EditorEvents } from "./EditorEventTypes";
import { EntityCreator } from "./EntityCreator";
import { EntitySelector } from "./EntitySelector";
import { EntityDragHandler } from "./EntityDragHandler";
import { EntityUpdater } from "./EntityUpdater";
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
  private keyboardManager: KeyboardManager;

  // State tracking
  private selectedEntityType: string | null = null;
  private placementConfig: any = null;
  private placementPreview: EditorEntity | null = null;

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
    // Set up pointer down handler for entity placement AND selection triggering
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      console.log("%%%%% ENTITY MANAGER POINTER DOWN LISTENER FIRED %%%%%");
      try {
        // --- UNCOMMENTING LOGIC BELOW ---
        // /* // Remove start comment
        // Only handle left clicks
        if (!pointer.leftButtonDown()) {
          // console.log("EntityManager: Input handler - Not left click, skipping"); // Can be noisy
          return;
        }

        // Skip if over UI
        if (this.uiBounds && this.uiBounds.contains(pointer.x, pointer.y)) {
          // console.log("EntityManager: Input handler - Over UI bounds, skipping"); // Can be noisy
          return;
        }

        // Check if placement mode is active
        const isPlacementModeActive = this.scene.registry.get(
          "isPlacementModeActive"
        );
        console.log(
          `[handleCanvasClick] Checking placement mode. isPlacementModeActive = ${isPlacementModeActive}, selectedEntityType = ${this.selectedEntityType}`
        );

        if (isPlacementModeActive && this.selectedEntityType) {
          // --- PLACEMENT LOGIC ---
          // console.log( // REMOVE
          //  `EntityManager: Input handler - In Placement Mode for ${this.selectedEntityType}. Config:`,
          //  this.placementConfig
          // );

          // Skip if spacebar is held (for camera panning)
          const spaceKey = this.scene.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
          );
          if (spaceKey && spaceKey.isDown) {
            // console.log(
            //   "EntityManager: Input handler - Space key held, skipping placement"
            // );
            return;
          }

          // console.log(
          //   `EntityManager: Placing entity of type ${this.selectedEntityType} at (${pointer.worldX}, ${pointer.worldY})`
          // );

          try {
            // Place entity at world position
            const entity = this.placeEntity(
              this.selectedEntityType,
              pointer.worldX,
              pointer.worldY,
              this.placementConfig // Pass stored config
            );

            if (entity) {
              // console.log("EntityManager: Entity created successfully via canvas click");
              this.eventBus.emit(EditorEvents.ENTITY_PLACED, entity);
              this.selectedEntityType = null;
              console.log(
                `[EntityManager] Setting isPlacementModeActive: false (in handleCanvasClick placement success)`
              ); // Log BEFORE
              this.scene.registry.set("isPlacementModeActive", false);
              console.log(
                `   New registry value: ${this.scene.registry.get(
                  "isPlacementModeActive"
                )}`
              ); // Log AFTER
              this.placementConfig = null;
              this.destroyPlacementPreview(); // ADDED: Destroy preview on successful placement

              // Deselect after placement (instead of selecting the new one)
              this.selector.selectEntity(null);
            } else {
              // console.log(`EntityManager: Failed to create entity ...`);
            }
          } catch (error) {
            console.error("Error during placeEntity call:", error);
            this.destroyPlacementPreview(); // Destroy preview even on error
          }
          // --- END PLACEMENT LOGIC ---
        } else {
          // --- SELECTION LOGIC ---
          console.log(
            "[ENTITY MANAGER] Click occurred while NOT in placement mode. Attempting selection."
          );
          this.destroyPlacementPreview(); // ADDED: Destroy preview if clicking while not placing
          this.selector.handleSelectionClick(pointer); // Call the selector's handler
        }
        // */ // Remove end comment
      } catch (error) {
        console.error(
          "%%%%% ERROR IN ENTITY MANAGER POINTER DOWN HANDLER %%%%%",
          error
        );
      }
    });
  }

  /**
   * Handles entity type selection from palette
   * @param type The type of entity selected
   * @param config Optional configuration for the entity
   */
  private handleEntityTypeSelection(type: string, config?: any): void {
    // console.log(`EntityManager: Entity type selected: ${type} with config:`, config); // REMOVE
    this.selectedEntityType = type;
    this.placementConfig = config; // Store the config
    console.log(
      `[EntityManager] Setting isPlacementModeActive: true (in handleEntityTypeSelection)`
    ); // Log BEFORE
    this.scene.registry.set("isPlacementModeActive", true);
    console.log(
      `   New registry value: ${this.scene.registry.get(
        "isPlacementModeActive"
      )}`
    ); // Log AFTER

    // Create preview if applicable (e.g., for platform)
    this.createPlacementPreview(type, config);

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

    // Reset placement mode and config
    this.selectedEntityType = null;
    this.placementConfig = null;
    console.log(
      `[EntityManager] Setting isPlacementModeActive: false (in handleEntitySelected)`
    ); // Log BEFORE
    this.scene.registry.set("isPlacementModeActive", false);
    console.log(
      `   New registry value: ${this.scene.registry.get(
        "isPlacementModeActive"
      )}`
    ); // Log AFTER
    this.destroyPlacementPreview();
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
    // console.log(
    //   `EntityManager: handlePlaceEntity called for ${data.type} at (${data.x}, ${data.y})`
    // );
    const { type, x, y, config } = data;

    try {
      // Create and place the entity
      const entity = this.placeEntity(type, x, y, config);

      if (entity) {
        // console.log(`EntityManager: Entity placed successfully from UI drag`);

        // Emit entity placed event
        this.eventBus.emit(EditorEvents.ENTITY_PLACED, entity);

        // Select the entity
        this.selector.selectEntity(entity);

        // Exit placement mode
        this.selectedEntityType = null;
        this.scene.registry.set("isPlacementModeActive", false);
      } else {
        // console.log(`EntityManager: Failed to place entity of type ${type}`);
      }
    } catch (error) {
      // console.error("Error handling place entity:", error);
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
    // console.log(`EntityManager.placeEntity: Creating ${type} at ${x},${y}`);

    // Create the entity
    const entity = this.creator.createEntity(type, x, y, config);

    if (!entity) {
      // console.error(
      //   `EntityManager.placeEntity: Failed to create entity of type ${type}`
      // );
      return null;
    }

    // console.log(
    //   `EntityManager.placeEntity: Entity created: ${entity.type} at ${entity.x},${entity.y}`
    // );

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
    console.log("EntityManager: Level loaded event received.", levelData);

    // Protective check: If levelData is null or undefined, treat as a clear/empty level.
    if (!levelData) {
      console.warn(
        "EntityManager: handleLevelLoaded received null or undefined levelData. Clearing entities and using empty level."
      );
      this.clearEntities();
      this.levelData = LevelDataManager.createEmpty(); // Ensure a valid empty state
      this.updater.setLevelData(this.levelData);
      this.populateEntitiesFromLevelData(); // This should now be safe with empty data
      return;
    }

    this.clearEntities(); // Clears existing entities
    this.levelData = levelData; // Assigns the new level data
    this.updater.setLevelData(this.levelData); // Update for the updater component
    this.populateEntitiesFromLevelData(); // Populate entities from the new data
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
    console.log(
      "%%%%%%% HELLO FROM INSIDE POPULATE ENTITIES - VERSION X %%%%%%%"
    ); // For tracking

    // Ensure levelData itself exists
    if (!this.levelData) {
      console.warn(
        "POPULATE: this.levelData is undefined or null. Skipping population."
      );
      return;
    }
    try {
      console.log(
        "POPULATE: this.levelData IS defined. Value:",
        JSON.stringify(this.levelData)
      );
    } catch (e) {
      console.warn(
        "POPULATE: Could not stringify this.levelData. It might be circular or very complex.",
        this.levelData
      );
    }

    // Create platforms
    console.log(
      "POPULATE: Checking this.levelData.platforms. Value:",
      this.levelData.platforms
    );
    console.log(
      "POPULATE: Result of Array.isArray(this.levelData.platforms):",
      Array.isArray(this.levelData.platforms)
    );

    const platforms = Array.isArray(this.levelData.platforms)
      ? this.levelData.platforms
      : [];
    console.log(
      "POPULATE: 'platforms' local variable assigned. Value:",
      platforms
    );
    console.log(
      "POPULATE: typeof 'platforms' local variable:",
      typeof platforms
    );

    if (typeof platforms.forEach !== "function") {
      console.error(
        "POPULATE: CRITICAL! 'platforms' variable does not have a forEach method. Value:",
        platforms
      );
      return; // Avoid the TypeError
    }

    platforms.forEach((platform) => {
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
    const enemies = Array.isArray(this.levelData.enemies)
      ? this.levelData.enemies
      : [];
    enemies.forEach((enemy) => {
      // Check if type exists and use a direct string match
      const entityType = enemy.type?.includes("large")
        ? "enemy-large"
        : "enemy-small";
      const entity = this.creator.createEntity(entityType, enemy.x, enemy.y);

      if (entity) this.entities.push(entity);
    });

    // Create barrels
    const barrels = Array.isArray(this.levelData.barrels)
      ? this.levelData.barrels
      : [];
    barrels.forEach((barrel) => {
      const entity = this.creator.createEntity("barrel", barrel.x, barrel.y);

      if (entity) this.entities.push(entity);
    });

    // Create crates
    const crates = Array.isArray(this.levelData.crates)
      ? this.levelData.crates
      : [];
    crates.forEach((crate) => {
      const entityType = `crate-${crate.type || "small"}`;
      const entity = this.creator.createEntity(entityType, crate.x, crate.y);

      if (entity) this.entities.push(entity);
    });

    // Create finish line if exists and is an object
    if (
      this.levelData.finishLine &&
      typeof this.levelData.finishLine === "object"
    ) {
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
    const newState = !!type; // true if type is truthy, false otherwise
    console.log(
      `[EntityManager] Setting isPlacementModeActive: ${newState} (in setSelectedEntityType)`
    ); // Log BEFORE
    this.scene.registry.set("isPlacementModeActive", newState);
    console.log(
      `   New registry value: ${this.scene.registry.get(
        "isPlacementModeActive"
      )}`
    ); // Log AFTER

    // Potentially create/destroy preview based on type being set/unset
    if (newState) {
      this.placementConfig = config; // Assume config is passed if type is set
      this.createPlacementPreview(type!, config); // type asserted as non-null due to newState check
    } else {
      this.placementConfig = null;
      this.destroyPlacementPreview();
    }
  }

  /**
   * Clears the palette selection
   */
  public clearPaletteSelection(): void {
    console.log("[EntityManager] clearPaletteSelection called"); // Log entry
    this.selectedEntityType = null;
    this.placementConfig = null;
    console.log(
      `[EntityManager] Setting isPlacementModeActive: false (in clearPaletteSelection)`
    ); // Log BEFORE
    this.scene.registry.set("isPlacementModeActive", false);
    console.log(
      `   New registry value: ${this.scene.registry.get(
        "isPlacementModeActive"
      )}`
    ); // Log AFTER
    this.destroyPlacementPreview();
    this.eventBus.emit("PALETTE_SELECTION_CLEARED");
  }

  // --- NEW PREVIEW METHODS ---

  public updatePreviewPosition(worldX: number, worldY: number): void {
    if (!this.placementPreview) {
      if (this.selectedEntityType) {
        this.createPlacementPreview(
          this.selectedEntityType,
          this.placementConfig
        );
      } else {
        console.warn(
          "EntityManager.updatePreviewPosition: No selectedEntityType to create preview for."
        );
        return;
      }
    }

    if (this.placementPreview && this.placementPreview.gameObject) {
      // Snap to grid
      const snappedX =
        Math.floor(worldX / TILE_WIDTH) * TILE_WIDTH + TILE_WIDTH / 2;
      const snappedY =
        Math.floor(worldY / TILE_HEIGHT) * TILE_HEIGHT + TILE_HEIGHT / 2;

      (this.placementPreview.gameObject as any).setPosition(snappedX, snappedY);
      // Ensure it's visible if it was hidden
      if (!(this.placementPreview.gameObject as any).visible) {
        (this.placementPreview.gameObject as any).setVisible(true);
      }
    }
  }

  public destroyPlacementPreview(): void {
    if (this.placementPreview && this.placementPreview.gameObject) {
      (this.placementPreview.gameObject as any).destroy();
      this.placementPreview = null;
      // console.log("EntityManager: Placement preview destroyed."); // Can be noisy
    }
  }

  private createPlacementPreview(type: string, config?: any): void {
    if (this.placementPreview && this.placementPreview.gameObject) {
      (this.placementPreview.gameObject as any).destroy();
      this.placementPreview = null;
    }

    const previewEntity = this.creator.createEntity(type, 0, 0, config);

    if (previewEntity && previewEntity.gameObject) {
      this.placementPreview = previewEntity;
      // Make the preview semi-transparent and ensure it's on top
      (this.placementPreview.gameObject as any).setAlpha(0.7);
      (this.placementPreview.gameObject as any).setDepth(1001); // Ensure preview is on top
      (this.placementPreview.gameObject as any).setVisible(false); // Initially hidden

      // For physics bodies, disable them in the preview state
      if ((this.placementPreview.gameObject as any).body) {
        const body = (this.placementPreview.gameObject as any)
          .body as MatterJS.BodyType;
        body.isSensor = true;
        body.isStatic = true; // Make it static so it's not affected by gravity/forces
      }

      // console.log(
      //   `EntityManager: Created actual entity preview for ${type}.`
      // );
    } else {
      console.error(
        `EntityManager.createPlacementPreview: Failed to create preview entity for type: ${type}`
      );
    }
  }

  // --- END NEW PREVIEW METHODS ---

  /**
   * Clean up all components and resources
   */
  public destroy(): void {
    // Remove event listeners
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

    // Clean up components
    if (this.selector && typeof this.selector.destroy === "function") {
      this.selector.destroy();
    }
    if (this.dragHandler && typeof this.dragHandler.destroy === "function") {
      this.dragHandler.destroy();
    }
    if (
      this.keyboardManager &&
      typeof this.keyboardManager.destroy === "function"
    ) {
      this.keyboardManager.destroy();
    }

    // Clear entities array
    this.entities = [];

    // Destroy placement preview if it exists
    this.destroyPlacementPreview();

    // Unregister input handlers
    // Note: The original callback for pointerdown in setupInputHandlers is an anonymous function.
    // To correctly 'off' it, we'd need a reference to that exact function.
    // This might be a pre-existing issue or handled differently (e.g. scene shutdown handles it).
    // For now, attempting to remove with the method name might not work if the original registration used an arrow function directly.
    // this.scene.input.off("pointerdown", this.setupInputHandlers, this); // This line was commented out in a previous version, keeping it commented.

    console.log("EntityManager destroyed");
  }
}
