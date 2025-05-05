import { Scene } from "phaser";
import { EntityButton } from "./types";
import { EntityFactory } from "./EntityFactory";
import { EntityInstance } from "./types";

// Define the position type
type Position = { x: number; y: number };

// Define a type-safe record for entity positions
type EntityPositions = {
  [key: string]: Position;
};

// Define static constants for consistent button dimensions
const BUTTON_HEIGHT = 50;
const BUTTON_WIDTH = 200;
const ENTITY_POSITIONS: EntityPositions = {
  player: { x: 50, y: 25 },
  "enemy-large": { x: 50, y: 25 },
  "enemy-small": { x: 45, y: 25 },
  "crate-small": { x: 50, y: 25 },
  "crate-big": { x: 50, y: 25 },
  barrel: { x: 50, y: 25 },
  "finish-line": { x: 50, y: 25 },
  default: { x: 50, y: 25 },
};

export class PaletteButton {
  scene: Scene;
  container: Phaser.GameObjects.Container;
  entity: EntityButton;
  buttonWidth: number = BUTTON_WIDTH;
  buttonHeight: number = BUTTON_HEIGHT;
  onSelect: (type: string, generate: boolean) => void;
  private isSelected: boolean = false;
  private entityInstance: EntityInstance;
  private buttonBg: Phaser.GameObjects.Rectangle;
  private dragStartPosition = { x: 0, y: 0 };
  private isDragging: boolean = false;
  private dragPreview: EntityInstance | null = null;

  constructor(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    entity: EntityButton,
    onSelect: (type: string, generate: boolean) => void
  ) {
    this.scene = scene;
    this.entity = entity;
    this.onSelect = onSelect;

    // Use the provided width, but keep the static height
    this.buttonWidth = width;
    this.buttonHeight = BUTTON_HEIGHT;

    // Create button container
    this.container = this.scene.add.container(x, y);

    // Create button background with fixed dimensions
    this.buttonBg = this.scene.add.rectangle(
      0,
      0,
      this.buttonWidth,
      this.buttonHeight,
      0x444444
    );
    this.buttonBg.setOrigin(0, 0);
    this.container.add(this.buttonBg);

    // Create entity instance for display
    this.entityInstance = this.addEntityPreview();

    // Add text label
    this.addLabel();

    // Make button interactive
    this.setupInteractivity();
  }

  private addEntityPreview(): EntityInstance {
    // Create a deep copy of the configuration to avoid sharing references
    const configCopy = JSON.parse(
      JSON.stringify(this.entity.entityConfig || {})
    );

    // Create entity instance at origin (0,0)
    const entityInstance = EntityFactory.createEntityInstance(
      this.scene,
      this.entity.type,
      configCopy
    );

    // Explicitly disable physics for preview entities
    if (entityInstance.body) {
      try {
        // Try to disable physics interactions completely for previews
        entityInstance.setStatic(true);
        entityInstance.setSensor(true);

        // Try to remove body from world if possible
        if (this.scene.matter && this.scene.matter.world) {
          this.scene.matter.world.remove(entityInstance.body);
        }
      } catch (e) {
        console.warn("Could not fully disable physics for preview entity", e);
      }
    }

    // Set origin for consistent positioning
    if (typeof entityInstance.setOrigin === "function") {
      entityInstance.setOrigin(0.5, 0.5);
    }

    // Reset position to origin to start with a clean slate
    entityInstance.setPosition(0, 0);

    // Calculate available space for the entity
    const availableWidth = this.buttonWidth * 0.45; // Use 45% of button width for entity
    const availableHeight = this.buttonHeight * 0.8; // Use 80% of button height

    // Get entity dimensions (if available)
    let entityWidth = 0;
    let entityHeight = 0;

    if (
      entityInstance.width !== undefined &&
      entityInstance.height !== undefined
    ) {
      entityWidth = entityInstance.width;
      entityHeight = entityInstance.height;
    } else if (
      entityInstance.displayWidth !== undefined &&
      entityInstance.displayHeight !== undefined
    ) {
      entityWidth = entityInstance.displayWidth;
      entityHeight = entityInstance.displayHeight;
    }

    // Calculate appropriate scale to fit within available space
    // while maintaining aspect ratio
    let finalScale = this.entity.scale || 0.7;

    if (entityWidth && entityHeight) {
      const widthScale = availableWidth / entityWidth;
      const heightScale = availableHeight / entityHeight;

      // Use the smaller scale to ensure it fits within both dimensions
      const fitScale = Math.min(widthScale, heightScale);

      // Apply a sensible maximum scale to prevent very large or very small entities
      finalScale = Math.min(Math.max(fitScale, 0.3), 1.2);
    }

    // Apply the calculated scale
    entityInstance.setScale(finalScale);

    // Position entity in the left portion of the button
    entityInstance.x = this.buttonWidth * 0.25; // 25% from left
    entityInstance.y = this.buttonHeight * 0.5; // Center vertically

    // Apply custom offsets if defined in the entity configuration
    if (this.entity.offsetX !== undefined) {
      entityInstance.x += this.entity.offsetX;
    }

    if (this.entity.offsetY !== undefined) {
      entityInstance.y += this.entity.offsetY;
    }

    // Add to container with a consistent depth
    entityInstance.setDepth(1);
    this.container.add(entityInstance);

    return entityInstance;
  }

