import { Scene } from "phaser";
import { EditorEntity } from "../../ui/Inspector";
import { EditorEventBus } from "../EditorEventBus";
import { EditorEvents, DragPayload } from "../EditorEventTypes";
import { TILE_WIDTH, TILE_HEIGHT } from "../../../lib/constants";

/**
 * Manages entity dragging in the editor
 */
export class EntityDragHandler {
  private scene: Scene;
  private eventBus: EditorEventBus;
  private isDragging: boolean = false;
  private draggedEntity: EditorEntity | null = null;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private lastValidX: number = 0;
  private lastValidY: number = 0;

  constructor(scene: Scene) {
    this.scene = scene;
    this.eventBus = EditorEventBus.getInstance();

    // Setup input handlers
    this.setupInputHandlers();
  }

  /**
   * Setup input handlers for dragging
   */
  private setupInputHandlers(): void {
    // Listen for pointer down
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Skip if not left click or already dragging
      if (!pointer.leftButtonDown() || this.isDragging) return;

      // Skip if camera is panning
      if (this.scene.registry.get("isCameraPanning")) return;

      // Get selected entity from registry
      const selectedEntity = this.scene.registry.get(
        "selectedEntity"
      ) as EditorEntity;
      if (!selectedEntity) return;

      // Skip if position is within UI bounds
      const uiBounds = this.scene.registry.get(
        "uiBounds"
      ) as Phaser.Geom.Rectangle;
      if (uiBounds && uiBounds.contains(pointer.x, pointer.y)) return;

      // Get world position for entity
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      // Check if click is on the selected entity
      const gameObject = selectedEntity.gameObject;
      const bounds = this.getEntityBounds(selectedEntity);
      if (!bounds.contains(worldX, worldY)) return;

      // Start dragging
      this.startDragging(selectedEntity, worldX, worldY);
    });

    // Listen for pointer move
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !this.draggedEntity || !pointer.leftButtonDown())
        return;

      // Update entity position
      this.updateDragPosition(pointer.worldX, pointer.worldY);
    });

    // Listen for pointer up
    this.scene.input.on("pointerup", () => {
      if (this.isDragging) {
        this.stopDragging();
      }
    });
  }

  /**
   * Start dragging an entity
   */
  private startDragging(entity: EditorEntity, x: number, y: number): void {
    this.isDragging = true;
    this.draggedEntity = entity;
    this.dragStartX = x;
    this.dragStartY = y;
    this.lastValidX = entity.x;
    this.lastValidY = entity.y;

    // Set registry flag
    this.scene.registry.set("isDraggingEntity", true);

    // Emit drag start event
    const payload: DragPayload = {
      entity,
      x: entity.x,
      y: entity.y,
    };
    this.eventBus.emit(EditorEvents.DRAG_START, payload);
  }

  /**
   * Update entity position during drag
   */
  private updateDragPosition(x: number, y: number): void {
    if (!this.draggedEntity) return;

    // Calculate snap position
    const snappedX = Math.floor(x / TILE_WIDTH) * TILE_WIDTH + TILE_WIDTH / 2;
    const snappedY =
      Math.floor(y / TILE_HEIGHT) * TILE_HEIGHT + TILE_HEIGHT / 2;

    // Update last valid position
    this.lastValidX = snappedX;
    this.lastValidY = snappedY;

    // Update entity position
    this.draggedEntity.x = snappedX;
    this.draggedEntity.y = snappedY;

    // Update visual position based on entity type
    this.updateEntityVisualPosition(this.draggedEntity, snappedX, snappedY);

    // Emit dragging event
    const payload: DragPayload = {
      entity: this.draggedEntity,
      x: snappedX,
      y: snappedY,
    };
    this.eventBus.emit(EditorEvents.DRAGGING, payload);
  }

  /**
   * Stop dragging and finalize entity position
   */
  private stopDragging(): void {
    if (!this.draggedEntity) return;

    // Get final position
    const finalX = this.lastValidX;
    const finalY = this.lastValidY;

    // Update entity data
    if ("x" in this.draggedEntity.data) {
      (this.draggedEntity.data as any).x = finalX;
    }
    if ("y" in this.draggedEntity.data) {
      (this.draggedEntity.data as any).y = finalY;
    }

    // Emit drag end event
    const payload: DragPayload = {
      entity: this.draggedEntity,
      x: finalX,
      y: finalY,
    };
    this.eventBus.emit(EditorEvents.DRAG_END, payload);

    // Clear dragging state
    this.isDragging = false;
    const draggedEntity = this.draggedEntity;
    this.draggedEntity = null;
    this.scene.registry.set("isDraggingEntity", false);

    // Emit entity updated event
    this.eventBus.entityUpdated(
      draggedEntity,
      "position",
      { x: this.dragStartX, y: this.dragStartY },
      { x: finalX, y: finalY }
    );
  }

  /**
   * Update the visual position of an entity
   */
  private updateEntityVisualPosition(
    entity: EditorEntity,
    x: number,
    y: number
  ): void {
    const gameObject = entity.gameObject;

    // Update position based on the game object type
    if ("setPosition" in gameObject) {
      (gameObject as any).setPosition(x, y);
    } else {
      // Default fallback
      (gameObject as any).x = x;
      (gameObject as any).y = y;
    }
  }

  /**
   * Get the bounds of an entity for hit testing
   */
  private getEntityBounds(entity: EditorEntity): Phaser.Geom.Rectangle {
    const gameObject = entity.gameObject as Phaser.GameObjects.GameObject;

    // Different types of game objects have different ways to get bounds
    if ("getBounds" in gameObject) {
      // Use getBounds if available
      return (gameObject as any).getBounds();
    } else if ("width" in gameObject && "height" in gameObject) {
      // Use width and height if available
      const width = (gameObject as any).width;
      const height = (gameObject as any).height;
      return new Phaser.Geom.Rectangle(
        entity.x - width / 2,
        entity.y - height / 2,
        width,
        height
      );
    }

    // Default bounds if no explicit dimensions
    return new Phaser.Geom.Rectangle(entity.x - 32, entity.y - 32, 64, 64);
  }

  /**
   * Check if an entity is currently being dragged
   */
  public isDraggingActive(): boolean {
    return this.isDragging;
  }

  /**
   * Get the currently dragged entity
   */
  public getDraggedEntity(): EditorEntity | null {
    return this.draggedEntity;
  }

  /**
   * Clean up resources when no longer needed
   */
  public destroy(): void {
    // Clean up any listeners if needed
    this.scene.input.off("pointerdown");
    this.scene.input.off("pointermove");
    this.scene.input.off("pointerup");
  }
}
