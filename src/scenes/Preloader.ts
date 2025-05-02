import { Scene } from "phaser";
import { PHYSICS, SCENES, TEXTURE_ATLAS } from "../lib/constants";
import { createAnimations } from "../lib/helpers/createAnimations";
import { PLAYER_ANIMATIONS } from "../entities/Player/playerAnimations";
import { COIN_ANIMATIONS } from "../entities/Coin/coinAnimations";
import { FINISH_ANIMATIONS } from "../entities/Finish/finishAnimations";
import { FX_ANIMATIONS } from "../entities/fx-land/fxAnimations";
import { BARREL_ANIMATIONS } from "../entities/Barrel/barrelAnimations";
import { setupAnimations } from "../lib/level-generation/createAnimations";

export class Preloader extends Scene {
  private loadingText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super(SCENES.PRELOADER);
  }

  init() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    const barWidth = 468;
    const barHeight = 32;
    const progressBarHeight = 28;
    const progressBarInitialWidth = 4;

    //  A simple progress bar. This is the outline of the bar.
    this.add
      .rectangle(centerX, centerY, barWidth, barHeight)
      .setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(
      centerX - barWidth / 2 + progressBarInitialWidth / 2 + 2,
      centerY,
      progressBarInitialWidth,
      progressBarHeight,
      0xffffff
    );

    // Add loading text
    this.loadingText = this.add
      .text(centerX, centerY - barHeight - 50, "Loading: 0%", {
        fontFamily: "Arial",
        fontSize: "50px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      bar.width = Math.round(
        progressBarInitialWidth +
          (barWidth - progressBarInitialWidth * 2) * progress
      );

      // Update the loading text
      this.loadingText?.setText(`Loading: ${Math.round(progress * 100)}%`);
    });
  }
  preload() {
    //  Load the assets for the game
    this.load.setPath("assets");
    this.load.multiatlas(TEXTURE_ATLAS, "assets.json");
    this.load.json(PHYSICS, "physics.json");
  }

  create() {
    setupAnimations(this);
    this.loadingText?.destroy(true);
    this.loadingText = null;
    this.scene.start(SCENES.MAIN_MENU);
  }
}