  private addLabel(): void {
    const label = this.scene.add.text(
      this.buttonWidth * 0.6,
      this.buttonHeight * 0.5,
      this.entity.displayName,
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      }
    );
    label.setOrigin(0.5);
    this.container.add(label);
  }

  private setupInteractivity(): void {
    this.buttonBg
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        if (!this.isSelected) {
          this.buttonBg.setFillStyle(0x666666);
        }
      })
      .on("pointerout", () => {
        if (!this.isSelected) {
          this.buttonBg.setFillStyle(0x444444);
        } else {
          this.buttonBg.setFillStyle(0x88aaff);
        }

        // End any dragging when pointer leaves the button
        if (this.isDragging) {
          this.endDrag();
        }
      })
      .on(
        "pointerdown",
        (
          pointer: Phaser.Input.Pointer,
          localX: number,
          localY: number,
          event: Phaser.Types.Input.EventData
        ) => {
          // Prevent click from propagating to scene handlers
          if (event && typeof event.stopPropagation === "function") {
            event.stopPropagation();
          }

          // Store start position for potential drag
          this.dragStartPosition.x = pointer.x;
          this.dragStartPosition.y = pointer.y;

          // Select the entity type
          if (this.entity.needsConfiguration) {
            this.onSelect(this.entity.type, false);
          } else {
            this.onSelect(this.entity.type, true);
          }
        }
      )
      .on("pointermove", (pointer: Phaser.Input.Pointer) => {
        // Check if we should start dragging (after a certain threshold)
        if (
          !this.isDragging &&
          pointer.primaryDown &&
          (Math.abs(pointer.x - this.dragStartPosition.x) > 10 ||
            Math.abs(pointer.y - this.dragStartPosition.y) > 10)
        ) {
          this.startDrag(pointer);
        }

        // Update drag preview position
        if (this.isDragging && this.dragPreview) {
          this.dragPreview.x = pointer.x;
          this.dragPreview.y = pointer.y;
        }
      })
      .on("pointerup", () => {
        if (this.isDragging) {
          this.endDrag();
        }
      });
  }

  private startDrag(pointer: Phaser.Input.Pointer): void {
    this.isDragging = true;

    // Signal to the scene that we're dragging an entity
    this.scene.registry.set("isDraggingEntity", true);
    this.scene.registry.set("draggingEntityType", this.entity.type);

    // Create a deep copy of the configuration to avoid sharing references
    const configCopy = JSON.parse(
      JSON.stringify(this.entity.entityConfig || {})
    );

    // Create a preview entity that follows the cursor
    this.dragPreview = EntityFactory.createEntityInstance(
      this.scene,
      this.entity.type,
      configCopy
    );

    // Explicitly disable physics for drag preview entity
    if (this.dragPreview.body) {
      try {
        // Try to disable physics interactions completely
        this.dragPreview.setStatic(true);
        this.dragPreview.setSensor(true);

        // Try to remove body from world if possible
        if (this.scene.matter && this.scene.matter.world) {
          this.scene.matter.world.remove(this.dragPreview.body);
        }
      } catch (e) {
        console.warn(
          "Could not fully disable physics for drag preview entity",
          e
        );
      }
    }

    // Set preview position
    this.dragPreview.x = pointer.x;
    this.dragPreview.y = pointer.y;

    // Add preview scale and alpha for better visual feedback
    const previewScale = this.entity.scale || 0.7;
    this.dragPreview.setScale(previewScale);
    this.dragPreview.setAlpha(0.8);
    this.dragPreview.setDepth(1000); // Set high depth to appear above other elements
  }

  private endDrag(): void {
    if (!this.isDragging) return;

    this.isDragging = false;

    // Signal to the scene that we're no longer dragging
    this.scene.registry.set("isDraggingEntity", false);
    this.scene.registry.remove("draggingEntityType");

    // Get final position for placement
    if (this.dragPreview) {
      const finalX = this.dragPreview.x;
      const finalY = this.dragPreview.y;

      // Clean up the preview
      this.dragPreview.destroy();
      this.dragPreview = null;

      // Create a deep copy of the configuration to avoid sharing references
      const configCopy = JSON.parse(
        JSON.stringify(this.entity.entityConfig || {})
      );

      // Tell the editor to place the entity at the final position
      // by emitting an event that EditorScene can listen for
      this.scene.events.emit("PLACE_ENTITY", {
        type: this.entity.type,
        x: finalX,
        y: finalY,
        config: configCopy,
      });
    }
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.buttonBg.setFillStyle(selected ? 0x88aaff : 0x444444);
  }

  updateEntityDisplay(config: any): void {
    // Create a deep copy of the config to avoid sharing references
    const configCopy = JSON.parse(JSON.stringify(config || {}));

    EntityFactory.updateEntityDisplay(
      this.scene,
      this.entity.type,
      this.container,
      configCopy
    );
  }
}
