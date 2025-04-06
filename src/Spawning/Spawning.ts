import { IBotConfig } from "@spt/models/spt/config/IBotConfig";
import { IPmcConfig } from "@spt/models/spt/config/IPmcConfig";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { DependencyContainer } from "tsyringe";
import { ILocationConfig } from "@spt/models/spt/config/ILocationConfig";
import { ILogger } from "@spt/models/spt/utils/ILogger";

import globalValues from "../GlobalValues";
import mapConfig from "../../config/mapConfig.json";
import advancedConfig from "../../config/advancedConfig.json";

import {
    cloneDeep,
    getRandomPresetOrCurrentlySelectedPreset,
    saveToFile,
    enforceSmoothing,
    setEscapeTimeOverrides,
    validateWaveBuildSanity
} from "../utils";

import { originalMapList } from "./constants";
import { buildBossWaves } from "./buildBossWaves";
import { buildZombieWaves } from "./buildZombieWaves";
import buildScavMarksmanWaves from "./buildScavMarksmanWaves";
import buildPmcs from "./buildPmcs";
import updateSpawnLocations from "./updateSpawnLocations";
import marksmanChanges from "./marksmanChanges";
import type { MOARConfig, MOARPresetConfig } from "../types";
import { EPlayerSide } from "@spt-aki/models/enums/EPlayerSide";
import { ESpawnCategory } from "@spt-aki/models/enums/ESpawnCategory";

function isMOARConfig(obj: unknown): obj is MOARConfig {
    return typeof obj === "object" &&
        obj !== null &&
        "defaultPreset" in obj &&
        "enableBotSpawning" in obj &&
        "spawnSmoothing" in obj &&
        "randomSpawns" in obj &&
        "maxBotCap" in obj &&
        "debug" in obj;
}

