import { AnimationDefinition } from "../../lib/types";

export const FINISH_ANIMATION_KEYS = {
  FINISH_IDLE: "FINISH_IDLE",
  FINISH_ACTIVATED: "FINISH_ACTIVATED",
  FINISH_ACTIVE: "FINISH_ACTIVE",
} as const;

type AnimationKey = keyof typeof FINISH_ANIMATION_KEYS;

export const FINISH_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  FINISH_IDLE: {
    prefix: "finish/finish-idle/finish-idle.png",
    frames: 0,
    loop: 0,
  },
  FINISH_ACTIVATED: {
    prefix: "finish/finish-activated/finish-activated-",
    frames: 19,
    loop: 0,
    nextAnimation: FINISH_ANIMATION_KEYS.FINISH_ACTIVE,
  },
  FINISH_ACTIVE: {
    prefix: "finish/finish-active/finish-active-",
    frames: 8,
    loop: -1,
  },
};
