export type AnimationDefinition = {
  prefix: string;
  frames: number;
  loop: boolean;
  nextAnimation?: string;
};

export type EntityAnimations<T extends string> = Record<T, AnimationDefinition>;
