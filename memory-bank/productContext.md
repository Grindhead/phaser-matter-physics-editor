# Product Context

## Problem Solved

Manually configuring Matter.js physics in Phaser code can be tedious, error-prone, and lacks visual feedback. This editor aims to simplify this process, allowing developers and designers to visually create and tweak physics interactions.

## How It Works (Vision)

Users will interact with a graphical interface representing the Phaser/Matter.js scene. They can add predefined shapes or draw custom polygons, adjust their physical properties via input fields and sliders, connect bodies with constraints, and see a visual representation of the physics world.

## User Experience Goals

- Intuitive visual editing.
- Real-time feedback (potentially a simulation preview).
- Streamlined workflow for exporting configurations.
- Easy integration with existing Phaser projects.

## Gameplay Enhancements (Derived from Feedback)

- **Restart Input:** Allow level restart via keyboard input (Space/Enter) in addition to mouse/touch.
- **Streamlined Restart:** Combine the "dismiss game over" and "restart level" actions into a single input (click/press).
- **Post-Obstacle Safe Zone:** Provide a brief "safe zone" (e.g., slightly wider platform or temporary invulnerability) after clearing the first major obstacle (platform/enemy) to reinforce success.
- **Platform Visibility:** Ensure platforms are always fully visible by adjusting maximum Y-distance generation parameters to prevent "leaps of faith."
- **Box Respawns:** Respawn interactable boxes when the level restarts.
- **Reduced Fall Time:** Implement higher death colliders, especially early in the level, to reduce falling time after a mistake.
- **Enemy Difficulty Curve:**
  - Introduce smaller/simpler enemies early to teach avoidance mechanics.
  - Reserve larger/more challenging enemies for later parts of the level.
- **Level Complete Animation:** When the player completes a level and lands, play a specific "cool landing" animation, overriding any other current animation.
- **Finish Line Depth:** Ensure the player sprite is always rendered visually in front of (on top of) the finish line sprite.
- **Enemy Placement (Level 1):** The first two generated platforms in level 1 must never contain enemies.
