import { Scene } from "phaser";
import { SCENES } from "../lib/constants";

export class Boot extends Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  preload() {
    //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
    //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.
    // Note: If Boot gets paused here, preload might not complete. It's safer to have minimal/no assets here.
  }

  create() {
    console.log("Boot: create");
    console.log("hello photonstorm");
    this.scene.start(SCENES.PRELOADER);
  }
}
