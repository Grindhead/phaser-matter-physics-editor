import Phaser from "phaser";

/**
 * A tile sprite background that does not repeat vertically,
 * scales the texture to fit the canvas height exactly.
 */
export class ParallaxBackground extends Phaser.GameObjects.TileSprite {
  private customScrollFactorX: number;

  constructor(
    scene: Phaser.Scene,
    textureKey: string,
    scrollFactorX: number = 0.5
  ) {
    const canvasWidth = scene.scale.width;
    const canvasHeight = scene.scale.height;

    const image = scene.textures.get(textureKey).getSourceImage();

    const textureHeight = image.height;

    // Calculate scale so texture fits vertically
    const scaleY = canvasHeight / textureHeight;

    super(scene, 0, 0, canvasWidth, canvasHeight, textureKey);

    this.customScrollFactorX = scrollFactorX;

    this.setOrigin(0, 0);
    this.setScrollFactor(0);
    this.tileScaleY = scaleY;
    this.tileScaleX = scaleY; // optional: maintain aspect ratio

    scene.add.existing(this);
  }

  public update(): void {
    this.tilePositionX =
      this.scene.cameras.main.scrollX * this.customScrollFactorX;
  }
}
