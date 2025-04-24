import { Scene } from "phaser";
import { Player } from "../../entities/Player/Player";

const WORLD_WIDTH = 10000;
const WORLD_HEIGHT = 4000;
// Define zoom levels
const BASE_ZOOM = 1.0; // Reduced base zoom
const DEATH_ZOOM_IN = 1.5; // Zoom level on death
const DEATH_ZOOM_DURATION = 700; // Duration of death zoom tween in ms

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
  handlePlayerDeath(): void {
    this.scene.tweens.add({
      targets: this.camera,
      zoom: DEATH_ZOOM_IN,
      duration: DEATH_ZOOM_DURATION,
      ease: "Power2", // Use an easing function for smoothness
    });
  }
}
