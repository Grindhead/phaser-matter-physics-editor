import Phaser from "phaser";
import { TEXTURE_ATLAS } from "../../constants";
import { ParallaxBackground } from "./ParallaxBackground";

/**
 * Manages the creation and properties of parallax background layers using ParallaxBackground.
 * All layers are locked vertically relative to the camera bottom with specific offsets.
 * Layers use their original height and are not scaled vertically.
 * Manually updates tilePositionX for horizontal parallax effect.
 * Layers are created with the full level width after initialization.
 */
export class ParallaxManager {
  private scene: Phaser.Scene;
  private backgroundLayer: ParallaxBackground;
  private middleLayer: ParallaxBackground;
  private foregroundLayer: ParallaxBackground;
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
    this.bgScrollFactorX = 0.2;
    this.midScrollFactorX = 1.5;
    this.fgScrollFactorX = 2.0;

    // Helper function to create a layer
    const createLayer = (
      atlasKey: string,
      frameName: string,
      depth: number,
      verticalOffset: number,
      scaleFactor: number,
      scrollFactorX: number
    ): ParallaxBackground => {
      // Get frame dimensions from the atlas
      const frame = this.scene.textures.getFrame(atlasKey, frameName);
      if (!frame) {
        console.error(`Frame '${frameName}' not found in atlas '${atlasKey}'`);
      }
      const frameHeight = frame.height;

      // Calculate the visually scaled height of the texture
      const scaledTextureHeight = frameHeight * scaleFactor;

      // Calculate Y relative to screen bottom + offset
      const layerY = screenHeight - scaledTextureHeight + verticalOffset;

      // Instantiate ParallaxBackground
      const layer = new ParallaxBackground(
        this.scene,
        atlasKey,
        frameName,
        this.levelWidth,
        scaledTextureHeight,
        scrollFactorX
      );

      layer.y = layerY; // Set Y position
      layer.setDepth(depth); // Set depth

      // No need to set origin, scrollFactor, tileScale as ParallaxBackground handles them

      return layer;
    };

    // Background
    this.backgroundLayer = createLayer(
      TEXTURE_ATLAS,
      "bg/background.png",
      -3,
      -220,
      1,
      this.bgScrollFactorX
    );

    // Middle layer
    this.middleLayer = createLayer(
      TEXTURE_ATLAS,
      "bg/middle-ground.png",
      -2,
      -250,
      1,
      this.midScrollFactorX
    );

    // Foreground
    this.foregroundLayer = createLayer(
      TEXTURE_ATLAS,
      "bg/foreground.png",
      3,
      -250,
      1,
      this.fgScrollFactorX
    );
  }

  /**
   * Updates the tilePositionX of each layer by calling its own update method.
   * Should be called in the scene's update loop.
   */
  public update(): void {
    // Ensure layers exist before updating
    if (!this.backgroundLayer || !this.middleLayer || !this.foregroundLayer) {
      return;
    }
    // Call update on each ParallaxBackground instance
    this.backgroundLayer.update();
    this.middleLayer.update();
    this.foregroundLayer.update();
  }
}
