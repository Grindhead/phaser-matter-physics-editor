import { Scene } from "phaser";
import { Palette } from "../editor/ui/Palette";
import { Inspector, EditorEntity } from "../editor/ui/Inspector";
import { Toolbar } from "../editor/ui/Toolbar";
import { LevelDataManager, LevelData } from "../editor/lib/LevelData";
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  TEXTURE_ATLAS,
  PHYSICS,
} from "../lib/constants";
import { Platform, PlatformInterface } from "../entities/Platforms/Platform";
import { EnemyInterface } from "../entities/Enemies/EnemyBase";
import { EnemyLarge } from "../entities/Enemies/EnemyLarge";
import { EnemySmall } from "../entities/Enemies/EnemySmall";
import { CrateInterface } from "../entities/Crate/Crate";
import { BarrelInterface } from "../entities/Barrel/Barrel";
import { FinishLineInterface } from "../entities/Finish/Finish";

export class EditorScene extends Scene {
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private selectedEntityType: string | null = null;
  private selectedEntity: EditorEntity | null = null;
  private isEntityDragging: boolean = false;

  // UI components
  private palette: Palette | null = null;
  private inspector: Inspector | null = null;
  private toolbar: Toolbar | null = null;
  private fileInput: HTMLInputElement | null = null;

  // Level data
  private levelData: LevelData;
  private entities: EditorEntity[] = [];

  constructor() {
    super("EditorScene");
    this.levelData = LevelDataManager.createEmpty();
  }

  preload() {
    this.load.setPath("assets");
    this.load.multiatlas(TEXTURE_ATLAS, "assets.json");
    this.load.json(PHYSICS, "physics.json");
  }

  create() {
    console.log("EditorScene create method called");

    // Create grid using graphics
    this.createGrid();
    console.log("Grid created");

    // Setup camera controls
    this.setupCameraControls();
    console.log("Camera controls setup");

    // Create UI elements
    this.createUI();
    console.log("UI elements created");

    // Handle window resizing
    this.handleResizeEvents();
    console.log("Resize events handled");

    // Setup input handlers
    this.setupInputHandlers();
    console.log("Input handlers setup");

    console.log("Level Editor initialized!");
  }

  private createGrid() {
    console.log("Creating grid graphics");
    // Create a Graphics object for the grid
    const gridGraphics = this.add.graphics();

    // Set line style
    gridGraphics.lineStyle(1, 0x444444, 0.3);

    // Calculate grid dimensions based on camera size
    const width = this.cameras.main.width * 3; // Make grid larger than screen
    const height = this.cameras.main.height * 3;
    console.log("Grid dimensions:", width, "x", height);

    // Draw vertical lines
    for (let x = 0; x <= width; x += TILE_WIDTH) {
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, height);
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += TILE_HEIGHT) {
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(width, y);
    }

    // Stroke the lines
    gridGraphics.strokePath();
    console.log("Grid lines drawn");

    // Center the grid relative to (0,0)
    gridGraphics.setPosition(-width / 2, -height / 2);
    console.log("Grid positioned at", -width / 2, -height / 2);

