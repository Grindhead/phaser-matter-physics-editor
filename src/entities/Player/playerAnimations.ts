import { AnimationDefinition } from "../../lib/types";

export const PLAYER_ANIMATION_KEYS = {
  DUCK_FALL: "DUCK_FALL",
  DUCK_DEAD: "DUCK_DEAD",
  DUCK_IDLE: "DUCK_IDLE",
  DUCK_JUMP: "DUCK_JUMP",
  DUCK_RUN: "DUCK_RUN",
} as const;

type AnimationKey = keyof typeof PLAYER_ANIMATION_KEYS;

export const PLAYER_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  DUCK_FALL: {
    prefix: "player/fall/duck-fall-",
    frames: 10,
    loop: 0,
  },
  DUCK_DEAD: {
    prefix: "player/dead/duck-dead-",
    frames: 10,
    loop: 0,
  },
  DUCK_IDLE: {
    prefix: "player/idle/duck-idle-",
    frames: 10,
    loop: 0,
  },
  DUCK_JUMP: {
    prefix: "player/jump/duck-jump-",
    frames: 12,
    loop: 0,
    nextAnimation: PLAYER_ANIMATION_KEYS.DUCK_FALL,
  },
  DUCK_RUN: {
    prefix: "player/run/duck-run-",
    frames: 14,
    loop: -1,
  },
};
