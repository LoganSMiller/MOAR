import fs from "fs";
import path from "path";
import { ILocationBase, ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { MOARConfig } from "./types";

// === Constants ===
const CONFIG_PATH = path.resolve(__dirname, "../config/config.json");

// === Safe JSON loader ===
function loadConfigFile<T>(filePath: string): T | null {
    if (!fs.existsSync(filePath)) {
        console.warn("[MOAR] Config file not found:", filePath);
        return null;
    }

    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw) as T;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[MOAR] Failed to parse JSON:", filePath, "-", message);
        return null;
    }
}

// === Load initial config
let loadedConfig: MOARConfig | null = loadConfigFile<MOARConfig>(CONFIG_PATH);
if (!loadedConfig) {
    throw new Error("[MOAR] Cannot start — config.json is missing or invalid.");
}

const DEBUG = loadedConfig.debug?.enabled ?? false;
if (DEBUG) {
    console.log("[MOAR] ✅ Config loaded. Default preset:", loadedConfig.defaultPreset);
}

// === GlobalValues interface ===
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
    possiblePresets?: string[];

    reloadConfig: () => void;
    clear: () => void;
}

// === Global Singleton ===
const globalValues: GlobalValuesType = {
    baseConfig: loadedConfig,
    overrideConfig: {},
    locationsBase: [],
    currentPreset: "",
    forcedPreset: loadedConfig.defaultPreset || "random",
    addedMapZones: {},
    indexedMapSpawns: {},
    playerSpawn: undefined,
    coopSpawnZone: undefined,
    initialized: false,
    modVersion: "",
    possiblePresets: [],

    reloadConfig(): void {
        const newConfig = loadConfigFile<MOARConfig>(CONFIG_PATH);
        if (!newConfig) {
            console.error("[MOAR] Failed to reload config — keeping previous values.");
            return;
        }

        this.baseConfig = newConfig;
        this.forcedPreset = newConfig.defaultPreset || "random";

        if (newConfig.debug?.enabled) {
            console.log("[MOAR] 🔄 baseConfig hot-reloaded. New preset:", this.forcedPreset);
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
            console.log("[MOAR] 🧹 Global state cleared.");
        }
    }
};

if (DEBUG) {
    console.log("[MOAR] Initial forced preset:", globalValues.forcedPreset);
}

export default globalValues;
