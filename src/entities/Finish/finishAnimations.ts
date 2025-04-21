import { AnimationDefinition } from "../../lib/types";

export const FINISH_ANIMATION_KEYS = {
  IDLE: "IDLE",
  ACTIVATED: "ACTIVE",
  COLLECT: "COLLECT",
} as const;

type AnimationKey = keyof typeof FINISH_ANIMATION_KEYS;

export const FINISH_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  IDLE: {
    prefix: "finish/finish-idle/finish-idle.png",
    frames: 0,
    loop: 0,
  },
  ACTIVATED: {
    prefix: "finish/finish-activated/finish-activated-",
    frames: 19,
    loop: 0,
    nextAnimation: FINISH_ANIMATION_KEYS.COLLECT,
  },
  COLLECT: {
    prefix: "finish/finish-collect/finish-collect-",
    frames: 8,
    loop: -1,
  },
};
