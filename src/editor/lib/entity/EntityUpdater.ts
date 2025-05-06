import { Scene } from "phaser";
import { EditorEntity } from "../../ui/Inspector";
import { EditorEventBus } from "../EditorEventBus";
import { EditorEvents, PropertyChangePayload } from "../EditorEventTypes";
import { Platform } from "../../../entities/Platforms/Platform";

/**
 * Handles entity property updates in the editor
 */
export class EntityUpdater {
  private scene: Scene;
  private eventBus: EditorEventBus;

  constructor(scene: Scene) {
    this.scene = scene;
    this.eventBus = EditorEventBus.getInstance();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for property change events
    this.eventBus.on(EditorEvents.PROPERTY_CHANGE, this.onPropertyChange, this);
  }

  /**
   * Handler for property change events
   */
  private onPropertyChange(payload: PropertyChangePayload): void {
    const { entity, property, value } = payload;

    // Save original value for the undo history
    const originalValue = this.getEntityProperty(entity, property);

    // Update the property
    if (this.updateEntityProperty(entity, property, value)) {
      // Emit entity updated event
      this.eventBus.entityUpdated(entity, property, originalValue, value);
    }
  }

  /**
   * Get the value of a property from an entity
   */
  private getEntityProperty(entity: EditorEntity, property: string): any {
    if (!entity) return undefined;

    // Handle nested properties using dot notation (e.g., "data.segmentCount")
    const parts = property.split(".");
    let current: any = entity;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      current = current[part];
    }

    return current;
  }

  /**
   * Update a property on an entity
   */
  public updateEntityProperty(
    entity: EditorEntity,
    property: string,
    value: any
  ): boolean {
    if (!entity) return false;

    // Handle x and y coordinates specially
    if (property === "x" || property === "y") {
      return this.updatePositionProperty(entity, property, value);
    }

    // Handle platform-specific properties
    if (entity.type === "platform") {
      if (property === "segmentCount") {
        return this.updatePlatformSegmentCount(entity, value);
      }
      if (property === "isVertical") {
        return this.updatePlatformOrientation(entity, value);
      }
    }

    // Handle enemy-specific properties
    if (entity.type === "enemy-large" || entity.type === "enemy-small") {
      // Handle enemy properties if needed
    }

    // For all other properties, update the data object directly
    try {
      // Handle nested properties using dot notation
      const parts = property.split(".");
      let current: any = entity;
      const lastPart = parts.pop();

      if (!lastPart) return false;

      // Navigate to the containing object
      for (const part of parts) {
        if (current[part] === undefined) {
          current[part] = {};
        }
        current = current[part];
      }

      // Update the property
      current[lastPart] = value;

      // Apply changes to the visual representation if needed
      this.updateEntityVisual(entity);

      return true;
    } catch (error) {
      console.error(
        `Error updating property ${property} on entity ${entity.type}:`,
        error
      );
      return false;
    }
  }

  /**
   * Update position properties (x, y) on an entity
   */
  private updatePositionProperty(
    entity: EditorEntity,
    property: string,
    value: number
  ): boolean {
    try {
      // Update entity coordinate
      entity[property as keyof EditorEntity] = value;

      // Update data property if it exists
      if (
        entity.data &&
        typeof entity.data === "object" &&
        property in entity.data
      ) {
        (entity.data as any)[property] = value;
      }

      // Update visual representation
      const gameObject = entity.gameObject;
      if (gameObject && "setPosition" in gameObject) {
        const x = property === "x" ? value : entity.x;
        const y = property === "y" ? value : entity.y;
        (gameObject as any).setPosition(x, y);
      } else if (gameObject) {
        (gameObject as any)[property] = value;
      }

      return true;
    } catch (error) {
      console.error(`Error updating position property ${property}:`, error);
      return false;
    }
  }

  /**
   * Update platform segment count
   */
  private updatePlatformSegmentCount(
    entity: EditorEntity,
    segmentCount: number
  ): boolean {
    try {
      // Update data
      if (entity.data && typeof entity.data === "object") {
        (entity.data as any).segmentCount = segmentCount;
      }

      // Update the platform
      const platform = entity.gameObject as Platform;
      if (platform && "setSegmentCount" in platform) {
        platform.setSegmentCount(segmentCount);
        return true;
      }

      // If no direct method, recreate the platform
      return this.recreatePlatform(entity);
    } catch (error) {
      console.error("Error updating platform segment count:", error);
      return false;
    }
  }

  /**
   * Update platform orientation (vertical/horizontal)
   */
  private updatePlatformOrientation(
    entity: EditorEntity,
    isVertical: boolean
  ): boolean {
    try {
      // Update data
      if (entity.data && typeof entity.data === "object") {
        (entity.data as any).isVertical = isVertical;
      }

      // Update the platform
      const platform = entity.gameObject as Platform;
      if (platform && "setVertical" in platform) {
        platform.setVertical(isVertical);
        return true;
      }

      // If no direct method, recreate the platform
      return this.recreatePlatform(entity);
    } catch (error) {
      console.error("Error updating platform orientation:", error);
      return false;
    }
  }

  /**
   * Recreate a platform when its fundamental properties change
   */
  private recreatePlatform(entity: EditorEntity): boolean {
    try {
      // Get current platform data
      const data = entity.data;
      const x = entity.x;
      const y = entity.y;

      // Remove old platform
      const oldPlatform = entity.gameObject as Platform;
      if (oldPlatform && "destroy" in oldPlatform) {
        oldPlatform.destroy();
      }

      // Create new platform
      const newPlatform = new Platform(this.scene, x, y, {
        segmentCount: (data as any).segmentCount || 3,
        isVertical: (data as any).isVertical || false,
        id: (data as any).id,
        isEditor: true,
      });

      // Add to scene
      this.scene.add.existing(newPlatform);

      // Update entity reference
      entity.gameObject = newPlatform;

      return true;
    } catch (error) {
      console.error("Error recreating platform:", error);
      return false;
    }
  }

  /**
   * Update the visual representation of an entity after property changes
   */
  private updateEntityVisual(entity: EditorEntity): void {
    // Different entity types may need different visual updates
    switch (entity.type) {
      case "platform":
        // Platform visuals are updated by specific methods
        break;
      case "enemy-large":
      case "enemy-small":
        // Update enemy visuals if needed
        break;
      case "crate-small":
      case "crate-big":
      case "barrel":
      case "finish-line":
        // Update other entity visuals if needed
        break;
    }
  }

  /**
   * Clean up resources when no longer needed
   */
  public destroy(): void {
    // Remove event listeners
    this.eventBus.off(
      EditorEvents.PROPERTY_CHANGE,
      this.onPropertyChange,
      this
    );
  }
}
