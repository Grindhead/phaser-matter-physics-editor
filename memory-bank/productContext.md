# Product Context

## Problem Solved

This project aims to create a feature-rich, responsive platformer game using Phaser 3 and Matter.js. The primary goal is to enable **manual level design through a dedicated editor**, allowing for controlled and specific level layouts using pre-defined entities.

## How It Works

The final product will consist of:

1.  **A Level Editor (Run Separately):**

    - **Purpose:** Manually create, save, and load level layouts using available game entities.
    - **Features:**
      - UI Palette: Select platforms, enemies (from `@entities/Enemies`), barrels, crates (big/small), or the finish line.
      - Object Placement: Click/drag to place selected entities onto a canvas.
      - Platform Configuration: Adjust `segmentCount` and `orientation` (horizontal/vertical) for placed platforms via UI inputs.
      - Level Saving/Loading: Persist and load level designs as JSON files.

2.  **The Game:**
    - Loads level layouts from the JSON files created by the editor.
    - Player navigates these manually designed levels.
    - Includes responsive design, mobile touch controls, Matter.js physics, and core gameplay mechanics (player movement, interactions with placed entities like crates and barrels, enemy avoidance).
    - **Procedural Coin Placement:** Coins are automatically placed along platforms defined in the loaded level data (not placed manually in the editor).
    - **Coin Placement:** Coins are placed along platforms (loaded from JSON) by a repurposed `LevelGenerator`. This process happens _after_ entities are loaded and specifically avoids placing coins on platforms that contain manually placed enemies or crates.
    - Dynamic elements like respawning crates and death zones are included.

## User Experience Goals (Game)

- Immediate Gameplay: The game starts automatically after loading a level.
- Responsive Controls: Works on desktop (keyboard) and mobile (touch).
- Engaging Gameplay Loop: Manually designed levels provide specific challenges. The restart flow is seamless.
- Clear Visuals: Depth sorting ensures player visibility; UI adapts to screen size.

## User Experience Goals (Editor)

- **Intuitive Placement:** Simple click/drag interface for placing objects.
- **Clear Controls:** Obvious UI elements for selecting objects and adjusting properties (like platform `segmentCount` and orientation).
- **Visual Feedback:** Clear indication of selected object and placement location.
- **Easy Save/Load:** Simple mechanism to save work and load existing JSON designs.

## Core Gameplay Mechanics (to be supported in manually designed levels)

- **Player Movement:** Walk, Jump.
- **Interactions:**
  - **Crates (Big/Small):** Pushable, used for climbing/reaching higher areas.
  - **Barrels:** Player can enter/exit barrels for specific movement/sequences.
  - **Enemies:** Avoidance gameplay.
  - **Coins:** Collection (placed by the repurposed `LevelGenerator` on platforms without enemies/crates).
  - **Finish Line:** Goal object.
- **Physics:** Matter.js governs interactions.
- **Death Zones:** Falling into designated areas below platforms triggers level restart.
- **Restart Flow:** Seamless automatic restart after death or level completion.
- **Mobile Controls:** On-screen touch controls available.
- **Depth Sorting:** Player visible over finish line.
