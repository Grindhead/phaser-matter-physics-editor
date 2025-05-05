import { Scene } from "phaser";
import { EditorEntity } from "../ui/Inspector";
import { EditorEventBus } from "./EditorEventBus";
import { EditorEvents } from "./EditorEventTypes";
import { TILE_WIDTH, TILE_HEIGHT } from "../../lib/constants";

/**
 * Responsible for entity selection and highlighting in the editor
 */
export class EntitySelector {
  private scene: Scene;
  private eventBus: EditorEventBus;
  private selectedEntity: EditorEntity | null = null;
  private selectionHighlight: Phaser.GameObjects.Rectangle | null = null;
  private entities: EditorEntity[] = [];
  private uiBounds?: Phaser.Geom.Rectangle;
  private readonly HIGHLIGHT_TINT: number = 0x44aaff; // Blue highlight tint
  private isDeselecting: boolean = false; // Flag to prevent recursive deselection

  constructor(scene: Scene) {
    this.scene = scene;
    this.eventBus = EditorEventBus.getInstance();

    // Create invisible selection highlight (no fill, no stroke)
    this.selectionHighlight = this.scene.add.rectangle(
      0,
      0,
      TILE_WIDTH,
      TILE_HEIGHT,
      0xffffff,
      0 // No fill
    );
    // Don't set stroke style to make it completely invisible
    this.selectionHighlight.setVisible(false);
    this.selectionHighlight.setDepth(1000); // Ensure highlight would be above entities if it was visible

    // Setup event handlers
    this.setupEventHandlers();
    this.setupInputHandlers();
  }

  /**
   * Set the list of entities that can be selected
   * @param entities The array of entities
   */
  public setEntities(entities: EditorEntity[]): void {
    this.entities = entities;
  }

  /**
   * Set the UI bounds to avoid selection in UI areas
   * @param bounds The rectangle defining UI bounds
   */
  public setUIBounds(bounds: Phaser.Geom.Rectangle): void {
    this.uiBounds = bounds;
  }

  /**
   * Finds and returns the entity at the given position
   * @param x World X position
   * @param y World Y position
   * @returns The entity at the position or null if none
   */
  public getEntityAtPosition(x: number, y: number): EditorEntity | null {
    // Prioritize the selected entity for better dragging behavior
    if (this.selectedEntity) {
      const gameObject = this.selectedEntity
        .gameObject as Phaser.GameObjects.GameObject;
      if (gameObject && this.isPointInEntity(x, y, this.selectedEntity)) {
        return this.selectedEntity;
      }
    }

    // Check other entities
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (this.isPointInEntity(x, y, entity)) {
        return entity;
      }
    }

