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
    prefix: "player/idle/duck-fall-",
    frames: 10,
    loop: false,
  },
  DEAD: {
    prefix: "player/dead/duck-dead-",
    frames: 10,
    loop: false,
  },
  IDLE: {
    prefix: "player/idle/duck-idle-",
    frames: 10,
    loop: false,
  },
  JUMP: {
    prefix: "player/jump/duck-jump-",
    frames: 12,
    loop: false,
  },
  RUN: {
    prefix: "player/run/duck-run-",
    frames: 14,
    loop: true,
  },
};
