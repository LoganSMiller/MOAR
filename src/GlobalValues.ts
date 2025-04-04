import { ILocationBase, ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import fs from "fs";
import path from "path";
import { MOARConfig } from "./types"; 

// === Constants ===
const CONFIG_PATH = path.resolve(__dirname, "../config/config.json");
const DEBUG = true;

// === Type-safe JSON loader ===
function loadJSONFile<T = unknown>(filePath: string): T | null {
    if (!fs.existsSync(filePath)) {
        console.warn("[MOAR] Config file does not exist at:", filePath);
        return null;
    }

    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw) as T;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[MOAR] Failed to read JSON from", filePath, "-", message);
        return null;
    }
}

// === Load Initial Config ===
const loadedConfig = loadJSONFile<MOARConfig>(CONFIG_PATH);

if (!loadedConfig) {
    throw new Error("[MOAR] Failed to load config.json during startup. Please ensure it is valid.");
}

if (DEBUG) {
    console.log("[MOAR] Loaded config.json");
    console.log("[MOAR] Loaded default preset:", loadedConfig.defaultPreset);
}

// === Global Type ===
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
}

// === Singleton Store ===
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
        const newConfig = loadJSONFile<MOARConfig>(CONFIG_PATH);
        if (!newConfig) {
            console.error("[MOAR] Failed to reload config.json");
            return;
        }

        globalValues.baseConfig = newConfig;
        globalValues.forcedPreset = newConfig.defaultPreset ?? "random";

        if (DEBUG) {
            console.log("[MOAR] baseConfig hot-reloaded. Forced preset set to:", globalValues.forcedPreset);
        }
    }
};

if (DEBUG) {
    console.log("[MOAR] Initial forcedPreset:", globalValues.forcedPreset);
}

export default globalValues;
