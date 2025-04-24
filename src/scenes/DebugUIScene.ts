import Phaser from "phaser";
import { SCENES } from "../lib/constants";
import { DebugPanel } from "../lib/ui/DebugPanel";

/**
 * A separate scene for displaying the Debug UI overlay.
 * Runs in parallel with the main Game scene.
 */
export class DebugUIScene extends Phaser.Scene {
  private debugPanel?: DebugPanel;

  constructor() {
    super(SCENES.DEBUG_UI);
  }

  create(): void {
    console.log("DebugUIScene created");
    // Create the Debug Panel instance within this scene
    // Position top-right: x = screen width - padding, y = padding
    const padding = 10;
    this.debugPanel = new DebugPanel(this, this.scale.width - padding, padding);

    // Listen for data updates from the Game scene
    const gameScene = this.scene.get(SCENES.GAME);
    if (gameScene) {
      gameScene.events.on("updateDebugData", this.handleDebugDataUpdate, this);
      // Ensure listener is removed when this scene shuts down
      this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
        console.log("DebugUIScene shutting down, removing listener");
        gameScene.events.off(
          "updateDebugData",
          this.handleDebugDataUpdate,
          this
        );
      });
    }

    // Setup Q key listener within this scene
    this.input.keyboard?.on("keydown-Q", () => {
      this.debugPanel?.toggle();
    });
  }

  private handleDebugDataUpdate(data: { [key: string]: any }): void {
    this.debugPanel?.update(data);
  }

  // No update method needed here, panel is updated via events
}
