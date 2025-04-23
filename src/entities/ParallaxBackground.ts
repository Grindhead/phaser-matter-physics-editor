import Phaser from "phaser";

/**
 * Creates a tile sprite background that scrolls at a different speed than the camera,
 * creating a parallax effect.
 */
export class ParallaxBackground extends Phaser.GameObjects.TileSprite {
  private customScrollFactorX: number;

  /**
   * @param scene - The Scene to which this Game Object belongs.
   * @param x - The horizontal position of this Game Object in the world.
   * @param y - The vertical position of this Game Object in the world.
   * @param width - The width of the tile sprite.
   * @param height - The height of the tile sprite.
   * @param textureKey - The key, or index image array, of the texture this Game Object will use to render with, as stored in the Texture Manager.
   * @param scrollFactorX - The horizontal scroll factor relative to the camera. 0 means no scroll, 1 means scroll with camera. Default is 0.5.
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    textureKey: string,
    scrollFactorX: number = 0.5
  ) {
    super(scene, x, y, width, height, textureKey);
    this.customScrollFactorX = scrollFactorX;
    this.setOrigin(0, 0); // Align top-left
    this.setScrollFactor(0); // Keep the sprite fixed relative to the screen initially
    scene.add.existing(this); // Add to the scene
  }

  /**
   * Updates the tile sprite's position based on the camera scroll.
   */
  public update(): void {
    // Adjust the tile position based on the camera's scrollX and the custom scroll factor
    this.tilePositionX =
      this.scene.cameras.main.scrollX * this.customScrollFactorX;
  }
}
