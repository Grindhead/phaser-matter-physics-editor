# Product Context

## Problem Solved

This project aimed to create a feature-rich, responsive platformer game using Phaser 3 and Matter.js, incorporating procedural generation and specific gameplay mechanics based on iterative feedback.

## How It Works (Result)

The final product is a platformer game where the player navigates procedurally generated levels. Key features include:

- Responsive design adapting to different screen sizes.
- Mobile touch controls alongside keyboard input.
- Matter.js physics for interactions.
- Procedural level generation including platforms, vertical walls, enemies, coins, crates, and barrels.
- Dynamic elements like respawning crates and segmented death zones.
- Specific gameplay mechanics: strategic crate placement for wall jumps, barrel interactions, coin collection, enemy avoidance.
- Polished user experience: immediate game start, smooth restart flow, dedicated landing animations.

## User Experience Goals (Achieved)

- Immediate Gameplay: The game starts automatically after loading.
- Responsive Controls: Works on desktop (keyboard) and mobile (touch).
- Engaging Gameplay Loop: Procedural generation provides replayability, and the restart flow is seamless.
- Clear Visuals: Depth sorting ensures player visibility; UI adapts to screen size.

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
- **Conditional Landing Animation:** The 'fx_land' animation should \_not\* play if the player collects a coin during the landing action.
