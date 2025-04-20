import { AnimationDefinition } from "../../lib/types";

export const ENEMY_ANIMATION_KEYS = {
  IDLE: "IDLE",
} as const;

type AnimationKey = keyof typeof ENEMY_ANIMATION_KEYS;

export const ENEMY_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  IDLE: {
    prefix: "enemy/enemy.png",
    frames: 10,
    loop: false,
  },
};
