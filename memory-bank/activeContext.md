# Active Context

## Current Focus

Refactoring background handling in `src/scenes/Game.ts`.

## Recent Changes

- Created a new `ParallaxBackground` class (`src/entities/ParallaxBackground.ts`) extending `Phaser.GameObjects.TileSprite` to handle the scrolling background.
- Replaced the static `Phaser.GameObjects.Image` background in `Game.ts` with an instance of `ParallaxBackground`.
- The `ParallaxBackground` instance is updated in the `Game.ts` `update` loop to create the parallax effect.

## Next Steps

- Awaiting further instructions.

## Active Decisions & Considerations

- Using a dedicated class for the parallax background improves modularity and separates concerns.
- The `customScrollFactorX` property in `ParallaxBackground` allows easy adjustment of the parallax speed.

## Important Patterns & Preferences

- Encapsulate specific visual elements (like the background) into their own classes.
- Utilize Phaser's built-in Game Object types (`TileSprite`) where appropriate.

## Learnings & Project Insights

- Refactoring static elements into dynamic, updatable classes can enhance visual effects like parallax scrolling.
