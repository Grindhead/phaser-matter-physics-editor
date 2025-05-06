import { Scene } from "phaser";
import { EditorEventBus } from "../EditorEventBus";
import { EditorEvents } from "../EditorEventTypes";
import { EditorEntity } from "../../ui/Inspector";

/**
 * Integration layer to connect our new entity management system
 * with the existing EntityDisplayScene
 */
export class EntityDisplayIntegration {
  private scene: Scene;
  private eventBus: EditorEventBus;

  constructor(scene: Scene) {
    this.scene = scene;
    this.eventBus = EditorEventBus.getInstance();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for entity lifecycle events
   */
  private setupEventListeners(): void {
    // Listen for entity placed event
    this.eventBus.on(EditorEvents.ENTITY_PLACED, this.onEntityPlaced, this);

    // Listen for entity removed event
    this.eventBus.on(EditorEvents.ENTITY_REMOVED, this.onEntityRemoved, this);

    // Listen for level cleared event
    this.eventBus.on(EditorEvents.LEVEL_CLEARED, this.onLevelCleared, this);
  }

  /**
   * Handler for entity placed event
   */
  private onEntityPlaced(entity: EditorEntity): void {
    // Forward to the EntityDisplayScene via direct scene event
    this.scene.events.emit(
      "ADD_ENTITY_TO_DISPLAY",
      entity.gameObject,
      entity.type
    );
  }

  /**
   * Handler for entity removed event
   */
  private onEntityRemoved(entityType: string, entityId: string): void {
    // We need the gameObject to forward to EntityDisplayScene
    // This is more difficult since we only have type and id
    // As a workaround, we can emit a scene event for all removed entities
    this.scene.events.emit("ENTITY_REMOVED_BY_ID", entityType, entityId);
  }

  /**
   * Handler for level cleared event
   */
  private onLevelCleared(): void {
    // Forward to the EntityDisplayScene
    this.scene.events.emit("CLEAR_ENTITY_DISPLAY");
  }

  /**
   * Manually add an entity to the display
   */
  public addEntityToDisplay(entity: EditorEntity): void {
    this.scene.events.emit(
      "ADD_ENTITY_TO_DISPLAY",
      entity.gameObject,
      entity.type
    );
  }

  /**
   * Manually remove an entity from the display
   */
  public removeEntityFromDisplay(entity: EditorEntity): void {
    this.scene.events.emit("REMOVE_ENTITY_FROM_DISPLAY", entity.gameObject);
  }

  /**
   * Clean up event listeners
   */
  public destroy(): void {
    this.eventBus.off(EditorEvents.ENTITY_PLACED, this.onEntityPlaced, this);
    this.eventBus.off(EditorEvents.ENTITY_REMOVED, this.onEntityRemoved, this);
    this.eventBus.off(EditorEvents.LEVEL_CLEARED, this.onLevelCleared, this);
  }
}
