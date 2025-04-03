import { ILocationBase, ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import fs from "fs";
import path from "path";

//  Constants
const CONFIG_PATH = path.resolve(__dirname, "../config/config.json");
const DEBUG = true; // Set to false to suppress logs

//  Type-safe FS JSON loader
function loadJSONFile<T = unknown>(filePath: string): T | null {
    if (!fs.existsSync(filePath)) {
        console.warn("[MOAR]  Config file does not exist at:", filePath);
        return null;
    }

    try {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw) as T;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[MOAR]  Failed to read JSON from", filePath, "-", message);
        return null;
    }
}

//  Initial config load
const loadedConfig = loadJSONFile<Record<string, unknown>>(CONFIG_PATH) ?? {};
if (DEBUG) {
    console.log("[MOAR]  Loaded config.json");
    console.log("[MOAR]  Loaded default preset:", loadedConfig["defaultPreset"]);
}

//  Global shape
export interface GlobalValuesType {
    baseConfig: typeof loadedConfig;
    overrideConfig: Partial<typeof loadedConfig>;
    locationsBase: ILocationBase[];
    currentPreset: string;
    forcedPreset: string;
    addedMapZones: Record<string, string[]>;
    indexedMapSpawns: Record<string, ISpawnPointParam[]>;
    playerSpawn?: ISpawnPointParam;
    initialized: boolean;
    modVersion: string;
    reloadConfig: () => void;
}

//  Global store
const globalValues: GlobalValuesType = {
    baseConfig: loadedConfig,
    overrideConfig: {},
    locationsBase: [],
    currentPreset: "",
    forcedPreset: (loadedConfig["defaultPreset"] as string) ?? "random",
    addedMapZones: {},
    indexedMapSpawns: {},
    playerSpawn: undefined,
    initialized: false,
    modVersion: "",

    reloadConfig: (): void => {
        const newConfig = loadJSONFile<typeof loadedConfig>(CONFIG_PATH);
        if (!newConfig) {
            console.error("[MOAR]  Failed to reload config.json");
            return;
        }

        globalValues.baseConfig = newConfig;
        globalValues.forcedPreset = (newConfig["defaultPreset"] as string) ?? "random";

        if (DEBUG) {
            console.log("[MOAR]  baseConfig hot-reloaded. Forced preset set to:", globalValues.forcedPreset);
        }
    }
};

if (DEBUG) {
    console.log("[MOAR]  Initial forcedPreset:", globalValues.forcedPreset);
}

export default globalValues;
