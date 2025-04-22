import { AnimationDefinition } from "../../lib/types";

export const ENEMY_ANIMATION_KEYS = {
  ENEMY_IDLE: "ENEMY_IDLE",
} as const;

type AnimationKey = keyof typeof ENEMY_ANIMATION_KEYS;

export const ENEMY_ANIMATIONS: Record<AnimationKey, AnimationDefinition> = {
  ENEMY_IDLE: {
    prefix: "enemy/enemy.png",
    frames: 10,
    loop: 0,
  },
};
