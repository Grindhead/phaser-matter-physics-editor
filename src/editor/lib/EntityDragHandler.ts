import { Scene } from "phaser";
import { EditorEntity } from "../ui/Inspector";
import { EditorEventBus } from "./EditorEventBus";
import { EditorEvents } from "./EditorEventTypes";
import { EntitySelector } from "./EntitySelector";
import { TILE_WIDTH, TILE_HEIGHT } from "../../lib/constants";
import { EntityUpdater } from "./EntityUpdater";

/**
 * Responsible for handling entity dragging operations in the editor
 */
export class EntityDragHandler {
  private scene: Scene;
  private eventBus: EditorEventBus;
  private selector: EntitySelector;
  private updater: EntityUpdater;
  private isDragging: boolean = false;
  private newEntityDragging: boolean = false;
  private uiBounds?: Phaser.Geom.Rectangle;

  constructor(scene: Scene, selector: EntitySelector, updater: EntityUpdater) {
    this.scene = scene;
    this.eventBus = EditorEventBus.getInstance();
    this.selector = selector;
    this.updater = updater;

    this.setupInputHandlers();
  }

  /**
   * Sets UI bounds to avoid drag interactions in UI areas
   * @param bounds The rectangle defining UI bounds
   */
  public setUIBounds(bounds: Phaser.Geom.Rectangle): void {
    this.uiBounds = bounds;
  }

  /**
   * Start dragging a newly placed entity
   * @param entity The entity to drag
   */
  public startNewEntityDrag(entity: EditorEntity): void {
    if (entity) {
      this.selector.selectEntity(entity);
      this.isDragging = true;
      this.newEntityDragging = true;
      this.scene.registry.set("isDraggingEntity", true);

      // Emit drag started event using the correct name from EditorEvents
      this.eventBus.emit(EditorEvents.DRAG_START, entity);
    }
  }

  /**
   * Sets up input handlers for entity dragging
   */
  private setupInputHandlers(): void {
    // Pointer down handler for starting drag operations
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Skip if not left button or if UI area
      if (
        !pointer.leftButtonDown() ||
        (this.uiBounds && this.uiBounds.contains(pointer.x, pointer.y))
      ) {
        return;
      }

      // Skip if spacebar is down (for camera panning)
      const spaceKey = this.scene.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
      if (spaceKey.isDown) return;

      // Skip if already dragging or in placement mode
      if (this.isDragging || this.scene.registry.get("isPlacementModeActive"))
        return;

      // Get world position
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      // Check if clicking on an existing entity
      const entity = this.selector.getEntityAtPosition(worldX, worldY);

      if (entity) {
        // Start dragging the existing entity
        this.selector.selectEntity(entity);
        this.isDragging = true;
        this.scene.registry.set("isDraggingEntity", true);

        // Emit drag started event
        this.eventBus.emit(EditorEvents.DRAG_START, entity);
      }
    });

    // Pointer move handler for dragging
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      // Skip if not dragging or pointer not down
      if (!this.isDragging || !pointer.leftButtonDown()) return;

      // Get selected entity
      const entity = this.selector.getSelectedEntity();
      if (!entity) {
        this.isDragging = false;
        this.scene.registry.set("isDraggingEntity", false);
        return;
      }

      // Get world position
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      // Calculate snap position
      const snappedX =
        Math.floor(worldX / TILE_WIDTH) * TILE_WIDTH + TILE_WIDTH / 2;
      const snappedY =
        Math.floor(worldY / TILE_HEIGHT) * TILE_HEIGHT + TILE_HEIGHT / 2;

      // Update entity position
      this.updater.updateEntityPosition(entity, snappedX, snappedY);

      // Emit drag event using the correct name
      this.eventBus.emit(EditorEvents.DRAGGING, {
        entity,
        x: snappedX,
        y: snappedY,
      });
    });

    // Pointer up handler for ending drag operations
    this.scene.input.on("pointerup", () => {
      if (!this.isDragging) return;

      const entity = this.selector.getSelectedEntity();
      if (entity) {
        // Do final position update to ensure all changes are saved
        this.updater.updateEntityInLevelData(entity);

        // Emit drag ended event using the correct name
        this.eventBus.emit(EditorEvents.DRAG_END, entity);
      }

      // Reset drag state
      this.isDragging = false;
      this.newEntityDragging = false;
      this.scene.registry.set("isDraggingEntity", false);
    });
  }

  /**
   * Destroy the drag handler, removing all event listeners
   */
  public destroy(): void {
    this.scene.input.off("pointerdown");
    this.scene.input.off("pointermove");
    this.scene.input.off("pointerup");
  }
}
