// index.ts
import playerSpawns from "../../config/Spawns/playerSpawns.json";
import scavSpawns from "../../config/Spawns/scavSpawns.json";
import sniperSpawns from "../../config/Spawns/sniperSpawns.json";
import pmcSpawns from "../../config/Spawns/pmcSpawns.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";

const spawnRegistry: Record<string, Record<string, ISpawnPointParam[]>> = {
    player: playerSpawns,
    scav: scavSpawns,
    sniper: sniperSpawns,
    pmc: pmcSpawns,
};

/**
 * Retrieves spawn data for a specific bot type.
 * @param type Bot type (player, scav, sniper, pmc)
 * @returns Map-to-spawn dictionary or empty object
 */
export function getSpawnData(type: string): Record<string, ISpawnPointParam[]> {
    const normalized = type.toLowerCase();
    if (spawnRegistry[normalized]) {
        return spawnRegistry[normalized];
    }
    console.warn(`[MOAR] Unknown spawn type requested: '${type}'`);
    return {};
}

/**
 * Merges all spawn data across types into one array.
 * Useful for visualization or proximity logic.
 * @returns All spawns merged into flat array
 */
export function getAllSpawnData(): ISpawnPointParam[] {
    return Object.values(spawnRegistry)
        .map((mapSpawns) => Object.values(mapSpawns).flat())
        .flat();
}

/**
 * Validates spawn data structures across all spawn types and maps.
 * @returns True if all spawn entries are valid, false otherwise.
 */
export function validateSpawns(): boolean {
    let isValid = true;
    const requiredFields = ["BotZoneName", "Position"];

    for (const [type, maps] of Object.entries(spawnRegistry)) {
        for (const [map, spawns] of Object.entries(maps)) {
            if (!Array.isArray(spawns)) {
                console.error(`[MOAR] Spawn list for '${type}' on '${map}' is not an array.`);
                isValid = false;
                continue;
            }

            for (const [i, spawn] of spawns.entries()) {
                for (const field of requiredFields) {
                    if (!(field in spawn)) {
                        console.error(`[MOAR] Missing field '${field}' in '${type}' spawn [${map}] index ${i}`);
                        isValid = false;
                    }
                }
            }
        }
    }

    return isValid;
}

export default spawnRegistry;
