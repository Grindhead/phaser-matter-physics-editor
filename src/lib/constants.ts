export const SCENES = {
  BOOT: "Boot",
  PRELOADER: "Preloader",
  MAIN_MENU: "MainMenu",
  GAME: "Game",
  GAME_OVER: "GameOver",
} as const;

export const ENTITIES = {
  PLAYER: "Player",
  ENEMY: "Enemy",
  COIN: "Coin",
  FINISH: "Finish",
  CRATE_SMALL: "CrateSmall",
  CRATE_BIG: "CrateBig",
  PLATFORM: "Platform",
} as const;

export const TEXTURE_ATLAS = "assets" as const;
export const PHYSICS = "physics" as const;
