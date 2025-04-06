import { ILocationBase, ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { MOARConfig } from "./types";
import fs from "fs";
import path from "path";

// === Config paths ===
const CONFIG_PATH = path.resolve(__dirname, "../config/config.json");

// === Safe JSON loader ===
function loadConfigFile<T = unknown>(filePath: string): T | null {
    try {
        if (!fs.existsSync(filePath)) {
            console.warn("[MOAR] Config file does not exist at:", filePath);
            return null;
        }

        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw) as T;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[MOAR] Failed to parse JSON from", filePath, "-", message);
        return null;
    }
}

// === Load base config with fallback ===
let loadedConfig = loadConfigFile<MOARConfig>(CONFIG_PATH);
if (!loadedConfig) {
    throw new Error("[MOAR] Cannot start — config.json is missing or invalid.");
}

const DEBUG = loadedConfig.debug?.enabled ?? false;
if (DEBUG) {
    console.log("[MOAR] Config loaded. Default preset:", loadedConfig.defaultPreset);
}

// === Global Interface ===
export interface GlobalValuesType {
    baseConfig: MOARConfig;
    overrideConfig: Partial<MOARConfig>;
    locationsBase: ILocationBase[];
    currentPreset: string;
    forcedPreset: string;
    addedMapZones: Record<string, string[]>;
    indexedMapSpawns: Record<string, ISpawnPointParam[]>;
    playerSpawn?: ISpawnPointParam;
    coopSpawnZone?: string;
    initialized: boolean;
    modVersion: string;

    reloadConfig: () => void;
    clear: () => void;
}

// === Global Singleton ===
const globalValues: GlobalValuesType = {
    baseConfig: loadedConfig,
    overrideConfig: {},
    locationsBase: [],
    currentPreset: "",
    forcedPreset: loadedConfig.defaultPreset ?? "random",
    addedMapZones: {},
    indexedMapSpawns: {},
    playerSpawn: undefined,
    coopSpawnZone: undefined,
    initialized: false,
    modVersion: "",

    reloadConfig: (): void => {
        const newConfig = loadConfigFile<MOARConfig>(CONFIG_PATH);
        if (!newConfig) {
            console.error("[MOAR] Failed to reload config.json — keeping previous config.");
            return;
        }

        globalValues.baseConfig = newConfig;
        globalValues.forcedPreset = newConfig.defaultPreset ?? "random";

        if (newConfig.debug?.enabled) {
            console.log("[MOAR] baseConfig hot-reloaded. New preset:", globalValues.forcedPreset);
        }
    },

    clear: (): void => {
        globalValues.locationsBase = [];
        globalValues.indexedMapSpawns = {};
        globalValues.addedMapZones = {};
        globalValues.playerSpawn = undefined;
        globalValues.coopSpawnZone = undefined;
        globalValues.initialized = false;

        if (DEBUG) {
            console.log("[MOAR] Global state cleared for new session or map load.");
        }
    }
};

if (DEBUG) {
    console.log("[MOAR] Initial forced preset:", globalValues.forcedPreset);
}

export default globalValues;
