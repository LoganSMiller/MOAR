import fs from "fs";
import path from "path";
import { Ixyz } from "../Models/Ixyz";

const SPAWN_DIR = path.resolve(__dirname, "../../config/Spawns");
const LOG_PREFIX = "[MOAR:SpawnUtils]";
const DELETE_DISTANCE_THRESHOLD = 15;
const DEBUG = false;

export type BotSpawnType =
    | "player"
    | "pmc"
    | "scav"
    | "sniper"
    | "boss"
    | "zombie"
    | "mixed";

/**
 * Ensures a file exists; creates an empty object file if missing.
 */
function ensureJsonFileExists(filePath: string): void {
    if (!fs.existsSync(SPAWN_DIR)) {
        fs.mkdirSync(SPAWN_DIR, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2), "utf8");
        console.warn(`${LOG_PREFIX} Auto-created missing file: ${filePath}`);
    }
}

/**
 * Generic JSON updater with error handling and type safety.
 */
export const updateJsonFile = <T>(
    filePath: string,
    callback: (jsonData: T) => void,
    successMessage: string
): void => {
    try {
        ensureJsonFileExists(filePath);
        const raw = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(raw) as T;

        callback(jsonData);

        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf8");
        console.log(`${LOG_PREFIX} ${successMessage} → ${path.basename(filePath)}`);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`${LOG_PREFIX} Failed to update ${filePath}:`, message);
    }
};

/**
 * Adds a new spawn to a map's JSON config, ensuring y-offset for ground safety.
 */
export const updateBotSpawn = (
    map: string,
    value: Ixyz,
    type: BotSpawnType
): void => {
    const filePath = path.join(SPAWN_DIR, `${type}Spawns.json`);
    const key = map.toLowerCase();

    updateJsonFile<Record<string, Ixyz[]>>(filePath, (jsonData) => {
        const adjusted = new Ixyz(value.x, value.y + 0.5, value.z);
        jsonData[key] ??= [];
        jsonData[key].push(adjusted);
    }, `Added ${type} spawn to '${map}'`);
};

/**
 * Deletes the nearest spawn within DELETE_DISTANCE_THRESHOLD.
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

        spawns.forEach(({ x, y, z }, i) => {
            const dist = Math.sqrt((x - X) ** 2 + (y - Y) ** 2 + (z - Z) ** 2);
            if (dist < shortest) {
                shortest = dist;
                nearestIndex = i;
            }
        });

        if (nearestIndex !== -1 && shortest < DELETE_DISTANCE_THRESHOLD) {
            spawns.splice(nearestIndex, 1);
            console.log(`${LOG_PREFIX} Deleted ${type} spawn from '${map}' ~${shortest.toFixed(2)}m away`);
        } else {
            console.warn(`${LOG_PREFIX} No nearby ${type} spawn within ${DELETE_DISTANCE_THRESHOLD}m on '${map}'. Closest was ${shortest.toFixed(2)}m`);
        }
    }, `Removed ${type} spawn from '${map}'`);
};

/**
 * Removes duplicates from a set of Ixyz entries using rounded precision.
 */
function dedupeIxyzArray(points: Ixyz[]): Ixyz[] {
    const seen = new Set<string>();
    return points.filter(p => {
        const key = `${p.x.toFixed(3)}:${p.y.toFixed(3)}:${p.z.toFixed(3)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Replaces all spawn entries for a given type. Only use outside live raids.
 */
export const updateAllBotSpawns = (
    values: Record<string, Ixyz[]>,
    targetType: BotSpawnType | string
): void => {
    const safeType = targetType.toLowerCase();
    const filePath = path.join(SPAWN_DIR, `${safeType}Spawns.json`);

    updateJsonFile<Record<string, Ixyz[]>>(filePath, (jsonData) => {
        for (const [map, rawPoints] of Object.entries(values)) {
            const deduped = dedupeIxyzArray(rawPoints);
            jsonData[map] = deduped;

            if (DEBUG) {
                console.log(`${LOG_PREFIX} [${map}] ${safeType} spawns updated (${deduped.length} points)`);
            }
        }
    }, `Overwrote all ${safeType} spawns (deduplicated)`);
};
