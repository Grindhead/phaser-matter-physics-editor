import { createAnimations } from "../helpers/createAnimations";
import { TEXTURE_ATLAS } from "../constants";
import { PLAYER_ANIMATIONS } from "../../entities/Player/playerAnimations";
import { FINISH_ANIMATIONS } from "../../entities/Finish/finishAnimations";
import { COIN_ANIMATIONS } from "../../entities/Coin/coinAnimations";
import { FX_ANIMATIONS } from "../../entities/fx-land/fxAnimations";
import { BARREL_ANIMATIONS } from "../../entities/Barrel/barrelAnimations";

export const setupAnimations = (game: Phaser.Scene): void => {
  // Create animations using the correct atlas key
  createAnimations(game.anims, TEXTURE_ATLAS, PLAYER_ANIMATIONS);
  createAnimations(game.anims, TEXTURE_ATLAS, COIN_ANIMATIONS);
  createAnimations(game.anims, TEXTURE_ATLAS, FINISH_ANIMATIONS);
  createAnimations(game.anims, TEXTURE_ATLAS, FX_ANIMATIONS);
  createAnimations(game.anims, TEXTURE_ATLAS, BARREL_ANIMATIONS);
};
