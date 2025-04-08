import { IBotConfig } from "@spt/models/spt/config/IBotConfig.d";
import { IPmcConfig } from "@spt/models/spt/config/IPmcConfig.d";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt/models/spt/logging/ILogger";
import { ILocationConfig } from "@spt/models/spt/config/ILocationConfig.d";
import { IBossLocationSpawn } from "@spt/models/eft/common/ILocationBase";

import baseConfig from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import advancedConfig from "../../config/advancedConfig.json";

import globalValues from "../GlobalValues";
import { cloneDeep, getRandomPresetOrCurrentlySelectedPreset, saveToFile } from "../utils";
import { originalMapList } from "./constants";

import updateSpawnLocations from "./updateSpawnLocations";
import { setEscapeTimeOverrides, enforceSmoothing } from "../utils";

import { buildBossWaves } from "./buildBossWaves";
import { buildZombieWaves } from "./buildZombieWaves";
import { buildScavMarksmanWaves } from "./buildScavMarksmanWaves";
import buildPmcs from "./buildPmcs";
import marksmanChanges from "./marksmanChanges";

function assignDynamicConfigValues<TTarget extends object, TSource extends object>(
    target: TTarget,
    source: TSource,
    label: string,
    debug?: boolean
): void {
    for (const key of Object.keys(source)) {
        const oldVal = (target as Record<string, unknown>)[key];
        const newVal = (source as Record<string, unknown>)[key];
        if (oldVal !== newVal) {
            if (debug) {
                console.log(`[MOAR] ${label} ${key} changed from ${oldVal} to ${newVal}`);
            }
            (target as Record<string, unknown>)[key] = newVal;
        }
    }
}


export const buildWaves = (container: DependencyContainer): void => {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const logger = container.resolve<ILogger>("WinstonLogger");
    const pmcConfig = configServer.getConfig<IPmcConfig>(ConfigTypes.PMC);
    const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);
    const locationConfig = configServer.getConfig<ILocationConfig>(ConfigTypes.LOCATION);
    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
    const { locations, bots } = databaseServer.getTables();

    // === Patch vanilla location behavior for safety ===
    locationConfig.rogueLighthouseSpawnTimeSettings.waitTimeSeconds = 60;
    locationConfig.enableBotTypeLimits = false;
    locationConfig.fitLootIntoContainerAttempts = 1;
    locationConfig.addCustomBotWavesToMaps = false;
    locationConfig.customWaves = { boss: {}, normal: {} };

    // === Resolve config base + overrides + preset ===
    const config = cloneDeep(globalValues.baseConfig);
    const preset = getRandomPresetOrCurrentlySelectedPreset();

    config.smoothingDistribution ??= 0.5;
    config.spawnMinDistance ??= 60;
    config.spawnMaxDistance ??= 200;

    assignDynamicConfigValues(config, globalValues.overrideConfig, "overrideConfig", config.debug?.enabled);
    assignDynamicConfigValues(config, preset, `preset ${globalValues.currentPreset}`, config.debug?.enabled);

    // === Print applied preset for debugging ===
    console.log(globalValues.forcedPreset === "custom"
        ? "custom"
        : globalValues.forcedPreset || globalValues.currentPreset);

    // === Get location references from database ===
    const {
        bigmap: customs,
        factory4_day: factoryDay,
        factory4_night: factoryNight,
        interchange,
        laboratory,
        lighthouse,
        rezervbase,
        shoreline,
        tarkovstreets,
        woods,
        sandbox: gzLow,
        sandbox_high: gzHigh
    } = locations;

    let locationList = [
        customs, factoryDay, factoryNight,
        interchange, laboratory, lighthouse,
        rezervbase, shoreline, tarkovstreets,
        woods, gzLow, gzHigh
    ];

    // === Reset base locations to safe snapshot ===
    if (!globalValues.locationsBase) {
        globalValues.locationsBase = locationList.map(({ base }, idx) => {
            if (!base) {
                console.warn(`[MOAR] ⚠ Missing base property for map at index ${idx}.`);
                return {} as typeof base;
            }
            return cloneDeep(base);
        });
    } else {
        locationList = locationList.map((item, i) => {
            const originalBase = globalValues.locationsBase[i];
            if (!originalBase) {
                console.warn(`[MOAR] ⚠ Missing original base snapshot for map index ${i}.`);
                return { ...item, base: {} };
            }
            return {
                ...item,
                base: cloneDeep(originalBase)
            };
        });
    }

    // === Disable PMC transform logic (forces consistent side types) ===
    pmcConfig.convertIntoPmcChance = {
        default: {
            assault: { min: 0, max: 0 },
            cursedassault: { min: 0, max: 0 },
            pmcbot: { min: 0, max: 0 },
            exusec: { min: 0, max: 0 },
            arenafighter: { min: 0, max: 0 },
            arenafighterevent: { min: 0, max: 0 },
            crazyassaultevent: { min: 0, max: 0 }
        },
        factory4_day: { assault: { min: 0, max: 0 } },
        laboratory: { pmcbot: { min: 0, max: 0 } },
        rezervbase: { pmcbot: { min: 0, max: 0 } }
    };

    // === Override edge cases ===
    if (config.startingPmcs && (!config.randomSpawns || config.spawnSmoothing)) {
        logger.warning("[MOAR] Starting PMCs is on. Disabling smoothing and enforcing cascade spawns.");
        config.spawnSmoothing = false;
        config.randomSpawns = true;
    }

    if (advancedConfig.MarksmanDifficultyChanges) {
        marksmanChanges(bots);
    }

    // === Apply spawn changes ===
    updateSpawnLocations(locationList, config);
    setEscapeTimeOverrides(locationList, mapConfig, logger, config);

    // === Build all bot types ===
    buildBossWaves(config, locationList);
    if (locationList.some(loc => !loc?.base?.BossLocationSpawn)) {
        logger.warning("[MOAR] ⚠ One or more boss wave lists failed to initialize properly.");
    }

    if (config.zombiesEnabled) {
        buildZombieWaves(config, locationList, bots);
        if (locationList.some(loc => !loc?.base?.BossLocationSpawn?.some((w: IBossLocationSpawn) => w?.BotSide === "Savage"))) {
            logger.warning("[MOAR] ⚠ Zombie wave generation returned incomplete sets.");
        }
    }

    buildPmcs(config, locationList);
    if (locationList.some(loc => !loc?.base?.BossLocationSpawn?.some((w: IBossLocationSpawn) => w?.BotSide === "Usec" || w?.BotSide === "Bear"))) {
        logger.warning("[MOAR] ⚠ PMC wave generation failed or returned empty sets.");
    }

    buildScavMarksmanWaves(config, locationList, botConfig);
    if (locationList.some(loc => !loc?.base?.BossLocationSpawn?.some((w: IBossLocationSpawn) => w?.BotSide === "Savage"))) {
        logger.warning("[MOAR] ⚠ Scav/Marksman wave generation returned incomplete sets.");
    }

    // === Optional smoothing pass ===
    if (config.spawnSmoothing) {
        enforceSmoothing(locationList, config, logger);
    }

    // === Write location updates back to the server ===
    originalMapList.forEach((name, index) => {
        if (!locations[name]) {
            console.warn(`[MOAR] Missing map entry for: ${name}`);
        } else {
            locations[name] = locationList[index];
        }
    });
};
