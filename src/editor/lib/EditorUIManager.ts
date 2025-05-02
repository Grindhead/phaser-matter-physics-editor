import { Scene } from "phaser";
import { Palette } from "../ui/Palette";
import { Inspector, EditorEntity } from "../ui/Inspector";
import { Toolbar } from "../ui/Toolbar";

export class EditorUIManager {
  private scene: Scene;
  private palette: Palette;
  private inspector: Inspector;
  private toolbar: Toolbar;
  private fileInput: HTMLInputElement | null = null;

  // Callbacks
  private onEntityTypeSelect: (type: string) => void;
  private onPropertyChange: (
    entity: EditorEntity,
    property: string,
    value: any
  ) => void;
  private onSave: () => void;
  private onLoad: () => void;
  private onClear: () => void;

  constructor(
    scene: Scene,
    onEntityTypeSelect: (type: string) => void,
    onPropertyChange: (
      entity: EditorEntity,
      property: string,
      value: any
    ) => void,
    onSave: () => void,
    onLoad: () => void,
    onClear: () => void
  ) {
    this.scene = scene;
    this.onEntityTypeSelect = onEntityTypeSelect;
    this.onPropertyChange = onPropertyChange;
    this.onSave = onSave;
    this.onLoad = onLoad;
    this.onClear = onClear;

    this.createUI();
  }

  /**
   * Creates all UI components
   */
  private createUI(): void {
    // Create palette for entity selection
    this.palette = new Palette(
      this.scene,
      { x: 10, y: 10, width: 250 },
      this.onEntityTypeSelect
    );

    // Create inspector for entity properties
    this.inspector = new Inspector(
      this.scene,
      { x: this.scene.scale.width - 210, y: 10, width: 200 },
      this.onPropertyChange
    );

    // Create toolbar with save/load buttons
    const toolbarButtons = [
      { id: "save", label: "Save", onClick: this.onSave },
      { id: "load", label: "Load", onClick: this.onLoad },
      { id: "clear", label: "Clear", onClick: this.onClear },
    ];

    this.toolbar = new Toolbar(
      this.scene,
      { x: (this.scene.scale.width - 300) / 2, y: 10, width: 300 },
      toolbarButtons
    );
  }

  /**
   * Updates UI component positions on resize
   */
  public handleResize(gameSize: Phaser.Structs.Size): void {
    if (this.inspector) {
      this.inspector.updatePositionForResize(gameSize.width - 210, 10);
    }

    if (this.toolbar) {
      this.toolbar.updatePositionForResize((gameSize.width - 300) / 2, 10);
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
   * Updates the inspector with the selected entity
   */
  public selectEntity(entity: EditorEntity | null): void {
    if (this.inspector) {
      this.inspector.selectEntity(entity);
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
}
