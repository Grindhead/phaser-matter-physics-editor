import Phaser from "phaser";
import { SCENES, TEXTURE_ATLAS } from "../lib/constants";
import { DebugPanel } from "../lib/ui/DebugPanel";
import { CoinUI } from "../lib/ui/CoinUI";
import { LevelUI } from "../lib/ui/LevelUI";

/**
 * A separate scene for displaying the Debug UI overlay.
 * Runs in parallel with the main Game scene.
 */
export class UIScene extends Phaser.Scene {
  private debugPanel: DebugPanel;
  private coinUI: CoinUI;
  private levelUI: LevelUI;
  private overlayButton: Phaser.GameObjects.Image;

  constructor() {
    super(SCENES.DEBUG_UI);
  }

  create(): void {
    console.log("DebugUIScene created");
    // Create the Debug Panel instance within this scene
    // Position top-right: x = screen width - padding, y = padding
    const padding = 10;
    this.debugPanel = new DebugPanel(this, this.scale.width - padding, padding);

    // Instantiate CoinUI in the top-left corner
    this.coinUI = new CoinUI(this);
    this.levelUI = new LevelUI(this);

    // Create the continue button - fixed to camera
    this.overlayButton = this.add
      .image(
        this.scale.width / 2,
        this.scale.height / 2,
        TEXTURE_ATLAS,
        "ui/continue.png"
      )
      .setScrollFactor(0)
      .setInteractive()
      .setDepth(10000)
      .setOrigin(0.5);

    this.overlayButton.setScale(3);

    this.overlayButton.visible = false;

    // Add event handler
    this.overlayButton.on("pointerup", () => {
      // Clean up text when button is clicked
      this.overlayButton!.destroy();
      // Get reference to the Game scene and call its restartLevel method
      const gameScene = this.scene.get(SCENES.GAME);
      (gameScene as Phaser.Scene & { restartLevel: () => void }).restartLevel();
    });

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
        this.levelUI.destroy();
        this.coinUI.destroy();
      });
    }

    // Setup Q key listener within this scene
    this.input.keyboard?.on("keydown-Q", () => {
      this.debugPanel.toggle();
      // Emit event to toggle physics debug in Game scene
      this.game.events.emit("togglePhysicsDebug");
    });
  }

  private handleDebugDataUpdate(data: { [key: string]: any }): void {
    this.debugPanel.update(data);
  }

  public showContinueButton(): void {
    this.overlayButton.visible = true;
  }

  public hideContinueButton(): void {
    this.overlayButton.visible = false;
  }

  // Update CoinUI every frame
  update(): void {
    this.coinUI.update();
    this.levelUI.update();
  }
}
