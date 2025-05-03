import { Scene } from "phaser";
import { Palette } from "../ui/palette";
import { Inspector, EditorEntity } from "../ui/Inspector";
import { Toolbar } from "../ui/Toolbar";
import { PlatformTool } from "../tools/PlatformTool";
import { Platform } from "../../entities/Platforms/Platform";

export class EditorUIManager {
  private scene: Scene;
  private palette: Palette;
  private inspector: Inspector;
  private toolbar: Toolbar;
  private fileInput: HTMLInputElement | null = null;
  private platformTool: PlatformTool;
  private selectedEntity: EditorEntity | null = null;

  // Callbacks
  private onEntityTypeSelect: (type: string, config?: any) => void;
  private onPropertyChange: (
    entity: EditorEntity,
    property: string,
    value: any
  ) => void;
  private onSave: () => void;
  private onLoad: () => void;
  private onClear: () => void;
  private onRemoveEntity: ((entity: EditorEntity) => void) | null = null;

  // Flag to track if activation is in progress
  private isActivatingPlatformTool = false;

  constructor(
    scene: Scene,
    onEntityTypeSelect: (type: string, config?: any) => void,
    onPropertyChange: (
      entity: EditorEntity,
      property: string,
      value: any
    ) => void,
    onSave: () => void,
    onLoad: () => void,
    onClear: () => void,
    onRemoveEntity?: (entity: EditorEntity) => void
  ) {
    this.scene = scene;
    this.onEntityTypeSelect = onEntityTypeSelect;
    this.onPropertyChange = onPropertyChange;
    this.onSave = onSave;
    this.onLoad = onLoad;
    this.onClear = onClear;
    this.onRemoveEntity = onRemoveEntity || null;

    // Create platform tool
    this.platformTool = new PlatformTool(
      scene,
      (platform: Platform) => {
        // When a platform is placed, we need to create an entity from it

        // Pass type and coordinates to the entity selection callback,
        // which will then call placeEntity to properly register it
        this.onEntityTypeSelect("platform", {
          segmentCount: platform.segmentCount,
          isVertical: platform.isVertical,
          segmentWidth: platform.segmentWidth,
          id: platform.id,
          // Add position information to place it at the right position
          x: platform.x,
          y: platform.y,
        });

        // Since we're not using the typical placement flow, we need to
        // manually clean up the existing platform instance
        // (placeEntity will create a fresh instance)
        platform.destroy();
      },
      (platform: Platform) => {
        // When a platform is removed, find the corresponding entity and remove it
        if (
          this.onRemoveEntity &&
          this.selectedEntity &&
          this.selectedEntity.type === "platform" &&
          this.selectedEntity.gameObject === platform
        ) {
          this.onRemoveEntity(this.selectedEntity);
        }
      }
    );

    this.createUI();

    // Listen for window resize
    this.scene.scale.on("resize", this.handleResize, this);

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  /**
   * Creates all UI components
   */
  private createUI(): void {
    // Create palette for entity selection
    this.palette = new Palette(
      this.scene,
      { x: 10, y: 10, width: 250 },
      (type: string, config?: any) => {
        console.log("Palette selection:", type, config);

        // Check if this is a platform type selection
        if (type === "platform") {
          // Activate the platform tool for configuration
          this.activatePlatformTool();
          return; // Don't proceed with normal entity selection
        }

        // For other entity types, deactivate platform tool and pass to callback
        this.platformTool.deactivate();
        this.onEntityTypeSelect(type, config);
      }
    );

    // Create inspector for entity properties
    this.inspector = new Inspector(
      this.scene,
      { x: this.scene.scale.width - 210, y: 10, width: 200 },
      this.onPropertyChange,
      // Pass the delete callback to allow entities to be deleted from the inspector
      (entity: EditorEntity) => {
        if (this.onRemoveEntity) {
          this.onRemoveEntity(entity);
          this.selectedEntity = null;
        }
      }
    );

    // Create toolbar with save/load buttons and platform button
    const toolbarButtons = [
      {
        id: "platform",
        label: "Platform",
        onClick: () => {
          console.log("Platform button clicked in toolbar");
          // Direct activation - we'll handle timing within the activatePlatformTool method
          this.activatePlatformTool();
        },
        style: {
          bgColor: 0x00aa00,
          hoverColor: 0x00cc00,
          textColor: "#ffffff",
        },
      },
      { id: "save", label: "Save", onClick: this.onSave },
      { id: "load", label: "Load", onClick: this.onLoad },
      { id: "clear", label: "Clear", onClick: this.onClear },
    ];

    this.toolbar = new Toolbar(
      this.scene,
      { x: (this.scene.scale.width - 400) / 2, y: 10, width: 400 },
      toolbarButtons
    );

    // Make sure the platform tool is properly initialized but hidden
    this.platformTool.deactivate();
  }

  /**
   * Updates UI component positions on resize
   */
  public handleResize(gameSize: Phaser.Structs.Size): void {
    if (this.inspector) {
      this.inspector.updatePositionForResize(gameSize.width - 210, 10);
    }

    if (this.toolbar) {
      this.toolbar.updatePositionForResize((gameSize.width - 400) / 2, 10);
    }

    // Update platform tool position
    if (this.platformTool) {
      this.platformTool.updatePanelPosition();
    }
  }

  /**
   * Sets up the file input for loading levels
   */
  public setupFileInput(onFileLoad: (file: File) => void): void {
    if (this.toolbar) {
      this.fileInput = this.toolbar.createFileInput(onFileLoad);
    }
  }

  /**
   * Gets the file input element
   */
  public getFileInput(): HTMLInputElement | null {
    return this.fileInput;
  }

  /**
   * Gets the inspector component
   */
  public getInspector(): Inspector {
    return this.inspector;
  }

  /**
   * Gets the palette component
   */
  public getPalette(): Palette {
    return this.palette;
  }

  /**
   * Gets the platform tool
   */
  public getPlatformTool(): PlatformTool {
    return this.platformTool;
  }

  /**
   * Sets the remove entity callback
   */
  public setRemoveEntityCallback(
    callback: (entity: EditorEntity) => void
  ): void {
    this.onRemoveEntity = callback;
  }

  /**
   * Removes the currently selected entity
   */
  public removeSelectedEntity(): void {
    if (this.selectedEntity && this.onRemoveEntity) {
      this.onRemoveEntity(this.selectedEntity);
      this.selectedEntity = null;
    }
  }

  /**
   * Updates the inspector with the selected entity
   */
  public selectEntity(entity: EditorEntity | null): void {
    this.selectedEntity = entity;

    if (this.inspector) {
      this.inspector.selectEntity(entity);
    }

    // Clear palette selection when an entity is selected
    if (entity) {
      this.clearPaletteSelection();

      // Also deactivate platform tool if an entity is selected
      this.platformTool.deactivate();
    }
  }

  /**
   * Clears the palette selection
   */
  public clearPaletteSelection(): void {
    if (this.palette) {
      this.palette.clearSelection();
    }
  }

  // Add a new method to activate the platform tool
  private activatePlatformTool(): void {
    console.log("EditorUIManager: activating platform tool");

    // Prevent multiple activations at once
    if (this.isActivatingPlatformTool) {
      console.log(
        "Platform tool activation already in progress, ignoring request"
      );
      return;
    }

    this.isActivatingPlatformTool = true;

    // Force hide any potentially visible UI elements that might conflict
    if (this.inspector) {
      this.inspector.selectEntity(null);
    }

    // Clear palette selection when activating the platform tool
    this.clearPaletteSelection();

    // First ensure any previous platform tool is deactivated
    this.platformTool.deactivate();

    // Make sure the platform tool is visible and centered immediately
    // Don't use setTimeout which can cause timing issues
    this.platformTool.activate();

    // Reset the activation flag after a delay to prevent rapid re-activations
    this.scene.time.delayedCall(500, () => {
      this.isActivatingPlatformTool = false;
    });
  }

  /**
   * Sets up keyboard shortcuts for common editor operations
   */
  private setupKeyboardShortcuts(): void {
    // Setup delete key to remove selected entity
    if (this.scene.input.keyboard) {
      // Add delete key for removing selected entity
      const deleteKey = this.scene.input.keyboard.addKey("DELETE");
      deleteKey.on("down", () => {
        if (this.selectedEntity && this.onRemoveEntity) {
          console.log(
            "Delete key pressed - removing selected entity:",
            this.selectedEntity.type
          );
          this.onRemoveEntity(this.selectedEntity);
          this.selectedEntity = null;
        }
      });
    }
  }
}
