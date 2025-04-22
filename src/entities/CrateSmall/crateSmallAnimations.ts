import { AnimationDefinition } from "../../lib/types";

export const CRATE_SMALL_ANIMATION_KEYS = {
  CRATE_SMALL_IDLE: "CRATE_SMALL_IDLE",
} as const;

type AnimationKey = keyof typeof CRATE_SMALL_ANIMATION_KEYS;

export const CRATE_SMALL_ANIMATIONS: Record<AnimationKey, AnimationDefinition> =
  {
    CRATE_SMALL_IDLE: {
      prefix: "crate/crate-small.png",
      frames: 1,
      loop: 0,
    },
  };
