import { ILocationBase, ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { MOARConfig } from "./types";
import fs from "fs";
import path from "path";

// === Config path ===
const CONFIG_PATH = path.resolve(__dirname, "../config/config.json");

// === Safe config loader ===
function loadConfigFile<T = unknown>(filePath: string): T | null {
    try {
        if (!fs.existsSync(filePath)) {
            console.warn("[MOAR] Config file not found:", filePath);
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

// === Initial config load ===
let loadedConfig = loadConfigFile<MOARConfig>(CONFIG_PATH);
if (!loadedConfig) {
    throw new Error("[MOAR] Cannot start — config.json is missing or invalid.");
}

const DEBUG = loadedConfig.debug?.enabled ?? false;
if (DEBUG) {
    console.log("[MOAR] Config loaded. Default preset:", loadedConfig.defaultPreset);
}

// === Shared Global Singleton Type ===
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

    // Optional: preload support for future UI/preset lists
    possiblePresets?: string[];

    // Methods
    reloadConfig: () => void;
    clear: () => void;
}

// === Global State Instance ===
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

    reloadConfig(): void {
        const newConfig = loadConfigFile<MOARConfig>(CONFIG_PATH);
        if (!newConfig) {
            console.error("[MOAR] Failed to reload config.json — keeping previous config.");
            return;
        }

        this.baseConfig = newConfig;
        this.forcedPreset = newConfig.defaultPreset ?? "random";

        if (newConfig.debug?.enabled) {
            console.log("[MOAR] baseConfig hot-reloaded. New preset:", this.forcedPreset);
        }
    },

    clear(): void {
        this.locationsBase = [];
        this.indexedMapSpawns = {};
        this.addedMapZones = {};
        this.playerSpawn = undefined;
        this.coopSpawnZone = undefined;
        this.initialized = false;

        if (DEBUG) {
            console.log("[MOAR] Global state cleared for new session or map load.");
        }
    }
};

if (DEBUG) {
    console.log("[MOAR] Initial forced preset:", globalValues.forcedPreset);
}

export default globalValues;
