<<<<<<< Updated upstream
import { Ixyz } from "@spt/models/eft/common/Ixyz";
import config from "../config/config.json";
import {
  ILocationBase,
  ISpawnPointParam,
} from "@spt/models/eft/common/ILocationBase";

export class globalValues {
  public static baseConfig: typeof config = undefined;
  public static overrideConfig: Partial<typeof config> = undefined;
  public static locationsBase: ILocationBase[] = undefined;
  public static currentPreset: string = "";
  public static forcedPreset: string = "random";
  public static addedMapZones: Record<number, string[]> = {};
  public static indexedMapSpawns: Record<number, ISpawnPointParam[]> = {};
  public static playerSpawn: ISpawnPointParam;
=======
// GlobalValues.ts

import { Ixyz } from "@spt/models/eft/common/Ixyz";
import config from "../config/config.json";
import { ILocationBase, ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";

/**
 * Central runtime state for MOAR's spawn and config logic.
 * These values are populated during mod initialization and used across the system.
 */
export class GlobalValues {
    /** The default server-side config loaded from config.json */
    public static baseConfig: typeof config;

    /** Optional override values pulled from server endpoints or presets */
    public static overrideConfig: Partial<typeof config> = {};

    /** Location base data from database used for spawn logic */
    public static locationsBase: ILocationBase[] = [];

    /** The current active preset name as determined at runtime */
    public static currentPreset: string = "";

    /** A forced preset value used as fallback or override */
    public static forcedPreset: string = "random";

    /** Tracks all newly added spawn zones per map index */
    public static addedMapZones: Record<number, string[]> = {};

    /** Index of all spawn points by map ID */
    public static indexedMapSpawns: Record<number, ISpawnPointParam[]> = {};

    /** Stores the player's spawn point during runtime, used for relative zone logic */
    public static playerSpawn: ISpawnPointParam | undefined;
>>>>>>> Stashed changes
}
