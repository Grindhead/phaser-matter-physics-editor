import { AnimationDefinition } from "../../lib/types";

export const PLAYER_ANIMATION_KEYS = {
  DUCK_FALL: "DUCK_FALL",
  DUCK_DEAD: "DUCK_DEAD",
  DUCK_IDLE: "DUCK_IDLE",
  DUCK_JUMP: "DUCK_JUMP",
  DUCK_RUN: "DUCK_RUN",
  DUCK_LAND: "DUCK_LAND",
  DUCK_BLAST: "DUCK_BLAST",
  DUCK_WOBBLE: "DUCK_WOBBLE",
} as const;

type AnimationKey = keyof typeof PLAYER_ANIMATION_KEYS;

export const PLAYER_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  DUCK_FALL: {
    prefix: "player/fall/duck-fall-",
    frames: 10,
    loop: 0,
    frameRate: 30,
  },
  DUCK_DEAD: {
    prefix: "player/dead/duck-dead-",
    frames: 10,
    loop: 0,
    frameRate: 30,
  },
  DUCK_IDLE: {
    prefix: "player/idle/duck-idle-",
    frames: 10,
    loop: 0,
    frameRate: 30,
  },
  DUCK_JUMP: {
    prefix: "player/jump/duck-jump-",
    frames: 12,
    loop: 0,
    frameRate: 30,
  },
  DUCK_RUN: {
    prefix: "player/run/duck-run-",
    frames: 14,
    loop: -1,
    frameRate: 30,
  },
  DUCK_LAND: {
    prefix: "player/land/duck-land-",
    frames: 56,
    loop: 0,
    frameRate: 30,
  },
  DUCK_BLAST: {
    prefix: "player/blast/duck-blast-",
    frames: 19,
    loop: 0,
    frameRate: 30,
  },
  DUCK_WOBBLE: {
    prefix: "player/wobble/duck-wobble-",
    frames: 22,
    loop: -1,
    frameRate: 30,
  },
};
