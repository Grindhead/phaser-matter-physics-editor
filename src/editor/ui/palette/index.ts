import { Scene } from "phaser";
import { PaletteConfig, EntityButton } from "./types";
import { PaletteButton } from "./PaletteButton";
import { getEntityDefinitions } from "./EntityDefinitions";

export class Palette {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private buttons: { [key: string]: PaletteButton } = {};
  private selectedButton: string | null = null;
  private onSelectCallback: (type: string, config?: any) => void;
  private entities: EntityButton[] = [];
  private enabled: boolean = true;

  constructor(
    scene: Scene,
    config: PaletteConfig,
    onSelect: (type: string, config?: any) => void
  ) {
    this.scene = scene;
    this.onSelectCallback = onSelect;
    this.entities = getEntityDefinitions();

    // Create container and set depth
    this.container = scene.add.container(config.x, config.y).setDepth(10);

    // Intercept any pointerdown on the palette container to prevent scene callbacks,
    // but allow events through if an entity drag is active.
    const paletteHitArea = new Phaser.Geom.Rectangle(
      0,
      0,
      config.width,
      this.calculateHeight(config)
    );
    this.container.setInteractive({
      hitArea: paletteHitArea,
      hitAreaCallback: (
        hitArea: Phaser.Geom.Rectangle,
        x: number,
        y: number,
        gameObject: Phaser.GameObjects.Container
      ): boolean => {
        // Only interactive if NOT dragging an entity AND NOT in placement mode
        const isDragging = this.scene.registry.get("isDraggingEntity");
        const isPlacing = this.scene.registry.get("isPlacementModeActive");
        // Check internal enabled flag
        if (!this.enabled || isDragging || isPlacing) {
          return false; // Ignore hits if disabled, dragging, or in placement mode
        }
        return Phaser.Geom.Rectangle.Contains(hitArea, x, y); // Default check
      },
      useHandCursor: false, // Optional: don't show hand cursor on background
    });

    // Create background
    const bg = config.background || { color: 0x222222, alpha: 0.8 };
    this.background = scene.add.rectangle(
      0,
      0,
      config.width,
      this.calculateHeight(config),
      bg.color,
      bg.alpha || 0.8
    );
    this.background.setOrigin(0, 0);
    this.container.add(this.background);

    // Create entity buttons
    this.createButtons(config);

    // Set palette to be fixed to camera
    this.container.setScrollFactor(0);

    // Add to scene display list
    scene.add.existing(this.container);
  }

  private calculateHeight(config: PaletteConfig): number {
    const padding = config.padding || 10;
    let totalHeight = padding;

    // Calculate the sum of all button heights with padding
    this.entities.forEach((entity) => {
      const baseHeight = 50;
      const heightFactor = entity.heightFactor || 1.0;
      const buttonHeight = baseHeight * heightFactor;
      totalHeight += buttonHeight + padding;
    });

    return totalHeight;
  }

  private createButtons(config: PaletteConfig): void {
    const padding = config.padding || 10;
    const buttonWidth = config.width - padding * 2;
    let currentY = padding;

    // Create buttons for all entities
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];

      // Create button
      const button = new PaletteButton(
        this.scene,
        padding,
        currentY,
        buttonWidth,
        entity,
        (type: string, generate: boolean) =>
          this.handleButtonSelect(type, generate)
      );

      // Add button to palette container
      this.container.add(button.container);

      // Store reference
      this.buttons[entity.type] = button;

      // Calculate next button position
      const baseHeight = 50;
      const heightFactor = entity.heightFactor || 1.0;
      const buttonHeight = baseHeight * heightFactor;
      currentY += buttonHeight + padding;
    }
  }

  private handleButtonSelect(type: string, generate: boolean): void {
    // Clear previous selection
    if (this.selectedButton && this.buttons[this.selectedButton]) {
      this.buttons[this.selectedButton].setSelected(false);
    }

    // Set new selection
    this.selectedButton = type;
    this.buttons[type].setSelected(true);

    // Find entity definition
    const entity = this.entities.find((e) => e.type === type);

    if (entity) {
      console.log(
        "Selected entity:",
        entity.type,
        "needsConfiguration:",
        entity.needsConfiguration,
        "generate:",
        generate
      );

      // Check if this entity needs special configuration before placement
      if (entity.needsConfiguration) {
        // For entities requiring configuration (like platforms),
        // we don't generate immediately and instead pass the configuration
        // to be handled by the editor
        this.onSelectCallback(type, entity.entityConfig);
      } else if (generate) {
        // For regular entities, we proceed with immediate placement if generate=true
        this.onSelectCallback(type, entity.entityConfig);
      }
    }
  }

  clearSelection(): void {
    if (this.selectedButton && this.buttons[this.selectedButton]) {
      this.buttons[this.selectedButton].setSelected(false);
      this.selectedButton = null;
    }
  }

  getSelectedType(): string | null {
    return this.selectedButton;
  }

  getSelectedConfig(type: string): any {
    const entity = this.entities.find((e) => e.type === type);
    if (entity) {
      return entity.entityConfig;
    }
    return null;
  }

  updatePositionForResize(): void {
    // Update position when the window is resized
    this.container.setPosition(10, 10);
  }

  public enable(): void {
    this.enabled = true;
    // Optional: visually indicate enabled state (e.g., change alpha)
    // this.container.setAlpha(1); // Removed: No alpha change on enable
  }

  public disable(): void {
    this.enabled = false;
    this.clearSelection(); // Deselect button when disabled
    // Optional: visually indicate disabled state
    // this.container.setAlpha(0.5); // Removed: No alpha change on disable
  }
}
