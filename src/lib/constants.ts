export const SCENES = {
  BOOT: "Boot",
  PRELOADER: "Preloader",
  MAIN_MENU: "MainMenu",
  GAME: "Game",
  GAME_OVER: "GameOver",
} as const;

export const PHYSICS_ENTITIES = {
  DUCK_IDLE: "duck-idle",
  DUCK_RUN: "duck-run",
  DUCK_JUMP: "duck-jump",
  DUCK_FALL: "duck-fall",
  ENEMY: "enemy",
  COIN: "coin",
  FINISH: "finish",
  CRATE_SMALL: "crate-small",
  CRATE_BIG: "crate-big",
  PLATFORM: "platform",
} as const;

export const TEXTURE_ATLAS = "assets" as const;
export const PHYSICS = "physics" as const;
