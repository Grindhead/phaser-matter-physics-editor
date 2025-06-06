import { AnimationDefinition } from "../../lib/types";

export const PLATFORM_ANIMATION_KEYS = {
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  MIDDLE: "MIDDLE",
} as const;

type AnimationKey = keyof typeof PLATFORM_ANIMATION_KEYS;

export const PLATFORM_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  LEFT: {
    prefix: "platforms/platform-left.png",
    frames: 1,
    loop: 0,
    frameRate: 0,
  },
  RIGHT: {
    prefix: "platforms/platform-right.png",
    frames: 1,
    loop: 0,
    frameRate: 0,
  },
  MIDDLE: {
    prefix: "platforms/platform-middle.png",
    frames: 1,
    loop: 0,
    frameRate: 0,
  },
};