    // Make sure the grid scrolls with the camera
    gridGraphics.setScrollFactor(1);
    console.log("Grid scroll factor set to 1");
  }

  private setupCameraControls() {
    // Handle middle-click (or right-click) camera panning
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown() || pointer.rightButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.cameras.main.scrollX +=
          (this.dragStartX - pointer.x) / this.cameras.main.zoom;
        this.cameras.main.scrollY +=
          (this.dragStartY - pointer.y) / this.cameras.main.zoom;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.input.on("pointerup", () => {
      this.isDragging = false;
    });

    // Add zoom with mouse wheel
    this.input.on(
      "wheel",
      (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
        const delta = deltaY > 0 ? 0.9 : 1.1;
        this.cameras.main.zoom *= delta;
      }
    );
  }

  private createUI() {
    // Create palette for entity selection
    this.palette = new Palette(this, { x: 10, y: 10, width: 200 }, (type) =>
      this.handleEntityTypeSelection(type)
    );

    // Create inspector for entity properties
    this.inspector = new Inspector(
      this,
      { x: this.scale.width - 210, y: 10, width: 200 },
      (entity, property, value) =>
        this.handlePropertyChange(entity, property, value)
    );

    // Create toolbar with save/load buttons
    const toolbarButtons = [
      { id: "save", label: "Save", onClick: () => this.saveLevel() },
      { id: "load", label: "Load", onClick: () => this.loadLevel() },
      { id: "clear", label: "Clear", onClick: () => this.clearLevel() },
    ];

    this.toolbar = new Toolbar(
      this,
      { x: (this.scale.width - 300) / 2, y: 10, width: 300 },
      toolbarButtons
    );

    // Create hidden file input for loading levels
    if (this.toolbar) {
      this.fileInput = this.toolbar.createFileInput((file) => {
        this.handleFileLoad(file);
      });
    }
  }

  private handleResizeEvents() {
    // Update UI positions on resize
    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      if (this.inspector) {
        this.inspector.updatePositionForResize(gameSize.width - 210, 10);
      }

      if (this.toolbar) {
        this.toolbar.updatePositionForResize((gameSize.width - 300) / 2, 10);
      }
    });
  }

  private setupInputHandlers() {
    // Setup click handler for entity placement and selection
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Skip if not left-click or if dragging camera
      if (!pointer.leftButtonDown() || this.isDragging) return;

      // Get world position (accounting for camera)
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      // Check if clicking on an existing entity for selection
      const clickedEntity = this.getEntityAtPosition(worldX, worldY);

      // If in placement mode (an entity type is selected)
      if (this.selectedEntityType) {
        if (clickedEntity && pointer.getDuration() > 300) {
          // Long press on an entity while in placement mode - select the entity
          this.selectEntity(clickedEntity);

          // Start entity dragging
          this.isEntityDragging = true;

          // Exit placement mode
          this.selectedEntityType = null;

          // Update UI to reflect we're no longer in placement mode
          if (this.palette) {
            this.palette.clearSelection();
          }
        } else {
          // Regular click in placement mode - place the entity
          this.placeEntity(this.selectedEntityType, worldX, worldY);
        }
      } else {
        // Not in placement mode - select or deselect entities
        if (clickedEntity) {
          // Select the entity
          this.selectEntity(clickedEntity);

          // Start entity dragging
          this.isEntityDragging = true;
        } else {
          // Clicking empty space - deselect current entity
          this.selectEntity(null);
        }
      }
    });

    // Handle entity dragging
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (
        this.isEntityDragging &&
        this.selectedEntity &&
        pointer.leftButtonDown()
      ) {
        // Get world position (accounting for camera)
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;

        // Calculate snap position
        const snappedX =
          Math.floor(worldX / TILE_WIDTH) * TILE_WIDTH + TILE_WIDTH / 2;
        const snappedY =
          Math.floor(worldY / TILE_HEIGHT) * TILE_HEIGHT + TILE_HEIGHT / 2;

        // Update entity position
        this.selectedEntity.x = snappedX;
        this.selectedEntity.y = snappedY;

        // Update visual representation based on entity type
        if (this.selectedEntity.type === "platform") {
          (this.selectedEntity.gameObject as Platform).setPosition(
            snappedX,
            snappedY
          );
        } else if (
          this.selectedEntity.type === "enemy-large" ||
          this.selectedEntity.type === "enemy-small"
        ) {
          (
            this.selectedEntity.gameObject as EnemyLarge | EnemySmall
          ).setPosition(snappedX, snappedY);
        } else {
          (
            this.selectedEntity.gameObject as Phaser.GameObjects.Image
          ).setPosition(snappedX, snappedY);
        }

        // Update entity data
        this.updateEntityInLevelData(this.selectedEntity);

        // Update inspector if it exists
        if (this.inspector) {
          this.inspector.selectEntity(this.selectedEntity);
        }
      }
    });

    // Handle end of entity dragging
    this.input.on("pointerup", (_pointer: Phaser.Input.Pointer) => {
      this.isEntityDragging = false;
    });
  }

  private handleEntityTypeSelection(type: string) {
    // Store the selected entity type
    this.selectedEntityType = type;

    // If an entity is currently selected, deselect it
    // This way we're in "placement mode" rather than "edit mode"
    if (this.selectedEntity) {
      this.selectEntity(null);
    }

    // No need to call palette.selectButton here since this method
    // is already called by the palette when a button is selected
  }

  private placeEntity(type: string, x: number, y: number) {
    // Snap to grid
    const snappedX = Math.floor(x / TILE_WIDTH) * TILE_WIDTH + TILE_WIDTH / 2;
    const snappedY =
      Math.floor(y / TILE_HEIGHT) * TILE_HEIGHT + TILE_HEIGHT / 2;

    let entity: EditorEntity | null = null;

    switch (type) {
      case "platform":
        entity = this.createPlatform(snappedX, snappedY);
        break;
      case "enemy-large":
        entity = this.createEnemy(snappedX, snappedY, "enemy-large");
        break;
      case "enemy-small":
        entity = this.createEnemy(snappedX, snappedY, "enemy-small");
        break;
      case "crate-small":
        entity = this.createCrate(snappedX, snappedY, "small");
        break;
      case "crate-big":
        entity = this.createCrate(snappedX, snappedY, "big");
        break;
      case "barrel":
        entity = this.createBarrel(snappedX, snappedY);
        break;
      case "finish-line":
        entity = this.createFinishLine(snappedX, snappedY);
        break;
    }

    if (entity) {
      this.entities.push(entity);

      // Don't auto-select the entity after placement
      // This allows continued placement of the same entity type

      // We'll still highlight the newly placed entity briefly
      this.temporarilyHighlightEntity(entity);
    }
  }

  /**
   * Temporarily highlights an entity without selecting it (for visual feedback)
   */
  private temporarilyHighlightEntity(entity: EditorEntity): void {
    // Apply highlight tint
    if (entity.type === "platform") {
      const platform = entity.gameObject as Platform;
      platform.setTint(0x00ffff);

      // Clear tint after a short delay
      this.time.delayedCall(300, () => {
        platform.clearTint();
      });
    } else if (entity.type === "enemy-large" || entity.type === "enemy-small") {
      const enemy = entity.gameObject as EnemyLarge | EnemySmall;
      enemy.setTint(0x00ffff);

      // Clear tint after a short delay
      this.time.delayedCall(300, () => {
        enemy.clearTint();
      });
    } else {
      const image = entity.gameObject as Phaser.GameObjects.Image;
      image.setTint(0x00ffff);

      // Clear tint after a short delay
      this.time.delayedCall(300, () => {
        image.clearTint();
      });
    }
  }

  private createPlatform(x: number, y: number): EditorEntity {
    // Create platform data with default horizontal orientation
    const platformData: PlatformInterface = {
      scene: this,
      x,
      y,
      segmentCount: 5,
      id: `platform-${this.levelData.platforms.length}`,
      isVertical: false, // Default to horizontal
    };

    // Add to level data
    this.levelData.platforms.push(platformData);

    // Create actual platform instance using the Platform class
    const platform = new Platform(
      this,
      x,
      y,
      platformData.segmentCount,
      platformData.id,
      platformData.isVertical // Use the correct value from data
    );

    // Return entity
    return {
      type: "platform",
      x,
      y,
      gameObject: platform,
      data: platformData,
    };
  }

  private createEnemy(
    x: number,
    y: number,
    type: EnemyInterface["type"]
  ): EditorEntity {
    const enemyData: EnemyInterface = {
      x,
      y,
      type,
    };

    // Add to level data
    this.levelData.enemies.push(enemyData);

    // Create actual enemy instance
    let enemyInstance: EnemyLarge | EnemySmall;
    if (type === "enemy-large") {
      enemyInstance = new EnemyLarge(this, x, y);
    } else {
      enemyInstance = new EnemySmall(this, x, y);
    }

    // Ensure it's interactive for selection
    enemyInstance.setInteractive();

    // Return entity
    return {
      type: type, // Store the specific type
      x,
      y,
      gameObject: enemyInstance,
      data: enemyData,
    };
  }

  private createCrate(
    x: number,
    y: number,
    type: "small" | "big"
  ): EditorEntity {
    const crateData: CrateInterface = {
      scene: this,
      x,
      y,
      type,
    };

    // Add to level data
    this.levelData.crates.push(crateData);

    // Create visual representation with texture atlas
    const crateImage = this.add
      .image(x, y, TEXTURE_ATLAS, `crates/crate-${type}.png`)
      .setInteractive()
      .setDepth(15);

    // Return entity
    return {
      type: `crate-${type}`,
      x,
      y,
      gameObject: crateImage,
      data: crateData,
    };
  }

  private createBarrel(x: number, y: number): EditorEntity {
    const barrelData: BarrelInterface = {
      scene: this,
      x,
      y,
    };

    // Add to level data
    this.levelData.barrels.push(barrelData);

    // Create visual representation with texture atlas
    const barrelImage = this.add
      .image(x, y, TEXTURE_ATLAS, "barrel/barrel.png")
      .setInteractive()
      .setDepth(15);

    // Return entity
    return {
      type: "barrel",
      x,
      y,
      gameObject: barrelImage,
      data: barrelData,
    };
  }

  private createFinishLine(x: number, y: number): EditorEntity {
    const finishLineData: FinishLineInterface = {
      scene: this,
      x,
      y,
    };

    // Handle case where a finish line already exists
    if (this.levelData.finishLine) {
      // Remove existing finish line
      const existingIndex = this.entities.findIndex(
        (e) => e.type === "finish-line"
      );
      if (existingIndex >= 0) {
        const existingEntity = this.entities[existingIndex];
        existingEntity.gameObject.destroy();
        this.entities.splice(existingIndex, 1);
      }
    }

    // Set as the new finish line
    this.levelData.finishLine = finishLineData;

    // Create visual representation with texture atlas
    const finishLineImage = this.add
      .image(x, y, TEXTURE_ATLAS, "finish/finish-line.png")
      .setInteractive()
      .setDepth(5);

    // Return entity
    return {
      type: "finish-line",
      x,
      y,
      gameObject: finishLineImage,
      data: finishLineData,
    };
  }

  private getEntityAtPosition(x: number, y: number): EditorEntity | null {
    // Check if position is within any entity's bounds
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      const gameObject = entity.gameObject;

      if (entity.type === "platform") {
        // For platforms, we need to check the platform body bounds
        const platform = gameObject as Platform;
        const bounds = platform.getBounds();
        if (bounds.contains(x, y)) {
          return entity;
        }
      } else if (
        entity.type === "enemy-large" ||
        entity.type === "enemy-small"
      ) {
        // For enemies, check their bounds
        const enemy = gameObject as EnemyLarge | EnemySmall;
        const bounds = enemy.getBounds();
        if (bounds.contains(x, y)) {
          return entity;
        }
      } else {
        // For other entities using images
        const image = gameObject as Phaser.GameObjects.Image;
        const bounds = image.getBounds();
        if (bounds.contains(x, y)) {
          return entity;
        }
      }
    }

    return null;
  }

  private selectEntity(entity: EditorEntity | null) {
    // Deselect previously selected entity
    if (this.selectedEntity) {
      if (this.selectedEntity.type === "platform") {
        // For platforms, we use setTint directly on the platform sprite
        const platform = this.selectedEntity.gameObject as Platform;
        platform.clearTint();
      } else if (
        this.selectedEntity.type === "enemy-large" ||
        this.selectedEntity.type === "enemy-small"
      ) {
        // For enemies, clear tint
        const enemy = this.selectedEntity.gameObject as EnemyLarge | EnemySmall;
        enemy.clearTint();
      } else {
        // For other entities using images
        (
          this.selectedEntity.gameObject as Phaser.GameObjects.Image
        ).clearTint();
      }
    }

    this.selectedEntity = entity;

    // Highlight newly selected entity
    if (entity) {
      if (entity.type === "platform") {
        // For platforms, we use setTint directly on the platform sprite
        const platform = entity.gameObject as Platform;
        platform.setTint(0x00ffff);
      } else if (
        entity.type === "enemy-large" ||
        entity.type === "enemy-small"
      ) {
        // For enemies, set tint
        const enemy = entity.gameObject as EnemyLarge | EnemySmall;
        enemy.setTint(0x00ffff);
      } else {
        // For other entities using images
        (entity.gameObject as Phaser.GameObjects.Image).setTint(0x00ffff);
      }
    }

    // Update inspector
    if (this.inspector) {
      this.inspector.selectEntity(entity);
    }
  }

  private handlePropertyChange(
    entity: EditorEntity,
    property: string,
    value: any
  ) {
    if (!entity) return;

    // Update entity properties
    switch (property) {
      case "x":
        const snappedX =
          Math.floor(value / TILE_WIDTH) * TILE_WIDTH + TILE_WIDTH / 2;
        entity.x = snappedX;

        // Cast to appropriate type based on entity type
        if (entity.type === "platform") {
          (entity.gameObject as Platform).setPosition(snappedX, entity.y);
        } else if (
          entity.type === "enemy-large" ||
          entity.type === "enemy-small"
        ) {
          (entity.gameObject as EnemyLarge | EnemySmall).setPosition(
            snappedX,
            entity.y
          );
        } else {
          (entity.gameObject as Phaser.GameObjects.Image).setPosition(
            snappedX,
            entity.y
          );
        }

        this.updateEntityInLevelData(entity);
        break;
      case "y":
        const snappedY =
          Math.floor(value / TILE_HEIGHT) * TILE_HEIGHT + TILE_HEIGHT / 2;
        entity.y = snappedY;

        // Cast to appropriate type based on entity type
        if (entity.type === "platform") {
          (entity.gameObject as Platform).setPosition(entity.x, snappedY);
        } else if (
          entity.type === "enemy-large" ||
          entity.type === "enemy-small"
        ) {
          (entity.gameObject as EnemyLarge | EnemySmall).setPosition(
            entity.x,
            snappedY
          );
        } else {
          (entity.gameObject as Phaser.GameObjects.Image).setPosition(
            entity.x,
            snappedY
          );
        }

        this.updateEntityInLevelData(entity);
        break;
      case "id":
        if (entity.type === "platform") {
          // Get the platform data and update its ID
          const platformData = entity.data as PlatformInterface;
          const platform = entity.gameObject as Platform;

          // Update the ID in both the data and the platform object
          platformData.id = value;
          platform.id = value;

          this.updateEntityInLevelData(entity);
        }
        break;
      case "segmentCount":
        if (entity.type === "platform") {
          // Get the platform data and original platform object
          const platformData = entity.data as PlatformInterface;
          const oldPlatform = entity.gameObject as Platform;

          // Update the segment count
          platformData.segmentCount = value;

          // Store position
          const { x, y } = oldPlatform;

          // Destroy old platform
          oldPlatform.destroy();

          // Create new platform with updated segment count
          const newPlatform = new Platform(
            this,
            x,
            y,
            value,
            `platform-${Date.now()}`, // Ensure unique ID
            platformData.isVertical // Pass the existing isVertical value
          );

          // Update entity reference
          entity.gameObject = newPlatform;

          // Select the new platform
          this.selectEntity(entity);

          this.updateEntityInLevelData(entity);
        }
        break;
      case "orientation":
        if (entity.type === "platform") {
          // Get the platform data and original platform object
          const platformData = entity.data as PlatformInterface;
          const oldPlatform = entity.gameObject as Platform;

          // Update the orientation property in the data
          platformData.isVertical = value; // Value is already boolean (true/false)

          // Store position
          const { x, y } = oldPlatform;

          // Destroy old platform
          oldPlatform.destroy();

          // Create new platform with updated orientation
          const newPlatform = new Platform(
            this,
            x,
            y,
            platformData.segmentCount,
            `platform-${Date.now()}`, // Ensure unique ID
            platformData.isVertical // Pass the updated boolean value
          );

          // Update entity reference
          entity.gameObject = newPlatform;

          // Select the new platform
          this.selectEntity(entity);

          this.updateEntityInLevelData(entity);
        }
        break;
      case "enemyType":
        // Handle enemy type changes (if needed - currently enemies are recreated on type change)
        if (entity.type === "enemy-large" || entity.type === "enemy-small") {
          // Get enemy data and current position
          const enemyData = entity.data as EnemyInterface;
          const oldEnemy = entity.gameObject as EnemyLarge | EnemySmall;
          const { x, y } = oldEnemy;

          // Update enemy type in data
          enemyData.type = value;

          // Destroy old enemy
          oldEnemy.destroy();

          // Create new enemy with updated type
          let newEnemy: EnemyLarge | EnemySmall;
          if (value === "enemy-large") {
            newEnemy = new EnemyLarge(this, x, y);
          } else {
            newEnemy = new EnemySmall(this, x, y);
          }

          // Ensure it's interactive for selection
          newEnemy.setInteractive();

          // Update entity reference
          entity.gameObject = newEnemy;
          entity.type = value;

          // Select the new enemy
          this.selectEntity(entity);

          this.updateEntityInLevelData(entity);
        }
        break;
    }
  }

  private updateEntityInLevelData(entity: EditorEntity) {
    if (!entity) return;

    switch (entity.type) {
      case "platform":
        const platformIndex = this.levelData.platforms.findIndex(
          (p) => p === entity.data
        );
        if (platformIndex >= 0) {
          const platformData = entity.data as PlatformInterface;
          this.levelData.platforms[platformIndex] = {
            ...platformData,
            x: entity.x,
            y: entity.y,
          };
        }
        break;
      case "enemy-large":
      case "enemy-small":
        const enemyIndex = this.levelData.enemies.findIndex(
          (e) => e === entity.data
        );
        if (enemyIndex >= 0) {
          const enemyData = entity.data as EnemyInterface;
          this.levelData.enemies[enemyIndex] = {
            ...enemyData,
            x: entity.x,
            y: entity.y,
          };
        }
        break;
      case "barrel":
        const barrelIndex = this.levelData.barrels.findIndex(
          (b) => b === entity.data
        );
        if (barrelIndex >= 0) {
          this.levelData.barrels[barrelIndex] = {
            scene: this,
            x: entity.x,
            y: entity.y,
          };
        }
        break;
      case "crate-small":
      case "crate-big":
        const crateIndex = this.levelData.crates.findIndex(
          (c) => c === entity.data
        );
        if (crateIndex >= 0) {
          const crateData = entity.data as CrateInterface;
          this.levelData.crates[crateIndex] = {
            ...crateData,
            x: entity.x,
            y: entity.y,
          };
        }
        break;
      case "finish-line":
        if (this.levelData.finishLine === entity.data) {
          this.levelData.finishLine = {
            scene: this,
            x: entity.x,
            y: entity.y,
          };
        }
        break;
    }
  }

  private saveLevel() {
    const filename = prompt("Enter level filename:", "level.json");
    if (filename) {
      LevelDataManager.saveToFile(this.levelData, filename);
    }
  }

  private loadLevel() {
    if (this.fileInput) {
      this.fileInput.click();
    }
  }

  private handleFileLoad(file: File) {
    LevelDataManager.loadFromFile(file)
      .then((levelData) => {
        this.clearLevel();
        this.levelData = levelData;
        this.populateEntitiesFromLevelData();
      })
      .catch((error) => {
        console.error("Error loading level:", error);
        alert("Error loading level file.");
      });
  }

  private clearLevel() {
    // Destroy all entity game objects
    this.entities.forEach((entity) => {
      entity.gameObject.destroy();
    });

    // Clear arrays
    this.entities = [];
    this.levelData = LevelDataManager.createEmpty();

    // Deselect any selected entity
    this.selectEntity(null);
  }

  private populateEntitiesFromLevelData() {
    // Create platform entities
    this.levelData.platforms.forEach((platformData) => {
      // Create actual platform instance using the Platform class
      const platform = new Platform(
        this,
        platformData.x,
        platformData.y,
        platformData.segmentCount,
        `platform-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
        platformData.isVertical // Use the loaded isVertical value
      );

      this.entities.push({
        type: "platform",
        x: platformData.x,
        y: platformData.y,
        gameObject: platform,
        data: platformData,
      });
    });

    // Create enemy entities
    this.levelData.enemies.forEach((enemyData) => {
      let enemyInstance: EnemyLarge | EnemySmall;
      if (enemyData.type === "enemy-large") {
        enemyInstance = new EnemyLarge(this, enemyData.x, enemyData.y);
      } else {
        enemyInstance = new EnemySmall(this, enemyData.x, enemyData.y);
      }

      // Ensure it's interactive for selection
      enemyInstance.setInteractive();

      this.entities.push({
        type: enemyData.type, // Use the specific type from data
        x: enemyData.x,
        y: enemyData.y,
        gameObject: enemyInstance,
        data: enemyData,
      });
    });

    // Create barrel entities
    this.levelData.barrels.forEach((barrelData) => {
      const barrelImage = this.add
        .image(barrelData.x, barrelData.y, TEXTURE_ATLAS, "barrel/barrel.png")
        .setInteractive()
        .setDepth(15);

      this.entities.push({
        type: "barrel",
        x: barrelData.x,
        y: barrelData.y,
        gameObject: barrelImage,
        data: barrelData,
      });
    });

    // Create crate entities
    this.levelData.crates.forEach((crateData) => {
      const crateImage = this.add
        .image(
          crateData.x,
          crateData.y,
          TEXTURE_ATLAS,
          `crates/crate-${crateData.type}.png`
        )
        .setInteractive()
        .setDepth(15);

      this.entities.push({
        type: `crate-${crateData.type}`,
        x: crateData.x,
        y: crateData.y,
        gameObject: crateImage,
        data: crateData,
      });
    });

    // Create finish line entity if it exists
    if (this.levelData.finishLine) {
      const finishLineData = this.levelData.finishLine;
      const finishLineImage = this.add
        .image(
          finishLineData.x,
          finishLineData.y,
          TEXTURE_ATLAS,
          "finish/finish-line.png"
        )
        .setInteractive()
        .setDepth(5);

      this.entities.push({
        type: "finish-line",
        x: finishLineData.x,
        y: finishLineData.y,
        gameObject: finishLineImage,
        data: finishLineData,
      });
    }
  }

  update() {
    // Update logic for editor
  }
}
