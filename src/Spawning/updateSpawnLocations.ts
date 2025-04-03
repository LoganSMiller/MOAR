import { ILocation } from "@spt/models/eft/common/ILocation";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { configLocations } from "./constants";
import config from "../../config/config.json";
import { getRandomInArray } from "../utils";
import globalValues from "../GlobalValues";
import getSortedSpawnPointList from "./spawnZoneUtils";

/**
 * Updates spawn zones to favor player-centric clustering.
 * Prioritizes realism and performance by reducing spawn point spread.
 */
export default function updateSpawnLocations(
    locationList: ILocation[],
    activeConfig: typeof config
): void {
    for (let index = 0; index < locationList.length; index++) {
        const mapName = configLocations[index];
        const mapSpawns = globalValues.indexedMapSpawns?.[mapName];

        if (!mapSpawns?.length) {
            if (activeConfig.debug?.enabled) {
                console.warn(`[MOAR] Skipping spawn update for ${mapName}: no indexedMapSpawns found.`);
            }
            continue;
        }

        const playerSpawns = mapSpawns.filter(spawn => spawn.type === "player");

        if (playerSpawns.length === 0) {
            if (activeConfig.debug?.enabled) {
                console.warn(`[MOAR] No player spawns available for ${mapName}.`);
            }
            continue;
        }

        const selectedPlayerSpawn = getRandomInArray(playerSpawns);
        if (!selectedPlayerSpawn?.Position) {
            if (activeConfig.debug?.enabled) {
                console.warn(`[MOAR] Invalid player spawn position for ${mapName}.`);
            }
            continue;
        }

        globalValues.playerSpawn = selectedPlayerSpawn;

        const { x, y, z } = selectedPlayerSpawn.Position;
        const sortedSpawns = getSortedSpawnPointList(mapSpawns, x, y, z);

        const clusteredPlayerSpawns: ISpawnPointParam[] = [];
        const maxPlayerSpawns = 12;
        const maxDistSquared = 30 * 30;

        for (const spawn of sortedSpawns) {
            if (spawn.type !== "player") continue;

            const dx = spawn.Position.x - x;
            const dy = spawn.Position.y - y;
            const dz = spawn.Position.z - z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq <= maxDistSquared && clusteredPlayerSpawns.length < maxPlayerSpawns) {
                clusteredPlayerSpawns.push(spawn);
            }
        }

        locationList[index].base.SpawnPointParams = [
            ...clusteredPlayerSpawns,
            ...sortedSpawns.filter(spawn => spawn.type !== "player")
        ];

        if (activeConfig.debug?.enabled) {
            console.log(`[MOAR] ${mapName}: limited to ${clusteredPlayerSpawns.length} clustered player spawns.`);
        }
    }
}
