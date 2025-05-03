import Phaser from "phaser";
import { Palette } from "../ui/palette";
import { Inspector, InspectorConfig, EditorEntity } from "../ui/Inspector";
import { Toolbar, ToolbarConfig, ToolbarButton } from "../ui/Toolbar";
import { Grid } from "../lib/Grid";
import {
  LevelDataManager,
  SerializedLevel,
  SerializedPlatform,
  SerializedEnemy,
  SerializedCrate,
  SerializedBarrel,
  SerializedFinishLine,
} from "../lib/LevelDataManager";
import { Platform } from "../../entities/Terrain/Platform";
import { EnemyLarge } from "../../entities/Enemies/EnemyLarge";
import { EnemySmall } from "../../entities/Enemies/EnemySmall";
import { CrateSmall } from "../../entities/Items/CrateSmall";
import { CrateBig } from "../../entities/Items/CrateBig";
import { Barrel } from "../../entities/Items/Barrel";
import { FinishLine } from "../../entities/Items/FinishLine";

export class EditorScene extends Phaser.Scene {
  private palette!: Palette;
  private inspector!: Inspector;
  private toolbar!: Toolbar;
  private grid!: Grid;
  private levelDataManager!: LevelDataManager;

  // Removed placedObjects array
  // private placedObjects: Phaser.GameObjects.GameObject[] = [];
  private platformLayer!: Phaser.GameObjects.Layer;
  private entityLayer!: Phaser.GameObjects.Layer;

  private selectedObject: Phaser.GameObjects.GameObject | null = null;
  private selectedEntityType: string | null = null;
  private gridSnapSize: number = 32; // Example grid size

  private cameraControls!: Phaser.Cameras.Controls.SmoothedKeyControl;
  private graphics!: Phaser.GameObjects.Graphics; // For grid drawing

  constructor() {
    super("EditorScene");
  }

  preload() {
    // Load necessary assets (spritesheets, etc.)
    this.load.atlas(
      "platform-atlas",
      "assets/sprites/platform/platform-atlas.png",
      "assets/sprites/platform/platform-atlas.json"
    );
    this.load.json(
      "platform-physics",
      "assets/sprites/platform/platform-physics.json"
    );
    this.load.atlas(
      "character-atlas",
      "assets/sprites/character/character-atlas.png",
      "assets/sprites/character/character-atlas.json"
    );
    this.load.json(
      "character-physics",
      "assets/sprites/character/character-physics.json"
    );
    this.load.atlas(
      "items-atlas",
      "assets/sprites/items/items-atlas.png",
      "assets/sprites/items/items-atlas.json"
    );
    this.load.json("items-physics", "assets/sprites/items/items-physics.json");
    this.load.atlas(
      "enemies-atlas",
      "assets/sprites/enemies/enemies-atlas.png",
      "assets/sprites/enemies/enemies-atlas.json"
    );
    this.load.json(
      "enemies-physics",
      "assets/sprites/enemies/enemies-physics.json"
    );
  }

  create() {
    this.graphics = this.add.graphics();
    this.grid = new Grid(this, this.graphics, this.gridSnapSize);

    // Initialize layers
    this.platformLayer = this.add.layer();
    this.entityLayer = this.add.layer();

    this.palette = new Palette(
      this,
      { x: 10, y: 10, width: 150 },
      (type, config) => {
        this.selectedEntityType = type;
        this.setSelectedObject(null); // Deselect any object when choosing from palette
        console.log(`Selected entity type: ${type}`);
        // TODO: Handle config if necessary (e.g., for platforms needing pre-config)
      }
    );

    this.inspector = new Inspector(
      this,
      { x: this.scale.width - 210, y: 10, width: 200 },
      (editorEntity, property, value) => {
        // Check if the entity from the inspector matches the currently selected GameObject
        if (
          this.selectedObject &&
          this.selectedObject === editorEntity.gameObject
        ) {
          this.updateEntityProperty(this.selectedObject, property, value);
        }
      }
    );

    // Define Toolbar buttons with onClick handlers
    const toolbarButtons: ToolbarButton[] = [
      {
        id: "save",
        label: "Save",
        onClick: () => {
          this.levelDataManager.saveLevel(
            this.platformLayer.list as any[], // Cast for simplicity, improve type later if needed
            this.entityLayer.list as any[] // Cast for simplicity
          );
        },
      },
      {
        id: "load",
        label: "Load",
        onClick: () => {
          const fileInput = this.toolbar.createFileInput((file: File) => {
            this.levelDataManager
              .loadLevel(file)
              .then((levelData: SerializedLevel) => {
                this.clearLevel();
                this.populateLevel(levelData);
              })
              .catch((error: Error) => {
                console.error("Failed to load level:", error);
              })
              .finally(() => {
                if (fileInput.parentNode) {
                  fileInput.parentNode.removeChild(fileInput);
                }
              });
          });
          fileInput.click();
        },
      },
    ];

    // Corrected Toolbar instantiation
    this.toolbar = new Toolbar(
      this,
      { x: this.scale.width / 2 - 100, y: 10, width: 200 },
      toolbarButtons
    );

    this.levelDataManager = new LevelDataManager(this);

    this.setupCamera();
    this.setupInput();

    this.scale.on("resize", this.handleResize, this);
    this.handleResize(this.scale.gameSize); // Initial positioning

    this.grid.drawGrid(); // Draw initial grid

    console.log("Editor Scene Created");
    // Load a default or previously saved level if desired
    // this.loadLevel();
  }

