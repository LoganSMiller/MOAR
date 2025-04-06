import { ILocation } from "@spt/models/eft/common/ILocation";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { configLocations } from "./constants";
import { getRandomInArray } from "../utils";
import globalValues from "../GlobalValues";
import getSortedSpawnPointList from "./spawnZoneUtils";
import type { MOARConfig } from "../types";
import { EPlayerSide } from "@spt-aki/models/enums/EPlayerSide";

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
    const maxDistanceSquared = 30 * 30;

    for (let index = 0; index < locationList.length; index++) {
        const mapName = configLocations[index];
        const mapSpawns = globalValues.indexedMapSpawns?.[mapName];

        if (!Array.isArray(mapSpawns) || mapSpawns.length === 0) {
            if (activeConfig.debug?.enabled) {
                console.warn(`[MOAR] Skipping spawn update for ${mapName}: no indexedMapSpawns found.`);
            }
            continue;
        }

        const playerSpawns = mapSpawns.filter(spawn =>
            spawn.Categories?.includes("Player") &&
            spawn.Sides?.some((side: EPlayerSide) => side === EPlayerSide.Usec || side === EPlayerSide.Bear) &&
            spawn.Position
        );

        if (playerSpawns.length === 0) {
            if (activeConfig.debug?.enabled) {
                console.warn(`[MOAR] No valid player spawns for ${mapName}.`);
            }
            continue;
        }

        const selected = getRandomInArray(playerSpawns);
        if (!selected?.Position) {
            if (activeConfig.debug?.enabled) {
                console.warn(`[MOAR] Invalid selected player spawn for ${mapName}.`);
            }
            continue;
        }

        globalValues.playerSpawn ??= selected;

        const { x, y, z } = selected.Position;
        const sortedSpawns = getSortedSpawnPointList(mapSpawns, x, y, z);

        const clusteredPlayerSpawns: ISpawnPointParam[] = [];

        for (const spawn of sortedSpawns) {
            if (
                !spawn.Categories?.includes("Player") ||
                !spawn.Sides?.some((side: EPlayerSide) => side === EPlayerSide.Usec || side === EPlayerSide.Bear) ||
                !spawn.Position
            ) {
                continue;
            }

            const dx = spawn.Position.x - x;
            const dy = spawn.Position.y - y;
            const dz = spawn.Position.z - z;
            const distanceSq = dx * dx + dy * dy + dz * dz;

            if (distanceSq <= maxDistanceSquared && clusteredPlayerSpawns.length < maxPlayerSpawns) {
                clusteredPlayerSpawns.push(spawn);
            }
        }

        const nonPlayerSpawns = sortedSpawns.filter(spawn =>
            !spawn.Categories?.includes("Player") ||
            !spawn.Sides?.some((side: EPlayerSide) => side === EPlayerSide.Usec || side === EPlayerSide.Bear)
        );

        locationList[index].base.SpawnPointParams = [
            ...clusteredPlayerSpawns,
            ...nonPlayerSpawns
        ];

        if (activeConfig.debug?.enabled) {
            console.log(`[MOAR] ${mapName}: using ${clusteredPlayerSpawns.length} clustered player spawns (of ${playerSpawns.length}).`);
        }
    }
}
