import { Scene } from "phaser";
import { EditorEntity } from "../../ui/Inspector";
import { EditorEventBus } from "../EditorEventBus";
import { EditorEvents } from "../EditorEventTypes";

/**
 * Manages entity selection and highlighting in the editor
 */
export class EntitySelector {
  private scene: Scene;
  private eventBus: EditorEventBus;
  private selectedEntity: EditorEntity | null = null;
  private highlightGraphics: Phaser.GameObjects.Graphics;
  private temporaryHighlights: Map<string, Phaser.Time.TimerEvent> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
    this.eventBus = EditorEventBus.getInstance();

    // Create graphics object for highlighting
    this.highlightGraphics = this.scene.add.graphics();
    this.highlightGraphics.setDepth(1000); // Set high depth to show above entities

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for entity selection events
    this.eventBus.on(EditorEvents.ENTITY_SELECTED, this.onEntitySelected, this);
    this.eventBus.on(
      EditorEvents.ENTITY_DESELECTED,
      this.onEntityDeselected,
      this
    );
  }

  /**
   * Handler for entity selected event
   */
  private onEntitySelected(entity: EditorEntity): void {
    // Update selected entity
    this.selectedEntity = entity;

    // Update registry
    this.scene.registry.set("selectedEntity", entity);

    // Draw selection highlight
    this.drawSelectionHighlight();
  }

  /**
   * Handler for entity deselected event
   */
  private onEntityDeselected(): void {
    // Clear selected entity
    this.selectedEntity = null;

    // Update registry
    this.scene.registry.set("selectedEntity", null);

    // Clear selection highlight
    this.clearSelectionHighlight();
  }

  /**
   * Draw highlight around selected entity
   */
  private drawSelectionHighlight(): void {
    // Clear previous highlight
    this.clearSelectionHighlight();

    if (!this.selectedEntity) return;

    const entity = this.selectedEntity;
    const gameObject = entity.gameObject as Phaser.GameObjects.GameObject;

    // Get bounds of the game object
    let bounds: Phaser.Geom.Rectangle;

    if ("getBounds" in gameObject) {
      // Use getBounds if available
      bounds = (gameObject as any).getBounds();
    } else if ("width" in gameObject && "height" in gameObject) {
      // Use width and height if available
      const width = (gameObject as any).width;
      const height = (gameObject as any).height;
      bounds = new Phaser.Geom.Rectangle(
        entity.x - width / 2,
        entity.y - height / 2,
        width,
        height
      );
    } else {
      // Default size if no bounds info is available
      bounds = new Phaser.Geom.Rectangle(entity.x - 32, entity.y - 32, 64, 64);
    }

    // Draw selection rectangle
    this.highlightGraphics.lineStyle(2, 0xffff00, 1);
    this.highlightGraphics.strokeRect(
      bounds.x - 4,
      bounds.y - 4,
      bounds.width + 8,
      bounds.height + 8
    );
  }

  /**
   * Clear selection highlight
   */
  private clearSelectionHighlight(): void {
    this.highlightGraphics.clear();
  }

  /**
   * Find entity at the given position
   */
  public getEntityAtPosition(
    entities: EditorEntity[],
    x: number,
    y: number
  ): EditorEntity | null {
    // Check entities in reverse order (top to bottom in display list)
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      const gameObject = entity.gameObject as Phaser.GameObjects.GameObject;

      // Skip if game object is not interactive
      if (!this.isSelectable(gameObject)) continue;

      // Check if position is within entity bounds
      if (this.isPositionInEntity(gameObject, x, y)) {
        return entity;
      }
    }

    return null;
  }

  /**
   * Check if a game object is selectable
   */
  private isSelectable(gameObject: Phaser.GameObjects.GameObject): boolean {
    // Add any custom logic to determine if an entity is selectable
    return true;
  }

  /**
   * Check if a position is within an entity
   */
  private isPositionInEntity(
    gameObject: Phaser.GameObjects.GameObject,
    x: number,
    y: number
  ): boolean {
    // Different types of game objects have different hit testing methods
    if ("getBounds" in gameObject) {
      // Use getBounds if available
      const bounds = (gameObject as any).getBounds();
      return bounds.contains(x, y);
    } else if ("width" in gameObject && "height" in gameObject) {
      // For objects with width and height
      const width = (gameObject as any).width;
      const height = (gameObject as any).height;
      const posX = (gameObject as any).x;
      const posY = (gameObject as any).y;

      // Create a rectangle and check containment
      const rect = new Phaser.Geom.Rectangle(
        posX - width / 2,
        posY - height / 2,
        width,
        height
      );
      return rect.contains(x, y);
    }

    // Default hit radius for objects without explicit bounds
    const defaultRadius = 32;
    const posX = (gameObject as any).x || 0;
    const posY = (gameObject as any).y || 0;

    // Distance check
    const distance = Phaser.Math.Distance.Between(x, y, posX, posY);
    return distance <= defaultRadius;
  }

  /**
   * Temporarily highlight an entity (for hover effects)
   */
  public temporarilyHighlightEntity(
    entity: EditorEntity,
    duration: number = 200
  ): void {
    // Generate a unique ID for this entity if it doesn't have one
    // Use GameObject's ID or create one based on the entity's position and type
    const entityId = this.getEntityIdentifier(entity);

    // Clear any existing temporary highlight for this entity
    if (this.temporaryHighlights.has(entityId)) {
      this.temporaryHighlights.get(entityId)?.remove();
      this.temporaryHighlights.delete(entityId);
    }

    // Draw highlight
    this.drawTemporaryHighlight(entity);

    // Set timer to clear highlight
    const timer = this.scene.time.delayedCall(duration, () => {
      this.clearTemporaryHighlight(entity);
      this.temporaryHighlights.delete(entityId);
    });

    // Store timer reference
    this.temporaryHighlights.set(entityId, timer);
  }

  /**
   * Get a unique identifier for an entity
   */
  private getEntityIdentifier(entity: EditorEntity): string {
    // Try to get ID from data if it exists
    if (entity.data && "id" in entity.data) {
      return (entity.data as any).id;
    }

    // Fallback to generating an ID based on entity properties
    return `${entity.type}-${entity.x}-${entity.y}`;
  }

  /**
   * Draw temporary highlight for an entity
   */
  private drawTemporaryHighlight(entity: EditorEntity): void {
    const gameObject = entity.gameObject as Phaser.GameObjects.GameObject;

    // Get bounds of the game object
    let bounds: Phaser.Geom.Rectangle;

    if ("getBounds" in gameObject) {
      bounds = (gameObject as any).getBounds();
    } else if ("width" in gameObject && "height" in gameObject) {
      const width = (gameObject as any).width;
      const height = (gameObject as any).height;
      bounds = new Phaser.Geom.Rectangle(
        entity.x - width / 2,
        entity.y - height / 2,
        width,
        height
      );
    } else {
      bounds = new Phaser.Geom.Rectangle(entity.x - 32, entity.y - 32, 64, 64);
    }

    // Draw highlight rectangle (different color than selection)
    this.highlightGraphics.lineStyle(2, 0x00ffff, 0.8);
    this.highlightGraphics.strokeRect(
      bounds.x - 2,
      bounds.y - 2,
      bounds.width + 4,
      bounds.height + 4
    );
  }

  /**
   * Clear temporary highlight for an entity
   */
  private clearTemporaryHighlight(entity: EditorEntity): void {
    // Redraw the selection highlight if needed
    if (this.selectedEntity) {
      this.drawSelectionHighlight();
    } else {
      this.clearSelectionHighlight();
    }
  }

  /**
   * Get the currently selected entity
   */
  public getSelectedEntity(): EditorEntity | null {
    return this.selectedEntity;
  }

  /**
   * Clean up resources when no longer needed
   */
  public destroy(): void {
    // Remove event listeners
    this.eventBus.off(
      EditorEvents.ENTITY_SELECTED,
      this.onEntitySelected,
      this
    );
    this.eventBus.off(
      EditorEvents.ENTITY_DESELECTED,
      this.onEntityDeselected,
      this
    );

    // Clear all timers
    this.temporaryHighlights.forEach((timer) => {
      timer.remove();
    });
    this.temporaryHighlights.clear();

    // Destroy graphics
    this.highlightGraphics.destroy();
  }
}
