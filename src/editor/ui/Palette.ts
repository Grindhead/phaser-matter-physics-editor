import { Scene } from "phaser";
import { Platform } from "../../entities/Platforms/Platform";
import { EnemySmall } from "../../entities/Enemies/EnemySmall";
import { Crate } from "../../entities/Crate/Crate";
import { Barrel } from "../../entities/Barrel/Barrel";
import { Finish } from "../../entities/Finish/Finish";
import { EnemyBase } from "../../entities/Enemies/EnemyBase";
import { Player } from "../../entities/Player/Player";

// Import a concrete Enemy class for large enemy
import { EnemyLarge } from "../../entities/Enemies/EnemyLarge";

export interface PaletteConfig {
  x: number;
  y: number;
  width: number;
  padding?: number;
  background?: {
    color: number;
    alpha?: number;
  };
}

export interface EntityButton {
  type: string;
  entityClass:
    | typeof Platform
    | typeof EnemyBase
    | typeof EnemySmall
    | typeof EnemyLarge
    | typeof Crate
    | typeof Barrel
    | typeof Finish
    | typeof Player;
  entityConfig: any;
  displayName: string;
  scale?: number;
  heightFactor?: number;
  offsetX?: number;
  offsetY?: number;
  options?: Array<{
    label: string;
    value: string;
    config?: any;
  }>;
}

export class Palette {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private buttons: { [key: string]: Phaser.GameObjects.Container } = {};
  private dropdowns: { [key: string]: Phaser.GameObjects.Container } = {};
  private selectedButton: string | null = null;
  private selectedOption: { [key: string]: string } = {};
  private onSelectCallback: (type: string, config?: any) => void;
  private entities: EntityButton[] = [];
  private segmentInput: Phaser.GameObjects.DOMElement | null = null;
  private isGenerateMode: boolean = false;

