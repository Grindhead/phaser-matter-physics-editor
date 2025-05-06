import { Scene } from "phaser";
// Import interfaces directly from entity files
import { PlatformInterface } from "../../entities/Platforms/Platform";
import { EnemyInterface } from "../../entities/Enemies/EnemyBase";
import { CrateInterface } from "../../entities/Crate/Crate"; // Assuming interface is here
import { BarrelInterface } from "../../entities/Barrel/Barrel";
import { FinishLineInterface } from "../../entities/Finish/Finish";

export interface InspectorConfig {
  x: number;
  y: number;
  width: number;
  padding?: number;
  background?: {
    color: number;
    alpha?: number;
  };
}

// Define a generic entity type that could be any of our placeable entities
export type EditorEntity = {
  type: string;
  x: number;
  y: number;
  gameObject: Phaser.GameObjects.GameObject;
  data:
    | PlatformInterface
    | EnemyInterface
    | CrateInterface
    | BarrelInterface
    | FinishLineInterface;
};

export class Inspector {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private propertyControls: Phaser.GameObjects.GameObject[] = [];
  private selectedEntity: EditorEntity | null = null;
  private onPropertyChangeCallback: (
    entity: EditorEntity,
    property: string,
    value: any
  ) => void;
  private onDeleteCallback: ((entity: EditorEntity) => void) | null = null;

