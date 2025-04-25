import Phaser from "phaser";

/**
 * Manages the creation and properties of parallax background layers using TileSprites.
 * Ensures background/middle layers scale vertically to fit the screen height without repeating.
 * Positions the foreground layer at the bottom without vertical scaling.
 */
export class ParallaxManager {
  private scene: Phaser.Scene;
  private backgroundLayer: Phaser.GameObjects.TileSprite;
  private middleLayer: Phaser.GameObjects.TileSprite;
  private foregroundLayer: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createLayers();
  }

  private createLayers(): void {
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;

    // Helper function to create and scale a layer

    const createLayer = (
      textureKey: string,
      scrollFactorX: number,
      depth: number,
      scaleToFitHeight: boolean = true // Add parameter with default true
    ): Phaser.GameObjects.TileSprite => {
      const texture = this.scene.textures.get(textureKey);
      if (!texture || texture.key === "__MISSING") {
        console.warn(`ParallaxManager: Texture not found: ${textureKey}`);
        const placeholder = this.scene.add.tileSprite(
          0,
          0,
          screenWidth,
          screenHeight,
          "__DEFAULT"
        );
        placeholder.setOrigin(0, 0);
        placeholder.setScrollFactor(scrollFactorX, 0);
        placeholder.setDepth(depth);
        return placeholder;
      }
      const textureHeight = texture.getSourceImage().height;

      let layerY = 0;
      let layerHeight = screenHeight;
      let tileScaleY = 1;
      let tileScaleX = 1;

      if (scaleToFitHeight) {
        // Calculate scale factor to fit height
        tileScaleY = screenHeight / textureHeight;
        tileScaleX = tileScaleY; // Maintain aspect ratio
        layerHeight = screenHeight; // Sprite height is screen height
      } else {
        // Don't scale vertically, position at bottom
        const verticalOffset = 50; // Pixels to shift down from the bottom edge
        layerHeight = textureHeight; // Sprite height is texture height
        layerY = screenHeight - layerHeight + verticalOffset; // Apply offset
        // Keep original scale
        tileScaleX = 1;
        tileScaleY = 1;
      }

      const layer = this.scene.add.tileSprite(
        0, // X position
        layerY, // Calculated Y position
        screenWidth, // TileSprite width
        layerHeight, // Calculated height
        textureKey
      );
      layer.setOrigin(0, 0);
      layer.setScrollFactor(scrollFactorX, 0);
      layer.setDepth(depth);

      // Apply scaling
      layer.tileScaleY = tileScaleY;
      layer.tileScaleX = tileScaleX;

      return layer;
    };

    // Background (furthest back) - Scale to fit height
    this.backgroundLayer = createLayer("background", 0.2, -3, true);

    // Middle layer - Scale to fit height
    this.middleLayer = createLayer("middleground", 1.5, -2, true);
    this.middleLayer.y = 0;

    // Foreground (closest) - Position at bottom, don't scale height
    this.foregroundLayer = createLayer("foreground", 2, 1, false);
    this.foregroundLayer.y = 950;
  }

  // Optional: Add update method if manual tilePosition updates are needed later
  // public update(): void {
  //   // Example: Manually update tile positions based on camera scroll
  //   // this.backgroundLayer.tilePositionX = this.scene.cameras.main.scrollX * 0.2;
  //   // this.middleLayer.tilePositionX = this.scene.cameras.main.scrollX * 0.5;
  //   // this.foregroundLayer.tilePositionX = this.scene.cameras.main.scrollX * 1;
  // }
}
