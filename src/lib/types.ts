import { GAME_STATE } from "./constants";

export type AnimationDefinition = {
  prefix: string;
  frames: number;
  loop: number;
  frameRate: number;
};

export type EntityAnimations<T extends string> = Record<T, AnimationDefinition>;

// Define game states as constants
export type GameStateType = (typeof GAME_STATE)[keyof typeof GAME_STATE];

// Add LoadedEntity interface here:
export interface LoadedEntity {
  x: number;
  y: number;
  type: string;
  getBounds(): Phaser.Geom.Rectangle;
}