    return null;
  }

  /**
   * Checks if a point is within an entity's bounds
   * @param x The x coordinate to check
   * @param y The y coordinate to check
   * @param entity The entity to check against
   */
  private isPointInEntity(x: number, y: number, entity: EditorEntity): boolean {
    const gameObject = entity.gameObject as any;
    if (!gameObject) return false;

    // Platform has special handling
    if (entity.type === "platform") {
      const platform = gameObject;
      const bounds = platform.getBounds();
      return bounds.contains(x, y);
    }

    // Use Phaser's input hitbox if available
    if (gameObject.input && gameObject.input.hitArea) {
      return gameObject.input.hitArea.contains(
        x - gameObject.x,
        y - gameObject.y
      );
    }

    // Use getBounds if available
    if (typeof gameObject.getBounds === "function") {
      const bounds = gameObject.getBounds();
      return bounds.contains(x, y);
    }

    // Fallback to simple rectangular bounds
    const width = gameObject.width || TILE_WIDTH;
    const height = gameObject.height || TILE_HEIGHT;
    return (
      x >= entity.x - width / 2 &&
      x <= entity.x + width / 2 &&
      y >= entity.y - height / 2 &&
      y <= entity.y + height / 2
    );
  }

  /**
   * Apply tint to the entity's game object
   * @param entity The entity to tint
   */
  private applyTintToEntity(entity: EditorEntity): void {
    const gameObject = entity.gameObject as any;
    if (!gameObject) return;

    // Apply tint based on entity type
    if (entity.type === "platform") {
      // For platforms, we may need to tint individual segments
      if (Array.isArray(gameObject.segments)) {
        gameObject.segments.forEach((segment: any) => {
          if (segment && typeof segment.setTint === "function") {
            segment.setTint(this.HIGHLIGHT_TINT);
          }
        });
      } else if (typeof gameObject.setTint === "function") {
        gameObject.setTint(this.HIGHLIGHT_TINT);
      }
    } else {
      // For other entities that support tinting
      if (typeof gameObject.setTint === "function") {
        gameObject.setTint(this.HIGHLIGHT_TINT);
      }
    }
  }

  /**
   * Clear tint from the entity's game object
   * @param entity The entity to clear tint from
   */
  private clearTintFromEntity(entity: EditorEntity): void {
    const gameObject = entity.gameObject as any;
    if (!gameObject) return;

    // Clear tint based on entity type
    if (entity.type === "platform") {
      // For platforms, we may need to clear tint from individual segments
      if (Array.isArray(gameObject.segments)) {
        gameObject.segments.forEach((segment: any) => {
          if (segment && typeof segment.clearTint === "function") {
            segment.clearTint();
          }
        });
      } else if (typeof gameObject.clearTint === "function") {
        gameObject.clearTint();
      }
    } else {
      // For other entities that support tinting
      if (typeof gameObject.clearTint === "function") {
        gameObject.clearTint();
      }
    }
  }

  /**
   * Selects an entity
   * @param entity The entity to select, or null to deselect
   */
  public selectEntity(entity: EditorEntity | null): void {
    // Skip if selecting the same entity
    if (entity === this.selectedEntity) return;

    // Prevent recursive deselection
    if (this.isDeselecting) return;

    // Deselect the current entity
    if (this.selectedEntity) {
      // Set the flag to prevent recursion
      this.isDeselecting = true;

      // Clear tint from the previously selected entity
      this.clearTintFromEntity(this.selectedEntity);
      this.eventBus.emit(EditorEvents.ENTITY_DESELECTED, this.selectedEntity);

      // Reset flag after deselection complete
      this.isDeselecting = false;
    }

    // Update selection
    this.selectedEntity = entity;

    // Update highlight
    if (entity) {
      // Apply tint to highlight the selected entity
      this.applyTintToEntity(entity);
      this.updateSelectionHighlight(entity);
      this.eventBus.emit(EditorEvents.ENTITY_SELECTED, entity);
    } else {
      // Hide highlight when no entity is selected
      if (this.selectionHighlight) {
        this.selectionHighlight.setVisible(false);
      }
    }
  }

  /**
   * Updates the selection highlight to match the entity dimensions
   * @param entity The entity to highlight
   */
  private updateSelectionHighlight(entity: EditorEntity): void {
    if (!this.selectionHighlight) return;

    const gameObject = entity.gameObject as any;
    if (!gameObject) return;

    // Get the appropriate width and height for the highlight
    let width = TILE_WIDTH;
    let height = TILE_HEIGHT;

    // Special handling for platforms
    if (entity.type === "platform") {
      const bounds = gameObject.getBounds();
      width = bounds.width + 10;
      height = bounds.height + 10;
    } else {
      // For other objects, try to get dimensions from the game object
      width = (gameObject.width || TILE_WIDTH) + 10;
      height = (gameObject.height || TILE_HEIGHT) + 10;
    }

    // Update the highlight
    this.selectionHighlight.setSize(width, height);
    this.selectionHighlight.setPosition(entity.x, entity.y);
    this.selectionHighlight.setVisible(true);
  }

  /**
   * Temporarily highlights an entity to show it's selectable
   * @param entity The entity to highlight
   */
  public temporarilyHighlightEntity(entity: EditorEntity): void {
    // Skip if this is already the selected entity
    if (entity === this.selectedEntity) return;

    // No highlight effect applied - completely disabled
  }

  /**
   * Set up event handlers for selection-related events
   */
  private setupEventHandlers(): void {
    // Listen for entity-related events (both prefixed and non-prefixed)
    this.eventBus.on(
      EditorEvents.ENTITY_REMOVED,
      (removedEntity: EditorEntity) => {
        // If the removed entity was selected, deselect it
        if (this.selectedEntity && this.selectedEntity === removedEntity) {
          this.selectEntity(null);
        }
      },
      this
    );

    // Also listen for the prefixed version
    this.eventBus.on(
      `EB_${EditorEvents.ENTITY_REMOVED}`,
      (removedEntity: EditorEntity) => {
        // If the removed entity was selected, deselect it
        if (this.selectedEntity && this.selectedEntity === removedEntity) {
          this.selectEntity(null);
        }
      },
      this
    );

    // Deselect entity when a new entity is placed
    this.eventBus.on(
      EditorEvents.ENTITY_PLACED,
      () => {
        this.selectEntity(null);
      },
      this
    );

    // Also listen for the prefixed version
    this.eventBus.on(
      `EB_${EditorEvents.ENTITY_PLACED}`,
      () => {
        this.selectEntity(null);
      },
      this
    );
  }

  /**
   * Set up input handlers for selection
   */
  private setupInputHandlers(): void {
    // Handle clicks for entity selection
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Skip if right click or not left button
      if (!pointer.leftButtonDown()) return;

      // Skip if over UI
      if (this.uiBounds && this.uiBounds.contains(pointer.x, pointer.y)) {
        return;
      }

      // Check if placement mode is active - if so, the EntityManager will handle it
      const isPlacementModeActive = this.scene.registry.get(
        "isPlacementModeActive"
      );
      if (isPlacementModeActive) {
        console.log(
          "EntitySelector: Placement mode active, skipping selection logic"
        );
        return;
      }

      // Skip if spacebar is held (for camera panning)
      const spaceKey = this.scene.input.keyboard?.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
      if (spaceKey && spaceKey.isDown) return;

      // Get world position
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      // Check if clicking on an entity
      const clickedEntity = this.getEntityAtPosition(worldX, worldY);

      if (clickedEntity) {
        // Select the entity
        this.selectEntity(clickedEntity);
      } else {
        // Clicking empty space - deselect
        this.selectEntity(null);
      }
    });
  }

  /**
   * Gets the currently selected entity
   */
  public getSelectedEntity(): EditorEntity | null {
    return this.selectedEntity;
  }

  /**
   * Cleans up resources when the selector is destroyed
   */
  public destroy(): void {
    // Clear any tinting on the selected entity
    if (this.selectedEntity) {
      this.clearTintFromEntity(this.selectedEntity);
    }

    if (this.selectionHighlight) {
      this.selectionHighlight.destroy();
      this.selectionHighlight = null;
    }

    // Remove event listeners
    this.scene.input.off("pointerdown");
    this.eventBus.off(EditorEvents.ENTITY_REMOVED, undefined, this);
    this.eventBus.off(`EB_${EditorEvents.ENTITY_REMOVED}`, undefined, this);
    this.eventBus.off(EditorEvents.ENTITY_PLACED, undefined, this);
    this.eventBus.off(`EB_${EditorEvents.ENTITY_PLACED}`, undefined, this);
  }
}
