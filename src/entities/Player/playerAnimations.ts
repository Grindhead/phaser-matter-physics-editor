import { AnimationDefinition } from "../../lib/types";

export const PLAYER_ANIMATION_KEYS = {
  FALL: "FALL",
  DEAD: "DEAD",
  IDLE: "IDLE",
  JUMP: "JUMP",
  RUN: "RUN",
} as const;

type AnimationKey = keyof typeof PLAYER_ANIMATION_KEYS;

export const PLAYER_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  FALL: {
    prefix: "player/fall/duck-fall-",
    frames: 10,
    loop: 0,
  },
  DEAD: {
    prefix: "player/dead/duck-dead-",
    frames: 10,
    loop: 0,
  },
  IDLE: {
    prefix: "player/idle/duck-idle-",
    frames: 10,
    loop: 0,
  },
  JUMP: {
    prefix: "player/jump/duck-jump-",
    frames: 12,
    loop: 0,
    nextAnimation: PLAYER_ANIMATION_KEYS.FALL,
  },
  RUN: {
    prefix: "player/run/duck-run-",
    frames: 14,
    loop: -1,
  },
};
