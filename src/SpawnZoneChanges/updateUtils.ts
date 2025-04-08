import fs from "fs";
import path from "path";
import { Ixyz } from "../Models/Ixyz";
import config from "../../config/config.json";

const SPAWN_DIR = path.resolve(__dirname, "../../config/Spawns");
const LOG_PREFIX = "[MOAR:SpawnUtils]";
const DELETE_DISTANCE_THRESHOLD = 15;
const GROUP_RADIUS = 8;
const DEBUG = false;

export type BotSpawnType =
    | "player"
    | "pmc"
    | "scav"
    | "sniper"
    | "boss"
    | "zombie"
    | "mixed";

function ensureJsonFileExists(filePath: string): void {
    if (!fs.existsSync(SPAWN_DIR)) {
        fs.mkdirSync(SPAWN_DIR, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2), "utf8");
        console.warn(`${LOG_PREFIX} Auto-created missing file: ${filePath}`);
    }
}

function clampDistance(xyz: Ixyz): Ixyz {
    const min = config.spawnMinDistance ?? 50;
    const max = config.spawnMaxDistance ?? 250;
    const distance = Math.sqrt(xyz.x ** 2 + xyz.z ** 2);
    if (distance < min || distance > max) {
        const scale = Math.max(min, Math.min(max, distance)) / distance;
        return new Ixyz(xyz.x * scale, xyz.y, xyz.z * scale);
    }
    return xyz;
}

function findGroupSpawn(center: Ixyz, points: Ixyz[]): Ixyz[] {
    return points.filter(p => {
        const dx = p.x - center.x;
        const dy = p.y - center.y;
        const dz = p.z - center.z;
        return dx * dx + dy * dy + dz * dz <= GROUP_RADIUS ** 2;
    });
}

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

export const updateBotSpawn = (
    map: string,
    value: Ixyz,
    type: BotSpawnType
): void => {
    const filePath = path.join(SPAWN_DIR, `${type}Spawns.json`);
    const key = map.toLowerCase();

    updateJsonFile<Record<string, Ixyz[]>>(filePath, (jsonData) => {
        let adjusted = new Ixyz(value.x, value.y + 0.5, value.z);
        adjusted = clampDistance(adjusted);

        jsonData[key] ??= [];

        if (type === "player") {
            const group = findGroupSpawn(adjusted, jsonData[key]);

            if (group.length > 0) {
                // Force all players into the first group spawn's location
                adjusted = group[0];
            } else {
                jsonData[key].push(adjusted);
            }
        } else {
            if (!jsonData[key].some(p => Math.abs(p.x - adjusted.x) < 0.01 && Math.abs(p.z - adjusted.z) < 0.01)) {
                jsonData[key].push(adjusted);
            }
        }
    }, `Added ${type} spawn to '${map}'`);
};

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

function dedupeIxyzArray(points: Ixyz[]): Ixyz[] {
    const seen = new Set<string>();
    return points.filter(p => {
        const key = `${p.x.toFixed(3)}:${p.y.toFixed(3)}:${p.z.toFixed(3)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export const updateAllBotSpawns = (
    values: Record<string, Ixyz[]>,
    targetType: BotSpawnType | string
): void => {
    const safeType = targetType.toLowerCase();
    const filePath = path.join(SPAWN_DIR, `${safeType}Spawns.json`);

    updateJsonFile<Record<string, Ixyz[]>>(filePath, (jsonData) => {
        for (const [map, rawPoints] of Object.entries(values)) {
            const clamped = rawPoints.map(clampDistance);
            const deduped = dedupeIxyzArray(clamped);
            jsonData[map] = deduped;

            if (DEBUG) {
                console.log(`${LOG_PREFIX} [${map}] ${safeType} spawns updated (${deduped.length} points)`);
            }
        }
    }, `Overwrote all ${safeType} spawns (deduplicated + clamped)`);
};
