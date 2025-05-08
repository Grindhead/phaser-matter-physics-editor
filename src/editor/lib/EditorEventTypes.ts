import { EditorEntity } from "../ui/Inspector";

/**
 * Event types used for communication between editor components
 */
export enum EditorEventTypes {
  // Entity selection events
  ENTITY_SELECT = "ENTITY_SELECT",
  ENTITY_SELECTED = "ENTITY_SELECTED",
  ENTITY_DESELECTED = "ENTITY_DESELECTED",

  // Entity manipulation events
  ENTITY_PLACED = "ENTITY_PLACED",
  ENTITY_REMOVED = "ENTITY_REMOVED",
  ENTITY_UPDATED = "ENTITY_UPDATED",
  ENTITY_DRAGGED = "ENTITY_DRAGGED",
  ENTITY_DRAG_START = "ENTITY_DRAG_START",
  ENTITY_DRAG_END = "ENTITY_DRAG_END",

  // Property events
  PROPERTY_CHANGE = "PROPERTY_CHANGE",

  // UI events
  PLACE_ENTITY = "PLACE_ENTITY",
  PALETTE_SELECTION = "PALETTE_SELECTION",
  PALETTE_SELECTION_CLEARED = "PALETTE_SELECTION_CLEARED",
  UI_READY = "UI_READY",

  // Level management events
  SAVE = "SAVE",
  LOAD = "LOAD",
  CLEAR = "CLEAR",
  FILE_LOAD = "FILE_LOAD",
  LEVEL_LOADED = "LEVEL_LOADED",
  LEVEL_CLEARED = "LEVEL_CLEARED",

  // Camera events
  CAMERA_ZOOM = "CAMERA_ZOOM",
}

/**
 * All editor event types defined as string constants.
 * This centralizes event naming to prevent typos and make event management clearer.
 */
export const EditorEvents = {
  // Entity selection events
  ENTITY_SELECT: "ENTITY_SELECT",
  ENTITY_SELECTED: "ENTITY_SELECTED",
  ENTITY_DESELECTED: "ENTITY_DESELECTED",

  // Entity placement events
  PLACE_ENTITY: "PLACE_ENTITY",
  ENTITY_PLACED: "ENTITY_PLACED",

  // Entity modification events
  PROPERTY_CHANGE: "PROPERTY_CHANGE",
  ENTITY_UPDATED: "ENTITY_UPDATED",
  REMOVE_ENTITY: "REMOVE_ENTITY",
  ENTITY_REMOVED: "ENTITY_REMOVED",

  // Level management events
  SAVE: "SAVE",
  LOAD: "LOAD",
  CLEAR: "CLEAR",
  FILE_LOAD: "FILE_LOAD",
  LEVEL_LOADED: "LEVEL_LOADED",
  LEVEL_SAVED: "LEVEL_SAVED",
  LEVEL_CLEARED: "LEVEL_CLEARED",

  // UI events
  UI_MANAGER_READY: "UI_MANAGER_READY",
  PALETTE_SELECTION_CLEARED: "PALETTE_SELECTION_CLEARED",

  // Drag & drop events
  DRAG_START: "DRAG_START",
  DRAG_END: "DRAG_END",
  DRAGGING: "DRAGGING",

  // Camera events
  CAMERA_ZOOM: "CAMERA_ZOOM",
};

/**
 * Type definitions for event payloads
 */
export interface EntitySelectPayload {
  type: string;
  config?: any;
}

export interface EntitySelectedPayload {
  entity: EditorEntity;
}

export interface PlaceEntityPayload {
  type: string;
  x: number;
  y: number;
  config?: any;
}

export interface EntityPlacedPayload {
  entity: EditorEntity;
}

export interface PropertyChangePayload {
  entity: EditorEntity;
  property: string;
  value: any;
}

export interface EntityUpdatedPayload {
  entity: EditorEntity;
  property: string;
  oldValue: any;
  newValue: any;
}

export interface RemoveEntityPayload {
  entity: EditorEntity;
}

export interface EntityRemovedPayload {
  entityType: string;
  entityId: string;
}

export interface FileLoadPayload {
  file: File;
}

export interface LevelLoadedPayload {
  levelData: any;
}

export interface DragPayload {
  entity: EditorEntity;
  x: number;
  y: number;
}

export interface CameraZoomPayload {
  zoom: number;
}
