import playerSpawns from "../../config/Spawns/playerSpawns.json";
import scavSpawns from "../../config/Spawns/scavSpawns.json";
import sniperSpawns from "../../config/Spawns/sniperSpawns.json";
import pmcSpawns from "../../config/Spawns/pmcSpawns.json";

import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";

const LOG_PREFIX = "[MOAR:SpawnData]";

export type BotSpawnType = "player" | "scav" | "sniper" | "pmc";

const spawnRegistry: Record<BotSpawnType, Record<string, ISpawnPointParam[]>> = {
    player: playerSpawns,
    scav: scavSpawns,
    sniper: sniperSpawns,
    pmc: pmcSpawns
};

/**
 * Returns spawn data for a specific bot type.
 * Logs a warning and returns empty object if unknown.
 */
export function getSpawnData(type: string): Record<string, ISpawnPointParam[]> {
    const normalized = type.toLowerCase() as BotSpawnType;
    if (normalized in spawnRegistry) {
        return spawnRegistry[normalized];
    }

    console.warn(`${LOG_PREFIX} ⚠ Unknown spawn type requested: '${type}'`);
    return {};
}

/**
 * Flattens and returns all valid spawn points across all types and maps.
 */
export function getAllSpawnData(): ISpawnPointParam[] {
    return Object.values(spawnRegistry).flatMap((mapSet) =>
        Object.values(mapSet).flat().filter((spawn) =>
            spawn?.BotZoneName && spawn?.Position
        )
    );
}

/**
 * Validates spawn config structure and required fields.
 */
export function validateSpawns(): boolean {
    let isValid = true;
    const requiredFields: (keyof ISpawnPointParam)[] = ["BotZoneName", "Position"];

    for (const [type, maps] of Object.entries(spawnRegistry) as [BotSpawnType, Record<string, ISpawnPointParam[]>][]) {
        for (const [map, spawns] of Object.entries(maps)) {
            if (!Array.isArray(spawns)) {
                console.error(`${LOG_PREFIX} ❌ Spawn list for '${type}' on '${map}' is not an array.`);
                isValid = false;
                continue;
            }

            for (let i = 0; i < spawns.length; i++) {
                const spawn = spawns[i];
                for (const field of requiredFields) {
                    if (!spawn || spawn[field] == null) {
                        console.error(
                            `${LOG_PREFIX} ❌ Missing field '${field}' in ${type} spawn [${map}], index ${i}`
                        );
                        isValid = false;
                    }
                }
            }
        }
    }

    return isValid;
}

/**
 * Returns a summary count of spawn points by type.
 */
export function getSpawnSummary(): Record<BotSpawnType, number> {
    return {
        player: Object.values(spawnRegistry.player).flat().length,
        scav: Object.values(spawnRegistry.scav).flat().length,
        sniper: Object.values(spawnRegistry.sniper).flat().length,
        pmc: Object.values(spawnRegistry.pmc).flat().length
    };
}

export default spawnRegistry;
