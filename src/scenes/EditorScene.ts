import { Scene } from "phaser";
import { EditorEntity } from "../editor/ui/Inspector";
import { TEXTURE_ATLAS, PHYSICS } from "../lib/constants";
import { EditorEntityManager } from "../editor/lib/EditorEntityManager";
import { EditorUIManager } from "../editor/lib/EditorUIManager";
import { EditorGrid } from "../editor/lib/EditorGrid";
import { EditorLevelHandler } from "../editor/lib/EditorLevelHandler";
import { setupAnimations } from "../lib/level-generation/createAnimations";

export class EditorScene extends Scene {
  // Components
  private entityManager!: EditorEntityManager;
  private uiManager!: EditorUIManager;
  private levelHandler!: EditorLevelHandler;

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

    // Create grid
    new EditorGrid(this);

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
}
