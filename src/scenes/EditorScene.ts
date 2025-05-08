import { Scene } from "phaser";
import { TEXTURE_ATLAS, PHYSICS } from "../lib/constants";
import { EditorGrid } from "../editor/lib/EditorGrid";
import { EditorLevelHandler } from "../editor/lib/EditorLevelHandler";
import { setupAnimations } from "../lib/level-generation/createAnimations";
import { EditorUIManager } from "../editor/lib/EditorUIManager";
import { EntityManager } from "../editor/lib/EntityManager";
import { EditorEventBus } from "../editor/lib/EditorEventBus";
import { EditorEvents } from "../editor/lib/EditorEventTypes";
import { CameraPanManager } from "../editor/lib/input/CameraPanManager";

export class EditorScene extends Scene {
  // Components
  private entityManager!: EntityManager;
  private levelHandler!: EditorLevelHandler;
  // Grid renderer
  private grid!: EditorGrid;
  private cameraPanManager!: CameraPanManager;
  // UI bounds for input handling
  private uiBounds!: Phaser.Geom.Rectangle;

  constructor() {
    super("EditorScene");
  }

  preload() {
    this.load.setPath("assets");
    this.load.multiatlas(TEXTURE_ATLAS, "assets.json");
    this.load.json(PHYSICS, "physics.json");
  }

  create() {
    this.matter.world.enabled = false; // Disable physics in editor mode

    // Setup animations
    setupAnimations(this);

    // Create grid for drawing
    this.grid = new EditorGrid(this);

    // Default UI bounds - will be updated when UI is created
    this.uiBounds = new Phaser.Geom.Rectangle(0, 0, this.scale.width, 60);

    // Launch the scene responsible for displaying entities first
    this.scene.launch("EntityDisplayScene");

    // Launch the UI scene after the entity display scene
    this.scene.launch("EditorUIScene");

    // Get the UI scene (it should be launched now)
    const uiScene = this.scene.get("EditorUIScene");
    if (!uiScene) {
      console.error("EditorScene: Could not get launched EditorUIScene.");
      return;
    }

    // Listen for the UI Manager to be ready
    uiScene.events.once(
      "uiManagerReady",
      (uiManager: EditorUIManager) => {
        console.log("EditorScene: uiManagerReady event received.");
        // Initialize managers after UI manager is ready
        this.initializeManagers(uiManager);
      },
      this
    );

    // Ensure the UI Scene renders on top of the Entity Display Scene
    this.scene.bringToTop("EditorUIScene");

    // --- ADD Pointer Move Listener for Preview ---
    this.input.on(
      "pointermove",
      (pointer: Phaser.Input.Pointer) => {
        if (this.entityManager) {
          if (this.registry.get("isPlacementModeActive")) {
            this.entityManager.updatePreviewPosition(
              pointer.worldX,
              pointer.worldY
            );
          } else {
            // If not in placement mode, ensure any lingering preview is destroyed
            this.entityManager.destroyPlacementPreview();
          }
        }
      },
      this
    );
    // --- END Pointer Move Listener ---

    console.log("Level Editor create() finished initial setup.");
  }

  /**
   * Initializes EntityManager and LevelHandler once the UIManager is ready.
   */
  private initializeManagers(uiManager: EditorUIManager): void {
    console.log("EditorScene: Initializing managers...");

    // Initialize the entity manager
    this.entityManager = new EntityManager(this);

    // Set UI bounds for entity manager to handle input properly
    this.entityManager.setUIBounds(this.uiBounds);

    // Initialize level handler with entity manager
    this.levelHandler = new EditorLevelHandler(this.entityManager);

    // Initialize CameraPanManager AFTER grid is created
    if (this.grid) {
      this.cameraPanManager = new CameraPanManager(this, this.grid);
      console.log("EditorScene: CameraPanManager initialized.");
    } else {
      console.error(
        "EditorScene: Grid not available for CameraPanManager initialization."
      );
    }

    // Setup event handlers
    this.setupEditorEventHandlers();

    console.log("EditorScene: Managers initialized.");
  }

  /**
   * Sets up event listeners for UI interactions after managers are initialized.
   */
  private setupEditorEventHandlers(): void {
    // Clear existing listeners if any (safety measure)
    this.events.off("ENTITY_SELECT");
    this.events.off("PROPERTY_CHANGE");
    this.events.off("REMOVE_ENTITY");
    this.events.off("SAVE");
    this.events.off("LOAD");
    this.events.off("CLEAR");
    this.events.off("FILE_LOAD");
    this.events.off("PLACE_ENTITY");

    // Forward events from the scene event emitter to the centralized event bus
    const eventBus = EditorEventBus.getInstance();

    // Use UI_ prefix for scene events to distinguish from event bus events
    // Entity selection from palette
    this.events.on("UI_ENTITY_SELECT", (type: string, config?: any) => {
      console.log(`EditorScene: UI_ENTITY_SELECT received for type ${type}`);
      eventBus.emit(EditorEvents.ENTITY_SELECT, type, config);
    });

    // Property changes from inspector
    this.events.on(
      "UI_PROPERTY_CHANGE",
      (entity: any, property: string, value: any) => {
        console.log(`EditorScene: UI_PROPERTY_CHANGE received for ${property}`);
        eventBus.emit(EditorEvents.PROPERTY_CHANGE, entity, property, value);
      }
    );

    // Entity removal
    this.events.on("UI_REMOVE_ENTITY", (entity: any) => {
      console.log("EditorScene: UI_REMOVE_ENTITY received");
      eventBus.emit(EditorEvents.REMOVE_ENTITY, entity);
    });

    // Entity placement from drag operations
    this.events.on(
      "UI_PLACE_ENTITY",
      (data: { type: string; x: number; y: number; config: any }) => {
        console.log(
          `EditorScene: UI_PLACE_ENTITY received for type ${data.type}`
        );
        const worldPoint = this.cameras.main.getWorldPoint(data.x, data.y);
        eventBus.emit(EditorEvents.PLACE_ENTITY, {
          type: data.type,
          x: worldPoint.x,
          y: worldPoint.y,
          config: data.config,
        });
      }
    );

    // Level management events
    this.events.on("UI_SAVE", () => {
      this.levelHandler.saveLevel();
    });

    this.events.on("UI_LOAD", () => {
      const uiScene = this.scene.get("EditorUIScene") as Phaser.Scene & {
        getFileInput: () => HTMLInputElement | null;
      };
      uiScene.getFileInput()?.click();
    });

    this.events.on("UI_CLEAR", () => {
      this.levelHandler.clearLevel();
    });

    this.events.on("UI_FILE_LOAD", (file: File) => {
      this.levelHandler.handleFileLoad(file);
    });

    console.log("EditorScene: Event handlers set up.");
  }
}
