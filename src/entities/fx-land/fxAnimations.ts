import { AnimationDefinition } from "../../lib/types";

export const FX_LAND_ANIMATION_KEYS = {
  FX_LAND: "FX_LAND",
} as const;

type AnimationKey = keyof typeof FX_LAND_ANIMATION_KEYS;

export const FX_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  FX_LAND: {
    prefix: "fx-land/fx-land-",
    frames: 18,
    loop: 0,
    frameRate: 30,
  },
};
