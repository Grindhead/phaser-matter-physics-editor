import { AnimationDefinition } from "../../lib/types";

export const COIN_ANIMATION_KEYS = {
  COIN_IDLE: "COIN_IDLE",
  COIN_COLLECT: "COIN_COLLECT",
} as const;

type AnimationKey = keyof typeof COIN_ANIMATION_KEYS;

export const COIN_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  COIN_IDLE: {
    prefix: "coin/coin-idle/coin-idle-",
    frames: 23,
    loop: -1,
    frameRate: 30,
  },
  COIN_COLLECT: {
    prefix: "coin/coin-collect/coin-collect-",
    frames: 8,
    loop: 0,
    frameRate: 30,
  },
};
