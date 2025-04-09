import fs from "fs";
import path from "path";
import { DependencyContainer } from "tsyringe";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";

import globalValues from "./GlobalValues";
import { setupRoutes } from "./Routes/routes";
import { setupSpawns } from "./SpawnZoneChanges/setupSpawn";
import { buildWaves } from "./Spawning/Spawning";
import checkPresetLogic from "./Tests/checkPresets";
import { MOARConfig } from "./types";

const CONFIG_ROOT = path.resolve(__dirname, "../config");

const coreConfigFiles = [
    ["config.json", "config.default.json"],
    ["advancedConfig.json", "advancedConfig.default.json"],
    ["mapConfig.json", "mapConfig.default.json"],
    ["bossConfig.json", "bossConfig.default.json"],
    ["PresetWeightings.json", "PresetWeightings.default.json"],
    ["Presets.json", "Presets.default.json"]
];

const spawnConfigFiles = ["playerSpawns", "pmcSpawns", "scavSpawns", "sniperSpawns"];

function ensureConfigFile(target: string, fallback: string, logger: ILogger): void {
    const targetPath = path.join(CONFIG_ROOT, target);
    const fallbackPath = path.join(CONFIG_ROOT, fallback);

    if (!fs.existsSync(targetPath)) {
        if (fs.existsSync(fallbackPath)) {
            fs.copyFileSync(fallbackPath, targetPath);
            logger.warning(`[MOAR] Auto-created missing config: ${target}`);
        } else {
            logger.error(`[MOAR] Missing both ${target} and fallback ${fallback}`);
        }
    }
}

function ensureAllConfigs(logger: ILogger): void {
    for (const [target, fallback] of coreConfigFiles) {
        ensureConfigFile(target, fallback, logger);
    }
    for (const name of spawnConfigFiles) {
        ensureConfigFile(`Spawns/${name}.json`, `Spawns/${name}.default.json`, logger);
    }
}

function loadConfigFile<T = unknown>(filename: string): T | null {
    const fullPath = path.join(CONFIG_ROOT, filename);
    if (!fs.existsSync(fullPath)) return null;

    try {
        const raw = fs.readFileSync(fullPath, "utf-8");
        return JSON.parse(raw) as T;
    } catch (e) {
        console.error(`[MOAR] Failed to load config: ${filename}`, e);
        return null;
    }
}

function getDefaultConfig(): MOARConfig {
    return {
        defaultPreset: "random",
        enableBotSpawning: false,
        spawnSmoothing: false,
        randomSpawns: false,
        startingPmcs: false,
        smoothingDistribution: 1,
        spawnMinDistance: 50,
        spawnMaxDistance: 250,
        spawnRadius: 150,
        spawnDelay: 15,
        pmcDifficulty: 1,
        scavDifficulty: 1,
        zombieHealth: 100,
        pmcWaveQuantity: 1,
        scavWaveQuantity: 1,
        zombieWaveQuantity: 1,
        pmcWaveDistribution: 0,
        scavWaveDistribution: 0,
        zombieWaveDistribution: 0,
        pmcGroupChance: 0,
        scavGroupChance: 0,
        sniperGroupChance: 0,
        pmcMaxGroupSize: 1,
        scavMaxGroupSize: 1,
        sniperMaxGroupSize: 1,
        maxBotCap: 10,
        maxBotPerZone: 2,
        bossOpenZones: false,
        disableBosses: false,
        mainBossChanceBuff: 0,
        bossInvasion: false,
        bossInvasionSpawnChance: 0,
        gradualBossInvasion: false,
        enableBossOverrides: false,
        randomRaiderGroup: false,
        randomRaiderGroupChance: 0,
        randomRogueGroup: false,
        randomRogueGroupChance: 0,
        zombiesEnabled: false,
        forceHotzonesOnly: false,
        scavMarksmenEnabled: false,
        pmcWavesEnabled: true,
        debug: {
            enabled: false,
            logSpawnData: false,
            logBossOverrides: false
        }
    };
}

function loadMergedConfig(): MOARConfig {
    const file = loadConfigFile<MOARConfig>("config.json");
    return {
        ...getDefaultConfig(),
        ...(file ?? {})
    };
}

// === Global config for this session ===
const config = loadMergedConfig();
const enableBotSpawning = config.enableBotSpawning;

class Moar implements IPreSptLoadMod, IPostDBLoadMod, IPostSptLoadMod {
    preSptLoad(container: DependencyContainer): void {
        if (enableBotSpawning) {
            setupRoutes(container);
        }
    }

    postDBLoad(container: DependencyContainer): void {
        if (enableBotSpawning) {
            setupSpawns(container);
        }
    }

    postSptLoad(container: DependencyContainer): void {
        const logger = container.resolve<ILogger>("WinstonLogger");

        ensureAllConfigs(logger);

        if (!enableBotSpawning) {
            logger.info("[MOAR] Bot spawning disabled — skipping init.");
            return;
        }

        globalValues.baseConfig = config;
        globalValues.overrideConfig = {};

        try {
            checkPresetLogic(container);
        } catch (e) {
            logger.warning("[MOAR] Preset validation skipped due to format changes or load error.");
            logger.error(`[MOAR] Validation error: ${(e as Error).message}`);
        }

        setTimeout(() => {
            const spawnsReady = globalValues.indexedMapSpawns && Object.keys(globalValues.indexedMapSpawns).length > 0;
            if (!spawnsReady) {
                logger.error("[MOAR] Cannot build waves — indexedMapSpawns is not ready.");
                return;
            }

            try {
                buildWaves(container);
                const presetName = globalValues.forcedPreset || config.defaultPreset;
                logger.info(`[MOAR] ✅ Waves built successfully using preset '${presetName}'.`);
            } catch (e: unknown) {
                const message =
                    e && typeof e === "object" && "stack" in e
                        ? (e as Error).stack
                        : JSON.stringify(e, null, 2);
                logger.error("[MOAR] ❌ Error while building waves:\n" + message);
            }
        }, 100);

        logger.info("[MOAR] Startup complete. Bot spawning is enabled.");
    }
}

module.exports = { mod: new Moar() };
