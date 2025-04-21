import { AnimationDefinition } from "../../lib/types";

export const CRATE_BIG_ANIMATION_KEYS = {
  IDLE: "IDLE",
} as const;

type AnimationKey = keyof typeof CRATE_BIG_ANIMATION_KEYS;

export const CRATE_BIG_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  IDLE: {
    prefix: "crate/crate-big.png",
    frames: 1,
    loop: 0,
  },
};
