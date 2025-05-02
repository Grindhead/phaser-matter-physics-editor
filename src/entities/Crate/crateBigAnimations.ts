import { AnimationDefinition } from "../../lib/types";

export const CRATE_BIG_ANIMATION_KEYS = {
  CRATE_BIG_IDLE: "CRATE_BIG_IDLE",
} as const;

type AnimationKey = keyof typeof CRATE_BIG_ANIMATION_KEYS;

export const CRATE_BIG_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  CRATE_BIG_IDLE: {
    prefix: "crate/crate-big.png",
    frames: 1,
    loop: 0,
    frameRate: 0,
  },
};
