import { GAME_STATE } from "./constants";

export type AnimationDefinition = {
  prefix: string;
  frames: number;
  loop: number;
  nextAnimation?: string;
  frameRate: number;
};

export type EntityAnimations<T extends string> = Record<T, AnimationDefinition>;

// Define game states as constants
export type GameStateType = (typeof GAME_STATE)[keyof typeof GAME_STATE];
