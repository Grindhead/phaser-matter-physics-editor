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

  constructor(
    scene: Scene,
    config: InspectorConfig,
    onPropertyChange: (
      entity: EditorEntity,
      property: string,
      value: any
    ) => void
  ) {
    this.scene = scene;
    this.onPropertyChangeCallback = onPropertyChange;

    // Create container
    this.container = scene.add.container(config.x, config.y);

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
        yOffset += 120; // Increased from 80 to accommodate the ID field
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

    // Update background height
    this.background.setSize(this.background.width, yOffset + padding);
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

    // Segment Count Label
    const segmentLabel = this.scene.add.text(x, y, "Segments:", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.propertyControls.push(segmentLabel);
    this.container.add(segmentLabel);

    // Segment Count Input
    const segmentInput = this.createNumberInput(
      x + 90,
      y,
      platformData.segmentCount,
      (value) => {
        if (this.selectedEntity && this.selectedEntity.type === "platform") {
          this.onPropertyChangeCallback(
            this.selectedEntity,
            "segmentCount",
            value
          );
        }
      }
    );
    this.propertyControls.push(segmentInput);
    this.container.add(segmentInput);

    // Orientation Label
    const orientationLabel = this.scene.add.text(x, y + 30, "Orientation:", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.propertyControls.push(orientationLabel);
    this.container.add(orientationLabel);

    // Orientation Buttons (Horizontal/Vertical)
    const horizontalBtn = this.createButton(
      x + 90,
      y + 30,
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
      x + 180,
      y + 30,
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

    // ID Label
    const idLabel = this.scene.add.text(x, y + 60, "ID:", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.propertyControls.push(idLabel);
    this.container.add(idLabel);

    // ID Input
    const idInput = this.createTextInput(
      x + 90,
      y + 60,
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

    // Button background
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
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    // Make button interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      onClick();
      bg.setFillStyle(0x4477ff); // Highlight when selected
    });

    return container;
  }

  updatePositionForResize(x: number, y: number): void {
    this.container.setPosition(x, y);
  }
}
