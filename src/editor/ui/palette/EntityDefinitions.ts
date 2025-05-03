import { Platform } from "../../../entities/Platforms/Platform";
import { EnemySmall } from "../../../entities/Enemies/EnemySmall";
import { Crate } from "../../../entities/Crate/Crate";
import { Barrel } from "../../../entities/Barrel/Barrel";
import { Finish } from "../../../entities/Finish/Finish";
import { Player } from "../../../entities/Player/Player";
import { EnemyLarge } from "../../../entities/Enemies/EnemyLarge";
import { EntityButton } from "./types";

export const getEntityDefinitions = (): EntityButton[] => {
  return [
    {
      type: "player",
      entityClass: Player,
      entityConfig: {},
      displayName: "Player",
      scale: 0.6,
      heightFactor: 1.1,
      offsetX: 0,
    },
    {
      type: "platform",
      entityClass: Platform,
      entityConfig: {
        isVertical: false,
        segmentCount: 3,
        segmentWidth: 32,
      },
      displayName: "Platform",
      scale: 0.6,
      heightFactor: 1.0,
      offsetX: 0,
      needsConfiguration: true,
    },
    {
      type: "enemy-large",
      entityClass: EnemyLarge,
      entityConfig: {},
      displayName: "Large Enemy",
      scale: 0.5,
      heightFactor: 1.2,
      offsetX: 0,
    },
    {
      type: "enemy-small",
      entityClass: EnemySmall,
      entityConfig: {},
      displayName: "Small Enemy",
      scale: 0.5,
      heightFactor: 1.0,
      offsetX: 0,
    },
    {
      type: "crate-small",
      entityClass: Crate,
      entityConfig: {
        type: "small",
      },
      displayName: "Small Crate",
      scale: 0.5,
      heightFactor: 0.9,
      offsetX: 0,
    },
    {
      type: "crate-big",
      entityClass: Crate,
      entityConfig: {
        type: "big",
      },
      displayName: "Big Crate",
      scale: 0.5,
      heightFactor: 1.1,
      offsetX: 0,
    },
    {
      type: "barrel",
      entityClass: Barrel,
      entityConfig: {},
      displayName: "Barrel",
      scale: 0.65,
      heightFactor: 1.0,
      offsetX: 0,
    },
    {
      type: "finish-line",
      entityClass: Finish,
      entityConfig: {},
      displayName: "Finish Line",
      scale: 0.45,
      heightFactor: 1.0,
      offsetX: 0,
    },
  ];
};