export const buildWaves = (container: DependencyContainer): void => {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const logger = container.resolve<ILogger>("WinstonLogger");

    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
    const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);
    const locationConfig = configServer.getConfig<ILocationConfig>(ConfigTypes.LOCATION);

    locationConfig.rogueLighthouseSpawnTimeSettings.waitTimeSeconds = 60;
    locationConfig.enableBotTypeLimits = false;
    locationConfig.fitLootIntoContainerAttempts = 1;
    locationConfig.addCustomBotWavesToMaps = false;
    locationConfig.customWaves = { boss: {}, normal: {} };

    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
    const { locations, bots } = databaseServer.getTables();

    if (!globalValues.baseConfig) {
        logger.error("[MOAR] globalValues.baseConfig is undefined.");
        return;
    }

    const rawConfig = cloneDeep(globalValues.baseConfig);
    if (!isMOARConfig(rawConfig)) {
        logger.error("[MOAR] Invalid structure in baseConfig. Aborting wave build.");
        return;
    }

    const config = rawConfig;
    const preset = cloneDeep(getRandomPresetOrCurrentlySelectedPreset()) as Partial<MOARPresetConfig>;

    for (const [key, override] of Object.entries(globalValues.overrideConfig)) {
        if (key in config && config[key as keyof MOARConfig] !== override) {
            if (config.debug?.enabled) {
                console.log(`[MOAR] overrideConfig: ${key} = ${override}`);
            }
            (config as any)[key] = override;
        }
    }

    for (const [key, value] of Object.entries(preset)) {
        if (["label", "description", "enabled"].includes(key)) continue;
        if (config[key as keyof MOARConfig] !== value) {
            if (config.debug?.enabled) {
                console.log(`[MOAR] preset override: ${key} = ${value}`);
            }
            (config as any)[key] = value;
        }
    }

    config.debug = {
        enabled: config.debug?.enabled ?? false,
        logSpawnData: config.debug?.logSpawnData ?? false,
        logBossOverrides: config.debug?.logBossOverrides ?? false
    };

    console.log(`[MOAR] Using preset: ${globalValues.forcedPreset || globalValues.currentPreset}`);

    const locationList = originalMapList.map(mapName => locations[mapName]);

    if (!globalValues.locationsBase.length) {
        globalValues.locationsBase = locationList.map(loc => cloneDeep(loc.base));
    } else {
        for (let i = 0; i < locationList.length; i++) {
            locationList[i].base = cloneDeep(globalValues.locationsBase[i]);
        }
    }

    for (const loc of locationList) {
        const mapId = loc.base?.Id;
        if (mapId && !globalValues.indexedMapSpawns[mapId]) {
            globalValues.indexedMapSpawns[mapId] = loc.base.SpawnPointParams.map((p: any) => ({
                ...p,
                type: p?.type ?? (
                    p.Categories?.includes(ESpawnCategory.Player) ? "player"
                    : p.Categories?.includes(ESpawnCategory.Coop) ? "pmc"
                    : p.Categories?.includes(ESpawnCategory.Boss) ? "boss"
                    : "scav"
                )
            }));
        }

        loc.base.BossLocationSpawn = [];
    }

    pmcConfig.convertIntoPmcChance = {
        default: {
            assault: { min: 0, max: 0 },
            cursedassault: { min: 0, max: 0 },
            pmcbot: { min: 0, max: 0 },
            exUsec: { min: 0, max: 0 },
            arenafighter: { min: 0, max: 0 },
            arenafighterevent: { min: 0, max: 0 },
            crazyassaultevent: { min: 0, max: 0 }
        },
        factory4_day: { assault: { min: 0, max: 0 } },
        laboratory: { pmcbot: { min: 0, max: 0 } },
        rezervbase: { pmcbot: { min: 0, max: 0 } }
    };

    if (config.startingPmcs && (!config.randomSpawns || config.spawnSmoothing)) {
        logger.warning("[MOAR] Starting PMCs enabled. Forcing randomSpawns = true, spawnSmoothing = false.");
        config.spawnSmoothing = false;
        config.randomSpawns = true;
    }

    if (advancedConfig.MarksmanDifficultyChanges) {
        marksmanChanges(bots);
    }

    updateSpawnLocations(locationList, config);
    setEscapeTimeOverrides(locationList, mapConfig, logger, config);

    if (!validateWaveBuildSanity(locationList, logger)) {
        logger.error("[MOAR] Sanity validation failed. Aborting wave build.");
        return;
    }

    buildBossWaves(config, locationList);

    if (config.zombiesEnabled) {
        buildZombieWaves(config, locationList, bots);
    }

    if (config.scavMarksmenEnabled) {
        buildScavMarksmanWaves(config, locationList);
    }

    if (config.pmcWavesEnabled) {
        buildPmcs(config, locationList);
    }

    enforceSmoothing(locationList, config, logger);

    for (const loc of locationList) {
        const seen = new Set<string>();
        loc.base.BossLocationSpawn = (loc.base.BossLocationSpawn ?? []).filter((boss: any) => {
            if (typeof boss.Time !== "number" || isNaN(boss.Time)) {
                boss.Time = 0;
                if (config.debug?.logSpawnData) {
                    console.warn(`[MOAR] Boss spawn on ${loc.base.Id} had invalid Time. Auto-fixed to 0.`);
                }
            }

            const key = `${boss.BossName}-${boss.BossZone}-${boss.Time}`;
            if (seen.has(key)) {
                if (config.debug?.logSpawnData) {
                    console.warn(`[MOAR] Duplicate boss wave skipped: ${key}`);
                }
                return false;
            }

            seen.add(key);
            return true;
        });

        for (const p of loc.base.SpawnPointParams) {
            if (!p.Categories || !p.Sides) {
                console.warn(`[MOAR] 🟡 Missing category/side on spawn ${p.Id} in ${loc.base.Id}`);
            }
        }
    }

    saveToFile("spawned", locationList.map(loc => ({
        map: loc.base.Id,
        spawns: loc.base.SpawnPointParams?.length ?? 0,
        bosses: loc.base.BossLocationSpawn?.length ?? 0,
        escapeTime: loc.base.EscapeTimeLimit,
        botCap: loc.base.BotMax ?? null
    })));
};