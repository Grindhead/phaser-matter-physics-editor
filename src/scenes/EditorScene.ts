import { Scene } from "phaser";
import { EditorEntity } from "../editor/ui/Inspector";
import { TEXTURE_ATLAS, PHYSICS } from "../lib/constants";
import { EditorEntityManager } from "../editor/lib/EditorEntityManager";
import { EditorUIManager } from "../editor/lib/EditorUIManager";
import { EditorGrid } from "../editor/lib/EditorGrid";
import { EditorLevelHandler } from "../editor/lib/EditorLevelHandler";
import { setupAnimations } from "../lib/level-generation/createAnimations";
import Phaser from "phaser";

export class EditorScene extends Scene {
  // Components
  private entityManager!: EditorEntityManager;
  private uiManager!: EditorUIManager;
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

    // Initialize managers in correct order
    this.entityManager = new EditorEntityManager(this);
    this.levelHandler = new EditorLevelHandler(this.entityManager);

    // Create UI manager with callbacks
    const handleEntityTypeSelection = (type: string, config?: any) => {
      this.entityManager.setSelectedEntityType(type, config);
    };

    const handlePropertyChange = (
      entity: EditorEntity,
      property: string,
      value: any
    ) => {
      this.entityManager.updateEntityProperty(entity, property, value);
    };

    const handleRemoveEntity = (entity: EditorEntity) => {
      this.entityManager.removeEntity(entity);
    };

    this.uiManager = new EditorUIManager(
      this,
      handleEntityTypeSelection,
      handlePropertyChange,
      () => this.levelHandler.saveLevel(),
      () => this.uiManager.getFileInput()?.click(),
      () => this.levelHandler.clearLevel(),
      handleRemoveEntity
    );

    // Setup file loading
    this.uiManager.setupFileInput((file: File) =>
      this.levelHandler.handleFileLoad(file)
    );

    console.log("Level Editor initialized!");
  }

  update() {
    // No update logic needed as components handle their own updates
  }

  handleResize(gameSize: Phaser.Structs.Size) {
    // ... existing code ...
  }
}
