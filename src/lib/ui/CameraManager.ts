import { Scene } from "phaser";
import { Player } from "../../entities/Player/Player";

const WORLD_WIDTH = 10000;
const WORLD_HEIGHT = 4000;
// Define zoom levels
const BASE_ZOOM = 1.5; // Reduced base zoom
const ZOOM_IN = 2; // Zoom level on death - Increased for noticeable effect
const ZOOM_DURATION = 700; // Duration of death zoom tween in ms

export class CameraManager {
  private scene: Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Scene, player: Player) {
    this.scene = scene;
    this.camera = this.scene.cameras.main;
    this.setupCamera(player);
  }

  /**
   * Configures world and camera bounds.
   */
  private setupBounds(): void {
    this.scene.matter.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  /**
   * Sets up the camera to follow the player smoothly and applies initial zoom.
   *
   * @param player - The player sprite to follow.
   */
  private setupCamera(player: Player): void {
    this.setupBounds();
    this.camera.startFollow(player, true, 0.5, 0.5);
    this.camera.setLerp(0.5, 0.5);
    this.camera.setZoom(BASE_ZOOM); // Start at base zoom
  }

  /**
   * Initiates the zoom-in effect when the player dies.
   */
  handleZoomIn(): void {
    this.scene.tweens.add({
      targets: this.camera,
      zoom: ZOOM_IN,
      duration: ZOOM_DURATION,
      ease: "Power2",
    });
  }

  destroy(): void {
    this.camera.destroy();
  }
}
