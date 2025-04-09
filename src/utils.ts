import fs from "fs";
import path from "path";

import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ILocation } from "@spt/models/eft/common/ILocation";
import globalValues from "./GlobalValues";
import { MOARConfig, MapSettings } from "./types";
import { defaultEscapeTimes } from "./Spawning/constants";

// === Config Loading Paths ===
const configPath = path.resolve(__dirname, "../config/config.json");
const mapConfigPath = path.resolve(__dirname, "../config/mapConfig.json");

// === Safe JSON loading ===
function loadJSON<T = Record<string, unknown>>(filePath: string, label: string): T {
    if (!fs.existsSync(filePath)) {
        console.error(`[MOAR] ❌ ${label} file not found at: ${filePath}`);
        return {} as T;
    }

    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw) as T;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[MOAR] ❌ Failed to parse ${label}:`, message);
        return {} as T;
    }
}

// === Fallback config access (only used in legacy paths) ===
const config: MOARConfig = loadJSON<MOARConfig>(configPath, "config.json");
const mapConfig: Record<string, MapSettings> = loadJSON<Record<string, MapSettings>>(mapConfigPath, "mapConfig.json");

// === Text Utilities ===
export function kebabToTitle(text: string): string {
    return text.replace(/-/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

// === Clone Utilities ===
export function cloneDeep<T>(value: T): T {
    try {
        return JSON.parse(JSON.stringify(value, (_, val) => {
            if (typeof val === "function" || typeof val === "undefined") return null;
            return val;
        }));
    } catch (err) {
        const raw = (() => {
            try {
                return JSON.stringify(value, null, 2);
            } catch {
                return "[Unserializable object]";
            }
        })();

        console.warn(`[MOAR] ⚠ cloneDeep serialization failed: ${err instanceof Error ? err.message : err}`);
        console.warn(`[MOAR] ⚠ Failed object:`, raw);
        return Array.isArray(value) ? ([] as unknown as T) : ({} as T);
    }
}

// === Array Randomization ===
export function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function looselyShuffle<T>(array: T[], swaps = 3): T[] {
    const arr = [...array];
    for (let i = 0; i < swaps; i++) {
        const a = Math.floor(Math.random() * arr.length);
        const b = Math.floor(Math.random() * arr.length);
        [arr[a], arr[b]] = [arr[b], arr[a]];
    }
    return arr;
}

export function getRandomInArray<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// === Config Preset Resolver (fallback path) ===
export function getRandomPresetOrCurrentlySelectedPreset(): MOARConfig {
    return config;
}

// === Debug Dump Writer ===
export function saveToFile(filename: string, value: unknown): void {
    try {
        const modDirectory = path.resolve(__dirname, "../../../");
        const debugDir = path.join(modDirectory, "debug");
        const fullPath = path.join(debugDir, `debug_${filename}.json`);

        if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir, { recursive: true });
        }

        const safeString = JSON.stringify(value, (key, val) => {
            if (typeof val === "function") return "[Function]";
            if (typeof val === "bigint") return val.toString();
            return val;
        }, 2);

        fs.writeFileSync(fullPath, safeString);
    } catch (err) {
        console.warn(`[MOAR] ⚠ Failed to stringify or save debug file: ${filename}`, err);
    }
}

// === Wave Smoothing ===
export function enforceSmoothing(
    locationList: ILocation[],
    config: MOARConfig,
    logger: ILogger
): void {
    if (!config.spawnSmoothing) return;

    for (const location of locationList) {
        const waves = location.base?.BossLocationSpawn;
        if (!waves?.length) continue;

        for (const wave of waves) {
            wave.Time = typeof wave.Time === "number" && Number.isFinite(wave.Time)
                ? Math.round(wave.Time * config.smoothingDistribution)
                : 0;
        }

        if (config.debug?.enabled) {
            logger.info(`[MOAR] ✅ Smoothed waves on ${location.base?.Id}`);
        }
    }
}

// === Escape Time Override ===
export function setEscapeTimeOverrides(
    locations: ILocation[],
    mapOverrides: Record<string, MapSettings>,
    logger: ILogger,
    activeConfig: MOARConfig
): void {
    for (let i = 0; i < locations.length; i++) {
        const loc = locations[i];

        if (!loc?.base || typeof loc.base.Id !== "string") {
            if (activeConfig.debug?.enabled) {
                logger.warning(`[MOAR] ⏱ Missing loc.base.Id for map at index ${i}, skipping escape time override.`);
            }
            continue;
        }

        const mapId = loc.base.Id;
        const overrideTime = mapOverrides[mapId]?.escapeTimeOverride;
        const fallbackTime = defaultEscapeTimes[mapId as keyof typeof defaultEscapeTimes] ?? 45;

        loc.base.EscapeTimeLimit = typeof overrideTime === "number" ? overrideTime : fallbackTime;

        if (typeof overrideTime !== "number" && activeConfig.debug?.enabled) {
            logger.warning(`[MOAR] ⏱ No escapeTimeOverride for ${mapId}, using fallback ${fallbackTime} min.`);
        }

        if (activeConfig.debug?.enabled) {
            logger.info(`[MOAR] ⏱ ${mapId} escape time set to ${loc.base.EscapeTimeLimit} min`);
        }
    }
}

// === Sanity Check for Spawns and Config ===
export function validateWaveBuildSanity(
    locations: ILocation[],
    logger: ILogger
): boolean {
    if (!globalValues.indexedMapSpawns || Object.keys(globalValues.indexedMapSpawns).length === 0) {
        logger.error("[MOAR] ❌ indexedMapSpawns is missing or empty.");
        return false;
    }

    if (!globalValues.playerSpawn || !globalValues.playerSpawn.Position) {
        logger.error("[MOAR] ❌ globalValues.playerSpawn is not set.");
        return false;
    }

    for (const loc of locations) {
        if (!loc?.base) {
            logger.error("[MOAR] ❌ One of the locations is missing its .base property.");
            return false;
        }

        if (typeof loc.base.EscapeTimeLimit !== "number") {
            logger.error(`[MOAR] ❌ ${loc.base.Id} is missing a valid EscapeTimeLimit.`);
            return false;
        }
    }

    return true;
}
