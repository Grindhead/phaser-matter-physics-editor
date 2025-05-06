import { Platform } from "../../../entities/Platforms/Platform";
import { EnemySmall } from "../../../entities/Enemies/EnemySmall";
import { Crate } from "../../../entities/Crate/Crate";
import { Barrel } from "../../../entities/Barrel/Barrel";
import { Finish } from "../../../entities/Finish/Finish";
import { EnemyBase } from "../../../entities/Enemies/EnemyBase";
import { Player } from "../../../entities/Player/Player";
import { EnemyLarge } from "../../../entities/Enemies/EnemyLarge";

export interface PaletteConfig {
  x: number;
  y: number;
  width: number;
  padding?: number;
  background?: {
    color: number;
    alpha?: number;
  };
}

export interface EntityButton {
  type: string;
  entityClass:
    | typeof Platform
    | typeof EnemyBase
    | typeof EnemySmall
    | typeof EnemyLarge
    | typeof Crate
    | typeof Barrel
    | typeof Finish
    | typeof Player;
  entityConfig: any;
  displayName: string;
  scale?: number;
  heightFactor?: number;
  offsetX?: number;
  offsetY?: number;
  needsConfiguration?: boolean;
  options?: Array<{
    label: string;
    value: string;
    config?: any;
  }>;
}

export type EntityInstance =
  | Platform
  | EnemySmall
  | EnemyLarge
  | Crate
  | Barrel
  | Finish
  | Player;
