import { AnimationDefinition } from "../../lib/types";

export const BARREL_ANIMATION_KEYS = {
  BARREL_IDLE: "BARREL_IDLE",
  BARREL_ENTER: "BARREL_ENTER",
  BARREL_LAUNCH: "BARREL_LAUNCH",
} as const;

type AnimationKey = keyof typeof BARREL_ANIMATION_KEYS;

export const BARREL_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  BARREL_IDLE: {
    prefix: "barrel/launch/barrel-launch-0010",
    frames: 1,
    loop: 0,
    frameRate: 0,
  },
  BARREL_ENTER: {
    prefix: "barrel/enter/barrel-enter-",
    frames: 19,
    loop: 0,
    frameRate: 30,
  },
  BARREL_LAUNCH: {
    prefix: "barrel/launch/barrel-launch-",
    frames: 10,
    loop: 0,
    frameRate: 30,
  },
};