  constructor(
    scene: Scene,
    config: InspectorConfig,
    onPropertyChange: (
      entity: EditorEntity,
      property: string,
      value: any
    ) => void,
    onDelete?: (entity: EditorEntity) => void
  ) {
    this.scene = scene;
    this.onPropertyChangeCallback = onPropertyChange;
    this.onDeleteCallback = onDelete || null;

    // Create container and set depth
    this.container = scene.add.container(config.x, config.y).setDepth(10);

    // Create background
    const bg = config.background || { color: 0x222222, alpha: 0.8 };
    this.background = scene.add.rectangle(
      0,
      0,
      config.width,
      200, // Initial height, will be updated
      bg.color,
      bg.alpha || 0.8
    );
    this.background.setOrigin(0, 0);
    this.container.add(this.background);

    // Make background interactive to catch clicks, but allow pass-through during drag
    // Use a callback to disable hit detection during entity drag
    this.background.setInteractive({
      hitAreaCallback: (
        hitArea: any,
        x: number,
        y: number,
        gameObject: Phaser.GameObjects.Rectangle
      ): boolean => {
        const isDragging = this.scene.registry.get("isDraggingEntity");
        const isPlacing = this.scene.registry.get("isPlacementModeActive");
        if (isDragging || isPlacing) {
          return false; // Ignore hits during drag or placement mode
        }
        // Use default rectangle hit test
        return Phaser.Geom.Rectangle.Contains(gameObject.getBounds(), x, y);
      },
      useHandCursor: false,
    });

    this.background.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.scene.registry.get("isDraggingEntity")) {
        pointer.event.stopPropagation();
      }
    });

    // Create title
    const padding = config.padding || 10;
    this.titleText = scene.add.text(padding, padding, "No Selection", {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    this.container.add(this.titleText);

    // Set inspector to be fixed to camera
    this.container.setScrollFactor(0);

    // Hide initially since nothing is selected
    this.container.setVisible(false);

    // Add to scene display list
    scene.add.existing(this.container);
  }

  /**
   * Sets the delete callback function
   */
  public setDeleteCallback(callback: (entity: EditorEntity) => void): void {
    this.onDeleteCallback = callback;
  }

  selectEntity(entity: EditorEntity | null): void {
    // Clear previous property controls
    this.clearPropertyControls();

    this.selectedEntity = entity;

    if (entity) {
      // Show inspector and update title
      this.container.setVisible(true);
      this.titleText.setText(
        `${this.getDisplayNameForType(entity.type)} Properties`
      );

      // Create property controls based on entity type
      this.createPropertyControls();
    } else {
      // Hide inspector when nothing is selected
      this.container.setVisible(false);
    }
  }

  private getDisplayNameForType(type: string): string {
    const typeMap: { [key: string]: string } = {
      platform: "Platform",
      "enemy-large": "Large Enemy",
      "enemy-small": "Small Enemy",
      "crate-small": "Small Crate",
      "crate-big": "Big Crate",
      barrel: "Barrel",
      "finish-line": "Finish Line",
    };
    return typeMap[type] || type;
  }

  private clearPropertyControls(): void {
    this.propertyControls.forEach((control) => {
      control.destroy();
    });
    this.propertyControls = [];
  }

  private createPropertyControls(): void {
    if (!this.selectedEntity) return;

    const padding = 10;
    let yOffset = 50; // Starting position below title

    // Add X and Y position controls for all entity types
    this.addPositionControls(padding, yOffset);
    yOffset += 80; // Move down for the next set of controls

    // Add type-specific controls
    switch (this.selectedEntity.type) {
      case "platform":
        this.addPlatformControls(padding, yOffset);
        yOffset += 140; // Increased from 120 to accommodate the new layout
        break;
      case "enemy-large":
      case "enemy-small":
        this.addEnemyControls(padding, yOffset);
        yOffset += 40;
        break;
      case "crate-small":
      case "crate-big":
      case "barrel":
      case "finish-line":
        // No specific editable properties for these yet
        break;
    }

    // Add delete button at the bottom for all entity types
    this.addDeleteButton(padding, yOffset);
    yOffset += 50; // Space for the delete button

    // Update background height and ensure it's at least 200px tall
    const minHeight = 200;
    const newHeight = Math.max(minHeight, yOffset + padding);
    this.background.setSize(this.background.width, newHeight);
  }

  /**
   * Add a delete button at the bottom of the inspector
   */
  private addDeleteButton(x: number, y: number): void {
    if (!this.selectedEntity || !this.onDeleteCallback) return;

    // Create a delete button with red background
    const deleteButton = this.scene.add.container(x, y);

    // Button background
    const buttonBg = this.scene.add
      .rectangle(0, 0, this.background.width - 20, 40, 0xdd0000)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        if (this.selectedEntity && this.onDeleteCallback) {
          this.onDeleteCallback(this.selectedEntity);
          // Clear selection after deletion
          this.selectEntity(null);
        }
      })
      .on("pointerover", () => buttonBg.setFillStyle(0xff0000))
      .on("pointerout", () => buttonBg.setFillStyle(0xdd0000));

    // Button text
    const buttonText = this.scene.add
      .text(buttonBg.width / 2, 20, "Delete", {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);

    deleteButton.add([buttonBg, buttonText]);
    this.propertyControls.push(deleteButton);
    this.container.add(deleteButton);
  }

  private addPositionControls(x: number, y: number): void {
    if (!this.selectedEntity) return;

    // X Position Label
    const xLabel = this.scene.add.text(x, y, "X:", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.propertyControls.push(xLabel);
    this.container.add(xLabel);

    // X Position Input
    const xInput = this.createNumberInput(
      x + 70,
      y,
      this.selectedEntity.x,
      (value) => {
        if (this.selectedEntity) {
          this.onPropertyChangeCallback(this.selectedEntity, "x", value);
        }
      }
    );
    this.propertyControls.push(xInput);
    this.container.add(xInput);

    // Y Position Label
    const yLabel = this.scene.add.text(x, y + 30, "Y:", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.propertyControls.push(yLabel);
    this.container.add(yLabel);

    // Y Position Input
    const yInput = this.createNumberInput(
      x + 70,
      y + 30,
      this.selectedEntity.y,
      (value) => {
        if (this.selectedEntity) {
          this.onPropertyChangeCallback(this.selectedEntity, "y", value);
        }
      }
    );
    this.propertyControls.push(yInput);
    this.container.add(yInput);
  }

  private addPlatformControls(x: number, y: number): void {
    if (!this.selectedEntity || this.selectedEntity.type !== "platform") return;

    const platformData = this.selectedEntity.data as PlatformInterface;

    // Section background for orientation controls
    const orientationSectionBg = this.scene.add
      .rectangle(x, y, 240, 36, 0x1a1a1a, 0.8)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x555555);
    this.propertyControls.push(orientationSectionBg);
    this.container.add(orientationSectionBg);

    // Orientation Label with clearer instructions
    const orientationLabel = this.scene.add.text(x + 5, y + 8, "Orientation:", {
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    this.propertyControls.push(orientationLabel);
    this.container.add(orientationLabel);

    // Orientation Buttons - better positioned
    const horizontalBtn = this.createButton(
      x + 120,
      y + 8,
      "Horizontal",
      !platformData.isVertical,
      () => {
        if (this.selectedEntity && this.selectedEntity.type === "platform") {
          this.onPropertyChangeCallback(
            this.selectedEntity,
            "orientation",
            false
          );
        }
      }
    );
    this.propertyControls.push(horizontalBtn);
    this.container.add(horizontalBtn);

    const verticalBtn = this.createButton(
      x + 210,
      y + 8,
      "Vertical",
      platformData.isVertical,
      () => {
        if (this.selectedEntity && this.selectedEntity.type === "platform") {
          this.onPropertyChangeCallback(
            this.selectedEntity,
            "orientation",
            true
          );
        }
      }
    );
    this.propertyControls.push(verticalBtn);
    this.container.add(verticalBtn);

    // ID Section background
    const idSectionBg = this.scene.add
      .rectangle(x, y + 40, 240, 36, 0x1a1a1a, 0.8)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x555555);
    this.propertyControls.push(idSectionBg);
    this.container.add(idSectionBg);

    // ID Label
    const idLabel = this.scene.add.text(x + 5, y + 48, "ID:", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.propertyControls.push(idLabel);
    this.container.add(idLabel);

    // ID Input
    const idInput = this.createTextInput(
      x + 90,
      y + 48,
      platformData.id || "",
      (value) => {
        if (this.selectedEntity && this.selectedEntity.type === "platform") {
          this.onPropertyChangeCallback(this.selectedEntity, "id", value);
        }
      }
    );
    this.propertyControls.push(idInput);
    this.container.add(idInput);
  }

  private addEnemyControls(x: number, y: number): void {
    if (
      !this.selectedEntity ||
      (this.selectedEntity.type !== "enemy-large" &&
        this.selectedEntity.type !== "enemy-small")
    )
      return;

    const enemyData = this.selectedEntity.data as EnemyInterface;

    // Add enemy type selection
    const typeLabel = this.scene.add.text(x, y, "Type:", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.propertyControls.push(typeLabel);
    this.container.add(typeLabel);

    // Create buttons for enemy type selection
    const largeBtn = this.createButton(
      x + 60,
      y,
      "Large",
      enemyData.type === "enemy-large",
      () => {
        if (
          this.selectedEntity &&
          (this.selectedEntity.type === "enemy-large" ||
            this.selectedEntity.type === "enemy-small")
        ) {
          this.onPropertyChangeCallback(
            this.selectedEntity,
            "enemyType",
            "enemy-large"
          );
        }
      }
    );
    this.propertyControls.push(largeBtn);
    this.container.add(largeBtn);

    const smallBtn = this.createButton(
      x + 150,
      y,
      "Small",
      enemyData.type === "enemy-small",
      () => {
        if (
          this.selectedEntity &&
          (this.selectedEntity.type === "enemy-large" ||
            this.selectedEntity.type === "enemy-small")
        ) {
          this.onPropertyChangeCallback(
            this.selectedEntity,
            "enemyType",
            "enemy-small"
          );
        }
      }
    );
    this.propertyControls.push(smallBtn);
    this.container.add(smallBtn);
  }

  private createNumberInput(
    x: number,
    y: number,
    initialValue: number,
    onChange: (value: number) => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Input background
    const bg = this.scene.add.rectangle(0, 0, 80, 24, 0x333333);
    bg.setOrigin(0, 0);
    container.add(bg);

    // Text representation
    const text = this.scene.add.text(5, 4, initialValue.toString(), {
      fontSize: "14px",
      color: "#ffffff",
    });
    container.add(text);

    // Increment/decrement buttons
    const decBtn = this.scene.add.text(60, 0, "-", {
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#444444",
    });
    decBtn.setPadding(5, 2, 5, 2);
    decBtn.setInteractive({ useHandCursor: true });
    decBtn.on("pointerdown", () => {
      const currentValue = parseInt(text.text);
      const newValue = currentValue - 1;
      text.setText(newValue.toString());
      onChange(newValue);
    });
    container.add(decBtn);

    const incBtn = this.scene.add.text(75, 0, "+", {
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#444444",
    });
    incBtn.setPadding(5, 2, 5, 2);
    incBtn.setInteractive({ useHandCursor: true });
    incBtn.on("pointerdown", () => {
      const currentValue = parseInt(text.text);
      const newValue = currentValue + 1;
      text.setText(newValue.toString());
      onChange(newValue);
    });
    container.add(incBtn);

    // Make input interactive for direct editing (simplified implementation)
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      const input = prompt("Enter value:", text.text);
      if (input !== null) {
        const newValue = parseInt(input);
        if (!isNaN(newValue)) {
          text.setText(newValue.toString());
          onChange(newValue);
        }
      }
    });

    return container;
  }

  private createTextInput(
    x: number,
    y: number,
    initialValue: string,
    onChange: (value: string) => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Input background
    const bg = this.scene.add.rectangle(0, 0, 100, 24, 0x333333);
    bg.setOrigin(0, 0);
    container.add(bg);

    // Text representation
    const text = this.scene.add.text(5, 4, initialValue, {
      fontSize: "14px",
      color: "#ffffff",
    });
    container.add(text);

    // Make input interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      const input = prompt("Enter value:", text.text);
      if (input !== null) {
        text.setText(input);
        onChange(input);
      }
    });

    return container;
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    isSelected: boolean,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Button background with enhanced visibility
    const bg = this.scene.add.rectangle(
      0,
      0,
      80,
      24,
      isSelected ? 0x4477ff : 0x444444
    );
    bg.setOrigin(0, 0);
    container.add(bg);

    // Button text
    const text = this.scene.add.text(40, 12, label, {
      fontSize: "12px",
      color: "#ffffff",
      fontStyle: isSelected ? "bold" : "normal",
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    // Make button interactive with visual feedback
    bg.setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        if (!isSelected) {
          bg.setFillStyle(0x555555);
        }
      })
      .on("pointerout", () => {
        if (!isSelected) {
          bg.setFillStyle(0x444444);
        }
      })
      .on("pointerdown", () => {
        onClick();
        bg.setFillStyle(0x4477ff); // Highlight when selected
      });

    return container;
  }

  /**
   * Creates a dropdown selection control
   */
  private createDropdown(
    x: number,
    y: number,
    options: number[],
    currentValue: number,
    onChange: (value: number) => void
  ): Phaser.GameObjects.Container {
    // Create a simple container for the closed dropdown
    const dropdownContainer = this.scene.add.container(x, y);
    const dropdownWidth = 80;
    const dropdownHeight = 24;

    // Button background with dropdown styling
    const bg = this.scene.add.rectangle(
      0,
      0,
      dropdownWidth,
      dropdownHeight,
      0x3a3a3a
    );
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, 0x777777);

    // Add "click to open" text in small font
    const hintText = this.scene.add.text(
      5,
      dropdownHeight + 2,
      "Click to show options",
      {
        fontSize: "9px",
        color: "#aaaaaa",
      }
    );

    // Display current value with more emphasis
    const valueText = this.scene.add.text(5, 4, currentValue.toString(), {
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold",
    });

    // Dropdown arrow - more visible
    const arrowDown = this.scene.add.triangle(
      dropdownWidth - 15,
      dropdownHeight / 2,
      0,
      -5,
      7,
      5,
      -7,
      5,
      0xaaaaaa
    );

    // Add to container
    dropdownContainer.add([bg, valueText, arrowDown, hintText]);

    // Tracking variable for open/closed state
    let isOpen = false;

    // Store option containers - will be created on first open
    let optionButtons: Phaser.GameObjects.Container[] = [];

    // Function to open dropdown
    const openDropdown = () => {
      if (isOpen) return;
      isOpen = true;

      // Hide the hint when open
      hintText.setVisible(false);

      // Change background color to show active state
      bg.setFillStyle(0x4a4a4a);
      bg.setStrokeStyle(2, 0x5599ff);

      // Calculate absolute position accounting for scroll
      const globalX = this.container.x + x;
      const globalY = this.container.y + y + dropdownHeight;

      // Create option buttons
      options.forEach((option, index) => {
        const optionButton = this.scene.add.container(
          globalX,
          globalY + index * 24
        );
        optionButton.setDepth(1000); // Very high depth

        // Option background
        const optionBg = this.scene.add.rectangle(
          0,
          0,
          dropdownWidth,
          24,
          option === currentValue ? 0x5599ff : 0x444444
        );
        optionBg.setOrigin(0, 0);
        optionBg.setStrokeStyle(1, 0x555555);

        // Option text
        const optionText = this.scene.add.text(5, 4, option.toString(), {
          fontSize: "14px",
          color: "#ffffff",
          fontStyle: option === currentValue ? "bold" : "normal",
        });

        // Add to option container
        optionButton.add([optionBg, optionText]);

        // Make interactive
        optionBg
          .setInteractive({ useHandCursor: true })
          .on("pointerover", () => {
            optionBg.setFillStyle(0x666666);
          })
          .on("pointerout", () => {
            optionBg.setFillStyle(
              option === currentValue ? 0x5599ff : 0x444444
            );
          })
          .on("pointerdown", () => {
            // Update value and close dropdown
            valueText.setText(option.toString());
            closeDropdown();
            onChange(option);
          });

        // Add to tracking array
        optionButtons.push(optionButton);

        // Add to scene
        this.scene.add.existing(optionButton);
      });

      // Listen for clicks outside
      this.scene.input.once("pointerdown", (pointer: Phaser.Input.Pointer) => {
        // Small delay to allow the current click to process first
        setTimeout(() => {
          closeDropdown();
        }, 10);
      });
    };

    // Function to close dropdown
    const closeDropdown = () => {
      if (!isOpen) return;
      isOpen = false;

      // Show hint when closed
      hintText.setVisible(true);

      // Reset background color
      bg.setFillStyle(0x3a3a3a);
      bg.setStrokeStyle(2, 0x777777);

      // Destroy all option buttons
      optionButtons.forEach((button) => button.destroy());
      optionButtons = [];
    };

    // Make dropdown button interactive
    bg.setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        if (!isOpen) {
          bg.setFillStyle(0x444444);
        }
      })
      .on("pointerout", () => {
        if (!isOpen) {
          bg.setFillStyle(0x3a3a3a);
        }
      })
      .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation();
        if (isOpen) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });

    // When this dropdown is destroyed, make sure to clean up option buttons
    dropdownContainer.once("destroy", () => {
      closeDropdown();
    });

    return dropdownContainer;
  }

  updatePositionForResize(x: number, y: number): void {
    this.container.setPosition(x, y);
  }
}
