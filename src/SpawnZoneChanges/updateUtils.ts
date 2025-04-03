import fs from "fs";
import path from "path";
import { Ixyz } from "@spt/models/eft/common/Ixyz";
import  Distance  from "../Spawning/spawnZoneUtils";

const SPAWN_DIR = path.resolve(__dirname, "../../config/Spawns");
const LOG_PREFIX = "[MOAR:SpawnUtils]";
const DELETE_DISTANCE_THRESHOLD = 15;

export type BotSpawnType = "player" | "pmc" | "scav" | "sniper";

/**
 * Generic JSON file updater using a transformation callback.
 */
export const updateJsonFile = <T>(
    filePath: string,
    callback: (jsonData: T) => void,
    successMessage: string
): void => {
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error(`${LOG_PREFIX} Failed to read ${filePath}:`, err);
            return;
        }

        let jsonData: T;
        try {
            jsonData = JSON.parse(data);
        } catch (parseErr) {
            console.error(`${LOG_PREFIX} JSON parse error in ${filePath}:`, parseErr);
            return;
        }

        callback(jsonData);

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), "utf8", (writeErr) => {
            if (writeErr) {
                console.error(`${LOG_PREFIX} Failed to write ${filePath}:`, writeErr);
                return;
            }

            console.log(`${LOG_PREFIX} ${successMessage}`);
        });
    });
};

/**
 * Appends a new bot spawn point to the correct file.
 */
export const updateBotSpawn = (
    map: string,
    value: Ixyz,
    type: BotSpawnType
): void => {
    const filePath = path.join(SPAWN_DIR, `${type}Spawns.json`);
    const key = map.toLowerCase();

    updateJsonFile<Record<string, Ixyz[]>>(filePath, (jsonData) => {
        value.y += 0.5; // Offset to avoid floor clipping
        jsonData[key] = jsonData[key] ?? [];
        jsonData[key].push(value);
    }, `Added ${type} spawn to '${map}'`);
};

/**
 * Removes the closest spawn to the given coordinate from the file.
 */
export const deleteBotSpawn = (
    map: string,
    value: Ixyz,
    type: BotSpawnType
): void => {
    const filePath = path.join(SPAWN_DIR, `${type}Spawns.json`);
    const key = map.toLowerCase();

    updateJsonFile<Record<string, Ixyz[]>>(filePath, (jsonData) => {
        const spawns = jsonData[key];
        if (!spawns?.length) {
            console.warn(`${LOG_PREFIX} No ${type} spawns found on '${map}' to delete.`);
            return;
        }

        const { x: X, y: Y, z: Z } = value;
        let nearestIndex = -1;
        let shortest = Infinity;

        spawns.forEach(({ x, y, z }, index) => {
            const dist = Math.sqrt((x - X) ** 2 + (y - Y) ** 2 + (z - Z) ** 2);
            if (dist < shortest) {
                shortest = dist;
                nearestIndex = index;
            }
        });

        if (nearestIndex !== -1 && shortest < DELETE_DISTANCE_THRESHOLD) {
            spawns.splice(nearestIndex, 1);
            console.log(`${LOG_PREFIX} Deleted ${type} spawn from '${map}' ~${shortest.toFixed(2)}m away`);
        } else {
            console.warn(`${LOG_PREFIX} No nearby ${type} spawn found within ${DELETE_DISTANCE_THRESHOLD}m on '${map}'. Closest: ${shortest.toFixed(2)}m`);
        }
    }, `Removed ${type} spawn from '${map}'`);
};

/**
 * Replaces all spawn data for a type across all maps.
 */
export const updateAllBotSpawns = (
    values: Record<string, Ixyz[]>,
    targetType: BotSpawnType | string
): void => {
    const safeType = targetType.toLowerCase();
    const filePath = path.join(SPAWN_DIR, `${safeType}Spawns.json`);

    updateJsonFile<Record<string, Ixyz[]>>(filePath, (jsonData) => {
        for (const map of Object.keys(values)) {
            jsonData[map] = values[map];
        }
    }, `Overwrote all ${safeType} spawns`);
};
