export type AnimationDefinition = {
  prefix: string;
  frames: number;
  loop: boolean;
};

export type EntityAnimations<T extends string> = Record<T, AnimationDefinition>;
