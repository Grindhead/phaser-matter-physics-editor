import { Scene } from "phaser";
import { EditorEvents } from "./EditorEventTypes";

/**
 * A central event bus to facilitate communication between editor components.
 * This singleton allows components to register and emit events without direct coupling.
 */
export class EditorEventBus {
  private static instance: EditorEventBus;
  private scene: Scene | null = null;
  // Names of the events currently being dispatched (innermost last).
  // Used to detect true cycles (an event re-emitting itself, directly or via
  // other events) while still allowing legitimate chains such as
  // PLACE_ENTITY -> ENTITY_PLACED -> ENTITY_DESELECTED.
  private dispatchStack: string[] = [];

  /**
   * Get the singleton instance of the EditorEventBus
   */
  public static getInstance(): EditorEventBus {
    if (!EditorEventBus.instance) {
      EditorEventBus.instance = new EditorEventBus();
    }
    return EditorEventBus.instance;
  }

  /**
   * Initialize the event bus with a Phaser scene reference
   * @param scene The Phaser scene to use for event emitting/listening
   */
  public initialize(scene: Scene): void {
    this.scene = scene;
    console.log("EditorEventBus initialized with scene:", scene.scene.key);
  }

  /**
   * Registers an event listener for a specific event type
   * @param event The event type to listen for
   * @param callback The callback function to execute when the event is emitted
   * @param context The context to bind the callback to
   */
  public on(event: string, callback: Function, context?: any): void {
    if (!this.scene) {
      console.error("EditorEventBus not initialized with a scene");
      return;
    }
    this.scene.events.on(event, callback, context);
  }

  /**
   * Registers a one-time event listener for a specific event type
   * @param event The event type to listen for
   * @param callback The callback function to execute when the event is emitted
   * @param context The context to bind the callback to
   */
  public once(event: string, callback: Function, context?: any): void {
    if (!this.scene) {
      console.error("EditorEventBus not initialized with a scene");
      return;
    }
    this.scene.events.once(event, callback, context);
  }

  /**
   * Removes an event listener for a specific event type
   * @param event The event type to stop listening for
   * @param callback The callback function to remove
   * @param context The context of the callback
   */
  public off(event: string, callback?: Function, context?: any): void {
    if (!this.scene) {
      console.error("EditorEventBus not initialized with a scene");
      return;
    }
    this.scene.events.off(event, callback, context);
  }

  /**
   * Emits an event with optional parameters
   * @param event The event type to emit
   * @param args The parameters to pass to the event handlers
   */
  public emit(event: string | undefined, ...args: any[]): void {
    if (!this.scene) {
      console.error("EditorEventBus not initialized with a scene");
      return;
    }

    // Validate event name
    if (!event) {
      console.error("EditorEventBus: Attempted to emit undefined event");
      return;
    }

    // Only a re-entrant emission of an event that is already being dispatched
    // is a cycle. Different events emitted from inside a handler are delivered.
    if (this.dispatchStack.includes(event)) {
      console.warn(
        `EditorEventBus: cycle detected, dropping "${event}" (chain: ${[
          ...this.dispatchStack,
          event,
        ].join(" -> ")})`
      );
      return;
    }

    this.dispatchStack.push(event);
    try {
      // Each event is delivered exactly once, under its canonical name.
      this.scene.events.emit(event, ...args);
    } finally {
      this.dispatchStack.pop();
    }
  }

  /**
   * Removes all listeners for all events
   */
  public removeAllListeners(): void {
    if (!this.scene) {
      console.error("EditorEventBus not initialized with a scene");
      return;
    }
    this.scene.events.removeAllListeners();
  }

  /**
   * Destroys the event bus instance
   */
  public static destroy(): void {
    if (EditorEventBus.instance) {
      EditorEventBus.instance.scene = null;
      EditorEventBus.instance = null!;
    }
  }

  /**
   * Helper method to emit entity selection event
   */
  public selectEntityType(type: string, config?: any): void {
    this.emit(EditorEvents.ENTITY_SELECT, type, config);
  }

  /**
   * Helper method to emit entity selected event
   */
  public entitySelected(entity: any): void {
    this.emit(EditorEvents.ENTITY_SELECTED, entity);
  }

  /**
   * Helper method to emit entity deselected event
   */
  public entityDeselected(): void {
    this.emit(EditorEvents.ENTITY_DESELECTED);
  }

  /**
   * Helper method to emit property change event
   */
  public propertyChanged(entity: any, property: string, value: any): void {
    this.emit(EditorEvents.PROPERTY_CHANGE, entity, property, value);
  }

  /**
   * Helper method to emit entity updated event
   */
  public entityUpdated(
    entity: any,
    property: string,
    oldValue: any,
    newValue: any
  ): void {
    this.emit(
      EditorEvents.ENTITY_UPDATED,
      entity,
      property,
      oldValue,
      newValue
    );
  }

  /**
   * Helper method to emit remove entity event
   */
  public removeEntity(entity: any): void {
    this.emit(EditorEvents.REMOVE_ENTITY, entity);
  }

  /**
   * Helper method to emit entity removed event
   */
  public entityRemoved(entityType: string, entityId: string): void {
    this.emit(EditorEvents.ENTITY_REMOVED, entityType, entityId);
  }

  /**
   * Helper method to emit save event
   */
  public save(): void {
    this.emit(EditorEvents.SAVE);
  }

  /**
   * Helper method to emit load event
   */
  public load(): void {
    this.emit(EditorEvents.LOAD);
  }

  /**
   * Helper method to emit clear event
   */
  public clear(): void {
    this.emit(EditorEvents.CLEAR);
  }

  /**
   * Helper method to emit file load event
   */
  public fileLoad(file: File): void {
    this.emit(EditorEvents.FILE_LOAD, file);
  }

  /**
   * Helper method to emit place entity event
   */
  public placeEntity(type: string, x: number, y: number, config?: any): void {
    this.emit(EditorEvents.PLACE_ENTITY, { type, x, y, config });
  }

  /**
   * Helper method to emit entity placed event
   */
  public entityPlaced(entity: any): void {
    this.emit(EditorEvents.ENTITY_PLACED, entity);
  }
}
