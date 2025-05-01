import { Scene, GameObjects } from "phaser";
import { SCENES, TEXTURE_ATLAS } from "../lib/constants";

export class MainMenu extends Scene {
  background: GameObjects.Image;
  logo: GameObjects.Image;
  playButton: GameObjects.Image;

  constructor() {
    super(SCENES.MAIN_MENU);
  }

  create() {
    const { width, height } = this.scale;

    this.background = this.add.image(
      width / 2,
      height / 2,
      TEXTURE_ATLAS,
      "ui/main-menu/background.png"
    );

    const screenAspectRatio = width / height;
    const imageAspectRatio = this.background.width / this.background.height;

    let scale: number;
    if (screenAspectRatio > imageAspectRatio) {
      // Screen is wider than image
      scale = width / this.background.width;
    } else {
      // Screen is taller than (or same aspect ratio as) image
      scale = height / this.background.height;
    }

    this.background.setScale(scale).setScrollFactor(0);

    this.logo = this.add.image(
      width / 2,
      height * 0.4,
      TEXTURE_ATLAS,
      "ui/main-menu/title.png"
    );

    this.playButton = this.add
      .image(
        width / 2,
        height * 0.75,
        TEXTURE_ATLAS,
        "ui/main-menu/play-game.png"
      )
      .setInteractive({ useHandCursor: true });

    this.playButton.on("pointerdown", () => {
      this.scene.start(SCENES.GAME);
    });
  }
}
