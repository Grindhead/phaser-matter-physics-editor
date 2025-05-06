import { Scene } from "phaser";
import { EntityInstance } from "./types";
import { Platform } from "../../../entities/Platforms/Platform";
import { EnemySmall } from "../../../entities/Enemies/EnemySmall";
import { EnemyLarge } from "../../../entities/Enemies/EnemyLarge";
import { Crate } from "../../../entities/Crate/Crate";
import { Barrel } from "../../../entities/Barrel/Barrel";
import { Finish } from "../../../entities/Finish/Finish";
import { Player } from "../../../entities/Player/Player";

export class EntityFactory {
  static createEntityInstance(
    scene: Scene,
    entityType: string,
    config: any
  ): EntityInstance {
    switch (entityType) {
      case "player":
        return new Player(scene, 0, 0);
      case "platform":
        return new Platform(
          scene,
          0,
          0,
          config.segmentCount || 3,
          config.id || "palette-platform",
          config.isVertical || false
        );
      case "enemy-large":
        return new EnemyLarge(scene, 0, 0);
      case "enemy-small":
        return new EnemySmall(scene, 0, 0);
      case "crate-small":
      case "crate-big":
        return new Crate(scene, 0, 0, config.type);
      case "barrel":
        return new Barrel(scene, 0, 0);
      case "finish-line":
        return new Finish(scene, 0, 0);
      default:
        // Default to player as a fallback
        return new Player(scene, 0, 0);
    }
  }

  static updateEntityDisplay(
    scene: Scene,
    type: string,
    container: Phaser.GameObjects.Container,
    config: any
  ): void {
    // This is mainly for platforms to show horizontal/vertical orientation
    if (type === "platform") {
      const entityDisplay = container.getAt(1);

      if (entityDisplay instanceof Platform) {
        // Remove current display
        container.remove(entityDisplay);
        entityDisplay.destroy();

        // Create new display with updated config
        const newEntity = new Platform(
          scene,
          0,
          0,
          config.segmentCount || 3,
          config.id || "palette-platform",
          config.isVertical || false
        );

        // Position calculation
        const buttonBg = container.getAt(0) as Phaser.GameObjects.Rectangle;
        const buttonWidth = buttonBg.width;
        const buttonHeight = buttonBg.height;
        const iconX = buttonWidth / 6;
        const iconY = buttonHeight / 2;

        // Set scale and position
        newEntity.setScale(0.5); // Default scale if none provided
        newEntity.setPosition(iconX, iconY);
        newEntity.setDepth(10);

        // Add back to container
        container.addAt(newEntity, 1);
      }
    }
  }
}
