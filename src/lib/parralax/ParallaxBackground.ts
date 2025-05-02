import Phaser from "phaser";

/**
 * A tile sprite background that updates its tilePositionX based on camera scroll.
 * Does not automatically scale or position itself.
 */
export class ParallaxBackground extends Phaser.GameObjects.TileSprite {
  private customScrollFactorX: number;

  constructor(
    scene: Phaser.Scene,
    atlasKey: string,
    frameName: string,
    scrollFactorX: number = 0.5
  ) {
    super(
      scene,
      0,
      0,
      scene.scale.width,
      scene.scale.height,
      atlasKey,
      frameName
    );

    this.customScrollFactorX = scrollFactorX;

    this.setOrigin(0, 0);
    this.setScrollFactor(0, 0);

    scene.add.existing(this);
  }

  public update(): void {
    this.tilePositionX =
      this.scene.cameras.main.scrollX * this.customScrollFactorX;
  }
}
