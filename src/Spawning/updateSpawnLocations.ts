import { ILocation } from "@spt/models/eft/common/ILocation";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { configLocations } from "./constants";
import { getRandomInArray } from "../utils";
import globalValues from "../GlobalValues";
import getSortedSpawnPointList from "./spawnZoneUtils";
import type { MOARConfig } from "../types";

/**
 * Checks if a spawn is a valid player entry (Usec/Bear, Player category).
 */
function isPlayerSpawn(spawn: ISpawnPointParam): boolean {
    return (
        spawn?.Position != null &&
        spawn.Categories?.includes("Player") &&
        spawn.Sides?.some((s) => s === "Usec" || s === "Bear")
    );
}

/**
 * Updates spawn zones to favor player-centric clustering.
 * Ensures stability across vanilla, Coop, and Headless FIKA setups.
 *
 * @param locationList - The full list of game locations
 * @param activeConfig - The active MOAR config in use
 */
export default function updateSpawnLocations(
    locationList: ILocation[],
    activeConfig: MOARConfig
): void {
    const maxPlayerSpawns = 12;
    const maxDistanceSq = 30 * 30;

    for (let index = 0; index < locationList.length; index++) {
        const mapName = configLocations[index];
        const mapSpawns = globalValues.indexedMapSpawns?.[mapName];

        if (!Array.isArray(mapSpawns) || mapSpawns.length === 0) {
            if (activeConfig.debug?.enabled) {
                console.warn(`[MOAR] ⚠ Skipping spawn update for ${mapName}: indexedMapSpawns not found.`);
            }
            continue;
        }

        const playerSpawns = mapSpawns.filter(isPlayerSpawn);
        if (playerSpawns.length === 0) {
            if (activeConfig.debug?.enabled) {
                console.warn(`[MOAR] ⚠ No valid player spawns found for ${mapName}.`);
            }
            continue;
        }

        const selected = getRandomInArray(playerSpawns);
        if (!selected?.Position) {
            if (activeConfig.debug?.enabled) {
                console.warn(`[MOAR] ⚠ Invalid reference spawn for ${mapName}.`);
            }
            continue;
        }

        globalValues.playerSpawn ??= selected;

        const { x, y, z } = selected.Position;
        const sorted = getSortedSpawnPointList(mapSpawns, x, y, z);

        const clusteredPlayerSpawns: ISpawnPointParam[] = [];
        for (const spawn of sorted) {
            if (!isPlayerSpawn(spawn)) continue;

            const dx = spawn.Position.x - x;
            const dy = spawn.Position.y - y;
            const dz = spawn.Position.z - z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq <= maxDistanceSq && clusteredPlayerSpawns.length < maxPlayerSpawns) {
                clusteredPlayerSpawns.push(spawn);
            }
        }

        const nonPlayerSpawns = sorted.filter(s => !isPlayerSpawn(s));

        const mergedSpawns = [...clusteredPlayerSpawns, ...nonPlayerSpawns];
        locationList[index].base.SpawnPointParams = mergedSpawns;

        // Update OpenZones from merged spawns
        locationList[index].base.OpenZones = [
            ...new Set(
                mergedSpawns.map((p) => p.BotZoneName).filter((z): z is string => !!z)
            )
        ].join(",");

        if (activeConfig.debug?.enabled) {
            console.log(`[MOAR] ✅ ${mapName}: Using ${clusteredPlayerSpawns.length} clustered player spawns (of ${playerSpawns.length}).`);
        }
    }
}
