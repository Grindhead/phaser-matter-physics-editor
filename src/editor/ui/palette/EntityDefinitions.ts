import { Platform } from "../../../entities/Platforms/Platform"; // Still needed for type checking
import { EnemySmall } from "../../../entities/Enemies/EnemySmall";
import { Crate } from "../../../entities/Crate/Crate";
import { Barrel } from "../../../entities/Barrel/Barrel";
import { Finish } from "../../../entities/Finish/Finish";
import { Player } from "../../../entities/Player/Player";
import { EnemyLarge } from "../../../entities/Enemies/EnemyLarge";
import { EntityButton } from "./types";

export const getEntityDefinitions = (): EntityButton[] => {
  // Platform entity is intentionally excluded from palette since it's now
  // handled via the dedicated toolbar button and PlatformTool
  return [
    {
      type: "player",
      entityClass: Player,
      entityConfig: {},
      displayName: "Player",
    },
    {
      type: "enemy-large",
      entityClass: EnemyLarge,
      entityConfig: {},
      displayName: "Large Enemy",
    },
    {
      type: "enemy-small",
      entityClass: EnemySmall,
      entityConfig: {},
      displayName: "Small Enemy",
    },
    {
      type: "crate-small",
      entityClass: Crate,
      entityConfig: {
        type: "small",
      },
      displayName: "Small Crate",
    },
    {
      type: "crate-big",
      entityClass: Crate,
      entityConfig: {
        type: "big",
      },
      displayName: "Big Crate",
    },
    {
      type: "barrel",
      entityClass: Barrel,
      entityConfig: {},
      displayName: "Barrel",
    },
    {
      type: "finish-line",
      entityClass: Finish,
      entityConfig: {},
      displayName: "Finish Line",
    },
  ];
};
