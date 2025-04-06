import { DependencyContainer } from "tsyringe";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";

import fs from "fs";
import path from "path";

import globalValues from "./GlobalValues";
import { setupRoutes } from "./Routes/routes";
import { setupSpawns } from "./SpawnZoneChanges/setupSpawn";
import { buildWaves } from "./Spawning/Spawning";
import checkPresetLogic from "./Tests/checkPresets";
import { MOARConfig } from "./types";

const CONFIG_PATH = path.resolve(__dirname, "../config/config.json");

/**
 * Load and parse config.json, falling back to safe defaults on failure.
 */
function loadConfig(): MOARConfig {
    if (!fs.existsSync(CONFIG_PATH)) {
        console.error("[MOAR]  Config file does not exist at:", CONFIG_PATH);
        return getDefaultConfig();
    }

    try {
        const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
        const parsed = JSON.parse(raw);

        return {
            ...getDefaultConfig(),
            ...parsed
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[MOAR]  Failed to parse config.json in mod.ts:", message);
        console.warn("[MOAR] Falling back to default config due to parse error.");
        return getDefaultConfig();
    }
}

/**
 * Fallback MOAR config used when loading fails.
 */
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

const config = loadConfig();
const enableBotSpawning = config.enableBotSpawning;

class Moar implements IPostSptLoadMod, IPreSptLoadMod, IPostDBLoadMod {
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
        if (!enableBotSpawning) {
            return;
        }

        const logger = container.resolve<ILogger>("WinstonLogger");

        globalValues.baseConfig = config;
        globalValues.overrideConfig = {};

        try {
            checkPresetLogic(container);
        } catch (err) {
            logger.warning("[MOAR]  Preset validation skipped due to format changes or load error.");
        }

        setTimeout(() => {
            const spawnsReady =
                globalValues.indexedMapSpawns &&
                Object.keys(globalValues.indexedMapSpawns).length > 0;

            if (!spawnsReady) {
                logger.error("[MOAR]  Cannot build waves — indexedMapSpawns is not ready.");
                return;
            }

            try {
                buildWaves(container);
                const presetName = globalValues.forcedPreset || "random";
                logger.info(`[MOAR]  Waves built successfully using preset '${presetName}'.`);
            } catch (e: unknown) {
                const message =
                    e && typeof e === "object" && "stack" in e
                        ? (e as Error).stack
                        : JSON.stringify(e, null, 2);
                logger.error("[MOAR]  Error while building waves:\n" + message);
            }
        }, 100);

        logger.info("[MOAR]  Startup initialized. Bot spawning is enabled.");
    }
}

module.exports = { mod: new Moar() };
