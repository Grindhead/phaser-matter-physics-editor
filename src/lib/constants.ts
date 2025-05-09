export const SCENES = {
  BOOT: "Boot",
  PRELOADER: "Preloader",
  MAIN_MENU: "MainMenu",
  GAME: "Game",
  DEBUG_UI: "DebugUIScene",
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
  BARREL: "barrel",
} as const;

export const TEXTURE_ATLAS = "assets" as const;
export const PHYSICS = "physics" as const;

export const WORLD_WIDTH = Infinity;
export const WORLD_HEIGHT = Infinity;

export const BARREL_ROTATION_SPEED = 2;
export const BARREL_LAUNCH_SPEED = 15;

export const TILE_WIDTH = 24;
export const TILE_HEIGHT = 24;

export const MAX_LEVELS = 1;

export const GAME_STATE = {
  WAITING_TO_START: "waiting_to_start",
  PLAYING: "playing",
  GAME_OVER: "game_over",
  LEVEL_COMPLETE: "level_complete",
} as const;
