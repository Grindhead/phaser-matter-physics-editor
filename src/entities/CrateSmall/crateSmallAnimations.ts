import { AnimationDefinition } from "../../lib/types";

export const CRATE_SMALL_ANIMATION_KEYS = {
  IDLE: "IDLE",
} as const;

type AnimationKey = keyof typeof CRATE_SMALL_ANIMATION_KEYS;

export const CRATE_SMALL_ANIMATIONS: Record<AnimationKey, AnimationDefinition> =
  {
    IDLE: {
      prefix: "crate/crate-small.png",
      frames: 1,
      loop: false,
    },
  };
