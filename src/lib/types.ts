export type AnimationDefinition = {
  prefix: string;
  frames: number;
  loop: number;
  nextAnimation?: string;
  frameRate: number;
};

export type EntityAnimations<T extends string> = Record<T, AnimationDefinition>;
