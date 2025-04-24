# Progress

## What Works

- Basic platformer mechanics (movement, jumping).
- Coin collection and UI tracking.
- Enemy presence.
- Level finish detection.
- Game states (Start, Playing, Game Over, Level Complete) with UI overlays.
- Fall detection.
- Parallax background scrolling.

## What's Left to Build

- Level progression logic beyond simple counter increment.
- More complex level designs.
- Additional enemy types or behaviors.
- Sound effects and music.
- Potential main menu/level select.

## Current Status

- Core gameplay loop is functional for a single level.
- Background refactored to use a parallax scrolling TileSprite.
- Camera logic refactored into `CameraManager` with dynamic zoom.

## Known Issues

- ~~Entities (Player, Enemies) were being created twice on game start.~~ (Fixed)

## Evolution of Project Decisions

- Initial static background replaced with `ParallaxBackground` class for improved visual effect and modularity.
