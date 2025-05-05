import { Scene } from "phaser";
import { EditorEntity } from "../editor/ui/Inspector";
import { TEXTURE_ATLAS, PHYSICS } from "../lib/constants";
import { EditorEntityManager } from "../editor/lib/EditorEntityManager";
import { EditorGrid } from "../editor/lib/EditorGrid";
import { EditorLevelHandler } from "../editor/lib/EditorLevelHandler";
import { setupAnimations } from "../lib/level-generation/createAnimations";
import Phaser from "phaser";
import { EditorUIManager } from "../editor/lib/EditorUIManager";

export class EditorScene extends Scene {
  // Components
  private entityManager!: EditorEntityManager;
  private levelHandler!: EditorLevelHandler;
  // Grid renderer
  private grid!: EditorGrid;
  // Spacebar-driven panning state
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private isSpacePanning: boolean = false;
  private panLastX: number = 0;
  private panLastY: number = 0;

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

    // Create and store grid for drawing
    this.grid = new EditorGrid(this);
    // Setup spacebar-driven pan: hold SPACE and drag to move grid
    this.spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && this.spaceKey.isDown) {
        this.isSpacePanning = true;
        this.panLastX = pointer.x;
        this.panLastY = pointer.y;
      }
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isSpacePanning && pointer.leftButtonDown()) {
        const dx = pointer.x - this.panLastX;
        const dy = pointer.y - this.panLastY;
        this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
        this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
        this.panLastX = pointer.x;
        this.panLastY = pointer.y;
        this.grid.resize();
      }
    });
    this.input.on("pointerup", () => {
      this.isSpacePanning = false;
    });

    // Launch the scene responsible for displaying entities *first*
    this.scene.launch("EntityDisplayScene");

    // Launch the UI scene *after* the entity display scene
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
        // Initialize managers *after* UI manager is ready
        this.initializeManagers(uiManager);
      },
      this
    );

    // Ensure the UI Scene renders on top of the Entity Display Scene
    this.scene.bringToTop("EditorUIScene");

    // // Launch the scene responsible for displaying entities on top <-- Comment out or remove the old launch call
    // this.scene.launch("EntityDisplayScene"); // <-- Comment out or remove the old launch call

    console.log("Level Editor create() finished initial setup.");
  }

  /**
   * Initializes EntityManager and LevelHandler once the UIManager is ready.
   */
  private initializeManagers(uiManager: EditorUIManager): void {
    console.log("EditorScene: Initializing managers...");
    // Provide the clearPaletteSelection callback to EntityManager
    this.entityManager = new EditorEntityManager(this, () => {
      uiManager.clearPaletteSelection();
    });
    this.levelHandler = new EditorLevelHandler(this.entityManager);

    // Setup event handlers that depend on entityManager
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

    // Setup event handlers for UI interactions
    this.events.on(
      "ENTITY_SELECT",
      (type: string, config?: any) => {
        this.entityManager.setSelectedEntityType(type, config);
      },
      this
    );

    this.events.on(
      "PROPERTY_CHANGE",
      (entity: EditorEntity, property: string, value: any) => {
        this.entityManager.updateEntityProperty(entity, property, value);
      },
      this
    );

    this.events.on(
      "REMOVE_ENTITY",
      (entity: EditorEntity) => {
        this.entityManager.removeEntity(entity);
      },
      this
    );

    // Add handler for PLACE_ENTITY event from PaletteButton drag operations
    this.events.on(
      "PLACE_ENTITY",
      (data: { type: string; x: number; y: number; config: any }) => {
        const worldPoint = this.cameras.main.getWorldPoint(data.x, data.y);
        this.entityManager.placeEntity(data.type, worldPoint.x, worldPoint.y);

        // No need to call updateEntityInLevelData as that's handled internally by placeEntity
      },
      this
    );

    this.events.on(
      "SAVE",
      () => {
        this.levelHandler.saveLevel();
      },
      this
    );

    this.events.on(
      "LOAD",
      () => {
        const uiScene = this.scene.get("EditorUIScene") as Phaser.Scene & {
          getFileInput: () => HTMLInputElement | null;
        };
        uiScene.getFileInput()?.click();
      },
      this
    );

    this.events.on(
      "CLEAR",
      () => {
        this.levelHandler.clearLevel();
      },
      this
    );

    this.events.on(
      "FILE_LOAD",
      (file: File) => {
        this.levelHandler.handleFileLoad(file);
      },
      this
    );

    console.log("EditorScene: Event handlers set up.");
  }
}
