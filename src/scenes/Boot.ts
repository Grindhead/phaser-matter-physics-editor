import { Scene } from "phaser";
import { SCENES } from "../lib/constants";

export class Boot extends Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  create() {
    console.log("Boot: create");
    this.scene.start(SCENES.PRELOADER);
  }
}
