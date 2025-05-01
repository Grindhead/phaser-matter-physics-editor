# Project Progress

## What Works

- Project workspace initialized.
- Defined Project Structure (Standard Phaser/TS/Vite conventions).
- Mobile Responsiveness and UI Scaling:
  - Game scales correctly using `EXPAND` mode.
  - UI elements adapt to different screen sizes.
  - Mobile touch controls are implemented and functional.
- Conditional Game Initialization:
  - Game only initializes and runs in landscape orientation.
- Asset Naming Convention Applied (Player Wobble).

## What's Left to Build

- The entire editor application.
- Asset organization and processing pipelines.
- **Level Generation Enhancements:**
  - Vertical walls (using rotated platforms).
  - Barrel substitution for impassable gaps.
- **Gameplay Enhancements (Based on Feedback):**
  - Keyboard restart (Space/Enter).
  - Single-input restart (dismiss + start).
  - Post-obstacle "safe zone".
  - Improved platform visibility (adjust max Y distance).
  - Box respawning on restart.
  - Higher death colliders (reduce fall time).
  - Enemy difficulty curve refinement (smaller enemies first).
  - Level completion "cool landing" animation implementation.
  - Player/Finish line depth sorting implementation.
  - Enemy placement restriction for first two platforms (level 1).
  - Prevent 'fx_land' animation when collecting a coin on landing.

## Current Status

- Implementing Level Generation and Gameplay Enhancements.

## Known Issues

- None identified yet.

## Evolution of Decisions

- Initial decision made to standardize asset naming conventions (lowercase, hyphens).
