import { AnimationDefinition } from "../../lib/types";

export const COIN_ANIMATION_KEYS = {
  IDLE: "IDLE",
  COLLECT: "COLLECT",
} as const;

type AnimationKey = keyof typeof COIN_ANIMATION_KEYS;

export const COIN_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  IDLE: {
    prefix: "coin/coin-idle/coin-idle-",
    frames: 23,
    loop: -1,
  },
  COLLECT: {
    prefix: "coin/coin-collect/coin-collect-",
    frames: 8,
    loop: 0,
  },
};
