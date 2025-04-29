import Phaser from "phaser";
import { TEXTURE_ATLAS } from "../../constants";

/**
 * Manages the creation and properties of parallax background layers using TileSprites.
 * All layers are locked vertically relative to the camera bottom with specific offsets.
 * Layers use their original height and are not scaled vertically.
 * Manually updates tilePositionX for horizontal parallax effect.
 * Layers are created with the full level width after initialization.
 */
export class ParallaxManager {
  private scene: Phaser.Scene;
  private backgroundLayer: Phaser.GameObjects.TileSprite;
  private middleLayer: Phaser.GameObjects.TileSprite;
  private foregroundLayer: Phaser.GameObjects.TileSprite;
  private levelWidth: number = 0;

  // Store scroll factors
  private bgScrollFactorX: number;
  private midScrollFactorX: number;
  private fgScrollFactorX: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Initializes the parallax layers after the level width is known.
   * @param levelWidth The total width of the level.
   */
  public initialize(levelWidth: number): void {
    this.levelWidth = Math.max(levelWidth, this.scene.scale.width); // Ensure at least screen width
    this.createLayers();
  }

  private createLayers(): void {
    // Use stored levelWidth, not screenWidth for sprite creation
    const screenHeight = this.scene.scale.height;

    // Store factors from user edits/defaults
    this.bgScrollFactorX = 0.2; // Reset background factor
    this.midScrollFactorX = 1.5; // User edit
    this.fgScrollFactorX = 2.0; // User edit

    // Helper function to create a layer locked vertically to camera bottom
    const createLayer = (
      atlasKey: string, // Now atlas key
      frameName: string, // Now frame name
      depth: number,
      verticalOffset: number,
      scaleFactor: number
    ): Phaser.GameObjects.TileSprite => {
      // Get frame dimensions from the atlas
      const frame = this.scene.textures.getFrame(atlasKey, frameName);
      if (!frame) {
        console.error(`Frame '${frameName}' not found in atlas '${atlasKey}'`);
      }
      const frameHeight = frame.height;

      // Calculate the visually scaled height of the texture
      const scaledTextureHeight = frameHeight * scaleFactor;

      // Use scaled height, calculate Y relative to screen bottom + offset
      const layerY = screenHeight - scaledTextureHeight + verticalOffset;

      const layer = this.scene.add.tileSprite(
        0,
        layerY,
        this.levelWidth, // Use stored level width
        scaledTextureHeight, // Use scaled height for the TileSprite itself
        atlasKey, // Use atlas key
        frameName // Use frame name
      );
      layer.setOrigin(0, 0);
      layer.setDepth(depth);
      layer.setScrollFactor(0, 0); // Lock all layers vertically relative to the camera view
      layer.tileScaleY = scaleFactor;
      layer.tileScaleX = scaleFactor;

      return layer;
    };

    // Background - Locked to bottom of camera (offset 0)
    this.backgroundLayer = createLayer(
      TEXTURE_ATLAS,
      "bg/background.png",
      -3,
      -220,
      1
    );

    // Middle layer - Locked slightly above background (offset -50)
    this.middleLayer = createLayer(
      TEXTURE_ATLAS,
      "bg/middle-ground.png",
      -2,
      -250,
      1
    );

    // Foreground - Locked above middleground (offset -100)
    this.foregroundLayer = createLayer(
      TEXTURE_ATLAS,
      "bg/foreground.png",
      3,
      -250,
      1
    );
  }

  /**
   * Updates the tilePositionX of each layer based on camera scroll
   * to create the parallax effect.
   * Should be called in the scene's update loop.
   */
  public update(): void {
    // Ensure layers exist before updating
    if (!this.backgroundLayer || !this.middleLayer || !this.foregroundLayer) {
      return;
    }
    const scrollX = this.scene.cameras.main.scrollX;
    this.backgroundLayer.tilePositionX = scrollX * this.bgScrollFactorX;
    this.middleLayer.tilePositionX = scrollX * this.midScrollFactorX;
    this.foregroundLayer.tilePositionX = scrollX * this.fgScrollFactorX;
  }
}
