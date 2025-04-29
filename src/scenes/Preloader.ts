import { Scene } from "phaser";
import { PHYSICS, SCENES, TEXTURE_ATLAS } from "../lib/constants";
import { createAnimations } from "../lib/helpers/createAnimations";
import { PLAYER_ANIMATIONS } from "../entities/Player/playerAnimations";
import { COIN_ANIMATIONS } from "../entities/Coin/coinAnimations";
import { FINISH_ANIMATIONS } from "../entities/Finish/finishAnimations";
import { FX_ANIMATIONS } from "../entities/fx-land/fxAnimations";
import { BARREL_ANIMATIONS } from "../entities/Barrel/barrelAnimations";

export class Preloader extends Scene {
  constructor() {
    super(SCENES.PRELOADER);
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, "background");

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    //  Load the assets for the game
    this.load.setPath("assets");
    this.load.multiatlas(TEXTURE_ATLAS, "assets.json");
    this.load.json(PHYSICS, "physics.json");
  }

  create() {
    this.setupAnimations();
    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start(SCENES.MAIN_MENU);
  }

  setupAnimations() {
    // Create animations using the correct atlas key 'assets-1'
    createAnimations(this.game.anims, TEXTURE_ATLAS, PLAYER_ANIMATIONS);
    createAnimations(this.game.anims, TEXTURE_ATLAS, COIN_ANIMATIONS);
    createAnimations(this.game.anims, TEXTURE_ATLAS, FINISH_ANIMATIONS);
    createAnimations(this.game.anims, TEXTURE_ATLAS, FX_ANIMATIONS);
    createAnimations(this.game.anims, TEXTURE_ATLAS, BARREL_ANIMATIONS);
  }
}
