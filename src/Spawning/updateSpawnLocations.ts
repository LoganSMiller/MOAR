import { ILocation } from "@spt/models/eft/common/ILocation";
<<<<<<< Updated upstream
import { configLocations } from "./constants";
import _config from "../../config/config.json";
import { getRandomInArray, shuffle } from "./utils";
import advancedConfig from "../../config/advancedConfig.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { globalValues } from "../GlobalValues";
import getSortedSpawnPointList, {
  getClosestZone,
  getDistance,
  uuidv4,
} from "./spawnZoneUtils";
=======
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { configLocations } from "./constants";
import _config from "../../config/config.json";
import advancedConfig from "../../config/advancedConfig.json";
import { getRandomInArray } from "./utils";
import { globalValues } from "../GlobalValues";
import getSortedSpawnPointList from "./spawnZoneUtils";
>>>>>>> Stashed changes

/**
 * Filters spawn points near the selected player spawn and updates each map’s SpawnPointParams.
 * This is used to limit the spawn area to a small region near the player for performance and realism.
 */
export default function updateSpawnLocations(
<<<<<<< Updated upstream
  locationList: ILocation[],
  config: typeof _config
) {
  for (let index = 0; index < locationList.length; index++) {
    const map = configLocations[index];
    const mapSpawns = [...globalValues.indexedMapSpawns[index]];

    const playerSpawns = mapSpawns.filter(
      (point) => point?.["type"] === "player"
    );

    const playerSpawn: ISpawnPointParam = getRandomInArray(playerSpawns);

    globalValues.playerSpawn = playerSpawn;

    const { x, y, z } = playerSpawn.Position;

    const sortedSpawnPointList = getSortedSpawnPointList(mapSpawns, x, y, z);

    const possibleSpawnList: ISpawnPointParam[] = [];

    sortedSpawnPointList.forEach((point) => {
      if (
        possibleSpawnList.length <= advancedConfig.SpawnpointAreaTarget &&
        point?.["type"] === "player"
      ) {
        possibleSpawnList.push(point);
      }
    });

    // const possibleSpawnListSet = new Set(possibleSpawnList.map(({ Id }) => Id));

    locationList[index].base.SpawnPointParams = [
      ...possibleSpawnList,
      ...sortedSpawnPointList.filter((point) => point["type"] !== "player"),
    ];

    //  {
    // if (point["type"] === "player" && !possibleSpawnListSet.has(point.Id)) {
    //   point.Categories = [];
    //   point.Sides = [];
    // }

    // return point;
    // }

    // console.log(
    //   map,
    //   locationList[index].base.SpawnPointParams.filter(
    //     (point) => point?.["type"] === "player"
    //   ).length,
    //   locationList[index].base.SpawnPointParams.filter(
    //     (point) => point?.Categories[0] === "Player"
    //   ).length
    // );
  }
=======
    locationList: ILocation[],
    config: typeof _config
): void {
    for (let index = 0; index < locationList.length; index++) {
        const map = configLocations[index];
        const mapSpawns = [...globalValues.indexedMapSpawns[index]];

        const playerSpawns = mapSpawns.filter(spawn => spawn.type === "player");
        const playerSpawn = getRandomInArray(playerSpawns);
        globalValues.playerSpawn = playerSpawn;

        const { x, y, z } = playerSpawn.Position;

        // Sort all map spawns by distance from chosen player spawn
        const sortedSpawns = getSortedSpawnPointList(mapSpawns, x, y, z);

        // Limit player spawns to the nearest ones for spawn clustering
        const maxPlayerSpawns = advancedConfig.SpawnpointAreaTarget ?? 20;
        const clusteredPlayerSpawns: ISpawnPointParam[] = [];

        for (const spawn of sortedSpawns) {
            if (spawn.type === "player" && clusteredPlayerSpawns.length < maxPlayerSpawns) {
                clusteredPlayerSpawns.push(spawn);
            }
        }

        // Merge clustered player spawns with the rest of the non-player spawns
        locationList[index].base.SpawnPointParams = [
            ...clusteredPlayerSpawns,
            ...sortedSpawns.filter(spawn => spawn.type !== "player")
        ];

        if (_config.debug) {
            console.log(
                `[MOAR] ${map} spawn area limited to ${clusteredPlayerSpawns.length} player spawns.`
            );
        }
    }
>>>>>>> Stashed changes
}
