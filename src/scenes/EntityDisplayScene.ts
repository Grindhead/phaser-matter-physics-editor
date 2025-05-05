import Phaser from "phaser";

/**
 * A scene dedicated solely to rendering the entity GameObjects
 * on top of other scenes like EditorUIScene.
 */
export class EntityDisplayScene extends Phaser.Scene {
  private platformContainer!: Phaser.GameObjects.Container;
  private entityContainer!: Phaser.GameObjects.Container;
  private editorSceneEvents!: Phaser.Events.EventEmitter;

  constructor() {
    super("EntityDisplayScene");
  }

  create(): void {
    // Create containers for layering within this scene
    this.platformContainer = this.add.container(0, 0).setDepth(0);
    this.entityContainer = this.add.container(0, 0).setDepth(1);

    // Get reference to the EditorScene's event emitter
    // We listen to events from EditorScene to know when to add/remove visuals
    const editorScene = this.scene.get("EditorScene");
    if (!editorScene) {
      console.error("EntityDisplayScene: Could not get EditorScene.");
      return;
    }
    this.editorSceneEvents = editorScene.events;

    // Listen for events to add/remove entities
    this.editorSceneEvents.on(
      "ADD_ENTITY_TO_DISPLAY",
      this.handleAddEntity,
      this
    );
    this.editorSceneEvents.on(
      "REMOVE_ENTITY_FROM_DISPLAY",
      this.handleRemoveEntity,
      this
    );
    this.editorSceneEvents.on(
      "CLEAR_ENTITY_DISPLAY",
      this.handleClearDisplay,
      this
    );

    // Ensure this scene cleans up listeners when it shuts down
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.editorSceneEvents.off("ADD_ENTITY_TO_DISPLAY", this.handleAddEntity);
      this.editorSceneEvents.off(
        "REMOVE_ENTITY_FROM_DISPLAY",
        this.handleRemoveEntity
      );
      this.editorSceneEvents.off(
        "CLEAR_ENTITY_DISPLAY",
        this.handleClearDisplay
      );
    });

    console.log("EntityDisplayScene created and listening for entities.");
  }

  private handleAddEntity(
    gameObject: Phaser.GameObjects.GameObject,
    type: string
  ): void {
    if (!gameObject || !gameObject.scene) {
      // If the gameObject has been destroyed before this handler runs, ignore it.
      // This can happen during rapid creation/deletion or scene transitions.
      console.warn(
        "EntityDisplayScene: Attempted to add an invalid GameObject."
      );
      return;
    }

    // Check if the gameObject already belongs to this scene or its containers.
    // If so, it might be a duplicate add event or already handled.
    if (gameObject.scene === this) {
      if (
        type === "platform" &&
        this.platformContainer.list.includes(gameObject)
      ) {
        console.warn(
          `EntityDisplayScene: GameObject already in platformContainer.`
        );
        return;
      } else if (
        type !== "platform" &&
        this.entityContainer.list.includes(gameObject)
      ) {
        console.warn(
          `EntityDisplayScene: GameObject already in entityContainer.`
        );
        return;
      }
      // If it's in this scene but not the right container, remove it first
      this.platformContainer.remove(gameObject, false); // Don't destroy here
      this.entityContainer.remove(gameObject, false); // Don't destroy here
    }

    // If the gameObject belongs to another scene, move it to this scene first.
    if (gameObject.scene && gameObject.scene !== this) {
      // console.log('Moving GameObject from', gameObject.scene.scene.key, 'to EntityDisplayScene');
      gameObject.scene.children.remove(gameObject); // Remove from old scene's display list
      this.sys.displayList.add(gameObject); // Add to this scene's display list
      this.sys.updateList.add(gameObject); // Add to this scene's update list if needed (e.g., for animations)
    } else if (!gameObject.scene) {
      // If the gameObject doesn't have a scene yet, add it.
      // console.log('Adding GameObject without scene to EntityDisplayScene');
      this.sys.displayList.add(gameObject);
      this.sys.updateList.add(gameObject);
    }

    // Add to the appropriate container in *this* scene
    if (type === "platform") {
      // console.log('Adding to platformContainer', gameObject);
      this.platformContainer.add(gameObject);
    } else {
      // console.log('Adding to entityContainer', gameObject);
      this.entityContainer.add(gameObject);
    }
    // Ensure it has correct scroll factor relative to this scene's camera
    if (
      "setScrollFactor" in gameObject &&
      typeof gameObject.setScrollFactor === "function"
    ) {
      gameObject.setScrollFactor(1, 1);
    }
  }

  private handleRemoveEntity(gameObject: Phaser.GameObjects.GameObject): void {
    if (!gameObject) return;
    // Remove from containers without destroying (destruction is handled by EntityManager)
    // console.log('Removing from containers', gameObject);
    this.platformContainer.remove(gameObject, false);
    this.entityContainer.remove(gameObject, false);
    // Also remove from the scene's display list in case it wasn't in a container
    if (gameObject.scene === this) {
      this.sys.displayList.remove(gameObject);
      this.sys.updateList.remove(gameObject);
    }
  }

  private handleClearDisplay(): void {
    console.log("EntityDisplayScene: Clearing all entities.");
    // Remove all without destroying
    this.platformContainer.removeAll(false);
    this.entityContainer.removeAll(false);
  }
}
