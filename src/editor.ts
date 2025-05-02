import { Game, Types } from "phaser";
import { EditorScene } from "./scenes/EditorScene";

// Add debug information
console.log("Editor script initializing");
console.log("Window size:", window.innerWidth, "x", window.innerHeight);

// Configuration for the editor
const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "editor-container",
  backgroundColor: "#333333",
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: "matter",
    matter: {
      gravity: {
        x: 0,
        y: 0, // No gravity in the editor
      },
      debug: {
        showAxes: false,
        showAngleIndicator: true,
        showBounds: false,
      },
    },
  },
  scene: [EditorScene],
};

// Create and start the editor
console.log(
  "Starting editor game with config:",
  JSON.stringify(config, null, 2)
);
new Game(config);

// Log message
console.log("Level Editor started");
