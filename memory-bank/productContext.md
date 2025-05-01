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
- Immediate Gameplay: The game should start automatically after loading, without requiring an initial click.

## Gameplay Enhancements (Derived from Feedback)

- **Restart Input:** Allow level restart via keyboard input (Space/Enter) in addition to mouse/touch.
- **Streamlined Restart:** Combine the "dismiss game over" and "restart level" actions into a single input (click/press).
- **Platform Visibility:** Ensure platforms are always fully visible by adjusting maximum Y-distance generation parameters to prevent "leaps of faith." [Done]
- **Box Respawns:** Respawn interactable boxes when the level restarts.
- **Multiple Dynamic Death Zones:** Implement multiple death zone colliders positioned 500px below platforms at various points throughout the level to reduce fall time after a mistake.
- **Crate Destruction:** Crates should be destroyed (removed from the game) if they hit a death zone collider.
- **Enemy Difficulty Curve & Density:**
  - Increase overall enemy density and level length for greater challenge.
  - Introduce smaller/simpler enemies early to teach avoidance mechanics.
  - Reserve larger/more challenging enemies for later parts of the level.
- **Level Complete Animation:** When the player completes a level and lands, play a specific "cool landing" animation, overriding any other current animation.
- **Finish Line Depth:** Ensure the player sprite is always rendered visually in front of (on top of) the finish line sprite.
- **Enemy Placement (Level 1):** The first two generated platforms in level 1 must never contain enemies. [Done]
- **Vertical Walls:** Introduce vertical walls made from rotated platforms.
- **Barrel Substitution:** When the horizontal gap between generated platforms exceeds the maximum jump distance, substitute the next platform with a barrel to create a mandatory barrel jump sequence.
- **Conditional Landing Animation:** The 'fx*land' animation should \_not* play if the player collects a coin during the landing action.
