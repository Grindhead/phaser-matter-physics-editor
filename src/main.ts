import { Boot } from "./scenes/Boot";
import { Game as MainGame } from "./scenes/Game";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";
import { UIScene } from "./scenes/DebugUIScene";

import { Game, Types } from "phaser";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  parent: "game-container",
  backgroundColor: "#028af8",
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "matter",
    matter: {
      gravity: {
        x: 0,
        y: 1,
      },
      debug: {
        showAxes: false,
        showAngleIndicator: true,
        showBounds: false,
        showCollisions: true,
        showConvexHulls: true,
        showInternalEdges: false,
        showPositions: true,
        showSeparation: false,
        showVelocity: true,
        renderFill: true,
        renderLine: true,
        lineColor: 0x00ff00,
        fillColor: 0x00ff00,
        fillOpacity: 0.1,
        lineOpacity: 1,
        lineThickness: 1,
        staticFillColor: 0x0000ff,
        staticLineColor: 0x0000ff,
      },
    },
  },
  scene: [Boot, Preloader, MainMenu, MainGame, UIScene],
};

export default new Game(config);