  // ... existing setupCamera, setupInput methods ...

  setupCamera() {
    // ... existing camera setup ...
    this.cameras.main.setBackgroundColor("#333333");

    // Zoom and Pan controls
    const cursors = this.input.keyboard!.createCursorKeys();
    const controlConfig = {
      camera: this.cameras.main,
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      zoomIn: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
      zoomOut: this.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.MINUS
      ),
      acceleration: 0.5,
      drag: 0.01,
      maxSpeed: 1.0,
    };
    this.cameraControls = new Phaser.Cameras.Controls.SmoothedKeyControl(
      controlConfig
    );

    this.input.on(
      "wheel",
      (
        pointer: Phaser.Input.Pointer,
        gameObjects: Phaser.GameObjects.GameObject[],
        deltaX: number,
        deltaY: number,
        deltaZ: number
      ) => {
        if (deltaY > 0) {
          this.cameras.main.zoom *= 0.9;
        } else if (deltaY < 0) {
          this.cameras.main.zoom *= 1.1;
        }
        this.cameras.main.zoom = Phaser.Math.Clamp(
          this.cameras.main.zoom,
          0.2,
          3
        );
        this.grid.drawGrid(); // Redraw grid on zoom
      }
    );

    // Simple drag pan
    let dragStartX = 0;
    let dragStartY = 0;
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 1) {
        // Middle mouse button
        dragStartX = pointer.x;
        dragStartY = pointer.y;
      }
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown()) {
        const dx = pointer.x - dragStartX;
        const dy = pointer.y - dragStartY;
        this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
        this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
        dragStartX = pointer.x;
        dragStartY = pointer.y;
        this.grid.drawGrid(); // Redraw grid on pan
      }
    });
  }

  setupInput() {
    this.input.on("pointerdown", this.handlePointerDown, this);
    // Add listeners for pointer move and up if implementing dragging

    // Add keyboard listeners for delete
    this.input.keyboard?.on(
      "keydown-DELETE",
      this.handleDeleteKeyPressed,
      this
    );
    this.input.keyboard?.on(
      "keydown-BACKSPACE",
      this.handleDeleteKeyPressed,
      this
    );
    console.log("Keyboard delete listeners added.");
  }

  handlePointerDown(pointer: Phaser.Input.Pointer) {
    // Ignore clicks on UI elements
    if (this.isPointerOverUI(pointer)) {
      return;
    }

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridX =
      Math.floor(worldPoint.x / this.gridSnapSize) * this.gridSnapSize +
      this.gridSnapSize / 2;
    const gridY =
      Math.floor(worldPoint.y / this.gridSnapSize) * this.gridSnapSize +
      this.gridSnapSize / 2;

    // First check if clicking on an existing object (check entityLayer first, then platformLayer)
    let clickedObject: Phaser.GameObjects.GameObject | null = null;
    const hitAreaSize = 16; // Adjust as needed for easier selection

    // Check Entity Layer
    for (const obj of [...this.entityLayer.list].reverse()) {
      // Reverse to check topmost first
      if (
        obj instanceof Phaser.GameObjects.Image ||
        obj instanceof Phaser.GameObjects.Sprite ||
        obj instanceof Platform
      ) {
        // Check if object has bounds
        // Use getBounds for potentially rotated/scaled objects or simple check for basic sprites
        const bounds = (obj as any).getBounds
          ? (obj as any).getBounds()
          : new Phaser.Geom.Rectangle(
              obj.x - obj.width / 2,
              obj.y - obj.height / 2,
              obj.width,
              obj.height
            );
        // Slightly enlarge bounds for easier clicking if needed, or use a fixed hit area around pointer
        const interactiveBounds = new Phaser.Geom.Rectangle(
          bounds.centerX - hitAreaSize,
          bounds.centerY - hitAreaSize,
          hitAreaSize * 2,
          hitAreaSize * 2
        );
        if (interactiveBounds.contains(worldPoint.x, worldPoint.y)) {
          clickedObject = obj;
          break;
        }
      }
    }

    // Check Platform Layer if nothing found in entity layer
    if (!clickedObject) {
      for (const obj of [...this.platformLayer.list].reverse()) {
        if (
          obj instanceof Phaser.GameObjects.Image ||
          obj instanceof Phaser.GameObjects.Sprite ||
          obj instanceof Platform
        ) {
          const bounds = (obj as any).getBounds
            ? (obj as any).getBounds()
            : new Phaser.Geom.Rectangle(
                obj.x - obj.width / 2,
                obj.y - obj.height / 2,
                obj.width,
                obj.height
              );
          const interactiveBounds = new Phaser.Geom.Rectangle(
            bounds.centerX - hitAreaSize,
            bounds.centerY - hitAreaSize,
            hitAreaSize * 2,
            hitAreaSize * 2
          );
          if (interactiveBounds.contains(worldPoint.x, worldPoint.y)) {
            clickedObject = obj;
            break;
          }
        }
      }
    }

    if (clickedObject) {
      // Select the clicked object
      this.setSelectedObject(clickedObject);
      this.selectedEntityType = null; // Deselect palette type
      console.log("Selected object:", clickedObject);
    } else if (this.selectedEntityType) {
      // Place a new object if a type is selected from the palette
      this.placeEntity(this.selectedEntityType, gridX, gridY);
    } else {
      // Clicked on empty space with nothing selected
      this.setSelectedObject(null);
    }
  }

  placeEntity(entityType: string, x: number, y: number, properties?: any) {
    let entity: Phaser.GameObjects.GameObject | null = null;

    switch (entityType) {
      case "platform":
        const segmentCount = properties?.segmentCount ?? 5;
        const isVertical = properties?.isVertical ?? false;
        const platform = new Platform(
          this,
          `platform-${Date.now()}`,
          x,
          y,
          segmentCount,
          isVertical
        );
        entity = platform;
        this.platformLayer.add(platform);
        platform.setDepth(10); // Use numeric depth
        break;
      case "enemy-large":
        const enemyLarge = new EnemyLarge(this, x, y);
        entity = enemyLarge;
        this.entityLayer.add(enemyLarge);
        enemyLarge.setDepth(15); // Use numeric depth
        break;
      case "enemy-small":
        const enemySmall = new EnemySmall(this, x, y);
        entity = enemySmall;
        this.entityLayer.add(enemySmall);
        enemySmall.setDepth(15); // Use numeric depth
        break;
      case "crate-small":
        const crateSmall = new CrateSmall(this, x, y);
        entity = crateSmall;
        this.entityLayer.add(crateSmall);
        crateSmall.setDepth(15); // Use numeric depth
        break;
      case "crate-big":
        const crateBig = new CrateBig(this, x, y);
        entity = crateBig;
        this.entityLayer.add(crateBig);
        crateBig.setDepth(15); // Use numeric depth
        break;
      case "barrel":
        const barrel = new Barrel(this, x, y);
        entity = barrel;
        this.entityLayer.add(barrel);
        barrel.setDepth(15); // Use numeric depth
        break;
      case "finish-line":
        const finishLine = new FinishLine(this, x, y);
        entity = finishLine;
        this.entityLayer.add(finishLine);
        finishLine.setDepth(20); // Use numeric depth
        break;
      // Add cases for other entity types
      default:
        console.warn(`Unknown entity type: ${entityType}`);
    }

    if (entity) {
      (entity as any).entityType = entityType;
      entity.setInteractive();
      console.log(`Placed ${entityType} at (${x}, ${y})`);
      this.setSelectedObject(entity);
      this.selectedEntityType = null;
    }
  }

  updateEntityProperty(
    entity: Phaser.GameObjects.GameObject,
    property: string,
    value: any
  ) {
    console.log(`Updating property ${property} to ${value} for`, entity);
    if (
      entity instanceof Platform &&
      (property === "segmentCount" || property === "isVertical")
    ) {
      const oldPlatform = entity;
      const newProps = {
        segmentCount:
          property === "segmentCount" ? value : oldPlatform.segmentCount,
        isVertical: property === "isVertical" ? value : oldPlatform.isVertical,
      };
      const x = oldPlatform.x;
      const y = oldPlatform.y;
      this.platformLayer.remove(oldPlatform, true);
      const newPlatform = new Platform(
        this,
        `platform-${Date.now()}`,
        x,
        y,
        newProps.segmentCount,
        newProps.isVertical
      );
      this.platformLayer.add(newPlatform);
      newPlatform.setDepth(10); // Use numeric depth
      (newPlatform as any).entityType = "platform";
      newPlatform.setInteractive();
      this.setSelectedObject(newPlatform);

      // Update Inspector - need to adapt since Inspector expects EditorEntity
      // This requires fetching the full EditorEntity data associated with the newPlatform
      // Or modifying Inspector to accept GameObject or updating selectedObject type
      // For now, we'll re-call the inspector's select method with null then the new object
      // This is inefficient and assumes inspector can handle GameObject directly or finds it
      // A better approach would be needed for robust integration.
      const associatedEditorEntity =
        this.findEditorEntityForGameObject(newPlatform);
      if (associatedEditorEntity) {
        this.inspector.selectEntity(associatedEditorEntity);
      } else {
        this.inspector.selectEntity(null); // Fallback: clear inspector if mapping fails
        console.warn("Could not find EditorEntity mapping for new platform");
      }
    } else {
      console.warn(
        `Property update for ${property} not fully implemented for this entity type.`
      );
    }
  }

  // ... existing clearLevel, populateLevel, setSelectedObject, isPointerOverUI, handleResize methods ...

  clearLevel() {
    // Clear objects from both layers
    this.platformLayer.removeAll(true); // true = destroy children
    this.entityLayer.removeAll(true); // true = destroy children
    this.setSelectedObject(null);
  }

  populateLevel(levelData: SerializedLevel) {
    // Populate platforms
    levelData.platforms?.forEach((platformData: SerializedPlatform) => {
      this.placeEntity("platform", platformData.x, platformData.y, {
        segmentCount: platformData.segmentCount,
        isVertical: platformData.isVertical,
      });
    });

    // Populate enemies
    levelData.enemies?.forEach((enemyData: SerializedEnemy) => {
      this.placeEntity(enemyData.type, enemyData.x, enemyData.y); // Type is 'enemy-large' or 'enemy-small'
    });

    // Populate crates
    levelData.crates?.forEach((crateData: SerializedCrate) => {
      // Assuming type is 'small' or 'big' in the JSON
      const crateType = `crate-${crateData.type}`; // e.g., crate-small
      this.placeEntity(crateType, crateData.x, crateData.y);
    });

    // Populate barrels
    levelData.barrels?.forEach((barrelData: SerializedBarrel) => {
      this.placeEntity("barrel", barrelData.x, barrelData.y);
    });

    // Populate finish line
    if (levelData.finishLine) {
      const finishData = levelData.finishLine;
      this.placeEntity("finish-line", finishData.x, finishData.y);
    }

    this.setSelectedObject(null); // Deselect after loading
    console.log("Level populated from data.");
  }

  setSelectedObject(obj: Phaser.GameObjects.GameObject | null) {
    console.log("setSelectedObject called with:", obj);
    // Clear tint on previously selected object
    if (this.selectedObject && this.selectedObject.scene) {
      // Check if scene exists (object not destroyed)
      if (this.selectedObject instanceof Platform) {
        // Platform tinting might require iterating segments if tint isn't applied to container
        this.selectedObject.list.forEach((segment: any) => {
          if (segment instanceof Phaser.GameObjects.Image) {
            segment.clearTint();
          }
        });
      } else if (
        "clearTint" in this.selectedObject &&
        typeof this.selectedObject.clearTint === "function"
      ) {
        (this.selectedObject as Phaser.GameObjects.Sprite).clearTint();
      }
    }

    this.selectedObject = obj;

    // Apply tint to newly selected object
    if (this.selectedObject) {
      if (this.selectedObject instanceof Platform) {
        this.selectedObject.list.forEach((segment: any) => {
          if (segment instanceof Phaser.GameObjects.Image) {
            segment.setTint(0xaaaaaa); // Example tint
          }
        });
      } else if (
        "setTint" in this.selectedObject &&
        typeof this.selectedObject.setTint === "function"
      ) {
        (this.selectedObject as Phaser.GameObjects.Sprite).setTint(0xaaaaaa); // Example tint
      }
    }

    // Update Inspector - requires mapping GameObject to EditorEntity
    const editorEntity = obj ? this.findEditorEntityForGameObject(obj) : null;
    console.log("Updating inspector with:", editorEntity);
    if (editorEntity) {
      this.inspector.selectEntity(editorEntity);
    } else {
      this.inspector.selectEntity(null);
      if (obj)
        console.warn(
          "Could not find EditorEntity mapping for selected object",
          obj
        );
    }
  }

  isPointerOverUI(pointer: Phaser.Input.Pointer): boolean {
    // Check if pointer is over any UI element's bounding box
    const uiElements = [this.palette, this.inspector, this.toolbar];
    for (const element of uiElements) {
      // Need to get the bounds of the UI elements correctly
      // Assuming UI elements have a background or specific bounds we can check
      if (element && typeof (element as any).getBounds === "function") {
        const bounds = (element as any).getBounds();
        if (bounds && bounds.contains(pointer.x, pointer.y)) {
          return true;
        }
      }
    }
    return false;
  }

  handleResize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width;
    const height = gameSize.height;

    // Reposition UI elements based on the new size
    if (this.palette) this.palette.setPosition(10, 10); // Keep palette top-left
    if (this.inspector)
      this.inspector.setPosition(
        width - this.inspector.backgroundRect.width - 10,
        10
      ); // Keep inspector top-right
    if (this.toolbar)
      this.toolbar.setPosition(
        width / 2 - this.toolbar.backgroundRect.width / 2,
        10
      ); // Keep toolbar top-center

    // Optional: Adjust camera bounds or viewport if needed
    this.cameras.main.setBounds(-Infinity, -Infinity, Infinity, Infinity); // Or set specific world bounds

    // Redraw grid if it depends on screen size (it shouldn't if using world coords)
    if (this.grid) {
      this.grid.drawGrid();
    }
  }

  update(time: number, delta: number) {
    this.cameraControls.update(delta);
    // Optional: Add visual feedback for selected entity type (e.g., ghost object at cursor)
  }

  // Helper to map GameObject back to an EditorEntity structure for the Inspector
  // This is a placeholder and might need a more robust implementation,
  // e.g., storing a map or adding data to GameObjects.
  findEditorEntityForGameObject(
    gameObject: Phaser.GameObjects.GameObject
  ): EditorEntity | null {
    const entityType = (gameObject as any).entityType;
    if (!entityType) return null;

    // Revert to direct access with cast, as explicit variable assignment caused issues
    let data: any = {
      type: entityType,
      x: (gameObject as any).x,
      y: (gameObject as any).y,
    };

    if (gameObject instanceof Platform) {
      data.segmentCount = gameObject.segmentCount;
      data.isVertical = gameObject.isVertical;
    }

    return {
      type: entityType,
      x: (gameObject as any).x, // Direct access with cast
      y: (gameObject as any).y, // Direct access with cast
      gameObject: gameObject,
      data: data as any,
    };
  }

  handleDeleteKeyPressed(event: KeyboardEvent) {
    console.log(`Key pressed: ${event.code}`);
    // Prevent default backspace behavior (e.g., browser navigation)
    if (event.code === "Backspace") {
      event.preventDefault();
    }
    this.deleteSelectedObject();
  }

  deleteSelectedObject() {
    console.log(
      "deleteSelectedObject called. Selected object:",
      this.selectedObject
    );
    if (!this.selectedObject) {
      console.log("No object selected to delete.");
      return;
    }

    console.log("Attempting to delete selected object:", this.selectedObject);

    const objectToDelete = this.selectedObject;
    let removed = false;
    let targetLayer: Phaser.GameObjects.Layer | null = null;

    // Determine the layer and remove the object
    if (objectToDelete instanceof Platform) {
      targetLayer = this.platformLayer;
      console.log("Object identified as Platform, targeting platformLayer.");
    } else {
      // Check entity layer first
      if (this.entityLayer.list.includes(objectToDelete)) {
        targetLayer = this.entityLayer;
        console.log("Object found in entityLayer.");
      }
      // Fallback check for platform layer if not identified as Platform instance
      else if (this.platformLayer.list.includes(objectToDelete)) {
        targetLayer = this.platformLayer;
        console.log(
          "Object not instanceof Platform, but found in platformLayer (fallback)."
        );
      }
    }

    if (targetLayer) {
      console.log("Removing object from target layer:", targetLayer);
      targetLayer.remove(objectToDelete, true); // true = destroy child
      removed = true;
    } else {
      console.warn(
        "Selected object not found in any known layer list.",
        objectToDelete
      );
    }

    if (removed) {
      console.log("Object deleted successfully.");
      this.setSelectedObject(null); // Deselect and update Inspector
    } else {
      console.warn(
        "Object removal failed (not found in layer or already removed?).",
        objectToDelete
      );
      // Consider deselecting even if removal failed to avoid inconsistent state
      this.setSelectedObject(null);
    }
  }
}