  constructor(
    scene: Scene,
    config: PaletteConfig,
    onSelect: (type: string, config?: any) => void
  ) {
    this.scene = scene;
    this.onSelectCallback = onSelect;

    // Setup entity definitions with production-ready values
    this.entities = [
      {
        type: "player",
        entityClass: Player,
        entityConfig: {},
        displayName: "Player",
        scale: 0.6,
        heightFactor: 1.1,
      },
      {
        type: "platform",
        entityClass: Platform,
        entityConfig: {
          segmentCount: 3,
          id: "palette-platform",
          isVertical: false,
        },
        displayName: "Platform",
        scale: 0.5,
        heightFactor: 0.8,
        options: [
          {
            label: "Horizontal",
            value: "horizontal",
            config: { isVertical: false },
          },
          {
            label: "Vertical",
            value: "vertical",
            config: { isVertical: true },
          },
        ],
      },
      {
        type: "enemy-large",
        entityClass: EnemyLarge,
        entityConfig: {},
        displayName: "Large Enemy",
        scale: 0.5,
        heightFactor: 1.2,
      },
      {
        type: "enemy-small",
        entityClass: EnemySmall,
        entityConfig: {},
        displayName: "Small Enemy",
        scale: 0.5,
        heightFactor: 1.0,
      },
      {
        type: "crate-small",
        entityClass: Crate,
        entityConfig: {
          type: "small",
        },
        displayName: "Small Crate",
        scale: 0.5,
        heightFactor: 0.9,
      },
      {
        type: "crate-big",
        entityClass: Crate,
        entityConfig: {
          type: "big",
        },
        displayName: "Big Crate",
        scale: 0.5,
        heightFactor: 1.1,
      },
      {
        type: "barrel",
        entityClass: Barrel,
        entityConfig: {},
        displayName: "Barrel",
        scale: 0.65,
        heightFactor: 1.0,
      },
      {
        type: "finish-line",
        entityClass: Finish,
        entityConfig: {},
        displayName: "Finish Line",
        scale: 0.45,
        heightFactor: 1.0,
      },
    ];

    // Create container
    this.container = scene.add.container(config.x, config.y);

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

      // Add extra height for dropdown if entity has options
      if (entity.options && entity.options.length > 0) {
        totalHeight += 30; // Height for dropdown
      }
    });

    return totalHeight;
  }

  private createButtons(config: PaletteConfig): void {
    const padding = config.padding || 10;
    const buttonWidth = config.width - padding * 2;
    let currentY = padding;

    this.entities.forEach((entity) => {
      // Calculate dynamic button height based on entity type
      const baseHeight = 50;
      const heightFactor = entity.heightFactor || 1.0;
      const buttonHeight = baseHeight * heightFactor;

      // Create button container
      const buttonContainer = this.scene.add.container(padding, currentY);

      // Create button background
      const buttonBg = this.scene.add.rectangle(
        0,
        0,
        buttonWidth,
        buttonHeight,
        0x444444
      );
      buttonBg.setOrigin(0, 0);
      buttonContainer.add(buttonBg);

      // Position calculation for entity preview
      const iconX = buttonWidth / 5; // Position at 1/5 of button width instead of 1/4
      const iconY = buttonHeight / 2; // Center vertically

      // Create entity instance for display in the palette
      let entityInstance:
        | Platform
        | EnemySmall
        | EnemyLarge
        | Crate
        | Barrel
        | Finish
        | Player;

      switch (entity.type) {
        case "player":
          entityInstance = new Player(this.scene, 0, 0);
          break;
        case "platform":
          entityInstance = new Platform(
            this.scene,
            0,
            0,
            entity.entityConfig.segmentCount,
            entity.entityConfig.id,
            entity.entityConfig.isVertical
          );
          // Ensure platform is visible by bringing it to top and setting proper depth
          entityInstance.setDepth(10);
          break;
        case "enemy-large":
          entityInstance = new EnemyLarge(this.scene, 0, 0);
          break;
        case "enemy-small":
          entityInstance = new EnemySmall(this.scene, 0, 0);
          break;
        case "crate-small":
          entityInstance = new Crate(
            this.scene,
            0,
            0,
            entity.entityConfig.type
          );
          break;
        case "crate-big":
          entityInstance = new Crate(
            this.scene,
            0,
            0,
            entity.entityConfig.type
          );
          break;
        case "barrel":
          entityInstance = new Barrel(this.scene, 0, 0);
          break;
        case "finish-line":
          entityInstance = new Finish(this.scene, 0, 0);
          break;
        default:
          // Provide a default to satisfy TypeScript
          entityInstance = new Player(this.scene, 0, 0);
          break;
      }

      // Set scale from entity definition
      const scale = entity.scale || 0.7;
      entityInstance.setScale(scale);

      // Position entity correctly within the button
      entityInstance.setPosition(iconX, iconY);

      // Add the entity to the button container
      entityInstance.setDepth(1);
      buttonContainer.add(entityInstance);

      // Create button text
      const text = this.scene.add.text(
        buttonWidth * 0.35,
        buttonHeight / 2,
        entity.displayName,
        {
          fontSize: "16px",
          color: "#ffffff",
        }
      );
      text.setOrigin(0, 0.5);
      buttonContainer.add(text);

      // Add down arrow indicator for entities with options
      if (entity.options && entity.options.length > 0) {
        const arrow = this.scene.add.text(
          buttonWidth - 20,
          buttonHeight / 2,
          "▼",
          {
            fontSize: "12px",
            color: "#ffffff",
          }
        );
        arrow.setOrigin(0.5, 0.5);
        buttonContainer.add(arrow);
      }

      // Make button interactive
      buttonBg.setInteractive({ useHandCursor: true });

      // Add event listeners
      buttonBg.on("pointerdown", () => {
        this.selectButton(entity.type, false); // Pass false to prevent entity generation
      });

      buttonBg.on("pointerover", () => {
        buttonBg.setFillStyle(0x666666);
      });

      buttonBg.on("pointerout", () => {
        if (this.selectedButton !== entity.type) {
          buttonBg.setFillStyle(0x444444);
        }
      });

      // Add to container and store reference
      this.container.add(buttonContainer);
      this.buttons[entity.type] = buttonContainer;

      // Update currentY for next button
      currentY += buttonHeight + padding;

      // Create dropdown if entity has options
      if (entity.options && entity.options.length > 0) {
        this.createDropdown(entity, buttonWidth, currentY, padding);
        currentY += 30; // Add height for dropdown

        // Add segment count input for platform
        if (entity.type === "platform") {
          this.createSegmentCountInput(entity, buttonWidth, currentY, padding);
          currentY += 30; // Add height for segment count input

          // Add generate button
          this.createGenerateButton(entity, buttonWidth, currentY, padding);
          currentY += 40; // Add height for generate button
        }
      }
    });
  }

  private createDropdown(
    entity: EntityButton,
    width: number,
    y: number,
    padding: number
  ): void {
    // Default selected option to first in list
    if (
      !this.selectedOption[entity.type] &&
      entity.options &&
      entity.options.length > 0
    ) {
      this.selectedOption[entity.type] = entity.options[0].value;
    }

    // Create dropdown container
    const dropdownContainer = this.scene.add.container(padding, y);

    // Set proper depth to ensure visibility
    dropdownContainer.setDepth(100);

    // Create dropdown background
    const dropdownBg = this.scene.add.rectangle(0, 0, width, 30, 0x333333);
    dropdownBg.setOrigin(0, 0);
    dropdownContainer.add(dropdownBg);

    // Create dropdown options
    if (entity.options) {
      const optionWidth = width / entity.options.length;

      entity.options.forEach((option, index) => {
        // Create option background
        const optionBg = this.scene.add.rectangle(
          index * optionWidth,
          0,
          optionWidth,
          30,
          0x555555
        );
        optionBg.setOrigin(0, 0);

        // Highlight selected option
        if (this.selectedOption[entity.type] === option.value) {
          optionBg.setFillStyle(0x88aaff);
        }

        // Make option interactive
        optionBg.setInteractive({ useHandCursor: true });

        // Add event listeners
        optionBg.on("pointerdown", () => {
          this.selectOption(entity.type, option.value, option.config);

          // Update visuals
          dropdownContainer.list.forEach((item, i) => {
            if (i > 0 && i <= entity.options!.length) {
              const bg = item as Phaser.GameObjects.Rectangle;
              if (i - 1 === index) {
                bg.setFillStyle(0x88aaff);
              } else {
                bg.setFillStyle(0x555555);
              }
            }
          });
        });

        optionBg.on("pointerover", () => {
          if (this.selectedOption[entity.type] !== option.value) {
            optionBg.setFillStyle(0x777777);
          }
        });

        optionBg.on("pointerout", () => {
          if (this.selectedOption[entity.type] !== option.value) {
            optionBg.setFillStyle(0x555555);
          }
        });

        dropdownContainer.add(optionBg);

        // Create option text
        const optionText = this.scene.add.text(
          index * optionWidth + optionWidth / 2,
          15,
          option.label,
          {
            fontSize: "12px",
            color: "#ffffff",
          }
        );
        optionText.setOrigin(0.5, 0.5);
        dropdownContainer.add(optionText);
      });
    }

    // Add to container and store reference
    this.container.add(dropdownContainer);
    this.dropdowns[entity.type] = dropdownContainer;

    // Hide dropdown initially if not selected
    if (this.selectedButton !== entity.type) {
      dropdownContainer.setVisible(false);
    }
  }

  private createGenerateButton(
    entity: EntityButton,
    width: number,
    y: number,
    padding: number
  ): void {
    // Create button container
    const buttonContainer = this.scene.add.container(padding, y);
    buttonContainer.setDepth(100);

    // Create button background
    const buttonBg = this.scene.add.rectangle(
      0,
      0,
      width,
      30,
      0x007700 // Green color for generate button
    );
    buttonBg.setOrigin(0, 0);
    buttonContainer.add(buttonBg);

    // Create button text
    const buttonText = this.scene.add.text(width / 2, 15, "Generate Platform", {
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    buttonText.setOrigin(0.5, 0.5);
    buttonContainer.add(buttonText);

    // Make button interactive
    buttonBg.setInteractive({ useHandCursor: true });

    // Add event listeners
    buttonBg.on("pointerdown", () => {
      // Set generate mode to true and notify callback
      this.isGenerateMode = true;

      if (this.onSelectCallback && this.selectedButton) {
        // Get the updated entity config
        const entityIndex = this.entities.findIndex(
          (e) => e.type === this.selectedButton
        );

        if (entityIndex >= 0) {
          // Get current options including both segment count and orientation
          const currentConfig = { ...this.entities[entityIndex].entityConfig };

          // Make sure orientation is properly set based on selected option
          const selectedType = this.selectedButton;
          if (selectedType && this.selectedOption[selectedType]) {
            const option = this.entities[entityIndex].options?.find(
              (opt) => opt.value === this.selectedOption[selectedType]
            );

            if (option && option.config) {
              // Merge the selected option config with current config
              Object.assign(currentConfig, option.config);
            }
          }

          // Ensure we're using the most up-to-date configuration
          this.onSelectCallback(this.selectedButton, currentConfig);
        }
      }
    });

    buttonBg.on("pointerover", () => {
      buttonBg.setFillStyle(0x009900);
    });

    buttonBg.on("pointerout", () => {
      buttonBg.setFillStyle(0x007700);
    });

    // Add to container and store reference
    this.container.add(buttonContainer);
    this.dropdowns[entity.type + "-generate"] = buttonContainer;

    // Hide button initially if not selected
    if (this.selectedButton !== entity.type) {
      buttonContainer.setVisible(false);
    }
  }

  private createSegmentCountInput(
    entity: EntityButton,
    width: number,
    y: number,
    padding: number
  ): void {
    // Create input container
    const inputContainer = this.scene.add.container(padding, y);
    inputContainer.setDepth(100);

    // Create input background
    const inputBg = this.scene.add.rectangle(0, 0, width, 30, 0x333333);
    inputBg.setOrigin(0, 0);
    inputContainer.add(inputBg);

    // Create segment count label
    const labelText = this.scene.add.text(10, 15, "Segments:", {
      fontSize: "12px",
      color: "#ffffff",
    });
    labelText.setOrigin(0, 0.5);
    inputContainer.add(labelText);

    // Create number input buttons
    this.createNumberSelector(inputContainer, 85, 15, entity);

    // Add to container and store reference
    this.container.add(inputContainer);
    this.dropdowns[entity.type + "-segments"] = inputContainer;

    // Hide input initially if not selected
    if (this.selectedButton !== entity.type) {
      inputContainer.setVisible(false);
    }
  }

  private createNumberSelector(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    entity: EntityButton
  ): void {
    // Current segment count
    const currentCount = entity.entityConfig.segmentCount || 3;

    // Create decrease button
    const minusButton = this.scene.add.text(x, y, "-", {
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "#555555",
      padding: { left: 8, right: 8, top: 2, bottom: 2 },
    });
    minusButton.setOrigin(0.5);
    minusButton.setInteractive({ useHandCursor: true });

    // Create value display
    const valueText = this.scene.add.text(x + 40, y, currentCount.toString(), {
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#666666",
      padding: { left: 10, right: 10, top: 4, bottom: 4 },
    });
    valueText.setOrigin(0.5);

    // Create increase button
    const plusButton = this.scene.add.text(x + 80, y, "+", {
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "#555555",
      padding: { left: 8, right: 8, top: 2, bottom: 2 },
    });
    plusButton.setOrigin(0.5);
    plusButton.setInteractive({ useHandCursor: true });

    // Add event listeners
    minusButton.on("pointerdown", () => {
      // Decrease segment count
      const entityIndex = this.entities.findIndex(
        (e) => e.type === entity.type
      );
      if (entityIndex >= 0) {
        const currentValue =
          this.entities[entityIndex].entityConfig.segmentCount || 3;
        const newValue = Math.max(1, currentValue - 1);

        // Update config
        const entityConfig = {
          ...this.entities[entityIndex].entityConfig,
          segmentCount: newValue,
        };
        this.entities[entityIndex].entityConfig = entityConfig;

        // Update display
        valueText.setText(newValue.toString());
        this.updateEntityDisplay(entity.type, entityConfig);
      }
    });

    plusButton.on("pointerdown", () => {
      // Increase segment count
      const entityIndex = this.entities.findIndex(
        (e) => e.type === entity.type
      );
      if (entityIndex >= 0) {
        const currentValue =
          this.entities[entityIndex].entityConfig.segmentCount || 3;
        const newValue = currentValue + 1;

        // Update config
        const entityConfig = {
          ...this.entities[entityIndex].entityConfig,
          segmentCount: newValue,
        };
        this.entities[entityIndex].entityConfig = entityConfig;

        // Update display
        valueText.setText(newValue.toString());
        this.updateEntityDisplay(entity.type, entityConfig);
      }
    });

    // Add hover effects
    const addHoverEffects = (button: Phaser.GameObjects.Text) => {
      button.on("pointerover", () => {
        button.setBackgroundColor("#777777");
      });

      button.on("pointerout", () => {
        button.setBackgroundColor("#555555");
      });
    };

    addHoverEffects(minusButton);
    addHoverEffects(plusButton);

    // Add to container
    container.add([minusButton, valueText, plusButton]);
  }

  private selectOption(type: string, value: string, config?: any): void {
    this.selectedOption[type] = value;

    // Update entity config with the selected option config
    if (config) {
      const entityIndex = this.entities.findIndex((e) => e.type === type);
      if (entityIndex >= 0) {
        const entityConfig = {
          ...this.entities[entityIndex].entityConfig,
          ...config,
        };
        this.entities[entityIndex].entityConfig = entityConfig;

        // Update entity display in palette if needed
        this.updateEntityDisplay(type, entityConfig);
      }
    }

    // Only update the configuration, don't notify to prevent entity creation
    // The actual entity creation will happen only when placing in the editor
  }

  private updateEntityDisplay(type: string, config: any): void {
    // Re-create the entity display with new config if needed
    // This is mainly for platforms to show horizontal/vertical orientation
    if (type === "platform" && this.buttons[type]) {
      const buttonContainer = this.buttons[type];
      const entityDisplay = buttonContainer.getAt(1);

      if (entityDisplay instanceof Platform) {
        // Remove current display
        buttonContainer.remove(entityDisplay);
        entityDisplay.destroy();

        // Create new display with updated config
        const newEntity = new Platform(
          this.scene,
          0,
          0,
          config.segmentCount || 3,
          config.id || "palette-platform",
          config.isVertical || false
        );

        // Position calculation
        const buttonBg = buttonContainer.getAt(
          0
        ) as Phaser.GameObjects.Rectangle;
        const buttonWidth = buttonBg.width;
        const buttonHeight = buttonBg.height;
        const iconX = buttonWidth / 5;
        const iconY = buttonHeight / 2;

        // Set scale and position
        newEntity.setScale(
          this.entities.find((e) => e.type === type)?.scale || 0.5
        );
        newEntity.setPosition(iconX, iconY);
        newEntity.setDepth(10);

        // Add back to container
        buttonContainer.addAt(newEntity, 1);
      }
    }
  }

  /**
   * Handles the selection of an entity type button
   */
  selectButton(type: string, generateEntity: boolean = true): void {
    // Reset generate mode
    this.isGenerateMode = generateEntity;

    // Deselect previous button if any
    if (this.selectedButton) {
      const prevButton = this.buttons[this.selectedButton];
      const prevBg = prevButton.getAt(0) as Phaser.GameObjects.Rectangle;
      prevBg.setFillStyle(0x444444);

      // Hide previous dropdown if exists
      if (this.dropdowns[this.selectedButton]) {
        this.dropdowns[this.selectedButton].setVisible(false);
      }

      // Hide segment count input if exists
      if (this.dropdowns[this.selectedButton + "-segments"]) {
        this.dropdowns[this.selectedButton + "-segments"].setVisible(false);
      }

      // Hide generate button if exists
      if (this.dropdowns[this.selectedButton + "-generate"]) {
        this.dropdowns[this.selectedButton + "-generate"].setVisible(false);
      }
    }

    // Select new button
    const button = this.buttons[type];
    const bg = button.getAt(0) as Phaser.GameObjects.Rectangle;
    bg.setFillStyle(0x88aaff); // Use a blue highlight to make selection obvious

    this.selectedButton = type;

    // Show dropdown if exists
    if (this.dropdowns[type]) {
      this.dropdowns[type].setVisible(true);
      // Ensure dropdown is at the top of the display list
      this.container.bringToTop(this.dropdowns[type]);
    }

    // Show segment count input if exists
    if (this.dropdowns[type + "-segments"]) {
      this.dropdowns[type + "-segments"].setVisible(true);
      this.container.bringToTop(this.dropdowns[type + "-segments"]);
    }

    // Show generate button if exists
    if (this.dropdowns[type + "-generate"]) {
      this.dropdowns[type + "-generate"].setVisible(true);
      this.container.bringToTop(this.dropdowns[type + "-generate"]);
    }

    // Notify about selection with current config, but only if generate mode is true
    if (this.onSelectCallback && this.isGenerateMode) {
      const entity = this.entities.find((e) => e.type === type);
      if (entity) {
        this.onSelectCallback(type, entity.entityConfig);
      } else {
        this.onSelectCallback(type);
      }
    }
  }

  /**
   * Clears the current selection
   */
  clearSelection(): void {
    if (this.selectedButton) {
      const button = this.buttons[this.selectedButton];
      if (button) {
        const bg = button.getAt(0) as Phaser.GameObjects.Rectangle;
        bg.setFillStyle(0x444444);
      }

      // Hide dropdown if exists
      if (this.dropdowns[this.selectedButton]) {
        this.dropdowns[this.selectedButton].setVisible(false);
      }

      // Hide segment count input if exists
      if (this.dropdowns[this.selectedButton + "-segments"]) {
        this.dropdowns[this.selectedButton + "-segments"].setVisible(false);
      }

      // Hide generate button if exists
      if (this.dropdowns[this.selectedButton + "-generate"]) {
        this.dropdowns[this.selectedButton + "-generate"].setVisible(false);
      }

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
}
